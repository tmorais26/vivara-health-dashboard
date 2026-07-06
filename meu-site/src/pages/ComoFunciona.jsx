import { PageHeader, SectionBadge, Reveal, Check, Highlight } from "../components/ui";
import { useT } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Como funciona",
      title: <>A sua saúde, <em>organizada entre consultas.</em></>,
      desc: "Um lugar seguro para exames, resultados, sintomas e registos médicos — para que cada consulta valha a pena.",
    },
    stepsBadge: "Três passos",
    steps: [
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
    ],
    viewsBadge: "Duas vistas",
    viewsTitle: (
      <>
        A mesma história, <em>dois pontos de vista.</em>
      </>
    ),
    viewsDesc:
      "Não é medicina de longevidade nem wellness — é gestão do historial clínico contínuo entre consultas. O médico e o utente veem a mesma informação, cada um com o acesso que faz sentido para si.",
    views: [
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
    ],
    principlesBadge: "Princípios",
    principlesTitle: "O que nos guia.",
    principles: [
      ["Privacidade total", "Dados visíveis só ao utente e ao médico escolhido."],
      ["Medido vs. inferido", "Distingue sempre o que é medido do que é inferido pelos wearables."],
      ["A tecnologia apoia, não diagnostica", "A plataforma organiza, visualiza e avisa; as decisões são sempre do médico."],
    ],
  },
  en: {
    header: {
      badge: "How it works",
      title: <>Your health, <em>organised between appointments.</em></>,
      desc: "A safe place for exams, results, symptoms and medical records — so that every appointment counts.",
    },
    stepsBadge: "Three steps",
    steps: [
      {
        title: "Gather your data",
        desc: (
          <>
            Upload lab results and exams as you receive them, connect your wearables and note
            symptoms as they appear. Everything is kept in an <Highlight>encrypted vault</Highlight>,
            automatically organised by date — no folders, no PDFs lost in emails.
          </>
        ),
      },
      {
        title: "Follow the trend",
        desc: (
          <>
            Your record becomes a timeline, with <Highlight>clear insights</Highlight> month by
            month: what changed, what's holding steady and what needs attention. You see patterns
            a single exam could never show on its own.
          </>
        ),
      },
      {
        title: "Decide with your team",
        desc: (
          <>
            Your doctor sees exactly the same story — without you having to re-summarise everything
            at every appointment. Decisions are made with <Highlight>full context</Highlight>, and
            they always remain the doctor's.
          </>
        ),
      },
    ],
    viewsBadge: "Two views",
    viewsTitle: (
      <>
        The same story, <em>two points of view.</em>
      </>
    ),
    viewsDesc:
      "This isn't longevity medicine or wellness — it's continuous clinical record management between appointments. Doctor and patient see the same information, each with the access that makes sense for them.",
    views: [
      {
        who: "For the doctor",
        title: "Clinical portal",
        items: [
          "Lab results, exams and notes organised chronologically",
          "Wearables, sleep and activity next to the clinical data",
          "Plans, prescriptions, appointments and documents in one place",
          "Private clinical journal for the team",
          "Quick setup: invite the patient by email",
        ],
      },
      {
        who: "For the patient",
        title: "App",
        items: [
          "Health summary and unified record",
          "Daily plan, messages with the team and appointments",
          "Upload lab results and connect wearables",
          "Reminders and summaries after every appointment",
          "Your data, always yours — full export",
        ],
      },
    ],
    principlesBadge: "Principles",
    principlesTitle: "What guides us.",
    principles: [
      ["Total privacy", "Data visible only to the patient and the chosen doctor."],
      ["Measured vs. inferred", "Always distinguishes what is measured from what is inferred by wearables."],
      ["Technology supports, it doesn't diagnose", "The platform organises, visualises and alerts; decisions always belong to the doctor."],
    ],
  },
};

export default function ComoFunciona() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal><SectionBadge>{L.stepsBadge}</SectionBadge></Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {L.steps.map((s, i) => (
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
            <SectionBadge>{L.viewsBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.viewsTitle}
            </h2>
            <p className="mt-4 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">
              {L.viewsDesc}
            </p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {L.views.map((v, i) => (
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
          <Reveal><SectionBadge>{L.principlesBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">{L.principlesTitle}</h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {L.principles.map(([tt, d], i) => (
              <Reveal key={tt} delay={i * 0.08}>
                <h3 className="font-serif text-2xl mb-2">{tt}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
