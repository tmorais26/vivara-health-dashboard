import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import type { Estado, Marcador } from "@/data/mock-utente";

export function Sparkline({
  marcador,
  estado,
  height = 28,
}: {
  marcador: Marcador;
  estado: Estado;
  height?: number;
}) {
  const data = marcador.serie.map((p) => ({ v: p.valor }));
  const stroke =
    estado === "ok"
      ? "var(--state-ok)"
      : estado === "atencao"
        ? "var(--state-warn)"
        : "var(--state-alert)";

  return (
    <div style={{ width: 92, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
