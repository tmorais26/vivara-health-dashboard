import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Video } from "lucide-react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { agendaSemana } from "@/data/mock-portal";
import { formatarData } from "@/data/mock-utente";

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
  // Agrupa por dia.
  const porDia = agendaSemana.reduce<Record<string, typeof agendaSemana>>((acc, e) => {
    (acc[e.data] ??= []).push(e);
    return acc;
  }, {});
  const dias = Object.keys(porDia).sort();

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-6 py-10 pb-24 lg:pb-10">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-4xl text-foreground">Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Próximas consultas. Clica num utente para abrir o perfil clínico.
          </p>
        </div>

        <div className="space-y-6">
          {dias.map((dia) => (
            <section key={dia} className="rounded-2xl border border-border bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
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
                      <Link
                        to="/utentes/$utenteId"
                        params={{ utenteId: e.utenteId }}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
                      >
                        <div className="tabular w-16 text-sm font-medium text-foreground">{e.hora}</div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground">
                          {e.iniciais}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground">{e.utenteNome}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{e.motivo}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {e.tipo === "video" ? (
                            <Video className="h-3 w-3" />
                          ) : null}
                          {e.duracao} · {e.tipo}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}