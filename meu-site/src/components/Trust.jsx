import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "Princípios",
    title: (
      <>
        O que nos <em>guia.</em>
      </>
    ),
    principles: [
      {
        title: "Privacidade total",
        desc: "Os dados de saúde são visíveis só à pessoa a quem pertencem e aos profissionais que ela escolher. Nunca a mais ninguém.",
      },
      {
        title: "Cada dado, com a sua origem",
        desc: "Ao lado de cada valor vê de onde vem: uma análise de laboratório, um registo seu ou um wearable. Nunca se misturam.",
      },
      {
        title: "A decisão clínica é sempre do médico",
        desc: "A Vivara organiza, mostra e avisa quando um valor sai do intervalo de referência. Não faz diagnósticos nem sugere tratamentos.",
      },
    ],
  },
  en: {
    badge: "Principles",
    title: (
      <>
        What <em>guides us.</em>
      </>
    ),
    principles: [
      {
        title: "Total privacy",
        desc: "Health data is visible only to the person it belongs to and the professionals they choose. Never to anyone else.",
      },
      {
        title: "Every data point, with its source",
        desc: "Next to every value you can see where it comes from: a lab result, an entry of your own or a wearable. They are never mixed.",
      },
      {
        title: "Clinical decisions always belong to the doctor",
        desc: "Vivara organises, shows and alerts you when a value falls outside its reference range. It does not diagnose or suggest treatments.",
      },
    ],
  },
};

export default function Trust() {
  const t = useT();
  const L = t(T);
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5">
            {L.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {L.principles.map((p, i) => (
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
