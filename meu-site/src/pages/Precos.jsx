import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, Check as CheckIcon } from "../components/ui";
import { useLang, useT } from "../i18n";

function Check({ light }) {
  return <CheckIcon className={`size-4 mt-0.5 shrink-0 ${light ? "text-brand-lime" : "text-brand-green-dark"}`} />;
}

const T = {
  pt: {
    header: {
      badge: "Preços",
      title: <>Simples e <em>transparente.</em></>,
      desc: "Planos separados para quem acompanha e quem é acompanhado. O acesso do utente é independente do da clínica.",
    },
    monthly: "Mensal",
    annual: "Anual — 1 mês grátis",
    patientsBadge: "Para utentes",
    perMonth: "/mês",
    billedAnnually: "Faturado anualmente",
    perYear: "ano",
    patient: {
      name: "Utente",
      desc: "Acesso completo à app Vivara. Histórico, wearables, mensagens com a equipa e resumos de cada consulta.",
      features: [
        "Resumo da saúde e histórico unificado",
        "Plano do dia (o que tomar e que exames fazer), mensagens com a equipa e consultas",
        "Carregar análises e ligar wearables",
        "Lembretes e resumos de cada consulta",
        "Os seus dados, sempre seus — exportação completa",
      ],
      cta: "Começar como utente",
    },
    patientSide1: "O plano do utente dá-lhe acesso total à sua área na app Vivara, independentemente da clínica onde é acompanhado.",
    patientSide2: "Os médicos e clínicas pagam os seus próprios planos à parte — o seu acesso não depende disso.",
    patientPoints: [
      "Funciona com qualquer médico na Vivara",
      "O seu médico ainda não usa a Vivara? Começa na mesma — convide-o depois",
      "Cancela quando quiser",
    ],
    doctorsBadge: "Para médicos e clínicas",
    perDoctorMonth: "/médico/mês",
    custom: "Sob consulta",
    doctorPlans: [
      {
        name: "Individual",
        monthly: 29,
        desc: "Para médicos a trabalhar de forma independente.",
        features: ["Portal clínico completo", "Análises, exames e notas numa só linha do tempo", "Alertas de valores fora do intervalo de referência", "Funciona com ou sem app do utente", "Suporte por email"],
      },
      {
        name: "Equipa",
        monthly: null,
        desc: "Para clínicas com 2 ou mais profissionais.",
        features: ["Tudo do Individual", "Vários profissionais, um só historial por utente", "Condições e suporte acordados com a clínica"],
        featured: true,
      },
    ],
    ctaStart: "Começar",
    ctaTalk: "Falar connosco",
    referral: {
      badge: "Recomendar a Vivara",
      title: <>Recomende e <em>ganhe um mês grátis.</em></>,
      desc: "Quem recomenda e quem chega ganham um mês grátis — entre utentes, entre médicos, e de utente para médico.",
      rules: [
        { who: "Utente → utente", text: "Os dois ganham um mês grátis." },
        { who: "Médico → médico", text: "Os dois ganham um mês grátis." },
        { who: "Utente → o seu médico", text: "O utente ganha um mês grátis e o médico começa com o primeiro mês grátis." },
        { who: "Médico → utente", text: "O utente começa com o primeiro mês grátis. O médico não recebe nada em troca: a recomendação de um médico nunca deve depender de um benefício próprio." },
      ],
      fine: [
        "O mês grátis de quem recomenda é atribuído quando a pessoa convidada paga a primeira mensalidade.",
        "Até 12 meses grátis por ano. Nos planos anuais, a subscrição é prolongada por um mês.",
        "Planos de clínica: condições a combinar.",
      ],
    },
    footnote: "Sem custos de setup. Cancela quando quiser. IVA não incluído. Os planos de médicos e utentes são independentes.",
  },
  en: {
    header: {
      badge: "Pricing",
      title: <>Simple and <em>transparent.</em></>,
      desc: "Separate plans for those who provide care and those who receive it. Patient access is independent from the clinic's.",
    },
    monthly: "Monthly",
    annual: "Annual — 1 month free",
    patientsBadge: "For patients",
    perMonth: "/month",
    billedAnnually: "Billed annually",
    perYear: "year",
    patient: {
      name: "Patient",
      desc: "Full access to the Vivara app. Record, wearables, messages with your team and a summary after every appointment.",
      features: [
        "Health summary and unified record",
        "Daily plan (what to take and which exams to do), messages with the team and appointments",
        "Upload lab results and connect wearables",
        "Reminders and summaries after every appointment",
        "Your data, always yours — full export",
      ],
      cta: "Start as a patient",
    },
    patientSide1: "The patient plan gives you full access to your own area in the Vivara app, regardless of which clinic looks after you.",
    patientSide2: "Doctors and clinics pay for their own plans separately — your access doesn't depend on it.",
    patientPoints: [
      "Works with any doctor on Vivara",
      "Your doctor doesn't use Vivara yet? Start anyway — invite them later",
      "Cancel anytime",
    ],
    doctorsBadge: "For doctors and clinics",
    perDoctorMonth: "/doctor/month",
    custom: "Custom pricing",
    doctorPlans: [
      {
        name: "Individual",
        monthly: 29,
        desc: "For doctors working independently.",
        features: ["Full clinical portal", "Lab results, exams and notes on a single timeline", "Alerts for values outside the reference range", "Works with or without the patient app", "Email support"],
      },
      {
        name: "Team",
        monthly: null,
        desc: "For clinics with 2 or more professionals.",
        features: ["Everything in Individual", "Several professionals, one record per patient", "Terms and support agreed with the clinic"],
        featured: true,
      },
    ],
    ctaStart: "Get started",
    ctaTalk: "Talk to us",
    referral: {
      badge: "Recommend Vivara",
      title: <>Recommend us and <em>get a month free.</em></>,
      desc: "Whoever recommends and whoever joins get a free month — between patients, between doctors, and from patient to doctor.",
      rules: [
        { who: "Patient → patient", text: "Both get a free month." },
        { who: "Doctor → doctor", text: "Both get a free month." },
        { who: "Patient → their doctor", text: "The patient gets a free month and the doctor starts with their first month free." },
        { who: "Doctor → patient", text: "The patient starts with their first month free. The doctor receives nothing in return: a doctor's recommendation should never depend on a personal benefit." },
      ],
      fine: [
        "The recommender's free month is granted once the invited person pays their first monthly fee.",
        "Up to 12 free months a year. On annual plans, the subscription is extended by one month.",
        "Clinic plans: terms to be agreed.",
      ],
    },
    footnote: "No setup costs. Cancel anytime. VAT not included. Doctor and patient plans are independent.",
  },
};

const PATIENT_MONTHLY = 6.99;
// Plano anual: 12 meses ao preço de 11.
const ANNUAL_FACTOR = 11 / 12;

export default function Precos() {
  const { lang } = useLang();
  const t = useT();
  const L = t(T);
  const [billing, setBilling] = useState("mensal");

  const formatPrice = (monthly) => {
    const price = billing === "anual" ? monthly * ANNUAL_FACTOR : monthly;
    return price.toLocaleString(lang === "pt" ? "pt-PT" : "en-IE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

      <section className="bg-brand-beige pt-2 pb-8">
        <div className="mx-auto max-w-6xl px-6 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
            {["mensal", "anual"].map((opt) => (
              <button
                key={opt}
                onClick={() => setBilling(opt)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  billing === opt ? "bg-brand-dark text-white" : "text-brand-muted"
                }`}
              >
                {opt === "mensal" ? L.monthly : L.annual}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Utente */}
      <section className="bg-brand-beige pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionBadge>{L.patientsBadge}</SectionBadge>
          <div className="mt-6 grid md:grid-cols-2 gap-6 items-stretch">
            <Reveal>
              <div className="rounded-3xl bg-brand-dark text-white p-8 h-full flex flex-col">
                <h3 className="font-serif text-2xl mb-2">{L.patient.name}</h3>
                <p className="text-sm text-white/70 mb-6">{L.patient.desc}</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl">€{formatPrice(PATIENT_MONTHLY)}</span>
                  <span className="text-white/60 text-sm">{L.perMonth}</span>
                  {billing === "anual" && <p className="text-xs text-brand-lime mt-1">{L.billedAnnually} · €{(PATIENT_MONTHLY * 11).toLocaleString(lang === "pt" ? "pt-PT" : "en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{L.perYear}</p>}
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {L.patient.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check light />
                      <span className="text-white/90">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contacto"
                  className="mt-auto inline-flex items-center justify-center rounded-full bg-brand-lime text-brand-text px-5 py-3 text-sm font-medium"
                >
                  {L.patient.cta}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-black/10 bg-white p-8 h-full flex flex-col justify-center">
                <p className="text-lg text-brand-muted/85 leading-relaxed mb-4">{L.patientSide1}</p>
                <p className="text-lg text-brand-muted/85 leading-relaxed mb-6">{L.patientSide2}</p>
                <ul className="space-y-3 text-sm text-brand-muted border-t border-black/10 pt-6">
                  {L.patientPoints.map((p) => (
                    <li key={p} className="flex items-start gap-2"><Check /> {p}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      {/* Médicos */}
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionBadge>{L.doctorsBadge}</SectionBadge>
          <div className="mt-6 mx-auto grid max-w-4xl md:grid-cols-2 gap-6">
            {L.doctorPlans.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <div
                  className={`rounded-3xl p-8 h-full flex flex-col border ${
                    p.featured
                      ? "bg-brand-dark text-white border-brand-dark"
                      : "bg-white border-black/10"
                  }`}
                >
                  <h3 className="font-serif text-2xl mb-2">{p.name}</h3>
                  <p className={`text-sm mb-6 min-h-[2.5em] ${p.featured ? "text-white/70" : "text-brand-muted/70"}`}>
                    {p.desc}
                  </p>
                  <div className="mb-6">
                    {p.monthly ? (
                      <>
                        <span className="font-serif text-4xl">€{formatPrice(p.monthly)}</span>
                        <span className={`text-sm ${p.featured ? "text-white/60" : "text-brand-muted/60"}`}>{L.perDoctorMonth}</span>
                      </>
                    ) : (
                      <span className="font-serif text-4xl">{L.custom}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check light={p.featured} />
                        <span className={p.featured ? "text-white/90" : ""}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contacto"
                    className={`mt-auto inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium ${
                      p.featured ? "bg-brand-lime text-brand-text" : "bg-brand-olive text-white hover:bg-brand-olive-hover"
                    }`}
                  >
                    {p.monthly ? L.ctaStart : L.ctaTalk}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-brand-muted/60">{L.footnote}</p>
        </div>
      </section>

      {/* Referenciação */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.referral.badge}</SectionBadge>
            <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.referral.title}
            </h2>
            <p className="mt-4 text-lg text-brand-muted/80 max-w-2xl leading-relaxed">{L.referral.desc}</p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {L.referral.rules.map((r, i) => (
              <Reveal key={r.who} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-black/10 bg-brand-beige p-6">
                  <p className="font-serif text-xl">{r.who}</p>
                  <p className="mt-2 text-sm text-brand-muted/80 leading-relaxed">{r.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <ul className="mt-8 space-y-1.5 text-xs text-brand-muted/60">
            {L.referral.fine.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
