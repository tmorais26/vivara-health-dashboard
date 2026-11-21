import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { MarcarConsultaModal } from "@/components/portal/MarcarConsultaModal";
import { definirUsarAgenda, usePrefsMedico } from "@/lib/medico-prefs";
import { useIdioma, useT } from "@/lib/i18n";
import { e_clinico, iniciais, useSessao } from "@/lib/sessao";
import { membrosDoEspaco, rotuloMembro, soData, type ConsultaDb, type MembroDb } from "@/lib/dados";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Vivara Health" }] }),
  component: AgendaPage,
});

type Item = ConsultaDb & { utenteNome: string };

function AgendaPage() {
  const t = useT();
  const ta = t.agendaDb;
  const idioma = useIdioma();
  const { usarAgenda } = usePrefsMedico();
  const { atual } = useSessao();
  const clinica = atual?.espaco.tipo === "clinica";
  const [quem, setQuem] = useState<"minhas" | "todas">(e_clinico(atual) ? "minhas" : "todas");
  const [quando, setQuando] = useState<"proximas" | "anteriores">("proximas");
  const [itens, setItens] = useState<Item[] | null>(null);
  const [membros, setMembros] = useState<MembroDb[]>([]);
  const [marcarOpen, setMarcarOpen] = useState(false);

  const carregar = useCallback(async () => {
    if (!atual) return;
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
    let q = supabase.from("consultas").select("*").eq("espaco_id", atual.espaco_id);
    q = quando === "proximas" ? q.gte("inicio", inicioDia).order("inicio") : q.lt("inicio", inicioDia).order("inicio", { ascending: false });
    if (quem === "minhas") q = q.eq("profissional_id", atual.id);
    const { data } = await q.limit(200);
    const ids = [...new Set((data ?? []).map((c) => c.utente_id))];
    const { data: us } = ids.length ? await supabase.from("utentes").select("id, nome").in("id", ids) : { data: [] };
    const nomes = new Map((us ?? []).map((u) => [u.id, u.nome]));
    setItens((data ?? []).map((c) => ({ ...c, utenteNome: nomes.get(c.utente_id) ?? "—" })));
  }, [atual, quem, quando]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (atual) void membrosDoEspaco(atual.espaco_id).then(setMembros);
  }, [atual]);

  const porDia = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const c of itens ?? []) {
      const d = new Date(c.inicio);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      (m.get(k) ?? m.set(k, []).get(k)!).push(c);
    }
    return [...m.entries()];
  }, [itens]);

  const nomeDe = (id: string) => {
    const m = membros.find((x) => x.id === id);
    return m ? rotuloMembro(m, { medico: t.ficha.medico, administrativo: t.ficha.administrativo }) : "";
  };

  async function cancelar(id: string) {
    if (!window.confirm(ta.confirmarCancelar)) return;
    await supabase.from("consultas").update({ estado: "cancelada" }).eq("id", id);
    void carregar();
  }

  if (!usarAgenda) {
    return (
      <PortalShell>
        <main className="mx-auto max-w-[640px] px-4 py-16 text-center">
          <p className="text-sm text-foreground">{t.agendaPref.desligada}</p>
          <button type="button" onClick={() => definirUsarAgenda(true)} className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90">
            {t.agendaPref.ligar}
          </button>
        </main>
        <MobileNavTabs />
      </PortalShell>
    );
  }

  const hojeK = new Date().toDateString();
  const segmento = "rounded-full px-3 py-1.5";

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{atual?.espaco.nome}</div>
            <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">{ta.titulo}</h1>
          </div>
          <button type="button" onClick={() => setMarcarOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            <CalendarPlus className="h-3.5 w-3.5" />
            {t.marcar.titulo}
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs">
          <div role="group" className="flex rounded-full border border-border bg-surface-raised p-0.5">
            {(["proximas", "anteriores"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={quando === v} onClick={() => setQuando(v)} className={`${segmento} ${quando === v ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                {ta[v]}
              </button>
            ))}
          </div>
          {clinica && (
            <div role="group" className="flex rounded-full border border-border bg-surface-raised p-0.5">
              {(["minhas", "todas"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={quem === v} onClick={() => setQuem(v)} className={`${segmento} ${quem === v ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                  {ta[v]}
                </button>
              ))}
            </div>
          )}
        </div>

        {itens === null ? (
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface-raised" />
        ) : porDia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface-raised px-6 py-12 text-center text-sm text-muted-foreground">
            {quando === "proximas" ? ta.vazia : ta.vaziaAnteriores}
          </p>
        ) : (
          <div className="space-y-4">
            {porDia.map(([dia, cs]) => (
              <section key={dia} className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
                <header className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {new Date(cs[0].inicio).toDateString() === hojeK ? `${ta.hoje} · ` : ""}
                    {soData(cs[0].inicio, idioma)}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">{ta.nConsultas(cs.length)}</span>
                </header>
                <ul className="divide-y divide-border">
                  {cs.map((c) => (
                    <li key={c.id} className={`flex flex-wrap items-center gap-4 px-5 py-3 ${c.estado === "cancelada" ? "opacity-50" : ""}`}>
                      <span className="tabular w-12 text-sm text-foreground">
                        {new Date(c.inicio).toLocaleTimeString(idioma === "pt" ? "pt-PT" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground">{iniciais(c.utenteNome)}</span>
                      <div className="min-w-0 flex-1">
                        <Link to="/utentes/$utenteId" params={{ utenteId: c.utente_id }} className="text-sm text-foreground hover:underline">
                          {c.utenteNome}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          {c.tipo === "video" && <Video className="h-3 w-3" />}
                          <span>
                            {t.ficha.duracao(c.duracao_min)} · {c.tipo === "video" ? t.ficha.video : t.ficha.presencial}
                          </span>
                          {(quem === "todas" || !e_clinico(atual)) && <span>· {nomeDe(c.profissional_id)}</span>}
                          {c.motivo && <span>· {c.motivo}</span>}
                          {c.estado !== "agendada" && <span className="rounded-full bg-accent px-1.5 text-foreground">{t.ficha.estado[c.estado]}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.estado === "agendada" && quando === "proximas" && (
                          <button type="button" onClick={() => cancelar(c.id)} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                            {ta.cancelar}
                          </button>
                        )}
                        <Link to="/consulta/$eventoId" params={{ eventoId: c.id }} className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90">
                          {ta.abrir}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <MobileNavTabs />
      <MarcarConsultaModal
        open={marcarOpen}
        onClose={() => setMarcarOpen(false)}
        onMarcada={() => {
          setMarcarOpen(false);
          void carregar();
        }}
      />
    </PortalShell>
  );
}
