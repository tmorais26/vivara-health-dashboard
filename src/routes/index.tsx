import { createFileRoute, Link } from "@tanstack/react-router";
import { utente, calcularEstado } from "@/data/mock-utente";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vivara Health — Portal Clínico" },
      {
        name: "description",
        content:
          "Portal clínico Vivara Health. Lista de utentes em medicina de longevidade com alertas funcionais.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const alertasAtivos = utente.alertas.length;
  const marcadoresFora = utente.marcadores.filter((m) => calcularEstado(m) !== "ok").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
            <span className="font-serif text-base text-foreground">Vivara Health</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Dra. Sofia Cardoso</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              SC
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-8 py-12">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Portal clínico
          </div>
          <h1 className="font-serif mt-2 text-5xl text-foreground">Os meus utentes</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Medicina de longevidade, longitudinal por natureza. Cada utente é uma série temporal
            que se lê como um livro.
          </p>
        </div>

        <Link
          to="/utentes/$utenteId"
          params={{ utenteId: utente.id }}
          className="group block rounded-2xl border border-border bg-surface-raised p-6 transition-colors hover:border-foreground/20"
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-base font-medium text-foreground">
                MA
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl text-foreground">{utente.nome}</span>
                  <span className="text-muted-foreground">, {utente.idade}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {utente.cidade} · Plano {utente.plano} · {utente.medicaResponsavel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Stat label="Alertas activos" value={String(alertasAtivos)} tone="alert" />
              <Stat label="Fora do alvo" value={String(marcadoresFora)} tone="warn" />
              <Stat label="Marcadores" value={String(utente.marcadores.length)} tone="muted" />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
          </div>
        </Link>

        <p className="mt-8 text-xs text-muted-foreground">
          Versão demonstrativa — outros utentes serão sincronizados a partir do PMS clínico.
        </p>

        <Link
          to="/app"
          className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver app da utente <ArrowRight className="h-3 w-3" />
        </Link>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "alert" | "warn" | "muted";
}) {
  const color =
    tone === "alert" ? "text-state-alert" : tone === "warn" ? "text-state-warn" : "text-foreground";
  return (
    <div className="text-right">
      <div className={`tabular text-2xl font-light ${color}`}>{value}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
