import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";
import doctorPhoto from "../assets/doctor-patient.jpg";
import notebookPhoto from "../assets/sobre-photo.jpg";
import phonePhoto from "../assets/hero-photo.jpg";

// Cada cena mostra um momento real, nas duas vistas (médico e utente).
// Para trocar uma fotografia, substitua o ficheiro em src/assets e ajuste
// `image` / `position` abaixo. O texto fica na esquerda; o assunto da imagem
// deve ficar do lado direito.
// Fotografias próprias: basta guardar o ficheiro em src/assets/scenes/ com o
// nome da cena (ver LEIA-ME.txt). Sem ficheiro, usa-se a fotografia ou o fundo
// da marca indicado abaixo.
const found = import.meta.glob("../assets/scenes/*.{jpg,jpeg,webp,png}", { eager: true, import: "default" });
const own = Object.fromEntries(Object.entries(found).map(([path, url]) => [path.split("/").pop().replace(/\.\w+$/, ""), url]));
const SCENES_BASE = [
  { file: "antes-consulta", image: doctorPhoto, position: "50% 28%" },
  { file: "resultados", image: notebookPhoto, position: "60% 55%" },
  { file: "entre-consultas", bg: "radial-gradient(circle at 78% 30%, #3f7a45 0%, #1a4d25 45%, #121c15 100%)" },
  { file: "sono", image: phonePhoto, position: "55% 40%" },
  { file: "historia", bg: "radial-gradient(circle at 78% 35%, #7d6f55 0%, #4a4337 50%, #1a1814 100%)" },
];
const SCENE_IMAGES = SCENES_BASE.map((s) =>
  own[s.file] ? { image: own[s.file], position: "68% 40%" } : s
);
const KINDS = ["timeline", "upload", "trend", "sleep", "age"];

const T = {
  pt: {
    badge: "Visão geral",
    title: (
      <>
        O mesmo historial, <em>em cada momento.</em>
      </>
    ),
    scenes: [
      {
        thumb: "Antes da consulta",
        who: "Médico",
        tag: "Antes da consulta",
        title: "Chegue já a saber tudo",
        desc: "«Trouxe as análises?» deixa de ser a primeira pergunta. Tudo o que o utente recebeu está no mesmo sítio.",
        q: "O que mudou desde a última consulta?",
        a: "Há 2 análises novas desde 12 mar. LDL-C: 142 mg/dL, acima do alvo que definiu.",
      },
      {
        thumb: "Resultados",
        who: "Utente",
        tag: "Resultados",
        title: "Todas as análises, num só sítio",
        desc: "Do laboratório que for. Carregue o PDF ou uma fotografia, e fica organizado por data.",
        q: "Onde está a análise de janeiro?",
        a: "Hemograma completo · 22 jan · 12 valores. Carregado a partir de um PDF.",
      },
      {
        thumb: "Entre consultas",
        who: "Médico e utente",
        tag: "Entre consultas",
        title: "Veja a evolução, não só o último valor",
        desc: "O mesmo historial para os dois, com a tendência de cada marcador ao longo do tempo.",
        q: "Como está a vitamina D?",
        a: "24 ng/mL em maio. Há 9 meses estava em 38. Alvo: 50–80.",
      },
      {
        thumb: "Sono",
        who: "Utente",
        tag: "Wearables",
        title: "O sono, ao lado das análises",
        desc: "Ligue o seu wearable. Os dados aparecem junto do historial, mas sempre identificados como wearable.",
        q: "Como dormi esta semana?",
        a: "Média de 6h40 por noite. Dados do wearable, separados das análises.",
      },
      {
        thumb: "A sua história",
        who: "Utente",
        tag: "Indicadores",
        title: "Os seus números, ao longo do tempo",
        desc: "Indicadores de acompanhamento, com a origem de cada dado à vista.",
        q: "Como é calculada a idade biológica?",
        a: "É uma estimativa a partir dos seus dados, para acompanhar a evolução. Não é um diagnóstico.",
      },
    ],
    widgets: {
      timeline: { title: "Últimos 60 dias", rows: [["22 mai", "Hemograma completo", "Análise"], ["08 mai", "Vitamina D", "Análise"], ["02 abr", "Consulta registada", "Nota"]] },
      upload: { title: "Carregado", rows: [["Hemograma completo", "PDF · 22 jan"], ["Colesterol total", "Fotografia · 14 mar"], ["Vitamina D", "PDF · 08 mai"]] },
      trend: { title: "Vitamina D", unit: "ng/mL", target: "alvo 50–80", source: "Análise", months: ["Ago", "Nov", "Fev", "Mai"], values: [38, 33, 29, 24] },
      sleep: { title: "Sono · últimos 7 dias", source: "Wearable", avg: "Média 6h40", days: ["S", "T", "Q", "Q", "S", "S", "D"], hours: [6.5, 7, 6, 7.2, 6.8, 6.1, 7.4] },
      age: { title: "Idade biológica", bio: 43, real: 47, bioLabel: "Biológica", realLabel: "Real", diff: "−4 anos", note: "Estimativa. Não é um diagnóstico." },
    },
    who: "Vista",
  },
  en: {
    badge: "Overview",
    title: (
      <>
        The same record, <em>at every moment.</em>
      </>
    ),
    scenes: [
      {
        thumb: "Before the visit",
        who: "Doctor",
        tag: "Before the visit",
        title: "Arrive already knowing everything",
        desc: "“Did you bring your results?” stops being the first question. Everything the patient received is in one place.",
        q: "What has changed since the last appointment?",
        a: "There are 2 new lab results since 12 Mar. LDL-C: 142 mg/dL, above the target you set.",
      },
      {
        thumb: "Results",
        who: "Patient",
        tag: "Results",
        title: "Every lab result, in one place",
        desc: "From whichever lab. Upload the PDF or a photo, and it is organised by date.",
        q: "Where is my January lab result?",
        a: "Full blood count · 22 Jan · 12 values. Uploaded from a PDF.",
      },
      {
        thumb: "Between visits",
        who: "Doctor and patient",
        tag: "Between visits",
        title: "See the trend, not just the latest value",
        desc: "The same record for both, with each marker's trend over time.",
        q: "How is my vitamin D?",
        a: "24 ng/mL in May. Nine months ago it was 38. Target: 50–80.",
      },
      {
        thumb: "Sleep",
        who: "Patient",
        tag: "Wearables",
        title: "Sleep, next to your lab results",
        desc: "Connect your wearable. The data shows up with your record, always labelled as wearable.",
        q: "How did I sleep this week?",
        a: "Average of 6h40 a night. Wearable data, kept separate from lab results.",
      },
      {
        thumb: "Your story",
        who: "Patient",
        tag: "Indicators",
        title: "Your numbers, over time",
        desc: "Tracking indicators, with the source of each data point in plain view.",
        q: "How is biological age calculated?",
        a: "It's an estimate based on your data, to follow your progress. It's not a diagnosis.",
      },
    ],
    widgets: {
      timeline: { title: "Last 60 days", rows: [["22 May", "Full blood count", "Lab result"], ["08 May", "Vitamin D", "Lab result"], ["02 Apr", "Appointment logged", "Note"]] },
      upload: { title: "Uploaded", rows: [["Full blood count", "PDF · 22 Jan"], ["Total cholesterol", "Photo · 14 Mar"], ["Vitamin D", "PDF · 08 May"]] },
      trend: { title: "Vitamin D", unit: "ng/mL", target: "target 50–80", source: "Lab result", months: ["Aug", "Nov", "Feb", "May"], values: [38, 33, 29, 24] },
      sleep: { title: "Sleep · last 7 days", source: "Wearable", avg: "Average 6h40", days: ["M", "T", "W", "T", "F", "S", "S"], hours: [6.5, 7, 6, 7.2, 6.8, 6.1, 7.4] },
      age: { title: "Biological age", bio: 43, real: 47, bioLabel: "Biological", realLabel: "Actual", diff: "−4 years", note: "An estimate. Not a diagnosis." },
    },
    who: "View",
  },
};

const DURATION = 5000;

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/40 px-1.5 py-px text-[10px] uppercase tracking-wide text-white/90">
      {children}
    </span>
  );
}

function Widget({ kind, W }) {
  const box = "w-full rounded-2xl border border-white/20 bg-brand-dark/60 p-4 text-white backdrop-blur-md";
  if (kind === "timeline") {
    const d = W.timeline;
    return (
      <div className={box}>
        <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">{d.title}</p>
        <ul className="mt-3 space-y-2.5">
          {d.rows.map(([date, label, src]) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="w-14 shrink-0 text-white/60">{date}</span>
              <span className="flex-1">{label}</span>
              <Chip>{src}</Chip>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (kind === "upload") {
    const d = W.upload;
    return (
      <div className={box}>
        <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">{d.title}</p>
        <ul className="mt-3 space-y-2.5">
          {d.rows.map(([label, meta]) => (
            <li key={label} className="flex items-center justify-between gap-3 text-sm">
              <span>{label}</span>
              <span className="text-xs text-white/65">{meta}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (kind === "trend") {
    const d = W.trend;
    const min = 20;
    const max = 40;
    const xs = [20, 80, 140, 200];
    const pts = d.values.map((v, i) => [xs[i], 78 - ((v - min) / (max - min)) * 56]);
    return (
      <div className={box}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">{d.title}</p>
          <Chip>{d.source}</Chip>
        </div>
        <p className="mt-2 font-serif text-3xl leading-none">
          {d.values[d.values.length - 1]} <span className="text-sm text-white/65">{d.unit}</span>
        </p>
        <p className="text-xs text-white/65">{d.target}</p>
        <svg viewBox="0 0 220 96" className="mt-2 w-full" aria-hidden="true">
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#c7de82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4.5 : 3} fill="#c7de82" />
          ))}
          {d.months.map((m, i) => (
            <text key={m} x={xs[i]} y="93" textAnchor="middle" fontSize="9" fill="white" opacity="0.6">
              {m}
            </text>
          ))}
        </svg>
      </div>
    );
  }
  if (kind === "sleep") {
    const d = W.sleep;
    return (
      <div className={box}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">{d.title}</p>
          <Chip>{d.source}</Chip>
        </div>
        <p className="mt-2 font-serif text-2xl leading-none">{d.avg}</p>
        <div className="mt-4 flex h-[4.75rem] items-end gap-2">
          {d.hours.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t bg-brand-lime/90" style={{ height: `${Math.round(h * 7)}px` }} />
              <span className="text-[10px] text-white/60">{d.days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const d = W.age;
  return (
    <div className={box}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-white/70">{d.title}</p>
      <div className="mt-3 flex items-end gap-6">
        <div>
          <p className="font-serif text-5xl leading-none">{d.bio}</p>
          <p className="mt-1 text-xs text-white/65">{d.bioLabel}</p>
        </div>
        <div>
          <p className="font-serif text-3xl leading-none text-white/70">{d.real}</p>
          <p className="mt-1 text-xs text-white/65">{d.realLabel}</p>
        </div>
        <span className="mb-1 rounded-full bg-brand-lime/90 px-2.5 py-1 text-xs font-medium text-brand-dark">{d.diff}</span>
      </div>
      <p className="mt-3 text-xs text-white/65">{d.note}</p>
    </div>
  );
}

export default function Overview() {
  const t = useT();
  const L = t(T);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // «Reduzir movimento»: a rotação continua, mas só com um fundido suave.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % L.scenes.length), DURATION);
    return () => clearTimeout(id);
  }, [active, paused, L.scenes.length]);

  const scene = L.scenes[active];
  const img = SCENE_IMAGES[active];

  return (
    <section id="como" className="bg-brand-beige py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">{L.title}</h2>
        </Reveal>

        {/* Miniaturas */}
        <div
          className="mt-12 -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0"
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          onFocus={(e) => e.target.matches(":focus-visible") && setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {L.scenes.map((s, i) => (
            <button
              key={s.thumb}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`relative h-28 min-w-[9.5rem] flex-1 snap-start overflow-hidden rounded-2xl text-left transition-all md:min-w-0 ${
                active === i ? "ring-2 ring-brand-dark ring-offset-2 ring-offset-brand-beige" : "opacity-80 hover:opacity-100"
              }`}
            >
              {SCENE_IMAGES[i].image ? (
                <img
                  src={SCENE_IMAGES[i].image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: SCENE_IMAGES[i].position }}
                  loading="lazy"
                />
              ) : (
                <span className="absolute inset-0" style={{ background: SCENE_IMAGES[i].bg }} />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 font-serif text-base leading-tight text-white">{s.thumb}</span>
              {active === i && !paused && (
                <motion.span
                  key={active}
                  className="absolute bottom-0 left-0 h-1 w-full origin-left bg-brand-lime"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Cena */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-brand-dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="relative grid min-h-[30rem] md:min-h-[28rem] md:grid-cols-[1.15fr_0.85fr]"
            >
              {img.image ? (
                <img
                  src={img.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40 md:left-auto md:right-0 md:w-[64%] md:opacity-100"
                  style={{ objectPosition: img.position }}
                />
              ) : (
                <span className="absolute inset-0" style={{ background: img.bg }} />
              )}
              <span className="absolute inset-0 bg-brand-dark/55 md:hidden" />
              <span
                className="absolute inset-0 hidden md:block"
                style={{ background: "linear-gradient(90deg, #1a1814 0%, #1a1814 34%, rgba(26,24,20,0.55) 52%, rgba(26,24,20,0) 76%)" }}
              />

              <div className="relative z-10 flex flex-col justify-center gap-5 p-7 text-white md:p-12">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-brand-dark">{scene.tag}</span>
                  <span className="rounded-full border border-white/40 px-3 py-1 text-xs text-white/90">
                    {L.who}: {scene.who}
                  </span>
                </div>
                <h3 className="font-serif text-3xl leading-tight md:text-5xl">{scene.title}</h3>
                <p className="max-w-md text-white/85 leading-relaxed">{scene.desc}</p>
                <div className="max-w-md space-y-2.5">
                  <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-[#dbe6f4] px-4 py-2.5 text-sm text-brand-dark">{scene.q}</p>
                  <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-brand-dark">{scene.a}</p>
                </div>
              </div>

              <div className="relative z-10 flex items-end p-7 pt-0 md:p-10 md:pl-0">
                <Widget kind={KINDS[active]} W={L.widgets} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
