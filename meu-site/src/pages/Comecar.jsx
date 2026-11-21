import { Link, useSearchParams } from "react-router-dom";
import { PageHeader, Reveal, Check } from "../components/ui";
import { useLang, useT } from "../i18n";
import { ACCESS_URLS, PRICES, dayPrice } from "../config/access";

const T = {
  pt: {
    header: {
      badge: "Começar",
      title: <>Comece <em>no seu lado.</em></>,
      desc: "A Vivara tem duas vistas do mesmo historial. Escolha a sua.",
    },
    perDayUnit: "/dia",
    annualNote: (m, a) => `€${m} por mês, ou €${a} por ano`,
    waitlist: "Ainda não abrimos. Deixe o seu contacto e avisamos assim que puder entrar.",
    cards: [
      {
        key: "utente",
        who: "Utente",
        title: "Abra a app",
        points: ["Carregue as suas análises (PDF ou fotografia)", "Veja o seu historial numa só linha do tempo", "Convide o seu médico quando quiser"],
        cta: "Abrir a app",
        more: "Ver a vista do utente",
        to: "/utentes",
      },
      {
        key: "medico",
        who: "Médico ou clínica",
        title: "Crie a sua conta",
        points: ["Conta de profissional em minutos", "Funciona com ou sem a app do utente", "Clínicas com 2 ou mais profissionais: falar connosco"],
        cta: "Criar conta no portal",
        more: "Ver a vista do médico",
        to: "/medicos",
      },
    ],
  },
  en: {
    header: {
      badge: "Get started",
      title: <>Start <em>on your side.</em></>,
      desc: "Vivara has two views of the same record. Choose yours.",
    },
    perDayUnit: "/day",
    annualNote: (m, a) => `€${m} a month, or €${a} a year`,
    waitlist: "We haven't opened yet. Leave your details and we'll let you know as soon as you can get in.",
    cards: [
      {
        key: "utente",
        who: "Patient",
        title: "Open the app",
        points: ["Upload your lab results (PDF or photo)", "See your record on a single timeline", "Invite your doctor whenever you like"],
        cta: "Open the app",
        more: "See the patient view",
        to: "/utentes",
      },
      {
        key: "medico",
        who: "Doctor or clinic",
        title: "Create your account",
        points: ["Professional account in minutes", "Works with or without the patient's app", "Clinics with 2 or more professionals: talk to us"],
        cta: "Create a portal account",
        more: "See the doctor view",
        to: "/medicos",
      },
    ],
  },
};

export default function Comecar() {
  const t = useT();
  const L = t(T);
  const { lang } = useLang();
  const [params] = useSearchParams();
  const highlight = params.get("perfil");
  const euro = (v) => (lang === "pt" ? v : v.replace(",", "."));

  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-4xl px-6 grid md:grid-cols-2 gap-6">
          {L.cards.map((c, i) => {
            const url = ACCESS_URLS[c.key];
            const price = PRICES[c.key];
            const featured = highlight === c.key;
            return (
              <Reveal key={c.key} delay={i * 0.1}>
                <div
                  className={`rounded-3xl p-8 h-full flex flex-col border ${
                    featured ? "bg-brand-dark text-white border-brand-dark" : "bg-white border-black/10"
                  }`}
                >
                  <p className={`text-xs uppercase tracking-[0.18em] ${featured ? "text-white/60" : "text-brand-muted/50"}`}>{c.who}</p>
                  <h2 className="font-serif text-3xl mt-1 mb-4">{c.title}</h2>
                  <p className="mb-6">
                    <span className="font-serif text-3xl">€{euro(dayPrice(price.monthly))}</span>
                    <span className={`text-sm ${featured ? "text-white/60" : "text-brand-muted/60"}`}>{L.perDayUnit}</span>
                    <span className={`block text-xs mt-1 ${featured ? "text-white/60" : "text-brand-muted/60"}`}>{L.annualNote(euro(price.monthly), euro(price.annual))}</span>
                  </p>
                  <ul className="space-y-3 mb-8 text-sm">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <Check light={featured} />
                        <span className={featured ? "text-white/90" : "text-brand-muted/85"}>{p}</span>
                      </li>
                    ))}
                  </ul>
                  {url ? (
                    <a
                      href={url}
                      className={`mt-auto inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium ${
                        featured ? "bg-brand-lime text-brand-text" : "bg-brand-olive text-white hover:bg-brand-olive-hover"
                      }`}
                    >
                      {c.cta}
                    </a>
                  ) : (
                    <Link
                      to={`/contacto?perfil=${c.key}`}
                      className={`mt-auto inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium ${
                        featured ? "bg-brand-lime text-brand-text" : "bg-brand-olive text-white hover:bg-brand-olive-hover"
                      }`}
                    >
                      {c.cta}
                    </Link>
                  )}
                  <Link to={c.to} className={`mt-4 text-center text-sm underline underline-offset-4 ${featured ? "text-white/80" : "text-brand-muted"}`}>
                    {c.more}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
        {!ACCESS_URLS.utente && !ACCESS_URLS.medico && (
          <p className="mx-auto mt-8 max-w-xl px-6 text-center text-sm text-brand-muted/70">{L.waitlist}</p>
        )}
      </section>
    </>
  );
}
