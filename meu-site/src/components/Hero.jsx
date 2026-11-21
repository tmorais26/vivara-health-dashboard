import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CTAButton } from "./ui";
import { useT } from "../i18n";
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
    desc: "Uma só plataforma, duas vistas: o utente tem a sua saúde num só lugar, o médico tem o historial completo. O mesmo registo para ambos, para que cada consulta valha a pena.",
    cta: "Ver como funciona",
    facts: [
      { big: "Qualquer laboratório", text: "PDF ou fotografia" },
      { big: "Médico e utente", text: "O mesmo historial" },
      { big: "16 min", text: "por consulta no registo clínico", source: "Annals of Internal Medicine, 2020", url: "https://doi.org/10.7326/M18-3684" },
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
    desc: "One platform, two views: patients have their health in one place, doctors have the complete record. The same record for both, so that every appointment counts.",
    cta: "See how it works",
    facts: [
      { big: "Any lab", text: "PDF or photo" },
      { big: "Doctor and patient", text: "The same record" },
      { big: "16 min", text: "per appointment in the health record", source: "Annals of Internal Medicine, 2020", url: "https://doi.org/10.7326/M18-3684" },
    ],
  },
};

export default function Hero() {
  const t = useT();
  const L = t(T);
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

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-xl text-base md:text-lg text-white/85 leading-relaxed"
        >
          {L.desc}
        </motion.p>

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
              <p className="font-serif text-lg leading-tight text-white md:text-2xl">{f.big}</p>
              <p className="mt-1 text-[11px] leading-snug text-white/75 md:text-sm">{f.text}</p>
              {f.source && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 hidden text-xs text-white/55 underline underline-offset-2 hover:text-white/80 md:block"
                >
                  {f.source}
                </a>
              )}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
