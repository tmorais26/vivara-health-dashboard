import { Link } from "react-router-dom";
import { PageHeader, SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import AppMock from "../components/AppMock";
import { useT } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Para utentes · App do utente",
      title: <>A sua saúde, <em>na palma da mão.</em></>,
      desc: "Um lugar seguro para exames, resultados, sintomas e registos médicos. Sem ruído — só o que importa, perto da sua equipa clínica.",
    },
    cards: [
      { title: "Resumo e histórico unificado", desc: "Todos os seus exames, resultados e consultas num só lugar, organizados por data." },
      {
        title: "Wearables",
        desc: <>Ligue Apple Health, Oura ou Whoop. Sono e atividade <Highlight>ao lado do seu historial clínico</Highlight>, sem trocar de aplicação.</>,
      },
      { title: "Plano do dia e mensagens", desc: "O que tomar e como tomar, que exames fazer e como os fazer. Mais mensagens com a equipa clínica e lembretes de consultas." },
    ],
    planBadge: "Plano de utente",
    price: "€6,99",
    perMonth: "/mês",
    annualNote: "ou €79 por ano, com plano anual",
    planDesc: "Acesso total à app. Funciona com qualquer médico na Vivara. Cancela quando quiser. IVA incluído.",
    planNote: "O seu médico ainda não usa a Vivara? Pode começar sozinho — o seu historial fica pronto para partilhar assim que ele se juntar.",
    noAppNote: "Prefere não usar a app? Se o seu médico usa a Vivara, basta reencaminhar-lhe por email as análises que recebe.",
    planCta: "Ver planos",
    dataTitle: "Os seus dados, sempre seus.",
    dataDesc: "Pode exportar tudo a qualquer momento. Os seus dados só são vistos por si e pela equipa clínica que escolheu — nunca por mais ninguém.",
    featuresBadge: "Incluído",
    featuresTitle: "Tudo o que precisa na app.",
    features: [
      {
        title: "Resumo e histórico unificado",
        desc: "Exames, análises e consultas numa linha do tempo pesquisável.",
      },
      {
        title: "Wearables ligados",
        desc: "Apple Health, Oura e Whoop, com sono e atividade ao lado dos dados clínicos.",
      },
      {
        title: "Plano do dia e lembretes",
        desc: "O que tomar e como tomar, que exames fazer e como os fazer — e os lembretes de consulta sempre à mão.",
      },
      {
        title: "Mensagens com a equipa",
        desc: "Conversa direta e privada com quem o acompanha, com histórico permanente.",
      },
      {
        title: "Resumos de cada consulta",
        desc: "O que foi decidido e o que fazer a seguir, por escrito, depois de sair.",
      },
      {
        title: "Exportação completa",
        desc: "Os seus dados saem consigo a qualquer momento, num formato aberto.",
      },
    ],
  },
  en: {
    header: {
      badge: "For patients · Patient app",
      title: <>Your health, <em>in the palm of your hand.</em></>,
      desc: "A safe place for exams, results, symptoms and medical records. No noise — only what matters, close to your care team.",
    },
    cards: [
      { title: "Summary and unified record", desc: "All your exams, results and appointments in one place, organised by date." },
      {
        title: "Wearables",
        desc: <>Connect Apple Health, Oura or Whoop. Sleep and activity <Highlight>next to your clinical record</Highlight>, without switching apps.</>,
      },
      { title: "Daily plan and messages", desc: "What to take and how to take it, which exams to do and how to do them. Plus messages with your care team and appointment reminders." },
    ],
    planBadge: "Patient plan",
    price: "€6.99",
    perMonth: "/month",
    annualNote: "or €79 a year on the annual plan",
    planDesc: "Full access to the app. Works with any doctor on Vivara. Cancel anytime. VAT included.",
    planNote: "Your doctor doesn't use Vivara yet? You can start on your own — your record will be ready to share as soon as they join.",
    noAppNote: "Rather not use the app? If your doctor uses Vivara, just forward them the lab results you receive by email.",
    planCta: "See plans",
    dataTitle: "Your data, always yours.",
    dataDesc: "You can export everything at any time. Your data is seen only by you and the care team you chose — never by anyone else.",
    featuresBadge: "Included",
    featuresTitle: "Everything you need in the app.",
    features: [
      {
        title: "Unified summary and record",
        desc: "Exams, lab results and appointments on a searchable timeline.",
      },
      {
        title: "Connected wearables",
        desc: "Apple Health, Oura and Whoop, with sleep and activity next to the clinical data.",
      },
      {
        title: "Daily plan and reminders",
        desc: "What to take and how to take it, which exams to do and how to do them — and appointment reminders, always at hand.",
      },
      {
        title: "Messages with your team",
        desc: "A direct, private conversation with your care team, with a permanent record.",
      },
      {
        title: "Summaries after every appointment",
        desc: "What was decided and what to do next, in writing, after you leave.",
      },
      {
        title: "Full export",
        desc: "Your data leaves with you at any time, in an open format.",
      },
    ],
  },
};

export default function Utentes() {
  const t = useT();
  const L = t(T);
  return (
    <>
      <PageHeader badge={L.header.badge} title={L.header.title} desc={L.header.desc} />

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
            <AppMock />
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <SectionBadge>{L.planBadge}</SectionBadge>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5">
              {L.price} <span className="text-2xl text-brand-muted/60">{L.perMonth}</span>
            </h2>
            <p className="mt-1 text-sm text-brand-muted/60">{L.annualNote}</p>
            <p className="mt-4 text-brand-muted/80 leading-relaxed">{L.planDesc}</p>
            <p className="mt-3 text-sm text-brand-muted/70 leading-relaxed">{L.planNote}</p>
            <p className="mt-2 text-sm text-brand-muted/70 leading-relaxed">{L.noAppNote}</p>
            <Link to="/precos"><CTAButton className="mt-8">{L.planCta}</CTAButton></Link>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-brand-dark">
        <div className="mx-auto max-w-6xl px-6 text-white">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90">
              {L.featuresBadge}
            </span>
            <h2 className="font-serif font-light text-4xl md:text-5xl mt-5 max-w-2xl">
              {L.featuresTitle}
            </h2>
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
