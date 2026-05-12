import { createFileRoute, Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { prescricoesPendentes } from "@/data/mock-portal";
import { formatarData } from "@/data/mock-utente";

export const Route = createFileRoute("/prescricoes")({
  head: () => ({
    meta: [
      { title: "Prescrições — Vivara Health" },
      { name: "description", content: "Prescrições pendentes de renovação no portal Vivara Health." },
    ],
  }),
  component: PrescricoesPage,
});

function PrescricoesPage() {
  const sorted = [...prescricoesPendentes].sort((a, b) => a.diasRestantes - b.diasRestantes);

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">Prescrições pendentes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Receitas e manipulados perto do fim. Renovar antecipadamente evita falhas de adesão.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised">
          <ul className="divide-y divide-border">
            {sorted.map((p) => {
              const tone =
                p.diasRestantes <= 7
                  ? "border-state-alert/30 bg-state-alert-soft text-state-alert"
                  : p.diasRestantes <= 14
                    ? "border-state-warn/30 bg-state-warn-soft text-state-warn"
                    : "border-border bg-muted text-muted-foreground";
              return (
                <li key={p.id} className="flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap sm:items-center sm:gap-4 sm:px-5">
                  <Link
                    to="/utentes/$utenteId"
                    params={{ utenteId: p.utenteId }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground hover:bg-accent/80"
                  >
                    {p.iniciais}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/utentes/$utenteId"
                      params={{ utenteId: p.utenteId }}
                      className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:underline"
                    >
                      {p.utenteNome}
                    </Link>
                    <div className="mt-1 flex items-start gap-1.5">
                      <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium leading-snug text-foreground">{p.nome}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{p.posologia}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                      <span
                        className={`tabular inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${tone}`}
                      >
                        Expira em {p.diasRestantes} d
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">{formatarData(p.expira)}</span>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <span
                      className={`tabular inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}
                    >
                      Expira em {p.diasRestantes} d
                    </span>
                    <div className="mt-1 text-[10.5px] text-muted-foreground">
                      {formatarData(p.expira)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent sm:ml-0"
                  >
                    Renovar
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}