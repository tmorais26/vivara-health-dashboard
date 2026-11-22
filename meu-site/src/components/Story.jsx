import { Link } from "react-router-dom";
import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "Porque existimos",
    title: (
      <>
        Nascida de uma <em>frustração partilhada.</em>
      </>
    ),
    body: "A Vivara Health não nasceu numa sala de reuniões. Nasceu da frustração partilhada entre médicos e utentes: análises perdidas em emails, exames espalhados por pastas, wearables que ninguém olha em consulta e cada visita a começar do zero.",
    pillars: [
      {
        title: "Médicos no desenho",
        desc: "Cada ecrã validado com médicos em prática ativa.",
      },
      {
        title: "Utentes no centro",
        desc: "Pensada para quem quer acompanhar a sua saúde.",
      },
      {
        title: "Um só historial",
        desc: "Um único historial, partilhado só entre utente e profissionais.",
      },
    ],
    link: "Conhecer a nossa história",
  },
  en: {
    badge: "Why we exist",
    title: (
      <>
        Born from a <em>shared frustration.</em>
      </>
    ),
    body: "Vivara Health wasn't born in a meeting room. It was born from a frustration shared by doctors and patients alike: lab results lost in emails, exams scattered across folders, wearables nobody looks at during appointments, and every visit starting from scratch.",
    pillars: [
      {
        title: "Doctors in the design",
        desc: "Every screen validated with doctors in active practice.",
      },
      {
        title: "Patients at the centre",
        desc: "Built for people who want to stay on top of their health.",
      },
      {
        title: "One record",
        desc: "One single record, shared only between patient and professionals.",
      },
    ],
    link: "Read our story",
  },
};

export default function Story() {
  const t = useT();
  const L = t(T);
  return (
    <section className="bg-brand-beige py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">
            {L.title}
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 rounded-3xl bg-white border border-black/10 p-8 md:p-12 shadow-sm">
            <p className="text-lg text-brand-muted/85 leading-relaxed max-w-2xl">{L.body}</p>

            <div className="mt-10 grid md:grid-cols-3 gap-8">
              {L.pillars.map((p) => (
                <div key={p.title}>
                  <h3 className="font-serif text-xl mb-2">{p.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 mt-10 text-sm font-medium underline underline-offset-4"
            >
              {L.link}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
