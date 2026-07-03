import { SectionBadge, Reveal } from "./ui";

const PRINCIPLES = [
  {
    title: "Privacidade total",
    desc: "Os seus dados são visíveis só a si e ao médico que escolher. Nunca a mais ninguém.",
  },
  {
    title: "Medido vs. inferido",
    desc: "A Vivara distingue sempre o que é medido — as suas análises — do que é inferido pelos wearables.",
  },
  {
    title: "A tecnologia apoia, não diagnostica",
    desc: "A plataforma organiza, visualiza e avisa. As decisões clínicas são sempre do médico.",
  },
];

export default function Trust() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>Princípios</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5">
            O que nos <em>guia.</em>
          </h2>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <h3 className="font-serif text-2xl mb-2">{p.title}</h3>
              <p className="text-brand-muted/80 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
