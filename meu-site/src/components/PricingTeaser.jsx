import { Link } from "react-router-dom";
import { SectionBadge, Reveal } from "./ui";
import { useLang, useT } from "../i18n";
import { PRICES, dayPrice as day } from "../config/access";

const T = {
  pt: {
    badge: "Preços",
    title: (
      <>
        Cada lado paga o seu. <em>Sem surpresas.</em>
      </>
    ),
    desc: "Preços com IVA incluído. Cancela quando quiser.",
    perMonth: "/mês",
    perDayUnit: "/dia",
    billed: (m, a) => `€${m} por mês, ou €${a} por ano`,
    cards: [
      { key: "utente", who: "Utente", text: "A app completa, com o seu historial sempre consigo." },
      { key: "medico", who: "Médico individual", text: "O portal clínico, com ou sem a app do utente." },
    ],
    clinic: "Clínicas com 2 ou mais profissionais",
    clinicNote: "Sob consulta",
    cta: "Ver todos os preços",
  },
  en: {
    badge: "Pricing",
    title: (
      <>
        Each side pays its own. <em>No surprises.</em>
      </>
    ),
    desc: "VAT included. Cancel anytime.",
    perMonth: "/month",
    perDayUnit: "/day",
    billed: (m, a) => `€${m} a month, or €${a} a year`,
    cards: [
      { key: "utente", who: "Patient", text: "The full app, with your record always with you." },
      { key: "medico", who: "Individual doctor", text: "The clinical portal, with or without the patient's app." },
    ],
    clinic: "Clinics with 2 or more professionals",
    clinicNote: "Custom pricing",
    cta: "See all pricing",
  },
};

export default function PricingTeaser() {
  const t = useT();
  const L = t(T);
  const { lang } = useLang();
  const euro = (v) => (lang === "pt" ? v : v.replace(",", "."));
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-6xl mt-5 max-w-3xl">{L.title}</h2>
          <p className="mt-5 text-lg text-brand-muted/80">{L.desc}</p>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {L.cards.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.1}>
              <div className="rounded-3xl border border-black/10 bg-brand-beige p-8 h-full">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{c.who}</p>
                <p className="mt-3">
                  <span className="font-serif text-5xl">€{euro(day(PRICES[c.key].monthly))}</span>
                  <span className="text-brand-muted/60">{L.perDayUnit}</span>
                </p>
                <p className="mt-1 text-sm text-brand-green-dark">{L.billed(euro(PRICES[c.key].monthly), euro(PRICES[c.key].annual))}</p>
                <p className="mt-5 text-brand-muted/85 leading-relaxed">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p className="mt-6 text-brand-muted/80">
            {L.clinic}: <span className="font-medium">{L.clinicNote}</span>.{" "}
            <Link to="/precos" className="underline underline-offset-4">{L.cta} →</Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
