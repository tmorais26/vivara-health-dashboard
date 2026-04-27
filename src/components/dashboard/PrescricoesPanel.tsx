import type { Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";
import { Pill } from "lucide-react";

const tipoLabel = {
  receita: "Receita",
  manipulado: "Manipulado",
  suplemento: "Suplemento",
} as const;

const tipoTone = {
  receita: "bg-state-ok-soft text-state-ok",
  manipulado: "bg-state-warn-soft text-state-warn",
  suplemento: "bg-muted text-muted-foreground",
} as const;

export function PrescricoesPanel({ utente }: { utente: Utente }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised">
      <div className="border-b border-border px-6 py-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Plano farmacológico
        </div>
        <div className="mt-1 font-serif text-2xl text-foreground">
          {utente.prescricoes.length} ativos
        </div>
      </div>
      <ul className="divide-y divide-border">
        {utente.prescricoes.map((p) => (
          <li key={p.id} className="flex items-start gap-4 px-6 py-4">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-accent">
              <Pill className="h-4 w-4 text-foreground/70" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">{p.nome}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tipoTone[p.tipo]}`}
                >
                  {tipoLabel[p.tipo]}
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{p.posologia}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Desde {formatarData(p.desde)}
                {p.proximaRenovacao && ` · Renovar ${formatarData(p.proximaRenovacao)}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
