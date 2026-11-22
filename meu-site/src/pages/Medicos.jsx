import { Link } from "react-router-dom";
import PhotoHeader from "../components/PhotoHeader";
import doctorPhoto from "../assets/doctor-patient.jpg";
import { SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import TimelineMock from "../components/TimelineMock";
import { PRICES, dayPrice } from "../config/access";
import { useT, useLang } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Para médicos · Portal clínico",
      title: <>O contexto completo, <em>antes de cada decisão.</em></>,
      desc: "Um portal clínico para acompanhar utentes entre consultas. Análises, exames e notas organizados cronologicamente.",
    },
    cards: [
      { title: "Historial cronológico", desc: "Análises, exames e consultas numa só linha do tempo, venham de onde vierem." },
      { title: "Alertas no contexto certo", desc: <>Valores fora do alvo definido por si, <Highlight>sempre com a tendência</Highlight> e nunca só o último número.</> },
      { title: "Plano do utente e mensagens", desc: "O plano do dia (o que tomar, que exames fazer) e conversa direta com o utente, sem sair do portal." },
    ],
    start: "Criar conta",
    planBadge: "Plano de médico",
    perDay: "/dia",
    annualNote: "€{m} por mês, ou €{a} por ano com plano anual. Por médico.",
    planDesc: "Acesso total ao portal, a título individual. Cancela quando quiser. IVA incluído.",
    planNote: "Trabalha numa clínica com 2 ou mais profissionais? O preço é sob consulta, com acessos por perfil para toda a equipa.",
    planCta: "Ver planos",
    featuresBadge: "Incluído",
    featuresTitle: "Tudo o que precisa no portal.",
    features: [
      { title: "Histórico com tendência", desc: "Cada marcador ao longo do tempo, com a origem de cada valor." },
      { title: "Planos e documentos num só sítio", desc: "O plano do dia do utente e os documentos, sem andar a procurar em pastas." },
      { title: "Diário clínico privado", desc: "Notas internas da equipa, visíveis só entre profissionais e nunca partilhadas com o utente." },
      { title: "Com ou sem app do utente", desc: "Sem app, basta o utente reencaminhar-lhe os resultados e você acrescenta-os ao historial." },
      { title: "Mensagens diretas", desc: "Conversa com o utente com histórico permanente da troca." },
      { title: "Cédula profissional", desc: "Conta aberta em minutos, a título individual ou com a clínica, sem instalar nada." },
    ],
    dataTitle: "Os dados são do utente.",
    dataDesc: "Cada utente decide quem vê o seu historial, e os dados podem ser exportados a qualquer momento, num formato aberto. A decisão clínica é sempre sua.",
  },
  en: {
    header: {
      badge: "For doctors · Clinical portal",
      title: <>Full context, <em>before every decision.</em></>,
      desc: "A clinical portal for following patients between appointments. Lab results, exams and notes organised chronologically.",
    },
    cards: [
      { title: "Chronological record", desc: "Lab results, exams and appointments on a single timeline, wherever they come from." },
      { title: "Alerts in context", desc: <>Values outside the target you set, <Highlight>always with the trend</Highlight> and never just the latest number.</> },
      { title: "Patient plan and messages", desc: "The daily plan (what to take, which exams to do) and direct conversation with the patient, without leaving the portal." },
    ],
    start: "Create an account",
    planBadge: "Doctor plan",
    perDay: "/day",
    annualNote: "€{m} a month, or €{a} a year on the annual plan. Per doctor.",
    planDesc: "Full access to the portal, on your own. Cancel anytime. VAT included.",
    planNote: "Work in a clinic with 2 or more professionals? Pricing is on request, with role-based access for the whole team.",
    planCta: "See plans",
    featuresBadge: "Included",
    featuresTitle: "Everything you need in the portal.",
    features: [
      { title: "Record with trends", desc: "Every marker over time, with the source of each value." },
      { title: "Plans and documents in one place", desc: "The patient's daily plan and documents, without digging through folders." },
      { title: "Private clinical diary", desc: "Internal team notes, visible only between professionals and never shared with the patient." },
      { title: "With or without the patient's app", desc: "Without the app, the patient simply forwards you the results and you add them to the record." },
      { title: "Direct messaging", desc: "Talk to the patient with a permanent record of the exchange." },
      { title: "Professional licence", desc: "Account opened in minutes, on your own or with your clinic, nothing to install." },
    ],
    dataTitle: "The data belongs to the patient.",
    dataDesc: "Each patient decides who sees their record, and the data can be exported at any time, in an open format. The clinical decision is always yours.",
  },
};

export default function Medicos() {
  const t = useT();
  const L = t(T);
  const { lang } = useLang();
  const m = PRICES.medico.monthly;
  const a = PRICES.medico.annual;
  const day = lang === "pt" ? dayPrice(m) : dayPrice(m).replace(",", ".");
  const fmt = (s) => (lang === "pt" ? s : s.replace(",", "."));
  const note = L.annualNote.replace("{m}", fmt(m)).replace("{a}", a);
  return (
    <>
      <PhotoHeader name="medicos" fallback={doctorPhoto} position="50% 28%" badge={L.header.badge} title={L.header.title} desc={L.header.desc} cta={{ label: L.start, to: "/comecar?perfil=medico" }} />

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5 md:order-2">
            {L.cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-black/10 bg-white p-6">
                  <h3 className="font-serif text-xl mb-2">{c.title}</h3>
                  <p className="text-sm text-brand-muted/80 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15} className="md:order-1">
            <TimelineMock />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <SectionBadge>{L.planBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              €{day} <span className="text-2xl text-brand-muted/60">{L.perDay}</span>
            </h2>
            <p className="mt-1 text-sm text-brand-muted/60">{note}</p>
            <p className="mt-4 text-brand-muted/80 leading-relaxed">{L.planDesc}</p>
            <p className="mt-3 text-sm text-brand-muted/70 leading-relaxed">{L.planNote}</p>
            <Link to="/precos"><CTAButton className="mt-8">{L.planCta}</CTAButton></Link>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-brand-dark">
        <div className="mx-auto max-w-6xl px-6 text-white">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90">{L.featuresBadge}</span>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">{L.featuresTitle}</h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-6">
            {L.features.map((it, i) => (
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

      <section className="bg-brand-beige py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <h2 className="font-serif font-light text-3xl md:text-5xl">{L.dataTitle}</h2>
            <p className="mt-6 text-lg text-brand-muted/80 leading-relaxed">{L.dataDesc}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
