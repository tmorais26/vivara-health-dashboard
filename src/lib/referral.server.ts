// Lado servidor do programa de recomendação. Só corre com a chave de serviço:
// as tabelas não são acessíveis pelo telemóvel e só saem daqui contagens, nunca
// identidades.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeCode, normalizeEmail, type CodeCheck, type ReferralKind, type ReferralSummary } from "./referral";
import { sha256 } from "./request-info.server";

type Lookup = { code: string; ownerId: string; kind: ReferralKind };

/** Procura um código (já normalizado). */
export async function lookupCode(code: string): Promise<Lookup | null> {
  const { data, error } = await supabaseAdmin.from("referral_codes").select("code, owner_id, owner_kind").eq("code", code).maybeSingle();
  if (error) throw new Error(`referral_codes: ${error.message}`);
  return data ? { code: data.code, ownerId: data.owner_id, kind: data.owner_kind as ReferralKind } : null;
}

/** Validação em tempo real no registo, com limite de pedidos por IP. */
export async function checkCode(raw: string, ip: string | null): Promise<CodeCheck> {
  const code = normalizeCode(raw);
  const { data: ok, error } = await supabaseAdmin.rpc("rate_limit_hit", {
    p_bucket: `refcheck:${ip ?? "unknown"}`, p_limit: ip ? 20 : 60, p_window: "1 minute",
  });
  if (error) return { state: "unavailable" };
  if (!ok) return { state: "unavailable" };
  if (!code) return { state: "invalid" };
  const found = await lookupCode(code);
  if (!found) return { state: "invalid" };
  if (found.kind !== "doctor") return { state: "valid", kind: found.kind };
  // Só o nome do médico (sem especialidade nem clínica), e só se a cédula está validada.
  const { data: m } = await supabaseAdmin.from("medico_perfis").select("nome, cedula_validada").eq("user_id", found.ownerId).maybeSingle();
  return { state: "valid", kind: "doctor", doctorName: m?.cedula_validada && m.nome ? m.nome : undefined };
}

/**
 * Antes de criar a conta: o código existe e não é da própria pessoa (o mesmo
 * email, mesmo com «+etiqueta» ou pontos no Gmail)? Devolve o código, ou null.
 */
export async function usableCodeFor(rawCode: string, signupEmail: string): Promise<Lookup | null> {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  const found = await lookupCode(code);
  if (!found) return null;
  const { data } = await supabaseAdmin.auth.admin.getUserById(found.ownerId);
  const ownerEmail = data?.user?.email;
  if (ownerEmail && normalizeEmail(ownerEmail) === normalizeEmail(signupEmail)) return null;
  return found;
}

/** Depois de criar a conta: dá-lhe o seu código e regista o código que usou, se houver. */
export async function ensureReferral(userId: string, signupEmail: string, usedCode: string | null): Promise<{ code: string; registered: string | null }> {
  const { data: code, error } = await supabaseAdmin.rpc("ensure_referral_code", { p_user: userId, p_kind: "patient" });
  if (error || !code) throw new Error(`ensure_referral_code: ${error?.message ?? "sem código"}`);
  let registered: string | null = null;
  if (usedCode) {
    const hash = await sha256(normalizeEmail(signupEmail));
    const { data: r, error: e2 } = await supabaseAdmin.rpc("register_referral", {
      p_code: usedCode, p_referee: userId, p_referee_kind: "patient", p_email_norm_hash: hash,
    });
    if (e2) throw new Error(`register_referral: ${e2.message}`);
    registered = r;
  }
  return { code, registered };
}

export async function mySummary(userId: string): Promise<ReferralSummary> {
  const { data, error } = await supabaseAdmin.rpc("referral_summary", { p_user: userId });
  if (error) throw new Error(`referral_summary: ${error.message}`);
  return data as unknown as ReferralSummary;
}

export async function myCode(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("ensure_referral_code", { p_user: userId, p_kind: "patient" });
  if (error || !data) throw new Error(`ensure_referral_code: ${error?.message ?? "sem código"}`);
  return data;
}
