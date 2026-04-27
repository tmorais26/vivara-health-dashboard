import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calcularEstado, formatarData, type Marcador } from "@/data/mock-utente";

const ranges = [
  { id: "3m", label: "3M", dias: 90 },
  { id: "6m", label: "6M", dias: 180 },
  { id: "1a", label: "1A", dias: 365 },
  { id: "tudo", label: "Tudo", dias: 99999 },
] as const;

type RangeId = (typeof ranges)[number]["id"];

export function LongitudinalChart({ marcador }: { marcador: Marcador }) {
  const [range, setRange] = useState<RangeId>("tudo");
  const estado = calcularEstado(marcador);

  const data = useMemo(() => {
    const dias = ranges.find((r) => r.id === range)!.dias;
    const cutoff = Date.now() - dias * 24 * 60 * 60 * 1000;
    return marcador.serie
      .filter((p) => new Date(p.data).getTime() >= cutoff)
      .map((p) => ({ ...p, ts: new Date(p.data).getTime() }));
  }, [marcador, range]);

  const [labMin, labMax] = marcador.intervaloLab;
  const [alvoMin, alvoMax] = marcador.alvoFuncional;

  const valores = data.map((d) => d.valor);
  const dataMin = Math.min(...valores, labMin, alvoMin);
  const dataMax = Math.max(...valores, labMax, alvoMax);
  const pad = (dataMax - dataMin) * 0.1 || 1;

  const stroke =
    estado === "ok"
      ? "var(--state-ok)"
      : estado === "atencao"
        ? "var(--state-warn)"
        : "var(--state-alert)";

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Histórico longitudinal
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            {data.length} medições · fonte {marcador.serie[0].fonte}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                range === r.id
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            {/* intervalo laboratorial — banda muito subtil */}
            <ReferenceArea
              y1={labMin}
              y2={labMax}
              fill="var(--muted)"
              fillOpacity={0.5}
              ifOverflow="extendDomain"
            />
            {/* alvo funcional — banda da médica */}
            <ReferenceArea
              y1={alvoMin}
              y2={alvoMax}
              fill="var(--state-ok)"
              fillOpacity={0.08}
              stroke="var(--state-ok)"
              strokeOpacity={0.25}
              strokeDasharray="3 3"
            />
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
            <YAxis
              domain={[dataMin - pad, dataMax + pad]}
              stroke="var(--muted-foreground)"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
                padding: "8px 12px",
                boxShadow: "0 4px 24px rgb(0 0 0 / 0.06)",
              }}
              labelFormatter={(t) => formatarData(new Date(t as number).toISOString())}
              formatter={(v: number) => [`${v} ${marcador.unidade}`, marcador.nomeCurto]}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={stroke}
              strokeWidth={2}
              dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-raised)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: "var(--state-ok)", opacity: 0.2 }}
          />
          Alvo funcional ({alvoMin}–{alvoMax} {marcador.unidade})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-sm"
            style={{ background: "var(--muted)" }}
          />
          Intervalo laboratorial ({labMin}–{labMax})
        </span>
      </div>
    </div>
  );
}
