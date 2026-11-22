import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CTAButton } from "./ui";
import { useLang, useT } from "../i18n";
import { PRICES, dayPrice } from "../config/access";
import heroPhoto from "../assets/hero-sofa.webp";

const T = {
  pt: {
    title: (
      <>
        A sua saúde,
        <br />
        <em>sempre acompanhada.</em>
      </>
    ),
    desc: "Uma só plataforma, duas vistas:",
    views: ["O utente tem a sua saúde num só lugar", "O médico tem o historial completo"],
    cta: "Ver como funciona",
    facts: [
      { big: "Qualquer laboratório", text: "PDF ou fotografia" },
      { big: "Médico e utente", text: "O mesmo historial" },
      { big: "Desde €{u}/dia", text: "Utentes. Médicos: €{m} por dia", link: "Ver preços", to: "/precos" },
    ],
  },
  en: {
    title: (
      <>
        Your health,
        <br />
        <em>always looked after.</em>
      </>
    ),
    desc: "One platform, two views:",
    views: ["Patients have their health in one place", "Doctors have the complete record"],
    cta: "See how it works",
    facts: [
      { big: "Any lab", text: "PDF or photo" },
      { big: "Doctor and patient", text: "The same record" },
      { big: "From €{u}/day", text: "Patients. Doctors: €{m} a day", link: "See pricing", to: "/precos" },
    ],
  },
};

const ICONS = [
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
  <>
    <path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </>,
];

export default function Hero() {
  const t = useT();
  const L = t(T);
  const { lang } = useLang();
  // Preços por dia a partir dos preços mensais (config), com vírgula em PT e ponto em EN.
  const fill = (str) =>
    str
      .replace("{u}", lang === "pt" ? dayPrice(PRICES.utente.monthly) : dayPrice(PRICES.utente.monthly).replace(",", "."))
      .replace("{m}", lang === "pt" ? dayPrice(PRICES.medico.monthly) : dayPrice(PRICES.medico.monthly).replace(",", "."));
  return (
    <section id="top" className="relative min-h-screen flex items-end overflow-hidden bg-brand-dark">
      <img
        src={heroPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "74% 22%" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(14,30,20,0.88) 0%, rgba(14,30,20,0.62) 38%, rgba(14,30,20,0.10) 72%), linear-gradient(180deg, rgba(14,30,20,0.35) 0%, rgba(14,30,20,0) 30%, rgba(14,30,20,0.80) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl w-full px-6 pb-20 pt-32">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif font-light text-white leading-[0.98] tracking-tight text-5xl sm:text-7xl lg:text-8xl"
        >
          {L.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-xl"
        >
          <p className="text-base text-white/85 md:text-lg">{L.desc}</p>
          <ul className="mt-4 space-y-3">
            {L.views.map((v, i) => (
              <li key={v} className="flex items-center gap-3 text-base text-white md:text-lg">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" className="size-5 text-brand-lime" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {ICONS[i]}
                  </svg>
                </span>
                {v}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10"
        >
          <Link to="/como-funciona">
            <CTAButton>{L.cta}</CTAButton>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-12 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/20 pt-6 md:gap-10"
        >
          {L.facts.map((f) => (
            <div key={f.big}>
              <p className="font-serif text-lg leading-tight text-white md:text-2xl">{fill(f.big)}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/75 md:text-sm">{fill(f.text)}</p>
              {f.to && (
                <Link to={f.to} className="mt-1 hidden text-xs text-white/60 underline underline-offset-2 hover:text-white/90 md:block">
                  {f.link} →
                </Link>
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
