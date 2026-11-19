import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, FileText, FlaskConical, MessageSquare } from "lucide-react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { useT } from "@/lib/i18n";
import { formatarData, formatarDataHora } from "@/data/mock-utente";
import { notificacoesAcoes, useNotificacoes, type TipoNotificacao } from "@/lib/notificacoes-store";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Vivara Health" }] }),
  component: NotificacoesPage,
});

const ICONES: Record<TipoNotificacao, typeof FileText> = {
  analise: FlaskConical,
  exame: FileText,
  consulta: CalendarCheck,
  mensagem: MessageSquare,
};

function NotificacoesPage() {
  const t = useT();
  const lista = useNotificacoes();
  const naoLidas = lista.filter((n) => !n.lida).length;
  const ordenada = [...lista].sort((a, b) => b.quando.localeCompare(a.quando));

  return (
    <PortalShell>
      <main className="mx-auto max-w-[760px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.comum.portal}</div>
            <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">{t.notificacoes.titulo}</h1>
          </div>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={notificacoesAcoes.marcarTodasLidas}
              className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              {t.notificacoes.marcarTodas}
            </button>
          )}
        </div>

        {ordenada.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.notificacoes.vazio}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
            {ordenada.map((n) => {
              const Icone = ICONES[n.tipo];
              return (
                <li key={n.id} className={n.lida ? "" : "bg-accent/40"}>
                  <Link
                    to="/utentes/$utenteId"
                    params={{ utenteId: n.utenteId }}
                    onClick={() => notificacoesAcoes.marcarLida(n.id)}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground">
                      <Icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        {!n.lida && <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-alert" aria-hidden />}
                        <span className={n.lida ? "" : "font-medium"}>{t.notificacoes.tipos[n.tipo]}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{n.utenteNome}</span>
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-muted-foreground">
                      {formatarData(n.quando)} · {formatarDataHora(n.quando).split(" · ")[1]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}
