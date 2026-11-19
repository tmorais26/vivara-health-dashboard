import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CTAButton, OutlineButton } from "./ui";
import { useT } from "../i18n";
import heroPhoto from "../assets/hero-photo.jpg";

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
    ctaPatient: "Sou utente",
    ctaDoctor: "Sou médico",
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
    ctaPatient: "I'm a patient",
    ctaDoctor: "I'm a doctor",
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
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,24,20,0.45) 0%, rgba(26,24,20,0.35) 35%, rgba(26,24,20,0.92) 100%)",
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
          className="mt-10 flex flex-wrap gap-3"
        >
          <Link to="/utentes">
            <CTAButton>{L.ctaPatient}</CTAButton>
          </Link>
          <Link to="/medicos">
            <OutlineButton className="px-8 py-4">{L.ctaDoctor}</OutlineButton>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
