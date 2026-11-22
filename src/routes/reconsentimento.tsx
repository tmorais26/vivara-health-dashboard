import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import {
  ConsentFields,
  PrivacidadeInfo,
  useConsentTextos,
  type ConsentState,
} from "@/components/auth/ConsentFields";
import { gravarAceitacao } from "@/lib/consent-client";
import { estadoConsentimento } from "@/lib/consent.functions";

export const Route = createFileRoute("/reconsentimento")({
  head: () => ({ meta: [{ title: "Vivara Health" }] }),
  component: Reconsentimento,
});

function Reconsentimento() {
  const t = useT();
  const textos = useConsentTextos();
  const navigate = useNavigate();
  const [consent, setConsent] = useState<ConsentState>({
    documentos: false,
    habilitacao: false,
    marketing: false,
  });
  const [tentou, setTentou] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [primeiraVez, setPrimeiraVez] = useState<boolean | null>(null);

  useEffect(() => {
    estadoConsentimento()
      .then((r) => setPrimeiraVez(r.primeiraVez))
      .catch(() => setPrimeiraVez(false));
  }, []);

  async function continuar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (!consent.documentos || !consent.habilitacao) return;
    setLoading(true);
    setErro(null);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error();
      await gravarAceitacao(data.user, textos);
      window.location.assign("/");
    } catch {
      setErro(t.conta.erroGenerico);
      setLoading(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { saiu: 1 } });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form
        onSubmit={continuar}
        noValidate
        className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-sm"
      >
        <h1 className="font-serif text-2xl text-foreground">
          {primeiraVez === null
            ? "\u00a0"
            : primeiraVez
              ? t.consent.primeiraTitulo
              : t.consent.reTitulo}
        </h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          {primeiraVez === null
            ? "\u00a0"
            : primeiraVez
              ? t.consent.primeiraTexto
              : t.consent.reTexto}
        </p>
        <ConsentFields
          value={consent}
          onChange={setConsent}
          showErrors={tentou}
          includeMarketing={false}
        />
        {erro && (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-state-alert/30 bg-state-alert-soft px-3 py-2 text-xs text-state-alert"
          >
            {erro}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !consent.documentos || !consent.habilitacao}
          className="mt-5 w-full rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? t.conta.aProcessar : t.consent.reContinuar}
        </button>
        <PrivacidadeInfo />
        <button
          type="button"
          onClick={sair}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {t.consent.reSair}
        </button>
      </form>
    </div>
  );
}
