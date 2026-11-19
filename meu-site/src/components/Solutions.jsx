import { motion } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";
import doctorPatient from "../assets/doctor-patient.jpg";
import AppMock from "./AppMock";
import ClinicalAlerts from "./ClinicalAlerts";
import TimelineMock from "./TimelineMock";

const T = {
  pt: {
    timeline: {
      badge: "Para médicos · Portal clínico",
      title: (
        <>
          Cada utente, <em>organizado cronologicamente.</em>
        </>
      ),
      desc: "Análises, exames e notas organizados em linha do tempo, com wearables, sono e atividade ao lado dos dados clínicos.",
    },
    vault: {
      badge: "Para utentes · App do utente",
      title: (
        <>
          A sua saúde, <em>na palma da mão.</em>
        </>
      ),
      desc: "Resumo da saúde e histórico unificado. Carrega análises, liga wearables e recebe resumos de cada consulta.",
      note: "Ainda não tem médico na Vivara? Pode começar sozinho — o seu médico junta-se depois.",
    },
    insights: {
      badge: "Insights claros",
      title: (
        <>
          Acompanhamento <em>contínuo, entre consultas.</em>
        </>
      ),
      desc: "A plataforma organiza, visualiza e avisa quando algo muda — as decisões clínicas são sempre do médico.",
    },
    sharing: {
      badge: "Mensagens diretas",
      title: (
        <>
          Médico e utente, <em>a mesma história.</em>
        </>
      ),
      desc: "Mensagens diretas com a equipa clínica e um histórico partilhado só entre o utente e quem ele escolher.",
      cardLabel: "Partilhado com",
      cardValue: "Equipa clínica",
    },
  },
  en: {
    timeline: {
      badge: "For doctors · Clinical portal",
      title: (
        <>
          Every patient, <em>organised chronologically.</em>
        </>
      ),
      desc: "Lab results, exams and notes organised on a timeline, with wearables, sleep and activity right next to the clinical data.",
    },
    vault: {
      badge: "For patients · Patient app",
      title: (
        <>
          Your health, <em>in the palm of your hand.</em>
        </>
      ),
      desc: "A health summary and unified record. Upload lab results, connect wearables and get a summary after every appointment.",
      note: "No doctor on Vivara yet? You can start on your own — your doctor joins later.",
    },
    insights: {
      badge: "Clear insights",
      title: (
        <>
          Continuous care, <em>between appointments.</em>
        </>
      ),
      desc: "The platform organises, visualises and alerts when something changes — clinical decisions always belong to the doctor.",
    },
    sharing: {
      badge: "Direct messaging",
      title: (
        <>
          Doctor and patient, <em>the same story.</em>
        </>
      ),
      desc: "Direct messages with the care team and a record shared only between the patient and whoever they choose.",
      cardLabel: "Shared with",
      cardValue: "Care team",
    },
  },
};

function Layout({ id, bg, badge, title, desc, note, visual, reverse }) {
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
          {note && (
            <p className="mt-5 max-w-md border-l-2 border-black/10 pl-4 text-sm text-brand-muted/60 leading-relaxed">
              {note}
            </p>
          )}
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
  const t = useT();
  const L = t(T).timeline;
  return (
    <Layout
      id="medicos"
      bg="var(--color-brand-beige)"
      badge={L.badge}
      title={L.title}
      desc={L.desc}
      visual={<TimelineMock />}
    />
  );
}

export function Vault() {
  const t = useT();
  const L = t(T).vault;
  return (
    <Layout
      id="utentes"
      reverse
      bg="#ffffff"
      badge={L.badge}
      title={L.title}
      desc={L.desc}
      note={L.note}
      visual={<AppMock />}
    />
  );
}

export function Insights() {
  const t = useT();
  const L = t(T).insights;
  return (
    <Layout
      id="insights"
      bg="var(--color-brand-beige)"
      badge={L.badge}
      title={L.title}
      desc={L.desc}
      visual={<ClinicalAlerts />}
    />
  );
}

export function Sharing() {
  const t = useT();
  const L = t(T).sharing;
  return (
    <Layout
      id="sharing"
      reverse
      bg="#ffffff"
      badge={L.badge}
      title={L.title}
      desc={L.desc}
      visual={
        <div className="relative">
          <PersonImage src={doctorPatient} />
          <FloatCard label={L.cardLabel} value={L.cardValue} className="left-4 -bottom-4 animate-float" />
        </div>
      }
    />
  );
}
