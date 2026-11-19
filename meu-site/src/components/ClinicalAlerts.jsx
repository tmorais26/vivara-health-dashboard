import { useT } from "../i18n";

const T = {
  pt: {
    header: "3 alertas clínicos",
    sub: "11 fora do alvo",
    alerts: [
      { label: "LDL-C acima do alvo funcional", value: "142 mg/dL", meta: "alvo ≤100 · 4ª subida consecutiva", tone: "red" },
      { label: "Vitamina D em queda sustentada", value: "24 ng/mL", meta: "alvo 50–80 · −37% em 9 meses", tone: "red" },
      { label: "HRV abaixo da linha de base", value: "42 ms", meta: "linha de base 55 ms · −24% em 6 meses", tone: "amber" },
    ],
  },
  en: {
    header: "3 clinical alerts",
    sub: "11 out of range",
    alerts: [
      { label: "LDL-C above functional target", value: "142 mg/dL", meta: "target ≤100 · 4th consecutive rise", tone: "red" },
      { label: "Vitamin D in sustained decline", value: "24 ng/mL", meta: "target 50–80 · −37% in 9 months", tone: "red" },
      { label: "HRV below baseline", value: "42 ms", meta: "baseline 55 ms · −24% in 6 months", tone: "amber" },
    ],
  },
};

const TONE = {
  red: "bg-red-50 text-red-700 border-red-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function ClinicalAlerts() {
  const t = useT();
  const L = t(T);
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.15em] text-brand-muted/50">{L.header}</p>
        <span className="text-xs text-brand-muted/40">{L.sub}</span>
      </div>
      <div className="space-y-2">
        {L.alerts.map((a) => (
          <div key={a.label} className={`rounded-2xl border px-4 py-3 ${TONE[a.tone]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{a.label}</p>
              <span className="font-serif text-lg shrink-0">{a.value}</span>
            </div>
            <p className="text-xs opacity-70 mt-0.5">{a.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
