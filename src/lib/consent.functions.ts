// Funções de servidor da conta do utente e do registo de consentimentos.
//
// Só o servidor escreve em consent_events (com o service role): é aqui que se
// lê o IP do pedido e a data/hora vem da base de dados (UTC). O browser nunca
// envia IP, data nem texto das caixas; envia só que caixas marcou e o idioma,
// e o servidor junta a versão em vigor e o hash do texto que estava no ecrã.

import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestUrl } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  DOC_VERSIONS, EXPORT_WINDOW_DAYS, RECONSENT_CHECKBOX, SIGNUP_CHECKBOXES, wearablePrompt,
  type ConsentLang, type SignupCheckboxId,
} from "./consent.config";
import { validateSignup, type SignupResult } from "./consent.validate";

export { validateSignup, type SignupField, type SignupResult } from "./consent.validate";

type ConsentInsert = Database["public"]["Tables"]["consent_events"]["Insert"];

// ─── utilitários ─────────────────────────────────────

const asLang = (v: unknown): ConsentLang => (v === "en" ? "en" : "pt");

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const checkboxText = (id: SignupCheckboxId, lang: ConsentLang) =>
  SIGNUP_CHECKBOXES.find((c) => c.id === id)!.text[lang];

/** IP do cliente, tal como chega ao servidor (a Vercel põe-no nestes cabeçalhos). */
function clientIp(): string | null {
  const h = getRequest()?.headers;
  if (!h) return null;
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for") || "";
  const ip = raw.split(",")[0].trim();
  if (!ip || ip.length > 45) return null;
  const v4 = /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip);
  const v6 = /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":");
  return v4 || v6 ? ip : null;
}

function userAgent(): string | null {
  const ua = getRequest()?.headers.get("user-agent");
  return ua ? ua.slice(0, 500) : null;
}

function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function insertEvents(rows: ConsentInsert[]) {
  const { error } = await supabaseAdmin.from("consent_events").insert(rows);
  if (error) throw new Error(`consent_events: ${error.message}`);
}

// ─── criar conta ─────────────────────────────────────

export const signUpPatient = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => raw)
  .handler(async ({ data }): Promise<SignupResult> => {
    const { input, errors } = validateSignup(data);
    if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
    if (!isConfigured()) return { ok: false, error: "not_configured" };

    const anon = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const origin = new URL(getRequestUrl()).origin;
    const { data: su, error } = await anon.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name }, emailRedirectTo: `${origin}/app-v2` },
    });
    if (error) {
      // Domínios que o Supabase recusa (inexistentes, de teste ou descartáveis).
      if ((error as { code?: string }).code === "email_address_invalid") return { ok: false, fieldErrors: { email: "invalid" } };
      if (/password/i.test(error.message)) return { ok: false, error: "weak_password" };
      console.error("[signup]", error.message);
      return { ok: false, error: "server" };
    }
    const user = su.user;
    // Email já registado: o Supabase devolve um utilizador sem identidades.
    // Respondemos igual a um registo novo, para não revelar que o email existe,
    // e não gravamos consentimentos em nome de outra pessoa.
    if (!user || (user.identities && user.identities.length === 0)) return { ok: true, session: null };

    const ip = clientIp();
    const ua = userAgent();
    const L = input.lang;
    const base = { user_id: user.id, action: "granted" as const, lang: L, ip, user_agent: ua };
    const legalHash = await sha256(checkboxText("signup-legal", L));
    const rows: ConsentInsert[] = [
      { ...base, consent_type: "age_18", checkbox_id: "signup-age", text_hash: await sha256(checkboxText("signup-age", L)) },
      { ...base, consent_type: "terms", checkbox_id: "signup-legal", doc_version: DOC_VERSIONS.terms, text_hash: legalHash },
      { ...base, consent_type: "privacy", checkbox_id: "signup-legal", doc_version: DOC_VERSIONS.privacy, text_hash: legalHash },
      { ...base, consent_type: "health_data", checkbox_id: "signup-health", text_hash: await sha256(checkboxText("signup-health", L)) },
    ];
    if (input.checks["signup-marketing"]) {
      rows.push({ ...base, consent_type: "marketing", checkbox_id: "signup-marketing", text_hash: await sha256(checkboxText("signup-marketing", L)) });
    }

    try {
      // O trigger on_auth_user_created já criou o perfil; confirma-se aqui o
      // papel de utente e guarda-se o código de convite.
      const { error: pErr } = await supabaseAdmin.from("profiles")
        .upsert({ id: user.id, role: "patient", full_name: input.name, invite_code: input.invite || null }, { onConflict: "id" });
      if (pErr) throw new Error(`profiles: ${pErr.message}`);
      await insertEvents(rows);
    } catch (e) {
      // Sem registo de consentimento não pode haver conta: desfaz-se.
      console.error("[signup]", e instanceof Error ? e.message : e);
      await supabaseAdmin.auth.admin.deleteUser(user.id).catch(() => {});
      return { ok: false, error: "server" };
    }

    return {
      ok: true,
      session: su.session ? { access_token: su.session.access_token, refresh_token: su.session.refresh_token } : null,
    };
  });

// ─── estado dos consentimentos ───────────────────────

export interface ConsentStatus {
  name: string | null;
  needsReconsent: boolean;
  health: boolean;
  marketing: boolean;
  wearables: Record<string, boolean>;
  closure: { requestedAt: string; exportUntil: string; reason: string } | null;
}

export const getConsentStatus = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConsentStatus> => {
    const uid = context.userId;
    const [{ data: events }, { data: profile }, { data: closures }] = await Promise.all([
      supabaseAdmin.from("consent_events").select("consent_type, action, doc_version, created_at").eq("user_id", uid).order("created_at", { ascending: true }).order("id", { ascending: true }),
      supabaseAdmin.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("account_closures").select("requested_at, export_until, reason").eq("user_id", uid).order("requested_at", { ascending: false }).limit(1),
    ]);
    const latest = new Map<string, { action: string; doc_version: string | null }>();
    for (const e of events ?? []) latest.set(e.consent_type, e);
    const granted = (t: string) => latest.get(t)?.action === "granted";
    const wearables: Record<string, boolean> = {};
    for (const [t, e] of latest) if (t.startsWith("wearable:")) wearables[t.slice(9)] = e.action === "granted";
    const c = closures?.[0];
    return {
      name: profile?.full_name ?? null,
      needsReconsent: latest.get("terms")?.doc_version !== DOC_VERSIONS.terms || latest.get("privacy")?.doc_version !== DOC_VERSIONS.privacy,
      health: granted("health_data"),
      marketing: granted("marketing"),
      wearables,
      closure: c ? { requestedAt: c.requested_at, exportUntil: c.export_until, reason: c.reason } : null,
    };
  });

// ─── registar uma decisão (depois do registo) ────────

type RecordInput =
  | { kind: "reconsent"; lang: ConsentLang }
  | { kind: "marketing"; granted: boolean; lang: ConsentLang }
  | { kind: "wearable"; id: string; name: string; granted: boolean; lang: ConsentLang };

const WEARABLE_ID_RE = /^[a-z0-9_-]{2,32}$/;

function validateRecord(raw: unknown): RecordInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const lang = asLang(r.lang);
  if (r.kind === "reconsent") return { kind: "reconsent", lang };
  if (r.kind === "marketing") return { kind: "marketing", granted: r.granted === true, lang };
  if (r.kind === "wearable" && typeof r.id === "string" && WEARABLE_ID_RE.test(r.id) && typeof r.name === "string" && r.name.length <= 60) {
    return { kind: "wearable", id: r.id, name: r.name, granted: r.granted === true, lang };
  }
  throw new Error("pedido inválido");
}

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator(validateRecord)
  .handler(async ({ data, context }) => {
    const base = { user_id: context.userId, lang: data.lang, ip: clientIp(), user_agent: userAgent() };
    if (data.kind === "reconsent") {
      const h = await sha256(RECONSENT_CHECKBOX.text[data.lang]);
      await insertEvents([
        { ...base, action: "granted", consent_type: "terms", checkbox_id: RECONSENT_CHECKBOX.id, doc_version: DOC_VERSIONS.terms, text_hash: h },
        { ...base, action: "granted", consent_type: "privacy", checkbox_id: RECONSENT_CHECKBOX.id, doc_version: DOC_VERSIONS.privacy, text_hash: h },
      ]);
    } else if (data.kind === "marketing") {
      await insertEvents([{
        ...base, action: data.granted ? "granted" : "withdrawn", consent_type: "marketing", checkbox_id: "settings-marketing",
        text_hash: await sha256(checkboxText("signup-marketing", data.lang)),
      }]);
    } else {
      await insertEvents([{
        ...base, action: data.granted ? "granted" : "withdrawn", consent_type: `wearable:${data.id}`,
        checkbox_id: data.granted ? "wearable-prompt" : "wearable-disconnect",
        text_hash: data.granted ? await sha256(wearablePrompt(data.name, data.lang)) : null,
      }]);
    }
    return { ok: true };
  });

// ─── encerrar conta / retirar consentimento de saúde ─

export const closeAccount = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    if (r.reason !== "user_request" && r.reason !== "health_consent_withdrawn") throw new Error("motivo inválido");
    return { reason: r.reason as "user_request" | "health_consent_withdrawn", lang: asLang(r.lang) };
  })
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const { data: existing } = await supabaseAdmin.from("account_closures").select("export_until").eq("user_id", uid).is("deleted_at", null).limit(1);
    if (existing?.length) return { ok: true, exportUntil: existing[0].export_until };

    if (data.reason === "health_consent_withdrawn") {
      await insertEvents([{
        user_id: uid, action: "withdrawn", consent_type: "health_data", checkbox_id: "settings-health-withdraw",
        lang: data.lang, ip: clientIp(), user_agent: userAgent(),
      }]);
    }
    const exportUntil = new Date(Date.now() + EXPORT_WINDOW_DAYS * 86_400_000).toISOString();
    const { error } = await supabaseAdmin.from("account_closures").insert({ user_id: uid, reason: data.reason, export_until: exportUntil });
    if (error) throw new Error(`account_closures: ${error.message}`);
    return { ok: true, exportUntil };
  });

// ─── exportar ────────────────────────────────────────

export const exportServerData = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [{ data: profile }, { data: consents }, { data: closures }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, invite_code, created_at").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("consent_events").select("consent_type, action, doc_version, checkbox_id, lang, ip, created_at").eq("user_id", uid).order("created_at"),
      supabaseAdmin.from("account_closures").select("reason, requested_at, export_until").eq("user_id", uid),
    ]);
    return { profile, consents: (consents ?? []).map((c) => ({ ...c, ip: c.ip == null ? null : String(c.ip) })), closures: closures ?? [] };
  });
