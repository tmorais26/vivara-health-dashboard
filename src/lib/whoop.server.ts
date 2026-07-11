import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestUrl,
} from "@tanstack/react-start/server";

// ─── Whoop OAuth + Data (API v2) ─────────────────────
// Ativa-se quando WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET estiverem definidos.
// Registe a app em https://developer.whoop.com e defina o redirect URI como
// `${origin}/app-v2` (ou WHOOP_REDIRECT_URI). Sem credenciais, tudo devolve
// { configured: false } e a app funciona na mesma.

const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API_BASE = "https://api.prod.whoop.com/developer/v2";
// "read:profile" é propositadamente omitido: a app usa uma identidade
// fictícia ("Maria Antunes") para demonstração, e trazer o nome/perfil real
// da tua conta Whoop misturaria dados reais dentro dessa persona — decisão
// de produto, não limitação técnica (o scope já está habilitado na tua app).
const SCOPES = "read:recovery read:sleep read:cycles read:body_measurement offline";

const C_ACCESS = "whoop_at";
const C_REFRESH = "whoop_rt";
const C_EXPIRES = "whoop_exp";
const C_STATE = "whoop_state";

interface WhoopHistory {
  hrv: number[];          // ms, cronológico (mais antigo → mais recente), até 7 pontos
  restingHr: number[];    // bpm
  deepSleepMin: number[]; // min de sono profundo (slow-wave)
}

interface WhoopBody {
  heightCm: number | null;
  weightKg: number | null;
  imc: number | null;
}

interface WhoopMetrics {
  recovery: number | null;   // %
  hrv: number | null;        // ms
  restingHr: number | null;  // bpm
  sleepHours: number | null; // h, sono total da última noite
  strain: number | null;     // 0–21
  lastSyncISO: string;
  history: WhoopHistory;
  body: WhoopBody;
}

export interface WhoopStatus {
  configured: boolean;      // credenciais presentes no servidor
  connected: boolean;       // utilizador autorizou (cookie válido)
  metrics: WhoopMetrics | null;
  error?: string;
}

function clientId() {
  return process.env.WHOOP_CLIENT_ID?.trim() || "";
}
function clientSecret() {
  return process.env.WHOOP_CLIENT_SECRET?.trim() || "";
}
function isConfigured() {
  return clientId().length > 0 && clientSecret().length > 0;
}

function redirectUri() {
  const explicit = process.env.WHOOP_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  try {
    const url = new URL(getRequestUrl());
    return `${url.origin}/app-v2`;
  } catch {
    return "";
  }
}

function cookieBase() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };
}

async function exchangeToken(params: Record<string, string>) {
  const body = new URLSearchParams({
    client_id: clientId(),
    client_secret: clientSecret(),
    ...params,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`token ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

function persistTokens(t: { access_token: string; refresh_token?: string; expires_in: number }) {
  const maxAge = 60 * 60 * 24 * 30; // 30 dias (cobre o refresh token)
  setCookie(C_ACCESS, t.access_token, { ...cookieBase(), maxAge });
  if (t.refresh_token) setCookie(C_REFRESH, t.refresh_token, { ...cookieBase(), maxAge });
  const expMs = Date.now() + (t.expires_in - 60) * 1000; // margem de 60s
  setCookie(C_EXPIRES, String(expMs), { ...cookieBase(), maxAge });
}

async function validAccessToken(): Promise<string | null> {
  const access = getCookie(C_ACCESS);
  const exp = Number(getCookie(C_EXPIRES) || 0);
  if (access && Date.now() < exp) return access;

  const refresh = getCookie(C_REFRESH);
  if (!refresh) return access || null; // sem refresh, tenta o que houver
  try {
    const t = await exchangeToken({
      grant_type: "refresh_token",
      refresh_token: refresh,
      scope: SCOPES,
    });
    persistTokens(t);
    return t.access_token;
  } catch {
    return access || null;
  }
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function firstRecord(data: unknown): Record<string, unknown> | null {
  return recordsList(data)[0] ?? null;
}

function recordsList(data: unknown): Array<Record<string, unknown>> {
  if (data && typeof data === "object") {
    const recs = (data as { records?: unknown[] }).records;
    if (Array.isArray(recs)) {
      return recs.filter((r): r is Record<string, unknown> => !!r && typeof r === "object");
    }
  }
  return [];
}

function deepSleepMinutes(sleepRecord: Record<string, unknown> | undefined): number | null {
  const score = (sleepRecord?.score ?? {}) as Record<string, unknown>;
  const stages = (score.stage_summary ?? {}) as Record<string, number>;
  const milli = stages.total_slow_wave_sleep_time_milli;
  return typeof milli === "number" && milli > 0 ? Math.round(milli / 60000) : null;
}

function totalSleepHours(sleepRecord: Record<string, unknown> | undefined): number | null {
  const score = (sleepRecord?.score ?? {}) as Record<string, unknown>;
  const stages = (score.stage_summary ?? {}) as Record<string, number>;
  const asleepMilli =
    (stages.total_light_sleep_time_milli ?? 0) +
    (stages.total_slow_wave_sleep_time_milli ?? 0) +
    (stages.total_rem_sleep_time_milli ?? 0);
  return asleepMilli > 0 ? Math.round((asleepMilli / 3_600_000) * 10) / 10 : null;
}

// Extrai um campo numérico de cada registo, em ordem cronológica (a API
// devolve do mais recente para o mais antigo), até `limit` pontos.
function historyOf(records: Array<Record<string, unknown>>, pick: (r: Record<string, unknown>) => number | null, limit = 7): number[] {
  return records
    .slice(0, limit)
    .reverse()
    .map(pick)
    .filter((v): v is number => typeof v === "number");
}

async function fetchMetrics(token: string): Promise<WhoopMetrics> {
  const [recovery, sleep, cycle, body] = await Promise.all([
    apiGet("/recovery?limit=7", token),
    apiGet("/activity/sleep?limit=7", token),
    apiGet("/cycle?limit=1", token),
    apiGet("/user/measurement/body", token),
  ]);

  const recRecords = recordsList(recovery);
  const sleepRecords = recordsList(sleep);
  const recScore = (recRecords[0]?.score ?? {}) as Record<string, number>;
  const cycleScore = (firstRecord(cycle)?.score ?? {}) as Record<string, number>;

  const history: WhoopHistory = {
    hrv: historyOf(recRecords, (r) => {
      const s = (r.score ?? {}) as Record<string, number>;
      return typeof s.hrv_rmssd_milli === "number" ? Math.round(s.hrv_rmssd_milli) : null;
    }),
    restingHr: historyOf(recRecords, (r) => {
      const s = (r.score ?? {}) as Record<string, number>;
      return typeof s.resting_heart_rate === "number" ? Math.round(s.resting_heart_rate) : null;
    }),
    deepSleepMin: historyOf(sleepRecords, deepSleepMinutes),
  };

  const b = (body ?? {}) as Record<string, unknown>;
  const heightM = typeof b.height_meter === "number" ? b.height_meter : null;
  const weightKg = typeof b.weight_kilogram === "number" ? b.weight_kilogram : null;
  const bodyInfo: WhoopBody = {
    heightCm: heightM != null ? Math.round(heightM * 100) : null,
    weightKg: weightKg != null ? Math.round(weightKg * 10) / 10 : null,
    imc: heightM && weightKg ? Math.round((weightKg / (heightM * heightM)) * 10) / 10 : null,
  };

  return {
    recovery: typeof recScore.recovery_score === "number" ? Math.round(recScore.recovery_score) : null,
    hrv: typeof recScore.hrv_rmssd_milli === "number" ? Math.round(recScore.hrv_rmssd_milli) : null,
    restingHr: typeof recScore.resting_heart_rate === "number" ? Math.round(recScore.resting_heart_rate) : null,
    sleepHours: totalSleepHours(sleepRecords[0]),
    strain: typeof cycleScore.strain === "number" ? Math.round(cycleScore.strain * 10) / 10 : null,
    lastSyncISO: new Date().toISOString(),
    history,
    body: bodyInfo,
  };
}

// ─── Server functions ────────────────────────────────
export const whoopAuthUrl = createServerFn({ method: "POST" }).handler(async () => {
  if (!isConfigured()) return { configured: false, url: "" };
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  setCookie(C_STATE, state, { ...cookieBase(), maxAge: 600 });
  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return { configured: true, url: url.toString() };
});

const validateExchange = (input: unknown) => {
  const i = (input ?? {}) as Record<string, unknown>;
  const code = typeof i.code === "string" ? i.code : "";
  const state = typeof i.state === "string" ? i.state : "";
  if (!code) throw new Error("code em falta");
  return { code, state };
};

export const whoopExchange = createServerFn({ method: "POST" })
  .inputValidator(validateExchange)
  .handler(async ({ data }) => {
    if (!isConfigured()) return { ok: false, error: "not_configured" };
    const expected = getCookie(C_STATE);
    if (expected && data.state && expected !== data.state) {
      return { ok: false, error: "state_mismatch" };
    }
    deleteCookie(C_STATE, cookieBase());
    try {
      const t = await exchangeToken({
        grant_type: "authorization_code",
        code: data.code,
        redirect_uri: redirectUri(),
        scope: SCOPES,
      });
      persistTokens(t);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "exchange_failed" };
    }
  });

export const whoopStatus = createServerFn({ method: "GET" }).handler(async (): Promise<WhoopStatus> => {
  if (!isConfigured()) return { configured: false, connected: false, metrics: null };
  const token = await validAccessToken();
  if (!token) return { configured: true, connected: false, metrics: null };
  try {
    const metrics = await fetchMetrics(token);
    return { configured: true, connected: true, metrics };
  } catch (e) {
    return { configured: true, connected: true, metrics: null, error: e instanceof Error ? e.message : "fetch_failed" };
  }
});

export const whoopDisconnect = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(C_ACCESS, cookieBase());
  deleteCookie(C_REFRESH, cookieBase());
  deleteCookie(C_EXPIRES, cookieBase());
  return { ok: true };
});
