import { useT } from "../i18n";

const T = {
  pt: {
    hello: "Olá",
    yourHealth: "A sua saúde",
    bioAge: "Idade biológica",
    years: "anos",
    bioDelta: "−4 anos",
    bioDisclaimer: "Idade biológica estimada a partir dos seus dados · idade real 47 anos.",
    barBio: "BIOLÓGICA",
    barReal: "REAL",
    score: "Score de longevidade",
    scoreDelta: "↑ 2 esta semana",
    scoreDisclaimer: "Indicador de acompanhamento pessoal — não é diagnóstico nem substitui o seu médico.",
    metrics: [
      { label: "Cardio-metab.", value: 71, color: "bg-brand-lime" },
      { label: "Composição", value: 68, color: "bg-amber-400" },
      { label: "Recuperação", value: 82, color: "bg-brand-lime" },
    ],
    actions: ["Carregar", "Análises", "Resumo", "Privacidade"],
    nav: ["Início", "Dados", "Mensagens", "Perfil"],
  },
  en: {
    hello: "Hello",
    yourHealth: "Your health",
    bioAge: "Biological age",
    years: "years",
    bioDelta: "−4 years",
    bioDisclaimer: "Biological age estimated from your data · actual age 47.",
    barBio: "BIOLOGICAL",
    barReal: "ACTUAL",
    score: "Longevity score",
    scoreDelta: "↑ 2 this week",
    scoreDisclaimer: "A personal tracking indicator — not a diagnosis and no substitute for your doctor.",
    metrics: [
      { label: "Cardio-metab.", value: 71, color: "bg-brand-lime" },
      { label: "Body comp.", value: 68, color: "bg-amber-400" },
      { label: "Recovery", value: 82, color: "bg-brand-lime" },
    ],
    actions: ["Upload", "Lab results", "Summary", "Privacy"],
    nav: ["Home", "Data", "Messages", "Profile"],
  },
};

const ACTION_ICONS = [
  ["M12 4v10m0-10-4 4m4-4 4 4M5 18h14", "text-brand-lime"],
  ["M4 19V9m6 10V5m6 14v-7", "text-sky-400"],
  ["M6 4h9l3 3v13H6zM9 12h6M9 16h6", "text-violet-300"],
  ["M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z", "text-amber-300"],
];

const NAV_ICONS = [
  "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  "M4 19V9m6 10V5m6 14v-7",
  "M4 5h16v11H7l-3 3z",
  "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 4-6 8-6s8 2 8 6",
];

export default function AppMock() {
  const t = useT();
  const L = t(T);
  return (
    <div className="relative mx-auto w-full max-w-[260px] aspect-[9/19.5] rounded-[2.4rem] border-[6px] border-brand-dark bg-brand-dark shadow-2xl overflow-hidden">
      <div className="absolute inset-0 rounded-[1.9rem] bg-[#0a0f0c] px-3.5 pt-3 pb-3 text-white flex flex-col">
        <div className="flex items-center justify-between text-[10px] text-white/60 mb-3 shrink-0">
          <span>09:41</span>
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 16 12" className="w-3.5 h-2.5" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="4.5" y="5" width="3" height="7" rx="0.5" /><rect x="9" y="2" width="3" height="10" rx="0.5" /><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.4" /></svg>
            <svg viewBox="0 0 22 12" className="w-5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="19" height="11" rx="2.5" /><rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor" /><rect x="20.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <p className="text-[10px] text-white/50">{L.hello}</p>
            <p className="font-serif text-lg mt-0.5">{L.yourHealth}</p>
          </div>
          <div className="grid place-items-center size-7 rounded-full bg-brand-olive/70 border border-white/10">
            <svg viewBox="0 0 24 24" className="size-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div
          className="rounded-2xl border border-white/5 p-3 mb-2 shrink-0"
          style={{ background: "radial-gradient(120% 100% at 15% 0%, #163420 0%, #0d2015 60%, #0a1811 100%)" }}
        >
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] uppercase tracking-[0.13em] text-white/50">{L.bioAge}</p>
            <span className="grid place-items-center size-3 rounded-full border border-white/25 text-[7px] text-white/50">i</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-serif text-3xl leading-none">43</span>
            <span className="text-xs text-white/55">{L.years}</span>
            <span className="ml-auto rounded-full bg-brand-lime/15 text-brand-lime text-[9px] font-medium px-2 py-0.5">
              {L.bioDelta}
            </span>
          </div>
          <p className="text-[8px] text-white/40 mt-1.5 leading-relaxed">{L.bioDisclaimer}</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-white/45 w-12 shrink-0">{L.barBio}</span>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex-1"><div className="h-full rounded-full bg-brand-lime" style={{ width: "72%" }} /></div>
              <span className="text-[8px] text-white/60 w-4 text-right shrink-0">43</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-white/45 w-12 shrink-0">{L.barReal}</span>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex-1"><div className="h-full rounded-full bg-white/30" style={{ width: "80%" }} /></div>
              <span className="text-[8px] text-white/60 w-4 text-right shrink-0">47</span>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border border-white/5 p-3 mb-2 shrink-0"
          style={{ background: "radial-gradient(130% 100% at 85% 0%, #14243f 0%, #0c1526 60%, #090f1c 100%)" }}
        >
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] uppercase tracking-[0.13em] text-white/50">{L.score}</p>
            <span className="grid place-items-center size-3 rounded-full border border-white/25 text-[7px] text-white/50">i</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="relative size-11 shrink-0">
              <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-brand-lime)" strokeWidth="3"
                  strokeDasharray="97.4" strokeDashoffset="22.4" strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-2xl leading-none">77</span>
                <span className="text-[10px] text-white/45">/100</span>
              </div>
              <span className="inline-block mt-0.5 rounded-full bg-brand-lime/15 text-brand-lime text-[9px] font-medium px-1.5 py-0.5">
                {L.scoreDelta}
              </span>
            </div>
          </div>
          <p className="text-[8px] text-white/40 mt-2 leading-relaxed">{L.scoreDisclaimer}</p>
          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            {L.metrics.map((m) => (
              <div key={m.label} className="rounded-lg bg-white/[0.04] border border-white/5 px-1.5 py-1.5">
                <p className="text-[7px] text-white/45 leading-tight">{m.label}</p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className="font-serif text-sm">{m.value}</p>
                </div>
                <div className="h-0.5 rounded-full bg-white/10 mt-1 overflow-hidden"><div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.value}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-auto shrink-0">
          {L.actions.map((label, i) => (
            <div key={label} className="rounded-lg bg-white/[0.04] border border-white/5 py-2 flex flex-col items-center gap-1">
              <svg viewBox="0 0 24 24" className={`size-3.5 ${ACTION_ICONS[i][1]}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={ACTION_ICONS[i][0]} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[7px] text-white/50 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2.5 shrink-0">
          {L.nav.map((label, i) => (
            <div key={label} className="relative flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className={`size-3.5 ${i === 0 ? "text-brand-lime" : "text-white/40"}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={NAV_ICONS[i]} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`text-[7px] ${i === 0 ? "text-brand-lime" : "text-white/40"}`}>{label}</span>
              {i === 2 && (
                <span className="absolute -top-1 -right-1.5 grid place-items-center size-2.5 rounded-full bg-red-500 text-[6px]">2</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
