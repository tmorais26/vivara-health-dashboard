import { SectionBadge, Reveal, Highlight } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "O problema",
    title: (
      <>
        A informação existe. <em>Só não está junta.</em>
      </>
    ),
    desc: "E cada consulta acaba por começar do zero.",
    points: [
      {
        title: "Análises perdidas em emails.",
        desc: <>Resultados espalhados por caixas de correio, sem organização nem <Highlight>contexto histórico</Highlight>.</>,
      },
      {
        title: "Exames em pastas diferentes.",
        desc: <>Cada clínica, cada laboratório, a sua pasta. <Highlight>Nada fala com nada.</Highlight></>,
      },
      {
        title: "Wearables que não falam com a clínica.",
        desc: <>Sono, atividade e recuperação ficam na app do relógio — <Highlight>nunca chegam à consulta</Highlight>.</>,
      },
    ],
  },
  en: {
    badge: "The problem",
    title: (
      <>
        The information exists. <em>It just isn't together.</em>
      </>
    ),
    desc: "And every appointment ends up starting from scratch.",
    points: [
      {
        title: "Lab results lost in emails.",
        desc: <>Results scattered across inboxes, with no organisation and no <Highlight>historical context</Highlight>.</>,
      },
      {
        title: "Exams in different folders.",
        desc: <>Every clinic, every lab, its own folder. <Highlight>Nothing talks to anything.</Highlight></>,
      },
      {
        title: "Wearables that don't talk to the clinic.",
        desc: <>Sleep, activity and recovery stay in the watch app — <Highlight>they never make it to the appointment</Highlight>.</>,
      },
    ],
  },
};

function Icon() {
  return (
    <div className="grid place-items-center size-12 rounded-2xl bg-gradient-to-br from-[#9DC83B] to-[#2A7A3B] text-white">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Problem() {
  const t = useT();
  const L = t(T);
  return (
    <section id="porque" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-2xl">
            {L.title}
          </h2>
          <p className="mt-5 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">{L.desc}</p>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {L.points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="h-full">
                <Icon />
                <h3 className="font-serif text-2xl mt-5 mb-2">{p.title}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
