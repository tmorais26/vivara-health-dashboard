import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal } from "../components/ui";
import { useT } from "../i18n";

// Cada passo mostra sempre as duas vistas: a do utente e a do médico.
const T = {
  pt: {
    header: {
      badge: "Como funciona",
      title: <>O mesmo historial, <em>cada um com a sua vista.</em></>,
      desc: "Uma só plataforma para utentes e médicos. Os resultados chegam de vários laboratórios e ficam num só sítio: o utente vê a sua saúde, o médico vê o historial completo.",
    },
    stepsBadge: "Três passos",
    patient: "Utente",
    doctor: "Médico",
    steps: [
      {
        title: "Os resultados entram num só sítio",
        patient:
          "Recebeu as análises por email? Carregue o PDF (ou uma fotografia) na app, venha do laboratório ou da clínica que vier. Fica num cofre encriptado, organizado por data.",
        doctor:
          "Crie a sua conta e registe o utente. Se ele não usar a app, basta reencaminhar-lhe o email com os resultados e você acrescenta-os ao historial.",
      },
      {
        title: "A evolução fica visível",
        patient:
          "O historial aparece em linha do tempo, com o que mudou, o que se mantém e o que precisa de atenção. Com wearables ligados, sono e atividade ficam ao lado das análises.",
        doctor:
          "Vê a mesma linha do tempo entre consultas, com alertas de valores fora do alvo. Os wearables aparecem quando o utente usa a app, e nunca se misturam com as análises.",
      },
      {
        title: "A consulta começa com contexto",
        patient:
          "Leva o historial completo para a consulta e sai com um resumo por escrito do que foi decidido, o plano do dia (o que tomar e que exames fazer) e lembretes.",
        doctor:
          "Chega com tudo num só ecrã, sem começar por «trouxe as análises?». A decisão clínica é sempre sua, e as notas internas da equipa nunca são partilhadas com o utente.",
      },
    ],
    startBadge: "Por onde começar",
    startTitle: (
      <>
        Cada um começa <em>no seu lado.</em>
      </>
    ),
    startDesc:
      "Os dois acessos são independentes e funcionam em conjunto: o utente pode começar sem o médico, e o médico sem a app do utente.",
    starts: [
      {
        who: "Utente",
        title: "Carregue o primeiro resultado",
        desc: "Abra a conta, carregue uma análise e veja o historial a crescer. Convide o seu médico quando quiser.",
        cta: "Ver a vista do utente",
        to: "/utentes",
      },
      {
        who: "Médico",
        title: "Crie a conta e registe o primeiro utente",
        desc: "Abra a sua conta de profissional, registe o utente e acrescente os resultados que ele lhe reencaminhar. Convide-o para a app se ele quiser.",
        cta: "Ver a vista do médico",
        to: "/medicos",
      },
    ],
    principlesBadge: "Princípios",
    principlesTitle: "O que nos guia.",
    principles: [
      ["Privacidade total", "Dados visíveis só à pessoa a quem pertencem e a quem ela escolher."],
      ["Cada dado, com a sua origem", "Cada valor mostra se vem de uma análise, de um registo ou de um wearable. Nunca se misturam."],
      ["A tecnologia apoia, não diagnostica", "A plataforma organiza, visualiza e avisa; as decisões são sempre do médico."],
    ],
  },
  en: {
    header: {
      badge: "How it works",
      title: <>The same record, <em>each with their own view.</em></>,
      desc: "One platform for patients and doctors. Results arrive from many labs and end up in one place: patients see their health, doctors see the complete record.",
    },
    stepsBadge: "Three steps",
    patient: "Patient",
    doctor: "Doctor",
    steps: [
      {
        title: "Results come together in one place",
        patient:
          "Got your lab results by email? Upload the PDF (or a photo) to the app, whichever lab or clinic it came from. It is kept in an encrypted vault, organised by date.",
        doctor:
          "Create your account and register the patient. If they don't use the app, they simply forward you the email with their results and you add them to the record.",
      },
      {
        title: "The trend becomes visible",
        patient:
          "The record appears as a timeline, showing what changed, what's holding steady and what needs attention. With wearables connected, sleep and activity sit next to the lab results.",
        doctor:
          "You see the same timeline between appointments, with alerts for out-of-range values. Wearables appear when the patient uses the app, and are never mixed with lab results.",
      },
      {
        title: "The appointment starts with context",
        patient:
          "You take the full record to the appointment and leave with a written summary of what was decided, your daily plan (what to take and which exams to do) and reminders.",
        doctor:
          "You arrive with everything on one screen, without starting from “did you bring your results?”. The clinical decision is always yours, and the team's internal notes are never shared with the patient.",
      },
    ],
    startBadge: "Where to start",
    startTitle: (
      <>
        Everyone starts <em>on their own side.</em>
      </>
    ),
    startDesc:
      "The two accesses are independent and work together: patients can start without their doctor, and doctors without the patient's app.",
    starts: [
      {
        who: "Patient",
        title: "Upload your first result",
        desc: "Open an account, upload a lab result and watch your record grow. Invite your doctor whenever you like.",
        cta: "See the patient view",
        to: "/utentes",
      },
      {
        who: "Doctor",
        title: "Create your account and register your first patient",
        desc: "Open your professional account, register the patient and add the results they forward to you. Invite them to the app if they want.",
        cta: "See the doctor view",
        to: "/medicos",
      },
    ],
    principlesBadge: "Principles",
    principlesTitle: "What guides us.",
    principles: [
      ["Total privacy", "Data visible only to the person it belongs to and whoever they choose."],
      ["Every data point, with its source", "Each value shows whether it comes from a lab result, an entry or a wearable. They are never mixed."],
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
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full flex flex-col">
                  <span className="text-sm text-brand-muted/50">0{i + 1}</span>
                  <h3 className="font-serif text-2xl mt-2 mb-5">{s.title}</h3>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50 mb-1.5">{L.patient}</p>
                      <p className="text-brand-muted/85 leading-relaxed">{s.patient}</p>
                    </div>
                    <hr className="border-black/10" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50 mb-1.5">{L.doctor}</p>
                      <p className="text-brand-muted/85 leading-relaxed">{s.doctor}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.startBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.startTitle}
            </h2>
            <p className="mt-4 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">
              {L.startDesc}
            </p>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {L.starts.map((c, i) => (
              <Reveal key={c.who} delay={i * 0.1}>
                <div className="rounded-3xl bg-white border border-black/10 p-8 h-full flex flex-col">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{c.who}</p>
                  <h3 className="font-serif text-2xl mt-1 mb-3">{c.title}</h3>
                  <p className="text-brand-muted/80 leading-relaxed mb-6">{c.desc}</p>
                  <Link to={c.to} className="mt-auto text-sm font-medium underline underline-offset-4">
                    {c.cta} →
                  </Link>
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
