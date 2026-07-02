const ENTRIES = [
  { date: "22 mai", label: "Análises carregadas", meta: "Hemograma completo · 12 valores", tone: "default" },
  { date: "08 mai", label: "Vitamina D atualizada", meta: "24 ng/mL · alvo 50–80", tone: "alert" },
  { date: "19 abr", label: "Wearable sincronizado", meta: "Sono e HRV dos últimos 30 dias", tone: "default" },
  { date: "02 abr", label: "Consulta registada", meta: "Notas e plano de seguimento", tone: "default" },
];

export default function TimelineMock() {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.15em] text-brand-muted/50">Linha do tempo</p>
        <span className="text-xs text-brand-muted/40">Últimos 60 dias</span>
      </div>

      <svg viewBox="0 0 320 70" className="w-full h-16 mt-2 mb-4">
        <polyline
          points="0,50 45,40 90,45 135,25 180,30 225,12 270,20 320,8"
          fill="none"
          stroke="var(--color-brand-green-dark)"
          strokeWidth="2.5"
          className="animate-line-draw"
        />
      </svg>

      <div className="relative pl-5 space-y-5">
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-black/10" />
        {ENTRIES.map((e) => (
          <div key={e.label} className="relative">
            <span
              className={`absolute -left-5 top-1.5 size-2.5 rounded-full ${
                e.tone === "alert" ? "bg-red-400" : "bg-brand-green-dark"
              }`}
            />
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{e.label}</p>
              <span className="text-xs text-brand-muted/50 shrink-0">{e.date}</span>
            </div>
            <p className="text-xs text-brand-muted/60 mt-0.5">{e.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
