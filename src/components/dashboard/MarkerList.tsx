import {
  calcularDirecao,
  calcularEstado,
  formatarData,
  formatarValor,
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
  return (
    <ul className="divide-y divide-border">
      {marcadores.map((m) => {
        const estado = calcularEstado(m);
        const dir = calcularDirecao(m);
        const ultima = m.serie[m.serie.length - 1];
        const isSelected = m.id === selectedId;

        // semantic direction color (rising LDL = bad; rising HDL = good)
        let dirColor = "text-muted-foreground";
        if (dir !== "flat") {
          const goingUp = dir === "up";
          const wantUp = m.direcaoBoa === "subir";
          const wantDown = m.direcaoBoa === "baixar";
          if ((goingUp && wantDown) || (!goingUp && wantUp)) dirColor = "text-state-alert";
          else if ((goingUp && wantUp) || (!goingUp && wantDown)) dirColor = "text-state-ok";
        }

        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onSelect(m.id)}
              className={`group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                isSelected
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
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
      })}
    </ul>
  );
}
