// Validação do formulário de criar conta. Corre no browser (erros junto de
// cada campo) e outra vez no servidor, que é quem decide.
import { SIGNUP_CHECKBOXES, type ConsentLang, type SignupCheckboxId } from "./consent.config";

export type SignupField = "name" | "email" | "password" | "invite" | SignupCheckboxId;
export type SignupResult =
  | { ok: true; session: { access_token: string; refresh_token: string } | null }
  | { ok: false; fieldErrors?: Partial<Record<SignupField, string>>; error?: "not_configured" | "server" | "weak_password" };

export interface SignupInput {
  name: string; email: string; password: string; invite: string;
  checks: Record<SignupCheckboxId, boolean>; lang: ConsentLang;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(raw: unknown): { input: SignupInput; errors: Partial<Record<SignupField, string>> } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const c = (r.checks ?? {}) as Record<string, unknown>;
  const input: SignupInput = {
    name: typeof r.name === "string" ? r.name.trim() : "",
    email: typeof r.email === "string" ? r.email.trim().toLowerCase() : "",
    password: typeof r.password === "string" ? r.password : "",
    invite: typeof r.invite === "string" ? r.invite.trim() : "",
    checks: {
      "signup-age": c["signup-age"] === true,
      "signup-legal": c["signup-legal"] === true,
      "signup-health": c["signup-health"] === true,
      "signup-marketing": c["signup-marketing"] === true,
    },
    lang: r.lang === "en" ? "en" : "pt",
  };
  const errors: Partial<Record<SignupField, string>> = {};
  if (!input.name) errors.name = "required";
  else if (input.name.length > 200) errors.name = "too_long";
  if (!input.email) errors.email = "required";
  else if (input.email.length > 254 || !EMAIL_RE.test(input.email)) errors.email = "invalid";
  if (!input.password) errors.password = "required";
  else if (input.password.length < 8) errors.password = "too_short";
  else if (input.password.length > 72) errors.password = "too_long";
  if (input.invite && !/^[A-Za-z0-9-]{3,64}$/.test(input.invite)) errors.invite = "invalid";
  for (const cb of SIGNUP_CHECKBOXES) if (cb.required && !input.checks[cb.id]) errors[cb.id] = "required";
  return { input, errors };
}

