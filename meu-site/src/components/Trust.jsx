import { SectionBadge, Reveal, Check } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "Princípios",
    title: (
      <>
        O que nos <em>guia.</em>
      </>
    ),
    controlTitle: <>Os seus dados. <em>O seu controlo.</em></>,
    control: [
      "Os seus dados são seus — exportáveis a qualquer momento",
      "Só os profissionais que escolher têm acesso",
      "Tratamos os dados de saúde segundo o RGPD, incluindo o Artigo 9.º",
      "Nunca vendemos os seus dados a terceiros",
    ],
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
        desc: "A Vivara organiza, mostra e avisa quando um valor sai do intervalo de referência ou do alvo definido. Não faz diagnósticos nem sugere tratamentos.",
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
    controlTitle: <>Your data. <em>Your control.</em></>,
    control: [
      "Your data is yours — exportable at any time",
      "Only the professionals you choose have access",
      "We process health data under the GDPR, including Article 9",
      "We never sell your data to third parties",
    ],
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
        desc: "Vivara organises, shows and alerts you when a value falls outside its reference range or the target set. It does not diagnose or suggest treatments.",
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

        <Reveal delay={0.1}>
          <div className="mt-14 rounded-3xl bg-brand-dark px-8 py-10 text-white md:px-12">
            <h3 className="font-serif text-3xl md:text-4xl font-light">{L.controlTitle}</h3>
            <ul className="mt-6 grid gap-x-10 gap-y-3 md:grid-cols-2">
              {L.control.map((c) => (
                <li key={c} className="flex items-start gap-3 text-white/85">
                  <Check className="mt-1 size-4 shrink-0 text-brand-lime" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
