import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  MessageSquare,
  Pill,
  Share2,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { useIdioma, useT } from "@/lib/i18n";
import { useNotificacoesDb } from "@/lib/notificacoes";
import { dataHora, soData, type NotificacaoDb } from "@/lib/dados";
import { useSessao } from "@/lib/sessao";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Vivara Health" }] }),
  component: NotificacoesPage,
});

const ICONES: Record<string, typeof FileText> = {
  analise: FlaskConical,
  exame: FileText,
  consulta: CalendarCheck,
  mensagem: MessageSquare,
  exportacao_pedido: Download,
  exportacao_decisao: Download,
  membro: UsersRound,
  agenda_hoje: CalendarClock,
  consulta_por_fechar: CalendarCheck,
  exame_atrasado: ClipboardList,
  medicacao_fim: Pill,
  partilha: Share2,
};

function NotificacoesPage() {
  const t = useT();
  const tn = t.notifDb;
  const idioma = useIdioma();
  const navigate = useNavigate();
  const { lista, naoLidas, marcarLida, marcarTodas } = useNotificacoesDb();
  const { membros, escolherEspaco } = useSessao();
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const ids = [...new Set((lista ?? []).map((n) => n.utente_id).filter((x): x is string => !!x))];
    if (!ids.length) return;
    void supabase
      .from("utentes")
      .select("id, nome")
      .in("id", ids)
      .then(({ data }) => setNomes(new Map((data ?? []).map((u) => [u.id, u.nome]))));
  }, [lista]);

  // Cada notificação leva ao sítio onde se resolve. Se for de outro espaço, muda para esse espaço.
  function abrir(n: NotificacaoDb) {
    void marcarLida(n.id);
    if (n.espaco_id && membros.some((m) => m.espaco_id === n.espaco_id))
      escolherEspaco(n.espaco_id);
    const d = (n.detalhe ?? {}) as { chat?: boolean };
    if ((n.tipo === "consulta" || n.tipo === "consulta_por_fechar") && n.ref_id)
      navigate({ to: "/consulta/$eventoId", params: { eventoId: n.ref_id } });
    else if (n.tipo === "agenda_hoje") navigate({ to: "/agenda" });
    else if (n.tipo === "mensagem" && !d.chat) navigate({ to: "/mensagens" });
    else if (n.tipo === "exportacao_pedido") navigate({ to: "/equipa" });
    else if (n.tipo === "membro") navigate({ to: "/" });
    else if (n.utente_id) {
      const separador =
        n.tipo === "medicacao_fim"
          ? "medicacao"
          : n.tipo === "exame_atrasado" || n.tipo === "analise" || n.tipo === "exame"
            ? "analises"
            : n.tipo === "partilha"
              ? (n.detalhe as { registo?: string } | null)?.registo === "observacao"
                ? "observacoes"
                : "outros"
              : undefined;
      navigate({
        to: "/utentes/$utenteId",
        params: { utenteId: n.utente_id },
        search: separador ? { separador } : {},
      });
    }
  }

  function detalhe(n: NotificacaoDb): string {
    const d = (n.detalhe ?? {}) as {
      inicio?: string;
      estado?: string;
      n?: number;
      primeira?: string;
      descricao?: string;
      dci?: string;
      fim?: string;
      registo?: string;
      espaco?: string;
      chat?: boolean;
    };
    const partes: (string | null | undefined)[] = [n.utente_id ? nomes.get(n.utente_id) : null];
    if ((n.tipo === "consulta" || n.tipo === "consulta_por_fechar") && d.inicio)
      partes.push(dataHora(d.inicio, idioma));
    if (n.tipo === "exportacao_decisao" && d.estado)
      partes.push(d.estado === "aprovado" ? tn.aprovada : tn.recusada);
    if (n.tipo === "agenda_hoje" && d.n && d.primeira)
      partes.push(
        tn.agendaN(
          d.n,
          new Date(d.primeira).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        ),
      );
    if (n.tipo === "exame_atrasado" && d.descricao) partes.push(d.descricao);
    if (n.tipo === "medicacao_fim" && d.dci && d.fim)
      partes.push(tn.medicacaoAte(d.dci, soData(d.fim, idioma)));
    if (n.tipo === "partilha")
      partes.push(d.registo === "observacao" ? tn.partilhaObservacao : tn.partilhaDiario);
    if (n.tipo === "mensagem" && d.chat) partes.push(tn.mensagemChat);
    if (n.tipo === "membro" && d.espaco) partes.push(d.espaco);
    return partes.filter(Boolean).join(" · ");
  }

  return (
    <PortalShell>
      <main className="mx-auto max-w-[760px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{tn.titulo}</h1>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={() => void marcarTodas()}
              className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              {tn.marcarTodas}
            </button>
          )}
        </div>

        {lista === null ? (
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface-raised" />
        ) : lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface-raised px-6 py-12 text-center text-sm text-muted-foreground">
            {tn.vazio}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
            {lista.map((n) => {
              const Icone = ICONES[n.tipo] ?? FileText;
              const titulo = (tn as Record<string, unknown>)[n.tipo];
              return (
                <li key={n.id} className={n.lida ? "" : "bg-accent/40"}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-accent/60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground">
                      <Icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        {!n.lida && (
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-state-alert"
                            aria-hidden
                          />
                        )}
                        <span className={n.lida ? "" : "font-medium"}>
                          {typeof titulo === "string" ? titulo : n.tipo}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {detalhe(n)}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-muted-foreground">
                      {dataHora(n.criada_em, idioma)}
                    </span>
                  </button>
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
