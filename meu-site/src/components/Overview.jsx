import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";

const TABS = [
  {
    key: "Linha do tempo",
    title: "Cada marcador, ao longo do tempo",
    desc: "Análises e exames organizados cronologicamente. Vê a evolução, não só o último valor.",
  },
  {
    key: "Insights",
    title: "Padrões, não apenas números",
    desc: "A Vivara transforma os seus registos em tendências claras e avisa quando algo muda.",
  },
  {
    key: "Análises",
    title: "Resultados que falam consigo",
    desc: "Cada análise interpretada no contexto do seu histórico e dos seus intervalos funcionais.",
  },
];

const DURATION = 5000;

export default function Overview() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % TABS.length), DURATION);
    return () => clearTimeout(id);
  }, [active, paused]);

  return (
    <section id="como" className="bg-brand-beige py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>Visão geral</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-2xl">
            A sua linha do tempo de saúde <em>começa aqui.</em>
          </h2>
        </Reveal>

        {/* Tabs */}
        <div
          className="mt-12 flex flex-wrap gap-3"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm transition-colors ${
                active === i ? "bg-brand-dark text-white" : "bg-transparent text-brand-muted border border-black/10"
              }`}
            >
              {t.key}
              {active === i && !paused && (
                <motion.span
                  key={active}
                  className="absolute left-0 bottom-0 h-0.5 w-full origin-left bg-brand-lime"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: DURATION / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="mt-8 grid md:grid-cols-2 gap-8 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="font-serif text-3xl md:text-4xl mb-3">{TABS[active].title}</h3>
              <p className="text-brand-muted/80 text-lg leading-relaxed">{TABS[active].desc}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45 }}
              className="aspect-[4/3] rounded-3xl border border-black/10 bg-white shadow-sm grid place-items-center"
            >
              <MockPanel index={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];
const POINTS_Y = [150, 120, 130, 80, 95, 50, 34];

function MockPanel({ index }) {
  if (index === 0) {
    const xFor = (i) => 20 + i * 46;
    const linePoints = POINTS_Y.map((y, i) => `${xFor(i)},${y}`).join(" ");
    const areaPoints = `${xFor(0)},180 ${linePoints} ${xFor(POINTS_Y.length - 1)},180`;
    const lastX = xFor(POINTS_Y.length - 1);
    const lastY = POINTS_Y[POINTS_Y.length - 1];

    return (
      <div className="w-[85%]">
        <svg viewBox="0 0 320 210" className="w-full">
          <defs>
            <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-lime)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-brand-lime)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[45, 90, 135].map((y) => (
            <line key={y} x1="10" y1={y} x2="310" y2={y} stroke="black" strokeOpacity="0.06" strokeWidth="1" />
          ))}

          <polygon points={areaPoints} fill="url(#timelineFill)" />

          <polyline
            points={linePoints}
            fill="none"
            stroke="var(--color-brand-green-dark)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-line-draw"
          />

          {POINTS_Y.map((y, i) => (
            <circle key={i} cx={xFor(i)} cy={y} r={i === POINTS_Y.length - 1 ? 5 : 3.5} fill="var(--color-brand-green-dark)" />
          ))}
          <circle cx={lastX} cy={lastY} r="9" fill="var(--color-brand-green-dark)" fillOpacity="0.18" className="animate-pulse" />

          {MONTHS.map((m, i) => (
            <text key={m} x={xFor(i)} y="200" textAnchor="middle" fontSize="10" fill="var(--color-brand-muted)" opacity="0.5">
              {m}
            </text>
          ))}
        </svg>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="w-3/4 space-y-3">
        {[
          ["LDL-C acima do alvo", "142 mg/dL"],
          ["Vitamina D em queda", "24 ng/mL"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-red-700">{k}</span>
              <span className="font-serif text-lg text-red-700">{v}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-3/4 space-y-3">
      {[
        ["HbA1c", "5.4%"],
        ["Vitamina D", "42 ng/mL"],
        ["LDL", "98 mg/dL"],
      ].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-xl bg-brand-beige px-4 py-3">
          <span className="text-sm text-brand-muted">{k}</span>
          <span className="font-serif text-lg">{v}</span>
        </div>
      ))}
    </div>
  );
}
