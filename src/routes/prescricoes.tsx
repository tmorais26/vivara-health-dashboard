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
      <main className="mx-auto max-w-[1100px] px-6 py-10 pb-24 lg:pb-10">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-4xl text-foreground">Prescrições pendentes</h1>
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
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <Link
                    to="/utentes/$utenteId"
                    params={{ utenteId: p.utenteId }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground hover:bg-accent/80"
                  >
                    {p.iniciais}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/utentes/$utenteId"
                      params={{ utenteId: p.utenteId }}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      {p.utenteNome}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Pill className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">{p.nome}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{p.posologia}</div>
                  </div>
                  <div className="text-right">
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
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent"
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