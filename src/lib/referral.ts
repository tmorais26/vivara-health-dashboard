// Programa de recomendação: partes puras (sem rede), usadas no telemóvel, no
// servidor e nos testes. As regras e os códigos vivem na base de dados do
// portal (codigos_recomendacao, recomendacoes, meses_gratis); aqui só se
// normaliza o que a pessoa escreve e se constroem ligações.
//
// Código: VIV-XXXX-XXXX, letras e números sem 0/O/1/I.

const SYMBOL = "[2-9A-HJ-NP-Z]";
export const CODE_RE = new RegExp(`^VIV-${SYMBOL}{4}-${SYMBOL}{4}$`);
const RAW_RE = new RegExp(`^VIV${SYMBOL}{8}$`);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Põe o que a pessoa escreveu no formato do código: maiúsculas, sem espaços,
 * com ou sem hífenes. Devolve "" se não der um código com o formato certo.
 */
export function normalizeCode(input: string): string {
  const raw = (input ?? "").toUpperCase().replace(/[\s-]+/g, "");
  if (!RAW_RE.test(raw)) return "";
  return `VIV-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
}

export const isCodeFormat = (code: string): boolean => CODE_RE.test(code);

/** Token de convite (uuid) enviado pelo médico; "" se não for um uuid. */
export function normalizeInvite(input: string): string {
  const v = (input ?? "").trim().toLowerCase();
  return UUID_RE.test(v) ? v : "";
}

/** «?codigo=VIV-…» e «?convite=<uuid>» do endereço, já validados no formato. */
export function referralParams(search: string): { codigo: string; convite: string } {
  try {
    const p = new URLSearchParams(search);
    return { codigo: normalizeCode(p.get("codigo") ?? ""), convite: normalizeInvite(p.get("convite") ?? "") };
  } catch {
    return { codigo: "", convite: "" };
  }
}

/** Domínio do portal do médico (configurável por VITE_PORTAL_URL). */
export const PORTAL_URL =
  (import.meta.env?.VITE_PORTAL_URL as string | undefined) || "https://vivara-plataforma-medico.vercel.app";

/** Ligação para o registo de médicos, com o código do utente já preenchido. */
export function doctorSignupLink(code: string, portal: string = PORTAL_URL): string {
  const u = new URL("/auth", portal);
  u.searchParams.set("codigo", code);
  return u.toString();
}

/** Respostas de usar_codigo / aceitar_convite_app. */
export type ReferralResult =
  | "ok" | "codigo_invalido" | "convite_invalido" | "proprio_codigo" | "nao_aplicavel" | "ja_usado" | "fora_do_registo";

export const REFERRAL_RESULTS: ReferralResult[] = [
  "ok", "codigo_invalido", "convite_invalido", "proprio_codigo", "nao_aplicavel", "ja_usado", "fora_do_registo",
];

export const asReferralResult = (v: unknown): ReferralResult | null =>
  typeof v === "string" && (REFERRAL_RESULTS as string[]).includes(v) ? (v as ReferralResult) : null;

/** Uma linha de meses_gratis, tal como a app a mostra (sem identidades). */
export interface FreeMonth {
  estado: "por_aplicar" | "aplicado" | "limite_atingido";
  ano: number;
  criadoEm: string;
  aplicadoEm: string | null;
}
