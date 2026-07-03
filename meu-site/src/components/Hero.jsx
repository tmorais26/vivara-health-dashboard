import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CTAButton } from "./ui";
import heroPhoto from "../assets/hero-photo.jpg";

export default function Hero() {
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
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/80"
        >
          Plataforma de saúde
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif font-light text-white mt-8 leading-[0.98] tracking-tight text-5xl sm:text-7xl lg:text-8xl"
        >
          A sua saúde,
          <br />
          <em>sempre acompanhada.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-xl text-base md:text-lg text-white/85 leading-relaxed"
        >
          Um lugar seguro para exames, resultados, sintomas e registos médicos. Para que cada
          consulta médica valha a pena.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10"
        >
          <Link to="/como-funciona">
            <CTAButton>Ver como funciona</CTAButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
