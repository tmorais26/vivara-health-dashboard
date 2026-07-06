import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Highlight } from "../components/ui";
import { useT } from "../i18n";
import sobrePhoto from "../assets/sobre-photo.jpg";

const T = {
  pt: {
    header: {
      badge: "Sobre nós",
      title: <>Nascida de uma <em>frustração partilhada.</em></>,
      desc: "A Vivara Health não nasceu numa sala de reuniões. Nasceu de um problema que médicos e utentes viviam todos os dias.",
    },
    story: [
      <>
        Análises perdidas em emails. Exames espalhados por pastas diferentes. Wearables
        que ninguém olha em consulta. E cada visita a <Highlight>começar do zero</Highlight>,
        como se a anterior nunca tivesse acontecido.
      </>,
      <>
        A informação existia. Só nunca estava junta — nem pertencia verdadeiramente a
        quem mais precisava dela: o médico que decide, e o utente que{" "}
        <Highlight>vive com a decisão</Highlight>.
      </>,
      <>
        Por isso construímos a Vivara: <Highlight>um lugar seguro</Highlight> onde o
        historial clínico se constrói continuamente, entre consultas, e não só durante os
        15 minutos que dura cada uma.
      </>,
      <>
        <Highlight className="font-normal" delay={0.1}>
          Hoje continuamos a construir com as mesmas duas pessoas em mente: o médico que
          precisa de contexto para decidir bem, e o utente que precisa de ser dono da sua
          própria história de saúde.
        </Highlight>
      </>,
    ],
    moveBadge: "O que nos move",
    moveTitle: <>Três princípios, <em>desde o início.</em></>,
    pillars: [
      {
        title: "Médicos no desenho",
        desc: "Cada ecrã validado por clínicos que o usam em consulta — não desenhado numa sala isolada da prática real.",
      },
      {
        title: "Utentes no centro",
        desc: "Co-criada com pessoas que querem entender e acompanhar a sua própria saúde, não só ver números.",
      },
      {
        title: "Tudo integrado",
        desc: "Um único histórico, partilhado só entre o utente e a equipa que ele escolher — nunca fragmentado.",
      },
    ],
    buildBadge: "Como construímos",
    buildTitle: "Devagar, com quem vai usar.",
    process: [
      {
        n: "01",
        title: "Falámos com quem vive o problema",
        desc: "Antes de desenhar um único ecrã, ouvimos médicos a explicar o que perdem entre consultas, e utentes a descrever o que gostariam de ter à mão.",
      },
      {
        n: "02",
        title: "Desenhámos com médicos reais",
        desc: "Cada funcionalidade passou por clínicos em prática ativa, não só por designers a imaginar um fluxo ideal.",
      },
      {
        n: "03",
        title: "Testámos com utentes reais",
        desc: "Antes de lançar, pessoas comuns usaram a app para o seu dia a dia — não só num laboratório de testes.",
      },
    ],
    clearBadge: "Para ser claro",
    clearTitle: "O que a Vivara não é.",
    not: [
      "Não é medicina de longevidade nem wellness.",
      "Não substitui o seu médico nem faz diagnósticos.",
      "Não vende os seus dados — nunca.",
    ],
    moreTitle: "Quer saber mais?",
    moreDesc: "Fale connosco — respondemos em 1-2 dias úteis.",
    moreCta: "Pedir acesso",
  },
  en: {
    header: {
      badge: "About us",
      title: <>Born from a <em>shared frustration.</em></>,
      desc: "Vivara Health wasn't born in a meeting room. It was born from a problem doctors and patients lived with every day.",
    },
    story: [
      <>
        Lab results lost in emails. Exams scattered across different folders. Wearables
        nobody looks at during appointments. And every visit <Highlight>starting from scratch</Highlight>,
        as if the previous one had never happened.
      </>,
      <>
        The information existed. It just was never together — and it didn't truly belong to
        the people who needed it most: the doctor who decides, and the patient who{" "}
        <Highlight>lives with the decision</Highlight>.
      </>,
      <>
        So we built Vivara: <Highlight>a safe place</Highlight> where the clinical record
        is built continuously, between appointments — not just during the 15 minutes each
        one lasts.
      </>,
      <>
        <Highlight className="font-normal" delay={0.1}>
          Today we keep building with the same two people in mind: the doctor who needs
          context to decide well, and the patient who needs to own their own health story.
        </Highlight>
      </>,
    ],
    moveBadge: "What drives us",
    moveTitle: <>Three principles, <em>from day one.</em></>,
    pillars: [
      {
        title: "Doctors in the design",
        desc: "Every screen validated by clinicians who use it in practice — not designed in a room detached from real care.",
      },
      {
        title: "Patients at the centre",
        desc: "Co-created with people who want to understand and follow their own health, not just look at numbers.",
      },
      {
        title: "Everything integrated",
        desc: "One single record, shared only between the patient and the team they choose — never fragmented.",
      },
    ],
    buildBadge: "How we build",
    buildTitle: "Slowly, with the people who will use it.",
    process: [
      {
        n: "01",
        title: "We talked to the people living the problem",
        desc: "Before designing a single screen, we listened to doctors explain what they lose between appointments, and to patients describe what they wished they had at hand.",
      },
      {
        n: "02",
        title: "We designed with real doctors",
        desc: "Every feature was reviewed by clinicians in active practice, not just by designers imagining an ideal flow.",
      },
      {
        n: "03",
        title: "We tested with real patients",
        desc: "Before launching, ordinary people used the app in their daily lives — not just in a testing lab.",
      },
    ],
    clearBadge: "To be clear",
    clearTitle: "What Vivara is not.",
    not: [
      "It's not longevity medicine or wellness.",
      "It doesn't replace your doctor or make diagnoses.",
      "It doesn't sell your data — ever.",
    ],
    moreTitle: "Want to know more?",
    moreDesc: "Talk to us — we reply within 1-2 business days.",
    moreCta: "Request access",
  },
};

export default function Sobre() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="bg-brand-beige pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="rounded-3xl overflow-hidden aspect-[4/5]">
              <img src={sobrePhoto} alt="" className="w-full h-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="space-y-5 text-lg text-brand-muted/85 leading-relaxed">
              {L.story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <SectionBadge>{L.moveBadge}</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.moveTitle}
            </h2>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {L.pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <h3 className="font-serif text-2xl mb-2">{p.title}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.buildBadge}</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.buildTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {L.process.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.1}>
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full">
                  <span className="text-sm text-brand-muted/50">{p.n}</span>
                  <h3 className="font-serif text-xl mt-2 mb-3">{p.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <SectionBadge>{L.clearBadge}</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-3xl md:text-4xl mt-5 mb-8">
              {L.clearTitle}
            </h2>
            <ul className="space-y-3 max-w-md mx-auto text-left">
              {L.not.map((n) => (
                <li key={n} className="text-brand-muted/80">{n}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">{L.moreTitle}</h2>
            <p className="mt-4 text-brand-muted/80">{L.moreDesc}</p>
            <Link to="/contacto">
              <CTAButton className="mt-8">{L.moreCta}</CTAButton>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
