import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CTAButton } from "./ui";

// Fotografias próprias: guardar em src/assets/pages/<nome>.jpg (ver LEIA-ME.txt).
const found = import.meta.glob("../assets/pages/*.{jpg,jpeg,webp,png}", { eager: true, import: "default" });
const own = Object.fromEntries(Object.entries(found).map(([p, url]) => [p.split("/").pop().replace(/\.\w+$/, ""), url]));

// Cabeçalho de página com fotografia e camada verde-escura (mesma linguagem do início).
export default function PhotoHeader({ name, fallback, position = "70% 35%", badge, title, desc, cta }) {
  const src = own[name] || fallback;
  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-[#0e1e14] md:min-h-[72vh]">
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover md:left-auto md:right-0 md:w-[64%]"
        style={{ objectPosition: position }}
      />
      <span className="absolute inset-0 md:hidden" style={{ background: "linear-gradient(180deg, rgba(14,30,20,0.55) 0%, rgba(14,30,20,0.35) 35%, rgba(14,30,20,0.85) 100%)" }} />
      <span
        className="absolute inset-0 hidden md:block"
        style={{ background: "linear-gradient(90deg, #0e1e14 0%, #0e1e14 34%, rgba(14,30,20,0.55) 52%, rgba(14,30,20,0) 78%), linear-gradient(180deg, rgba(14,30,20,0.35) 0%, rgba(14,30,20,0) 28%, rgba(14,30,20,0.55) 100%)" }}
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-36 md:pb-20">
        {badge && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.2em] text-white/70"
          >
            {badge}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 max-w-3xl font-serif text-5xl font-light leading-[1.02] tracking-tight text-white md:text-7xl"
        >
          {title}
        </motion.h1>
        {desc && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg"
          >
            {desc}
          </motion.p>
        )}
        {cta && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-9"
          >
            <Link to={cta.to}>
              <CTAButton>{cta.label}</CTAButton>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
