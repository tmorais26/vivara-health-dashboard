import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import ClinicalAlerts from "../components/ClinicalAlerts";
import TimelineMock from "../components/TimelineMock";
import { useT } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Para médicos · Portal clínico",
      title: <>O contexto completo, <em>antes de cada decisão.</em></>,
      desc: "Um portal clínico para acompanhar utentes entre consultas. Análises, exames, wearables e notas — organizados cronologicamente.",
    },
    howBadge: "Como funciona",
    steps: [
      {
        n: "01",
        title: "Crie a sua conta",
        desc: "Abra a sua conta de profissional em minutos, com a sua cédula profissional. É o seu acesso ao portal: não precisa de instalar nada nem de depender do sistema da clínica.",
      },
      {
        n: "02",
        title: "Registe o utente",
        desc: "Comece em minutos. Se o utente quiser, convide-o por email para a app. Se preferir não usar a app, basta ele reencaminhar-lhe os resultados que recebe — e você acrescenta-os ao historial.",
      },
      {
        n: "03",
        title: "Acompanhe entre consultas",
        desc: "Análises, exames e notas numa só linha do tempo, venham de onde vierem. Com a app do utente, também wearables, sono e atividade ao lado dos dados clínicos. Veja a evolução muito antes de ele voltar à consulta.",
      },
      {
        n: "04",
        title: "Chegue preparado à consulta",
        desc: "Todo o contexto reunido num só ecrã — alertas de valores fora do alvo e notas da última visita. A decisão clínica continua a ser sempre sua.",
      },
    ],
    audienceBadge: "Para quem é",
    audienceTitle: "Do consultório individual à clínica com equipa.",
    audience: [
      {
        title: "Médico independente",
        desc: "Trabalha sozinho ou em part-time em várias clínicas? O portal acompanha os seus utentes onde quer que os veja, sem depender do sistema de cada clínica.",
      },
      {
        title: "Clínica com equipa",
        desc: "Vários profissionais, um só histórico. Partilha o utente com nutricionistas, enfermeiros e outros médicos, cada um com o seu nível de acesso.",
      },
    ],
    alertsBadge: "O portal, por dentro",
    alertsTitle: <>Alertas clínicos, <em>no contexto certo.</em></>,
    alertsDesc:
      "A plataforma sinaliza valores fora do alvo funcional definido por si — sempre com a tendência ao longo do tempo, nunca só o último número.",
    timelineBadge: "Linha do tempo",
    timelineTitle: <>Cada exame, <em>na sua data.</em></>,
    timelineDesc: "Análises, wearables e consultas em ordem cronológica — nunca só o valor mais recente.",
    includedBadge: "Incluído",
    includedTitle: "Tudo o que precisa no portal clínico.",
    included: [
      {
        title: "Histórico cronológico",
        desc: <>Análises, exames e notas organizados por data, com a <Highlight>tendência de cada marcador</Highlight> ao longo do tempo.</>,
      },
      {
        title: "Wearables ao lado da clínica",
        desc: <>Sono, atividade e recuperação visíveis <Highlight>junto dos dados clínicos</Highlight> — não numa app separada.</>,
      },
      {
        title: "Planos e documentos num só sítio",
        desc: <>O plano do dia do utente (o que tomar, que exames fazer) e os documentos, <Highlight>sem andar a procurar em pastas</Highlight>.</>,
      },
      {
        title: "Diário clínico privado",
        desc: <>Notas internas da equipa, visíveis só entre profissionais — <Highlight>nunca partilhadas com o utente</Highlight>.</>,
      },
      {
        title: "Setup rápido",
        desc: <>Abra a conta e registe o utente em minutos, <Highlight>sem importações manuais</Highlight> nem onboarding complicado.</>,
      },
      {
        title: "Com ou sem app do utente",
        desc: <>O utente não precisa de app: basta reencaminhar-lhe o email com os resultados e você acrescenta-os ao historial. Com a app, o que ele carrega <Highlight>chega-lhe antes da consulta</Highlight>.</>,
      },
      {
        title: "Mensagens diretas",
        desc: <>Conversa com o utente sem sair do portal, com <Highlight>histórico permanente da troca</Highlight>.</>,
      },
      {
        title: "Exportação a qualquer momento",
        desc: <>Os dados do utente podem ser <Highlight>exportados sempre que necessário</Highlight>, num formato aberto.</>,
      },
    ],
    ctaTitle: "Pronto para conhecer a Vivara?",
    ctaPlans: "Ver planos",
    ctaDemo: "Agendar demo",
  },
  en: {
    header: {
      badge: "For doctors · Clinical portal",
      title: <>Full context, <em>before every decision.</em></>,
      desc: "A clinical portal for following patients between appointments. Lab results, exams, wearables and notes — organised chronologically.",
    },
    howBadge: "How it works",
    steps: [
      {
        n: "01",
        title: "Create your account",
        desc: "Open your professional account in minutes, with your professional licence number. It's your access to the portal: nothing to install, and no dependence on the clinic's system.",
      },
      {
        n: "02",
        title: "Register the patient",
        desc: "Start in minutes. If the patient wants, invite them to the app by email. If they'd rather not use the app, they can simply forward you the results they receive — and you add them to the record.",
      },
      {
        n: "03",
        title: "Follow between appointments",
        desc: "Lab results, exams and notes on a single timeline, wherever they come from. With the patient's app, also wearables, sleep and activity next to the clinical data. See how they're doing long before they return to the clinic.",
      },
      {
        n: "04",
        title: "Arrive at the appointment prepared",
        desc: "All the context on a single screen — alerts for out-of-range values and notes from the last visit. The clinical decision is always yours.",
      },
    ],
    audienceBadge: "Who it's for",
    audienceTitle: "From a solo practice to a clinic with a team.",
    audience: [
      {
        title: "Independent doctor",
        desc: "Working alone, or part-time across several clinics? The portal follows your patients wherever you see them, without depending on each clinic's system.",
      },
      {
        title: "Clinic with a team",
        desc: "Several professionals, one record. Share the patient with nutritionists, nurses and other doctors, each with their own level of access.",
      },
    ],
    alertsBadge: "Inside the portal",
    alertsTitle: <>Clinical alerts, <em>in the right context.</em></>,
    alertsDesc:
      "The platform flags values outside the functional target you define — always with the trend over time, never just the latest number.",
    timelineBadge: "Timeline",
    timelineTitle: <>Every exam, <em>on its date.</em></>,
    timelineDesc: "Lab results, wearables and appointments in chronological order — never just the most recent value.",
    includedBadge: "Included",
    includedTitle: "Everything you need in the clinical portal.",
    included: [
      {
        title: "Chronological record",
        desc: <>Lab results, exams and notes organised by date, with <Highlight>each marker's trend</Highlight> over time.</>,
      },
      {
        title: "Wearables next to the clinic",
        desc: <>Sleep, activity and recovery visible <Highlight>alongside the clinical data</Highlight> — not in a separate app.</>,
      },
      {
        title: "Plans and documents in one place",
        desc: <>The patient's daily plan (what to take, which exams to do) and documents, <Highlight>without hunting through folders</Highlight>.</>,
      },
      {
        title: "Private clinical journal",
        desc: <>Internal team notes, visible only between professionals — <Highlight>never shared with the patient</Highlight>.</>,
      },
      {
        title: "Quick setup",
        desc: <>Open your account and register a patient in minutes, <Highlight>no manual imports</Highlight> and no complicated onboarding.</>,
      },
      {
        title: "With or without the patient app",
        desc: <>The patient doesn't need the app: they can just forward you the email with their results and you add them to the record. With the app, what they upload <Highlight>reaches you before the appointment</Highlight>.</>,
      },
      {
        title: "Direct messaging",
        desc: <>Talk to the patient without leaving the portal, with a <Highlight>permanent record of the exchange</Highlight>.</>,
      },
      {
        title: "Export at any time",
        desc: <>Patient data can be <Highlight>exported whenever needed</Highlight>, in an open format.</>,
      },
    ],
    ctaTitle: "Ready to meet Vivara?",
    ctaPlans: "See plans",
    ctaDemo: "Book a demo",
  },
};

export default function Medicos() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal><SectionBadge>{L.howBadge}</SectionBadge></Reveal>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {L.steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <p className="font-serif text-5xl md:text-6xl opacity-20 text-brand-olive mb-4">{s.n}</p>
                <h3 className="font-serif text-2xl mb-3">{s.title}</h3>
                <p className="text-brand-muted/80 leading-relaxed">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.audienceBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.audienceTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {L.audience.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-black/10 bg-brand-beige p-6 h-full">
                  <h3 className="font-serif text-xl mb-2">{a.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <SectionBadge>{L.alertsBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              {L.alertsTitle}
            </h2>
            <p className="mt-5 text-lg text-brand-muted/80 leading-relaxed max-w-md">
              {L.alertsDesc}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ClinicalAlerts />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal className="md:order-2">
            <SectionBadge>{L.timelineBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              {L.timelineTitle}
            </h2>
            <p className="mt-5 text-lg text-brand-muted/80 leading-relaxed max-w-md">
              {L.timelineDesc}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="md:order-1">
            <TimelineMock />
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-brand-dark">
        <div className="mx-auto max-w-6xl px-6 text-white">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90">{L.includedBadge}</span>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.includedTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-6">
            {L.included.map((it, i) => (
              <Reveal key={it.title} delay={i * 0.05}>
                <div className="flex items-start gap-3">
                  <Check className="size-5 mt-0.5 shrink-0 text-brand-lime" />
                  <div>
                    <p className="text-white/90 font-medium">{it.title}</p>
                    <p className="text-sm text-white/50 mt-0.5">{it.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">{L.ctaTitle}</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/precos"><CTAButton>{L.ctaPlans}</CTAButton></Link>
              <Link to="/contacto" className="rounded-full border border-black/15 px-8 py-4 font-medium hover:bg-black/5 transition-colors">
                {L.ctaDemo}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
