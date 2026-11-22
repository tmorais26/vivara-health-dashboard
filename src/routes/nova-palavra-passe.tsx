import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/nova-palavra-passe")({
  head: () => ({ meta: [{ title: "Nova palavra-passe — Vivara Health" }] }),
  component: NovaPalavraPasse,
});

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring aria-[invalid=true]:border-state-alert";

function NovaPalavraPasse() {
  const t = useT().conta;
  const navigate = useNavigate();
  const [temSessao, setTemSessao] = useState<boolean | null>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setTemSessao(!!s));
    supabase.auth.getSession().then(({ data }) => setTemSessao(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (p1.length < 6) return setErro(t.erroPalavraPasse);
    if (p1 !== p2) return setErro(t.novaDiferentes);
    setErro(null);
    setAGuardar(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setAGuardar(false);
    if (error) return setErro(error.code === "weak_password" || error.code === "same_password" ? t.erroPalavraPasseFraca : t.erroGenerico);
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
        <h1 className="font-serif text-2xl text-foreground">{t.novaTitulo}</h1>
        {temSessao === false ? (
          <>
            <p role="alert" className="mt-3 text-sm text-foreground">
              {t.novaExpirado}
            </p>
            <Link to="/auth" className="mt-4 inline-block text-sm font-medium text-foreground underline">
              {t.voltarEntrar}
            </Link>
          </>
        ) : (
          <form onSubmit={guardar} noValidate className="mt-1 space-y-3">
            <p className="text-sm text-muted-foreground">{t.novaSub}</p>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.palavraPasse}
              <input type="password" autoComplete="new-password" className={inputClass} value={p1} onChange={(e) => setP1(e.target.value)} aria-invalid={!!erro} />
            </label>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.novaConfirmar}
              <input type="password" autoComplete="new-password" className={inputClass} value={p2} onChange={(e) => setP2(e.target.value)} aria-invalid={!!erro} />
            </label>
            {erro && (
              <p role="alert" className="text-xs text-state-alert">
                {erro}
              </p>
            )}
            <button
              type="submit"
              disabled={aGuardar || temSessao === null}
              className="w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {aGuardar ? t.aProcessar : t.novaGuardar}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
