// Programa de recomendação: partes puras (sem rede), usadas no telemóvel, no
// servidor e nos testes.
//
// Código: VIV-XXXX-XXXX. Alfabeto de 31 símbolos, sem 0/O/1/I/L, que se
// confundem ao ler ou ditar. Os 8 símbolos vêm de aleatoriedade segura na base
// de dados (ver supabase/migrations/…_referral_program.sql): 31^8 ≈ 8,5×10^11
// combinações e nada do código depende do nome da pessoa.

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_RE = /^VIV-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

/** Máximo de meses grátis por pessoa e por ano civil. */
export const MAX_FREE_MONTHS_PER_YEAR = 12;

/**
 * Põe o que a pessoa escreveu no formato do código: maiúsculas, sem espaços,
 * com ou sem hífenes. Devolve "" se não der um código com o formato certo.
 */
export function normalizeCode(input: string): string {
  const raw = (input ?? "").toUpperCase().replace(/[\s-]+/g, "");
  if (!/^VIV[2-9A-HJKMNP-Z]{8}$/.test(raw)) return "";
  return `VIV-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
}

export const isCodeFormat = (code: string): boolean => CODE_RE.test(code);

/**
 * Email normalizado só para detetar contas repetidas da mesma pessoa:
 * minúsculas, sem «+etiqueta» e, no Gmail, sem pontos. Não é usado para enviar
 * nada.
 */
export function normalizeEmail(email: string): string {
  const e = (email ?? "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** Ligação de convite, com o código já preenchido. */
export function referralLink(base: string, code: string): string {
  const u = new URL(base);
  u.searchParams.set("ref", code);
  return u.toString();
}

/** Código vindo de «?ref=…» no endereço; "" se não for um código válido. */
export function codeFromSearch(search: string): string {
  try {
    return normalizeCode(new URLSearchParams(search).get("ref") ?? "");
  } catch {
    return "";
  }
}

export type ReferralKind = "patient" | "doctor";

export interface ReferralSummary {
  invited: number;
  pending: number;
  completed: number;
  /** Meses grátis atribuídos no ano civil em curso (máx. 12). */
  monthsThisYear: number;
  /** Cada mês atribuído: sem identidades, só datas e estado. */
  credits: { grantedAt: string; appliedAt: string | null }[];
}

export type CodeCheck =
  | { state: "valid"; kind: ReferralKind; doctorName?: string }
  | { state: "invalid" }
  | { state: "unavailable" };
