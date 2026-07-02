import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, Check as CheckIcon } from "../components/ui";

function Check({ light }) {
  return <CheckIcon className={`size-4 mt-0.5 shrink-0 ${light ? "text-brand-lime" : "text-brand-green-dark"}`} />;
}

function formatPrice(monthly, billing) {
  const price = billing === "anual" ? monthly * 0.8 : monthly;
  return price.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PATIENT = {
  name: "Utente",
  monthly: 14.99,
  desc: "Acesso completo à app Vivara. Histórico, wearables, mensagens com a equipa e resumos de cada consulta.",
  features: [
    "Resumo da saúde e histórico unificado",
    "Plano diário, mensagens com a equipa e consultas",
    "Carregar análises e ligar wearables",
    "Lembretes e resumos de cada consulta",
    "Os seus dados, sempre seus — exportação completa",
  ],
  cta: "Começar como utente",
};

const DOCTOR_PLANS = [
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
];

const COMPARISON_ROWS = [
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
];

export default function Precos() {
  const [billing, setBilling] = useState("mensal");

  return (
    <>
      <PageHeader
        badge="Preços"
        title={<>Simples e <em>transparente.</em></>}
        desc="Planos separados para quem acompanha e quem é acompanhado. O acesso do utente é independente do da clínica."
      />

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
                {opt === "mensal" ? "Mensal" : "Anual — poupa 20%"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Utente */}
      <section className="bg-brand-beige pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionBadge>Para utentes</SectionBadge>
          <div className="mt-6 grid md:grid-cols-2 gap-6 items-stretch">
            <Reveal>
              <div className="rounded-3xl bg-brand-dark text-white p-8 h-full flex flex-col">
                <h3 className="font-serif text-2xl mb-2">{PATIENT.name}</h3>
                <p className="text-sm text-white/70 mb-6">{PATIENT.desc}</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl">€{formatPrice(PATIENT.monthly, billing)}</span>
                  <span className="text-white/60 text-sm">/mês</span>
                  {billing === "anual" && <p className="text-xs text-brand-lime mt-1">Faturado anualmente</p>}
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {PATIENT.features.map((f) => (
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
                  {PATIENT.cta}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-black/10 bg-white p-8 h-full flex flex-col justify-center">
                <p className="text-lg text-brand-muted/85 leading-relaxed mb-4">
                  O plano do utente dá-lhe acesso total à sua área na app Vivara, independentemente
                  da clínica onde é acompanhado.
                </p>
                <p className="text-lg text-brand-muted/85 leading-relaxed mb-6">
                  Os médicos e clínicas pagam os seus próprios planos à parte — o seu acesso não
                  depende disso.
                </p>
                <ul className="space-y-3 text-sm text-brand-muted border-t border-black/10 pt-6">
                  <li className="flex items-start gap-2"><Check /> Funciona com qualquer médico na Vivara</li>
                  <li className="flex items-start gap-2"><Check /> O seu médico ainda não usa a Vivara? Começa na mesma — convide-o depois</li>
                  <li className="flex items-start gap-2"><Check /> Cancela quando quiser</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Médicos */}
      <section className="bg-brand-beige pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionBadge>Para médicos e clínicas</SectionBadge>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {DOCTOR_PLANS.map((p, i) => (
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
                        <span className="font-serif text-4xl">€{formatPrice(p.monthly, billing)}</span>
                        <span className={`text-sm ${p.featured ? "text-white/60" : "text-brand-muted/60"}`}>/médico/mês</span>
                      </>
                    ) : (
                      <span className="font-serif text-4xl">Sob consulta</span>
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
                    {i === 2 ? "Falar connosco" : "Começar"}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-brand-muted/60">
            Sem custos de setup. Cancela quando quiser. IVA não incluído. Os planos de médicos e
            utentes são independentes.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-4xl mb-6">Compara os planos.</h2>
            <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="text-left font-medium text-brand-muted/60 px-6 py-4">&nbsp;</th>
                    <th className="text-left font-serif text-lg px-6 py-4">Individual</th>
                    <th className="text-left font-serif text-lg px-6 py-4">Equipa</th>
                    <th className="text-left font-serif text-lg px-6 py-4">Instituição</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map(([label, ind, team, inst], i) => (
                    <tr key={label} className={i < COMPARISON_ROWS.length - 1 ? "border-b border-black/5" : ""}>
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
