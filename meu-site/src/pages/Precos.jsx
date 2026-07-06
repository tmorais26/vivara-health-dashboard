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
    annual: "Anual — poupa 20%",
    patientsBadge: "Para utentes",
    perMonth: "/mês",
    billedAnnually: "Faturado anualmente",
    patient: {
      name: "Utente",
      desc: "Acesso completo à app Vivara. Histórico, wearables, mensagens com a equipa e resumos de cada consulta.",
      features: [
        "Resumo da saúde e histórico unificado",
        "Plano diário, mensagens com a equipa e consultas",
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
        monthly: 89,
        desc: "Para médicos a trabalhar de forma independente.",
        features: ["Até 200 utentes", "Portal clínico completo", "App de utente incluída", "Integrações com wearables", "Suporte por email"],
      },
      {
        name: "Equipa",
        monthly: 69,
        desc: "Para clínicas com 3+ profissionais.",
        features: ["Utentes ilimitados", "Tudo do Individual", "Equipa multidisciplinar", "Permissões granulares", "Suporte prioritário"],
        featured: true,
      },
      {
        name: "Instituição",
        monthly: null,
        desc: "Para hospitais e grupos clínicos.",
        features: ["Tudo do Equipa", "SSO e integrações HL7/FHIR", "Onboarding dedicado", "SLA personalizado", "Gestor de conta"],
      },
    ],
    ctaTalk: "Falar connosco",
    ctaStart: "Começar",
    footnote: "Sem custos de setup. Cancela quando quiser. IVA não incluído. Os planos de médicos e utentes são independentes.",
    compareTitle: "Compara os planos.",
    compareRows: [
      ["Médicos", "1", "Até 20", "Ilimitados"],
      ["Utentes activos", "Até 200", "Ilimitados", "Ilimitados"],
      ["Portal clínico", "✦", "✦", "✦"],
      ["App de utente", "✦", "✦", "✦"],
      ["Wearables", "✦", "✦", "✦"],
      ["Equipa multidisciplinar", "◦", "✦", "✦"],
      ["SSO (SAML/OIDC)", "◦", "◦", "✦"],
      ["HL7/FHIR", "◦", "◦", "✦"],
      ["Onboarding", "Self-serve", "Assistido", "Dedicado"],
      ["Suporte", "Email", "Prioritário", "Dedicado"],
    ],
  },
  en: {
    header: {
      badge: "Pricing",
      title: <>Simple and <em>transparent.</em></>,
      desc: "Separate plans for those who provide care and those who receive it. Patient access is independent from the clinic's.",
    },
    monthly: "Monthly",
    annual: "Annual — save 20%",
    patientsBadge: "For patients",
    perMonth: "/month",
    billedAnnually: "Billed annually",
    patient: {
      name: "Patient",
      desc: "Full access to the Vivara app. Record, wearables, messages with your team and a summary after every appointment.",
      features: [
        "Health summary and unified record",
        "Daily plan, messages with the team and appointments",
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
        monthly: 89,
        desc: "For doctors working independently.",
        features: ["Up to 200 patients", "Full clinical portal", "Patient app included", "Wearable integrations", "Email support"],
      },
      {
        name: "Team",
        monthly: 69,
        desc: "For clinics with 3+ professionals.",
        features: ["Unlimited patients", "Everything in Individual", "Multidisciplinary team", "Granular permissions", "Priority support"],
        featured: true,
      },
      {
        name: "Institution",
        monthly: null,
        desc: "For hospitals and clinical groups.",
        features: ["Everything in Team", "SSO and HL7/FHIR integrations", "Dedicated onboarding", "Custom SLA", "Account manager"],
      },
    ],
    ctaTalk: "Talk to us",
    ctaStart: "Get started",
    footnote: "No setup costs. Cancel anytime. VAT not included. Doctor and patient plans are independent.",
    compareTitle: "Compare the plans.",
    compareRows: [
      ["Doctors", "1", "Up to 20", "Unlimited"],
      ["Active patients", "Up to 200", "Unlimited", "Unlimited"],
      ["Clinical portal", "✦", "✦", "✦"],
      ["Patient app", "✦", "✦", "✦"],
      ["Wearables", "✦", "✦", "✦"],
      ["Multidisciplinary team", "◦", "✦", "✦"],
      ["SSO (SAML/OIDC)", "◦", "◦", "✦"],
      ["HL7/FHIR", "◦", "◦", "✦"],
      ["Onboarding", "Self-serve", "Assisted", "Dedicated"],
      ["Support", "Email", "Priority", "Dedicated"],
    ],
  },
};

const PATIENT_MONTHLY = 14.99;

export default function Precos() {
  const { lang } = useLang();
  const t = useT();
  const L = t(T);
  const [billing, setBilling] = useState("mensal");

  const formatPrice = (monthly) => {
    const price = billing === "anual" ? monthly * 0.8 : monthly;
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
                  {billing === "anual" && <p className="text-xs text-brand-lime mt-1">{L.billedAnnually}</p>}
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
      <section className="bg-brand-beige pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionBadge>{L.doctorsBadge}</SectionBadge>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
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
                    {i === 2 ? L.ctaTalk : L.ctaStart}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-brand-muted/60">{L.footnote}</p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-4xl mb-6">{L.compareTitle}</h2>
            <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left font-medium text-brand-muted/60 px-6 py-4">&nbsp;</th>
                    {L.doctorPlans.map((p) => (
                      <th key={p.name} className="text-left font-serif text-lg px-6 py-4">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {L.compareRows.map(([label, ind, team, inst], i) => (
                    <tr key={label} className={i < L.compareRows.length - 1 ? "border-b border-black/5" : ""}>
                      <td className="px-6 py-3 text-brand-muted">{label}</td>
                      <td className="px-6 py-3">{ind}</td>
                      <td className="px-6 py-3">{team}</td>
                      <td className="px-6 py-3">{inst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
