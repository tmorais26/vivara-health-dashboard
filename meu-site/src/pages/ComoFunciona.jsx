import { PageHeader, SectionBadge, Reveal, Check, Highlight } from "../components/ui";

const STEPS = [
  {
    title: "Reúna os seus dados",
    desc: (
      <>
        Carregue análises e exames à medida que os recebe, ligue os seus wearables e escreva
        sintomas quando surgem. Tudo fica guardado num <Highlight>cofre encriptado</Highlight>,
        organizado automaticamente por data — sem pastas, sem PDFs perdidos em emails.
      </>
    ),
  },
  {
    title: "Acompanhe a evolução",
    desc: (
      <>
        O seu historial fica visível em linha do tempo, com <Highlight>insights claros</Highlight>{" "}
        mês a mês: o que mudou, o que se mantém e o que precisa de atenção. Vê padrões que um
        único exame nunca mostraria sozinho.
      </>
    ),
  },
  {
    title: "Decida com a sua equipa",
    desc: (
      <>
        O seu médico vê exatamente a mesma história — sem ter de resumir tudo de novo em cada
        consulta. As decisões são tomadas com <Highlight>contexto completo</Highlight>, e
        continuam a ser sempre dele.
      </>
    ),
  },
];

const VIEWS = [
  {
    who: "Para o médico",
    title: "Portal clínico",
    items: [
      "Análises, exames e notas organizados cronologicamente",
      "Wearables, sono e atividade ao lado dos dados clínicos",
      "Planos, prescrições, consultas e documentos num só sítio",
      "Diário clínico privado da equipa",
      "Setup rápido: convida o utente por email",
    ],
  },
  {
    who: "Para o utente",
    title: "App",
    items: [
      "Resumo da saúde e histórico unificado",
      "Plano diário, mensagens com a equipa e consultas",
      "Carregar análises e ligar wearables",
      "Lembretes e resumos de cada consulta",
      "Os seus dados, sempre seus — exportação completa",
    ],
  },
];

const PRINCIPLES = [
  ["Privacidade total", "Dados visíveis só ao utente e ao médico escolhido."],
  ["Medido vs. inferido", "Distingue sempre o que é medido do que é inferido pelos wearables."],
  ["A tecnologia apoia, não diagnostica", "A plataforma organiza, visualiza e avisa; as decisões são sempre do médico."],
];

export default function ComoFunciona() {
  return (
    <>
      <PageHeader
        badge="Como funciona"
        title={<>A sua saúde, <em>organizada entre consultas.</em></>}
        desc="Um lugar seguro para exames, resultados, sintomas e registos médicos — para que cada consulta valha a pena."
      />

      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal><SectionBadge>Três passos</SectionBadge></Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full">
                  <span className="text-sm text-brand-muted/50">0{i + 1}</span>
                  <h3 className="font-serif text-2xl mt-2 mb-3">{s.title}</h3>
                  <p className="text-brand-muted/80 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>Duas vistas</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              A mesma história, <em>dois pontos de vista.</em>
            </h2>
            <p className="mt-4 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">
              Não é medicina de longevidade nem wellness — é gestão do historial clínico contínuo
              entre consultas. O médico e o utente veem a mesma informação, cada um com o acesso
              que faz sentido para si.
            </p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {VIEWS.map((v, i) => (
              <Reveal key={v.who} delay={i * 0.1}>
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{v.who}</p>
                  <h3 className="font-serif text-2xl mt-1 mb-5">{v.title}</h3>
                  <ul className="space-y-3">
                    {v.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 mt-0.5 shrink-0 text-brand-green-dark" />
                        <span className="text-brand-muted/85">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal><SectionBadge>Princípios</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">O que nos guia.</h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <h3 className="font-serif text-2xl mb-2">{t}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
