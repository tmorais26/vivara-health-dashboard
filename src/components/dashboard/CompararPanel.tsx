import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, X } from "lucide-react";
import { formatarData, type Marcador, type Utente } from "@/data/mock-utente";

const palette = ["var(--state-alert)", "var(--state-warn)", "var(--state-ok)"];

export function CompararPanel({ utente }: { utente: Utente }) {
  const [ids, setIds] = useState<string[]>(["ldl", "hscrp"]);
  const disponiveis = utente.marcadores.filter((m) => !ids.includes(m.id));
  const seleccionados = ids
    .map((id) => utente.marcadores.find((m) => m.id === id))
    .filter((m): m is Marcador => Boolean(m));

  function adicionar(id: string) {
    if (ids.length >= 3) return;
    setIds((prev) => [...prev, id]);
  }
  function remover(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  // Construir data points unificados: cada série normalizada à sua própria escala
  const data = useMemo(() => {
    if (seleccionados.length === 0) return [];
    const pontos: { ts: number; data: string; [k: string]: number | string }[] = [];
    const datasUnicas = new Set<string>();
    for (const m of seleccionados) for (const p of m.serie) datasUnicas.add(p.data);
    const sortedDates = Array.from(datasUnicas).sort();
    for (const d of sortedDates) {
      const row: { ts: number; data: string; [k: string]: number | string } = {
        ts: new Date(d).getTime(),
        data: d,
      };
      for (const m of seleccionados) {
        const p = m.serie.find((x) => x.data === d);
        if (p) row[m.id] = p.valor;
      }
      pontos.push(row);
    }
    return pontos;
  }, [seleccionados]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Comparar marcadores</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sobrepõe até 3 marcadores no mesmo eixo temporal. Útil para correlação clínica
          (ex.: LDL + hsCRP, TSH + T4L).
        </p>
      </div>

      {/* Chips dos seleccionados */}
      <div className="flex flex-wrap items-center gap-2">
        {seleccionados.map((m, i) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: palette[i] }}
            />
            {m.nomeCurto}
            <span className="text-muted-foreground">({m.unidade})</span>
            <button
              type="button"
              onClick={() => remover(m.id)}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remover ${m.nomeCurto}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {ids.length < 3 && disponiveis.length > 0 && (
          <details className="relative">
            <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" />
              Adicionar marcador
            </summary>
            <div className="absolute z-20 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-lg">
              {disponiveis.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => adicionar(m.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                >
                  <span>{m.nomeCurto}</span>
                  <span className="text-muted-foreground">{m.unidade}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <div className="h-96 w-full">
          {seleccionados.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Selecciona marcadores para começar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(t) =>
                    new Date(t).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
                  }
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                {seleccionados.map((m, i) => (
                  <YAxis
                    key={m.id}
                    yAxisId={m.id}
                    orientation={i === 0 ? "left" : "right"}
                    stroke={palette[i]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                ))}
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  labelFormatter={(t) => formatarData(new Date(t as number).toISOString())}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {seleccionados.map((m, i) => (
                  <Line
                    key={m.id}
                    yAxisId={m.id}
                    type="monotone"
                    dataKey={m.id}
                    name={`${m.nomeCurto} (${m.unidade})`}
                    stroke={palette[i]}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: palette[i], strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}