import {
  calcularDirecao,
  calcularEstado,
  formatarData,
  formatarValor,
  type Estado,
  type Marcador,
} from "@/data/mock-utente";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { StateDot } from "./StateTag";

function DirecaoIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <ArrowUp className="h-3 w-3" strokeWidth={2.5} />;
  if (dir === "down") return <ArrowDown className="h-3 w-3" strokeWidth={2.5} />;
  return <Minus className="h-3 w-3" strokeWidth={2.5} />;
}

export function MarkerList({
  marcadores,
  selectedId,
  onSelect,
}: {
  marcadores: Marcador[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  // Priorização: alerta → atenção → ok. Fora do alvo no topo.
  const ordemEstado: Record<Estado, number> = { alerta: 0, atencao: 1, ok: 2 };
  const ordenados = [...marcadores].sort(
    (a, b) => ordemEstado[calcularEstado(a)] - ordemEstado[calcularEstado(b)],
  );
  const foraDoAlvo = ordenados.filter((m) => calcularEstado(m) !== "ok");
  const noAlvo = ordenados.filter((m) => calcularEstado(m) === "ok");

  function renderItem(m: Marcador) {
    const estado = calcularEstado(m);
    const dir = calcularDirecao(m);
    const ultima = m.serie[m.serie.length - 1];
    const isSelected = m.id === selectedId;
    const isAtenuado = estado === "ok";

    let dirColor = "text-muted-foreground";
    if (dir !== "flat") {
      const goingUp = dir === "up";
      const wantUp = m.direcaoBoa === "subir";
      const wantDown = m.direcaoBoa === "baixar";
      if ((goingUp && wantDown) || (!goingUp && wantUp)) dirColor = "text-state-alert";
      else if ((goingUp && wantUp) || (!goingUp && wantDown)) dirColor = "text-state-ok";
    }

    const rowAccent =
      estado === "alerta"
        ? "border-l-2 border-l-state-alert"
        : estado === "atencao"
          ? "border-l-2 border-l-state-warn"
          : "border-l-2 border-l-transparent";

    return (
      <li key={m.id}>
        <button
          type="button"
          onClick={() => onSelect(m.id)}
          className={`group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${rowAccent} ${
            isSelected ? "bg-accent" : "hover:bg-accent/50"
          } ${isAtenuado ? "opacity-70" : ""}`}
        >
          <StateDot estado={estado} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className={`truncate text-sm ${
                  isSelected ? "font-semibold text-foreground" : "font-medium text-foreground"
                }`}
              >
                {m.nomeCurto}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {formatarData(ultima.data)}
            </div>
          </div>
          <Sparkline marcador={m} estado={estado} />
          <div className="flex w-20 flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="tabular text-base font-semibold text-foreground">
                {formatarValor(m)}
              </span>
              <span className="text-[10.5px] text-muted-foreground">{m.unidade}</span>
            </div>
            <div className={`mt-0.5 flex items-center gap-0.5 text-[10.5px] ${dirColor}`}>
              <DirecaoIcon dir={dir} />
            </div>
          </div>
        </button>
      </li>
    );
  }

  function SectionHeader({ label, count }: { label: string; count: number }) {
    return (
      <li className="flex items-center justify-between border-b border-border bg-surface px-5 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="tabular text-[10px] text-muted-foreground">{count}</span>
      </li>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {foraDoAlvo.length > 0 && (
        <>
          <SectionHeader label="Fora do alvo" count={foraDoAlvo.length} />
          {foraDoAlvo.map(renderItem)}
        </>
      )}
      {noAlvo.length > 0 && (
        <>
          <SectionHeader label="No alvo" count={noAlvo.length} />
          {noAlvo.map(renderItem)}
        </>
      )}
    </ul>
  );
}
