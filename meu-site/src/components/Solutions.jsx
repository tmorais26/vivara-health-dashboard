import { motion } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";
import doctorPatient from "../assets/doctor-patient.jpg";
import AppMock from "./AppMock";
import ClinicalAlerts from "./ClinicalAlerts";
import TimelineMock from "./TimelineMock";

function Layout({ id, bg, badge, title, desc, visual, reverse }) {
  return (
    <section id={id} className="py-24 md:py-32" style={{ background: bg }}>
      <div
        className={`mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <Reveal>
          <SectionBadge>{badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5">{title}</h2>
          <p className="mt-5 text-lg text-brand-muted/80 leading-relaxed max-w-md">{desc}</p>
        </Reveal>
        <Reveal delay={0.15}>{visual}</Reveal>
      </div>
    </section>
  );
}

function FloatCard({ label, value, trend, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute rounded-2xl bg-white shadow-lg border border-black/5 px-4 py-3 ${className}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-brand-muted/60">{label}</p>
      <p className="font-serif text-xl">{value}</p>
      {trend && (
        <svg viewBox="0 0 80 24" className="mt-1 w-20 h-5">
          <polyline points="0,18 20,10 40,14 60,4 80,8" fill="none" stroke="var(--color-brand-green-dark)" strokeWidth="2" />
        </svg>
      )}
    </motion.div>
  );
}

function PersonImage({ src }) {
  return (
    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

export function Timeline() {
  return (
    <Layout
      id="medicos"
      bg="var(--color-brand-beige)"
      badge="Para médicos · Portal clínico"
      title={
        <>
          Cada utente, <em>organizado cronologicamente.</em>
        </>
      }
      desc="Análises, exames e notas organizados em linha do tempo, com wearables, sono e atividade ao lado dos dados clínicos."
      visual={<TimelineMock />}
    />
  );
}

export function Vault() {
  return (
    <Layout
      id="utentes"
      reverse
      bg="#ffffff"
      badge="Para utentes · App do utente"
      title={
        <>
          A sua saúde, <em>na palma da mão.</em>
        </>
      }
      desc="Resumo da saúde e histórico unificado. Carrega análises, liga wearables e recebe resumos de cada consulta."
      visual={<AppMock />}
    />
  );
}

export function Insights() {
  return (
    <Layout
      id="insights"
      bg="var(--color-brand-beige)"
      badge="Insights claros"
      title={
        <>
          Acompanhamento <em>contínuo, entre consultas.</em>
        </>
      }
      desc="A plataforma organiza, visualiza e avisa quando algo muda — as decisões clínicas são sempre do médico."
      visual={<ClinicalAlerts />}
    />
  );
}

export function Sharing() {
  return (
    <Layout
      id="sharing"
      reverse
      bg="#ffffff"
      badge="Mensagens diretas"
      title={
        <>
          Médico e utente, <em>a mesma história.</em>
        </>
      }
      desc="Mensagens diretas com a equipa clínica e um histórico partilhado só entre o utente e quem ele escolher."
      visual={
        <div className="relative">
          <PersonImage src={doctorPatient} />
          <FloatCard label="Partilhado com" value="Equipa clínica" className="left-4 -bottom-4 animate-float" />
        </div>
      }
    />
  );
}
