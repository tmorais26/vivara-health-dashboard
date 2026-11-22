import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Download, FileText, Info, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import {
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
} from "@/components/portal/SimpleModal";
import { registarDeclaracaoRecomendacao } from "@/lib/consent.functions";
import { descarregarCartao, qrDataUrl } from "@/lib/cartao-recomendacao";
import { ligacaoColega, ligacaoUtente } from "@/lib/legal-docs";
import { useT } from "@/lib/i18n";
import { nomeAtual, useSessao } from "@/lib/sessao";

export const Route = createFileRoute("/definicoes_/recomendar")({
  head: () => ({ meta: [{ title: "Recomendar — Vivara Health" }] }),
  component: RecomendarPage,
});

type Resumo = { utentes: number; medicos: number; meses_ano: number; limite: number };

// Remove um "Dr."/"Dra." já presente no nome, para o cartão dizer "Convite do(a) Dr(a). Nome".
function nomeSemTitulo(nome: string) {
  return nome.replace(/^\s*(dr|dra|doutor|doutora)\.?\s+/i, "").trim();
}

function RecomendarPage() {
  const t = useT();
  const tr = t.recomendar;
  const sessao = useSessao();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [declarou, setDeclarou] = useState<boolean | null>(null);
  const [pendente, setPendente] = useState<(() => void) | null>(null);
  const [aceite, setAceite] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const nome = nomeSemTitulo(sessao.perfil?.nome || nomeAtual(sessao));
  const lUtente = codigo ? ligacaoUtente(codigo) : "";
  const lColega =
    codigo && typeof window !== "undefined" ? ligacaoColega(codigo, window.location.origin) : "";

  useEffect(() => {
    void (async () => {
      const [c, r, d] = await Promise.all([
        supabase.rpc("meu_codigo"),
        supabase.rpc("resumo_recomendacoes"),
        supabase.rpc("ja_declarou_recomendacao"),
      ]);
      if (c.error || !c.data) return setErro(tr.erroCodigo);
      setCodigo(c.data);
      setResumo((r.data as Resumo | null) ?? null);
      setDeclarou(!!d.data);
    })();
  }, [tr.erroCodigo]);

  useEffect(() => {
    if (lUtente) void qrDataUrl(lUtente).then(setQr);
  }, [lUtente]);

  // Na primeira partilha pede-se a declaração escrita; depois disso, partilha direta.
  function comDeclaracao(acao: () => void) {
    if (declarou) return acao();
    setAceite(false);
    setPendente(() => acao);
  }

  async function confirmarDeclaracao() {
    if (!aceite || !pendente) return;
    setAGuardar(true);
    try {
      await registarDeclaracaoRecomendacao({ data: { texto: tr.declaracao } });
      setDeclarou(true);
      const acao = pendente;
      setPendente(null);
      acao();
    } catch {
      setErro(t.conta.erroGenerico);
    } finally {
      setAGuardar(false);
    }
  }

  async function copiar() {
    if (!codigo) return;
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function partilhar(ligacao: string) {
    const texto = `${tr.convite(nome)} — ${codigo}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vivara", text: texto, url: ligacao });
      } catch {
        // partilha cancelada
      }
    } else {
      await navigator.clipboard.writeText(ligacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  function descarregarQr() {
    if (!qr || !codigo) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `vivara-qr-${codigo}.png`;
    a.click();
  }

  const botao =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50";

  return (
    <PortalShell>
      <main className="mx-auto max-w-[860px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <Link
          to="/definicoes"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.definicoes.titulo}
        </Link>
        <h1 className="font-serif mt-3 text-3xl text-foreground sm:text-4xl">{tr.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{tr.sub}</p>

        <p
          role="note"
          className="mt-5 flex items-start gap-2 rounded-xl border border-state-warn/30 bg-state-warn-soft px-4 py-3 text-sm font-medium text-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-state-warn" />
          {tr.transparencia}
        </p>

        {erro && (
          <p role="alert" className="mt-4 text-sm text-state-alert">
            {erro}
          </p>
        )}

        {codigo && (
          <section className="mt-5 grid gap-5 rounded-2xl border border-border bg-surface-raised p-5 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {tr.sub}
              </div>
              <div
                className="mt-1 font-mono text-2xl tracking-wider text-foreground sm:text-3xl"
                aria-label={codigo.split("").join(" ")}
              >
                {codigo}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => comDeclaracao(copiar)} className={botao}>
                  <Copy className="h-3.5 w-3.5" />
                  {copiado ? tr.copiado : tr.copiar}
                </button>
                <button
                  type="button"
                  onClick={() => comDeclaracao(() => partilhar(lUtente))}
                  className={botao}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {tr.ligacaoUtentes}
                </button>
                <button
                  type="button"
                  onClick={() => comDeclaracao(() => partilhar(lColega))}
                  className={botao}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {tr.ligacaoColegas}
                </button>
                <button
                  type="button"
                  disabled={!qr}
                  onClick={() => comDeclaracao(descarregarQr)}
                  className={botao}
                >
                  <Download className="h-3.5 w-3.5" />
                  {tr.descarregarQr}
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  comDeclaracao(
                    () =>
                      void descarregarCartao({
                        codigo,
                        ligacao: lUtente,
                        convite: tr.convite(nome),
                        chamada: tr.cartaoChamada,
                        transparencia: tr.transparencia,
                      }),
                  )
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <FileText className="h-3.5 w-3.5" />
                {tr.cartao}
              </button>
              <p className="mt-1 text-[11px] text-muted-foreground">{tr.cartaoAjuda}</p>
            </div>
            {qr && (
              <img
                src={qr}
                alt={`QR · ${tr.ligacaoUtentes}`}
                className="h-40 w-40 rounded-lg border border-border bg-white p-1"
              />
            )}
          </section>
        )}

        {resumo && (
          <section className="mt-4 rounded-2xl border border-border bg-surface-raised p-5 text-sm text-foreground">
            <p>{tr.utentesEntraram(resumo.utentes)}</p>
            <p className="mt-1">{tr.medicosEntraram(resumo.medicos, resumo.meses_ano)}</p>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-border bg-surface-raised p-5">
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {tr.regras}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            <li>{tr.regraUtente}</li>
            <li>{tr.regraMedico}</li>
            <li>{tr.regraPagamento}</li>
          </ul>
        </section>
      </main>
      <MobileNavTabs />

      <SimpleModal
        open={pendente !== null}
        onClose={() => setPendente(null)}
        title={tr.declaracaoTitulo}
        width="sm"
      >
        <p className="text-sm font-medium text-foreground">{tr.transparencia}</p>
        <div className="mt-4 flex items-start gap-2.5">
          <input
            id="declaracao-recomendar"
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
          />
          <label htmlFor="declaracao-recomendar" className="text-sm text-foreground">
            {tr.declaracao}
          </label>
        </div>
        <ModalActions>
          <SecondaryButton onClick={() => setPendente(null)}>{tr.cancelar}</SecondaryButton>
          <PrimaryButton onClick={() => void confirmarDeclaracao()}>
            {aGuardar ? t.conta.aProcessar : tr.confirmar}
          </PrimaryButton>
        </ModalActions>
      </SimpleModal>
    </PortalShell>
  );
}
