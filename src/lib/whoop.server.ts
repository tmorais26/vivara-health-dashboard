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
// "read:profile" foi propositadamente omitido: não está habilitado para esta
// app na dashboard da Whoop (developer.whoop.com → a tua app → Scopes) e
// pedi-lo causa "invalid_scope" logo no ecrã de autorização. Se o ativares
// lá, podes voltar a acrescentar "read:profile" aqui para mostrar o nome.
const SCOPES = "read:recovery read:sleep read:cycles offline";

const C_ACCESS = "whoop_at";
const C_REFRESH = "whoop_rt";
const C_EXPIRES = "whoop_exp";
const C_STATE = "whoop_state";

interface WhoopMetrics {
  recovery: number | null;   // %
  hrv: number | null;        // ms
  restingHr: number | null;  // bpm
  sleepHours: number | null; // h
  strain: number | null;     // 0–21
  lastSyncISO: string;
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
  if (data && typeof data === "object") {
    const recs = (data as { records?: unknown[] }).records;
    if (Array.isArray(recs) && recs.length > 0 && typeof recs[0] === "object") {
      return recs[0] as Record<string, unknown>;
    }
  }
  return null;
}

async function fetchMetrics(token: string): Promise<WhoopMetrics> {
  const [recovery, sleep, cycle] = await Promise.all([
    apiGet("/recovery?limit=1", token),
    apiGet("/activity/sleep?limit=1", token),
    apiGet("/cycle?limit=1", token),
  ]);

  const recScore = (firstRecord(recovery)?.score ?? {}) as Record<string, number>;
  const sleepScore = (firstRecord(sleep)?.score ?? {}) as Record<string, unknown>;
  const stages = (sleepScore.stage_summary ?? {}) as Record<string, number>;
  const cycleScore = (firstRecord(cycle)?.score ?? {}) as Record<string, number>;

  const asleepMilli =
    (stages.total_light_sleep_time_milli ?? 0) +
    (stages.total_slow_wave_sleep_time_milli ?? 0) +
    (stages.total_rem_sleep_time_milli ?? 0);
  const sleepHours = asleepMilli > 0 ? Math.round((asleepMilli / 3_600_000) * 10) / 10 : null;

  return {
    recovery: typeof recScore.recovery_score === "number" ? Math.round(recScore.recovery_score) : null,
    hrv: typeof recScore.hrv_rmssd_milli === "number" ? Math.round(recScore.hrv_rmssd_milli) : null,
    restingHr: typeof recScore.resting_heart_rate === "number" ? Math.round(recScore.resting_heart_rate) : null,
    sleepHours,
    strain: typeof cycleScore.strain === "number" ? Math.round(cycleScore.strain * 10) / 10 : null,
    lastSyncISO: new Date().toISOString(),
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
