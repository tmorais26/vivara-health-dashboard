import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Video, Sparkles, AlertTriangle, FileText, Activity } from "lucide-react";
import { useState } from "react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { agendaSemana } from "@/data/mock-portal";
import { formatarData, utente as mariaMock } from "@/data/mock-utente";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Vivara Health" },
      { name: "description", content: "Consultas agendadas da semana no portal Vivara Health." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const [prepararId, setPrepararId] = useState<string | null>(null);
  const evento = agendaSemana.find((e) => e.id === prepararId) ?? null;
  // Agrupa por dia.
  const porDia = agendaSemana.reduce<Record<string, typeof agendaSemana>>((acc, e) => {
    (acc[e.data] ??= []).push(e);
    return acc;
  }, {});
  const dias = Object.keys(porDia).sort();

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Próximas consultas. Clica num utente para abrir o perfil clínico.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {dias.map((dia) => (
            <section key={dia} className="rounded-2xl border border-border bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{formatarData(dia)}</span>
                </div>
                <span className="tabular text-[11px] text-muted-foreground">
                  {porDia[dia].length} consulta{porDia[dia].length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {porDia[dia]
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map((e) => (
                    <li key={e.id}>
                      <div className="flex items-center gap-2.5 px-3 py-3 transition-colors hover:bg-accent/40 sm:gap-3 sm:px-4 lg:gap-4 lg:px-5">
                        <div className="tabular w-11 shrink-0 text-[13px] font-medium text-foreground sm:w-14 sm:text-sm lg:w-16">
                          {e.hora}
                        </div>
                        <Link
                          to="/utentes/$utenteId"
                          params={{ utenteId: e.utenteId }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[10.5px] font-medium text-foreground hover:bg-accent/70 sm:h-9 sm:w-9 sm:text-[11px]"
                        >
                          {e.iniciais}
                        </Link>
                        <Link
                          to="/utentes/$utenteId"
                          params={{ utenteId: e.utenteId }}
                          className="min-w-0 flex-1"
                        >
                          <div className="truncate text-[13px] font-medium leading-tight text-foreground hover:underline sm:text-sm">
                            {e.utenteNome}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] leading-tight text-muted-foreground sm:text-[11px]">
                            {e.tipo === "video" ? <Video className="h-3 w-3 shrink-0" /> : null}
                            <span className="truncate">{e.duracao} · {e.tipo}</span>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPrepararId(e.id)}
                          aria-label="Preparar consulta"
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-2 text-[11px] font-medium text-foreground transition-colors hover:bg-accent lg:h-auto lg:px-3 lg:py-1.5"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span className="hidden lg:inline">Preparar</span>
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <Sheet open={!!prepararId} onOpenChange={(o) => !o && setPrepararId(null)}>
          <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-md sm:p-6">
            {evento && (
              <PreparoConsulta evento={evento} onClose={() => setPrepararId(null)} />
            )}
          </SheetContent>
        </Sheet>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}

function PreparoConsulta({
  evento,
  onClose,
}: {
  evento: (typeof agendaSemana)[number];
  onClose: () => void;
}) {
  // Mock: para Maria mostramos dados reais; para os restantes, conteúdo plausível.
  const isMaria = evento.utenteId === mariaMock.id;
  const alertas = isMaria
    ? mariaMock.alertas
    : [
        { id: "a-1", titulo: "Marcador fora do alvo", detalhe: "Acima do intervalo funcional", estado: "atencao" as const },
      ];
  const ultimaNota = isMaria
    ? [...mariaMock.notasMedicas].sort((a, b) => b.data.localeCompare(a.data))[0]
    : null;
  const adesao = [
    { titulo: "Vitamina D3 5000 UI", taxa: 30, dias: "2 de 7" },
    { titulo: "Berberina 500 mg", taxa: 71, dias: "5 de 7" },
    { titulo: "Magnésio bisglicinato", taxa: 100, dias: "7 de 7" },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <SheetHeader>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Preparar consulta
        </div>
        <SheetTitle className="font-serif text-2xl">{evento.utenteNome}</SheetTitle>
        <SheetDescription>
          {formatarData(evento.data)} · {evento.hora} · {evento.duracao} · {evento.tipo}
        </SheetDescription>
        <div className="mt-1 text-xs text-muted-foreground">{evento.motivo}</div>
      </SheetHeader>

      {/* Alertas */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          Alertas clínicos · {alertas.length}
        </div>
        <ul className="space-y-2">
          {alertas.map((a) => {
            const tone =
              a.estado === "alerta"
                ? "border-state-alert/30 bg-state-alert-soft text-state-alert"
                : "border-state-warn/30 bg-state-warn-soft text-state-warn";
            return (
              <li key={a.id} className={`rounded-xl border px-3 py-2 text-[12px] ${tone}`}>
                <div className="font-medium">{a.titulo}</div>
                <div className="opacity-70">{a.detalhe}</div>
              </li>
            );
          })}
          {alertas.length === 0 && (
            <li className="text-[12px] text-muted-foreground">Sem alertas activos.</li>
          )}
        </ul>
      </section>

      {/* Última nota */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3 w-3" />
          Última nota de consulta
        </div>
        {ultimaNota ? (
          <div className="space-y-2 text-[12.5px] text-foreground">
            <div className="text-[11px] text-muted-foreground">
              {formatarData(ultimaNota.data)} · {ultimaNota.autor}
            </div>
            {ultimaNota.avaliacao && (
              <p>
                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">A · </span>
                {ultimaNota.avaliacao}
              </p>
            )}
            {ultimaNota.plano && (
              <p>
                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">P · </span>
                {ultimaNota.plano}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Sem notas registadas. Esta poderá ser a primeira consulta.
          </p>
        )}
      </section>

      {/* Adesão últimos 7 dias */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3 w-3" />
          Adesão · últimos 7 dias
        </div>
        <ul className="space-y-2">
          {adesao.map((a) => {
            const bar =
              a.taxa < 50 ? "bg-state-alert" : a.taxa < 80 ? "bg-state-warn" : "bg-state-ok";
            return (
              <li key={a.titulo}>
                <div className="flex items-center justify-between text-[12px] text-foreground">
                  <span className="truncate">{a.titulo}</span>
                  <span className="tabular text-[11px] text-muted-foreground">{a.dias}</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${bar}`} style={{ width: `${a.taxa}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-auto flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-accent"
        >
          Fechar
        </button>
        <Link
          to="/utentes/$utenteId"
          params={{ utenteId: evento.utenteId }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
        >
          Abrir perfil completo
        </Link>
      </div>
    </div>
  );
}