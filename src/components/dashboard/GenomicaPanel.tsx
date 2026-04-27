import type { Utente } from "@/data/mock-utente";

const tone = {
  alta: "bg-state-alert-soft text-state-alert",
  media: "bg-state-warn-soft text-state-warn",
  baixa: "bg-muted text-muted-foreground",
} as const;

export function GenomicaPanel({ utente }: { utente: Utente }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised">
      <div className="border-b border-border px-6 py-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Painel genómico
        </div>
        <div className="mt-1 font-serif text-2xl text-foreground">
          {utente.genomica.length} variantes relevantes
        </div>
      </div>
      <ul className="divide-y divide-border">
        {utente.genomica.map((g) => (
          <li key={g.gene} className="flex items-start justify-between gap-4 px-6 py-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-medium text-foreground">{g.gene}</span>
                <span className="font-mono text-xs text-muted-foreground">{g.variante}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">{g.impacto}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider ${tone[g.relevancia]}`}
            >
              {g.relevancia}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
