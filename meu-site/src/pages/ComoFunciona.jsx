import { Link } from "react-router-dom";
import PhotoHeader from "../components/PhotoHeader";
import photo from "../assets/pages/como-funciona.webp";
import { Reveal, CTAButton } from "../components/ui";
import { useT } from "../i18n";

// Página enxuta: três passos, sempre nas duas vistas (utente e médico), uma frase por vista.
const T = {
  pt: {
    header: {
      badge: "Como funciona",
      title: <>O mesmo historial, <em>cada um com a sua vista.</em></>,
      desc: "Os resultados chegam de vários laboratórios e ficam num só sítio. O utente vê a sua saúde, o médico vê o historial completo.",
    },
    patient: "Utente",
    doctor: "Médico",
    steps: [
      {
        title: "Os resultados entram num só sítio",
        patient: "Carregue o PDF ou uma fotografia, de qualquer laboratório.",
        doctor: "Crie a conta e acrescente os resultados que o utente lhe reencaminha.",
      },
      {
        title: "A evolução fica visível",
        patient: "Veja o historial numa linha do tempo, com sono e atividade ao lado.",
        doctor: "Acompanhe a mesma linha do tempo entre consultas, com alertas fora do alvo.",
      },
      {
        title: "A consulta começa com contexto",
        patient: "Saia com um resumo escrito, o plano do dia e lembretes.",
        doctor: "Chegue com tudo num só ecrã. A decisão clínica é sempre sua.",
      },
    ],
    ctaTitle: <>Pronto para <em>começar?</em></>,
    cta: "Começar",
    prices: "Ver preços",
  },
  en: {
    header: {
      badge: "How it works",
      title: <>The same record, <em>each with their own view.</em></>,
      desc: "Results arrive from many labs and end up in one place. Patients see their health, doctors see the complete record.",
    },
    patient: "Patient",
    doctor: "Doctor",
    steps: [
      {
        title: "Results come together in one place",
        patient: "Upload the PDF or a photo, from any lab.",
        doctor: "Create your account and add the results the patient forwards to you.",
      },
      {
        title: "The trend becomes visible",
        patient: "See your record on a timeline, with sleep and activity alongside.",
        doctor: "Follow the same timeline between appointments, with out-of-range alerts.",
      },
      {
        title: "The appointment starts with context",
        patient: "Leave with a written summary, your daily plan and reminders.",
        doctor: "Arrive with everything on one screen. The clinical decision is always yours.",
      },
    ],
    ctaTitle: <>Ready to <em>get started?</em></>,
    cta: "Get started",
    prices: "See pricing",
  },
};

export default function ComoFunciona() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PhotoHeader name="como-funciona" fallback={photo} position="72% 28%" badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="bg-white py-8 md:py-16">
        <div className="mx-auto max-w-6xl px-6 divide-y divide-black/10">
          {L.steps.map((s, i) => (
            <Reveal key={s.title}>
              <div className="grid gap-8 py-12 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-16">
                <div>
                  <p className="font-serif text-6xl font-light text-brand-olive/25 md:text-7xl">0{i + 1}</p>
                  <h2 className="mt-3 max-w-md font-serif text-3xl font-light leading-tight md:text-4xl">{s.title}</h2>
                </div>
                <dl className="space-y-6 self-end">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{L.patient}</dt>
                    <dd className="mt-1.5 text-lg leading-relaxed text-brand-muted/90">{s.patient}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{L.doctor}</dt>
                    <dd className="mt-1.5 text-lg leading-relaxed text-brand-muted/90">{s.doctor}</dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-brand-beige py-20 md:py-28">
        <Reveal className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif font-light text-4xl tracking-tight md:text-6xl">{L.ctaTitle}</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/comecar"><CTAButton>{L.cta}</CTAButton></Link>
            <Link to="/precos" className="rounded-full border border-black/20 px-8 py-3 text-brand-dark transition-colors hover:bg-black/5">{L.prices}</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
