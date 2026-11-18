import { SectionBadge, Reveal, Highlight } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "O problema",
    title: (
      <>
        Os resultados existem. <em>Só não chegam ao mesmo sítio.</em>
      </>
    ),
    desc: "O utente faz um exame num sítio e análises noutro. O médico só vê o que lhe chega às mãos — e a consulta começa com «trouxe as análises?».",
    points: [
      {
        title: "Exames num sítio, análises noutro.",
        desc: <>Um exame num hospital, análises num laboratório, consulta numa terceira clínica. <Highlight>Cada um guarda a sua parte.</Highlight></>,
      },
      {
        title: "Tudo chega por email, em PDF.",
        desc: <>Cada resultado vem por uma via diferente e fica numa caixa de correio — <Highlight>longe de quem precisa dele</Highlight> na consulta.</>,
      },
      {
        title: "O médico junta tudo à mão.",
        desc: <>O que foi feito fora da clínica tem de ser anexado manualmente, <Highlight>quando chega a sê‑lo</Highlight>.</>,
      },
    ],
  },
  en: {
    badge: "The problem",
    title: (
      <>
        The results exist. <em>They just don't end up in one place.</em>
      </>
    ),
    desc: "The patient has an exam in one place and lab tests in another. The doctor only sees what reaches them — and the appointment starts with \"did you bring your results?\".",
    points: [
      {
        title: "An exam here, lab tests there.",
        desc: <>An exam at a hospital, lab tests at a lab, the appointment at a third clinic. <Highlight>Each one keeps its own part.</Highlight></>,
      },
      {
        title: "Everything arrives by email, as a PDF.",
        desc: <>Each result comes through a different channel and sits in an inbox — <Highlight>far from whoever needs it</Highlight> at the appointment.</>,
      },
      {
        title: "The doctor pieces it together by hand.",
        desc: <>Anything done outside the clinic has to be attached manually, <Highlight>if it gets attached at all</Highlight>.</>,
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
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">
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
