import { Link } from "react-router-dom";
import PhotoHeader from "../components/PhotoHeader";
import windowPhoto from "../assets/scenes/historia.jpg";
import teamPhoto from "../assets/pages/equipa.webp";
import { SectionBadge, Reveal, CTAButton } from "../components/ui";
import { useT } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Sobre nós",
      title: <>Nascida de uma <em>frustração partilhada.</em></>,
      desc: "Nasceu de um problema que médicos e utentes viviam todos os dias.",
    },
    problemBadge: "O problema",
    problemTitle: <>A informação existia. <em>Só nunca estava junta.</em></>,
    pains: [
      ["01", "Análises perdidas em emails"],
      ["02", "Exames em pastas diferentes"],
      ["03", "Wearables que ninguém vê em consulta"],
    ],
    reset: "E cada consulta a começar do zero.",
    solution: "Por isso construímos a Vivara: um lugar seguro onde o historial se constrói entre consultas, e não só durante cada uma.",
    pillars: [
      ["Médicos no desenho", "Cada ecrã validado com médicos em prática ativa."],
      ["Utentes no centro", "Para quem quer entender e acompanhar a sua própria saúde."],
      ["Um só historial", "Partilhado só com quem o utente escolher."],
    ],
    buildBadge: "Como construímos",
    buildTitle: "Devagar, com quem vai usar.",
    process: [
      ["01", "Falámos com médicos e utentes", "Ouvimos o que se perde entre consultas e o que gostariam de ter à mão."],
      ["02", "Desenhámos com médicos em prática", "Cada funcionalidade validada por quem está na consulta todos os dias."],
      ["03", "Vamos testar com utentes antes de lançar", "Pessoas comuns, no dia a dia, e não só em laboratório de testes."],
    ],
    clearBadge: "Para ser claro",
    clearTitle: "O que a Vivara não é.",
    not: [
      ["Não é um diagnóstico", "Indicadores como a idade biológica são estimativas de acompanhamento."],
      ["Não substitui o seu médico", "A decisão clínica é sempre do médico."],
      ["Não vende os seus dados", "Nunca."],
    ],
    moreTitle: "Quer saber mais?",
    moreDesc: "Fale connosco. Respondemos em 1-2 dias úteis.",
    moreCta: "Começar",
  },
  en: {
    header: {
      badge: "About us",
      title: <>Born from a <em>shared frustration.</em></>,
      desc: "It started with a problem doctors and patients lived with every day.",
    },
    problemBadge: "The problem",
    problemTitle: <>The information existed. <em>It was never in one place.</em></>,
    pains: [
      ["01", "Lab results lost in emails"],
      ["02", "Exams scattered across folders"],
      ["03", "Wearables nobody looks at during visits"],
    ],
    reset: "And every appointment starting from scratch.",
    solution: "So we built Vivara: a safe place where the record is built between appointments, not just during each one.",
    pillars: [
      ["Doctors in the design", "Every screen validated with doctors in active practice."],
      ["Patients at the centre", "For people who want to understand and follow their own health."],
      ["One record", "Shared only with whoever the patient chooses."],
    ],
    buildBadge: "How we build",
    buildTitle: "Slowly, with the people who will use it.",
    process: [
      ["01", "We talked to doctors and patients", "We listened to what gets lost between appointments and what they wish they had at hand."],
      ["02", "We designed with practising doctors", "Every feature validated by people who are in the consulting room every day."],
      ["03", "We will test with patients before launch", "Ordinary people, in daily life, not just in a testing lab."],
    ],
    clearBadge: "To be clear",
    clearTitle: "What Vivara is not.",
    not: [
      ["Not a diagnosis", "Indicators such as biological age are tracking estimates."],
      ["Not a replacement for your doctor", "The clinical decision always belongs to the doctor."],
      ["We don't sell your data", "Ever."],
    ],
    moreTitle: "Want to know more?",
    moreDesc: "Talk to us. We reply within 1-2 business days.",
    moreCta: "Get started",
  },
};

export default function Sobre() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PhotoHeader name="sobre" fallback={windowPhoto} position="60% 45%" badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.problemBadge}</SectionBadge>
            <h2 className="mt-5 max-w-3xl font-serif text-4xl font-light tracking-tight md:text-6xl">{L.problemTitle}</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {L.pains.map(([n, text], i) => (
              <Reveal key={n} delay={i * 0.1}>
                <div className="h-full rounded-3xl border border-black/10 bg-white p-7">
                  <span className="font-serif text-4xl text-brand-olive/25">{n}</span>
                  <p className="mt-3 font-serif text-2xl leading-snug">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-8 font-serif text-2xl italic text-brand-muted md:text-3xl">{L.reset}</p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-muted/85">{L.solution}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-dark py-16 text-white md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {L.pillars.map(([tt, d], i) => (
            <Reveal key={tt} delay={i * 0.08}>
              <h3 className="font-serif text-2xl">{tt}</h3>
              <p className="mt-2 leading-relaxed text-white/60">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16">
          <Reveal>
            <img src={teamPhoto} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover" style={{ objectPosition: "45% 35%" }} />
          </Reveal>
          <div>
            <Reveal>
              <SectionBadge>{L.buildBadge}</SectionBadge>
              <h2 className="mt-5 font-serif text-4xl font-light tracking-tight md:text-5xl">{L.buildTitle}</h2>
            </Reveal>
            <ol className="mt-8 space-y-6">
              {L.process.map(([n, title, desc], i) => (
                <Reveal key={n} delay={i * 0.1}>
                  <li className="flex gap-5">
                    <span className="font-serif text-3xl text-brand-olive/30">{n}</span>
                    <div>
                      <h3 className="font-serif text-xl">{title}</h3>
                      <p className="mt-1 text-brand-muted/75 leading-relaxed">{desc}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.clearBadge}</SectionBadge>
            <h2 className="mt-5 font-serif text-4xl font-light tracking-tight md:text-5xl">{L.clearTitle}</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {L.not.map(([tt, d], i) => (
              <Reveal key={tt} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-black/10 bg-white p-7">
                  <h3 className="font-serif text-xl">{tt}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted/75">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif text-3xl font-light md:text-5xl">{L.moreTitle}</h2>
            <p className="mt-4 text-brand-muted/80">{L.moreDesc}</p>
            <Link to="/comecar">
              <CTAButton className="mt-8">{L.moreCta}</CTAButton>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
