import { useState } from "react";
import { CTAButton } from "./ui";
import { useT } from "../i18n";

const SITE_USER = "site@vivara.health";
const SITE_PASS = "+Vivara2024";

const T = {
  pt: {
    notice: "Este site ainda não está disponível ao público.",
    email: "Email",
    password: "Palavra-passe",
    submit: "Entrar",
    invalid: "Credenciais inválidas.",
  },
  en: {
    notice: "This site is not yet available to the public.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    invalid: "Invalid credentials.",
  },
};

export default function SiteGate({ children }) {
  const t = useT();
  const L = t(T);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (email === SITE_USER && password === SITE_PASS) {
      setUnlocked(true);
      setError("");
    } else {
      setError(L.invalid);
    }
  }

  if (unlocked) return children;

  return (
    <div className="min-h-screen bg-brand-beige flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8"
      >
        <h1 className="font-serif font-light tracking-tight text-3xl text-center">
          Vivara Health
        </h1>
        <p className="mt-2 text-sm text-brand-muted/70 text-center">{L.notice}</p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="site-gate-email">
              {L.email}
            </label>
            <input
              id="site-gate-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-olive"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="site-gate-password">
              {L.password}
            </label>
            <input
              id="site-gate-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-brand-olive"
              required
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <CTAButton type="submit" className="mt-6 w-full">
          {L.submit}
        </CTAButton>
      </form>
    </div>
  );
}
