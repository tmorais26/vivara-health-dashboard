import { SectionBadge, Reveal, Highlight } from "./ui";

const POINTS = [
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
];

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
  return (
    <section id="porque" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>O problema</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-2xl">
            A informação existe. <em>Só não está junta.</em>
          </h2>
          <p className="mt-5 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">
            E cada consulta acaba por começar do zero.
          </p>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {POINTS.map((p, i) => (
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
