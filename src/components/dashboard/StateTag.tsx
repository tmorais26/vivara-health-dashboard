import type { Estado } from "@/data/mock-utente";

const labels: Record<Estado, string> = {
  ok: "ok",
  atencao: "atenção",
  alerta: "fora do alvo",
};

const styles: Record<Estado, string> = {
  ok: "bg-state-ok-soft text-state-ok",
  atencao: "bg-state-warn-soft text-state-warn",
  alerta: "bg-state-alert-soft text-state-alert",
};

export function StateDot({ estado }: { estado: Estado }) {
  const color =
    estado === "ok"
      ? "bg-state-ok"
      : estado === "atencao"
        ? "bg-state-warn"
        : "bg-state-alert";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export function StateTag({ estado }: { estado: Estado }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider ${styles[estado]}`}
    >
      <StateDot estado={estado} />
      {labels[estado]}
    </span>
  );
}
