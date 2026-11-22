import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PhotoHeader from "../components/PhotoHeader";
import doctorPhoto from "../assets/doctor-patient.jpg";
import { SectionBadge, Reveal, CTAButton, Check, Highlight } from "../components/ui";
import TimelineMock from "../components/TimelineMock";
import { PRICES, dayPrice } from "../config/access";
import { useT, useLang } from "../i18n";

const T = {
  pt: {
    header: {
      badge: "Para médicos e clínicas · Portal clínico",
      title: <>O contexto completo, <em>antes de cada decisão.</em></>,
      desc: "Para o médico que trabalha por conta própria e para a clínica com equipa. Análises, exames e notas de cada utente, organizados cronologicamente.",
    },
    tabs: { doctor: "Médico", clinic: "Clínica" },
    doctor: {
      stepsBadge: "O seu dia a dia",
      stepsTitle: <>Do primeiro resultado <em>à consulta.</em></>,
      steps: [
        ["01", "Crie a sua conta", "Abra o acesso em minutos com a cédula profissional, sem instalar nada."],
        ["02", "Junte os resultados", "O utente carrega-os na app ou reencaminha-lhe o email, e você acrescenta-os ao historial."],
        ["03", "Acompanhe entre consultas", "Tudo numa só linha do tempo, com alertas de valores fora do alvo."],
        ["04", "Chegue preparado", "Contexto completo num só ecrã. A decisão clínica é sempre sua."],
      ],
      cards: [
        { title: "Historial cronológico", desc: "Análises, exames e consultas numa só linha do tempo, venham de onde vierem." },
        { title: "Alertas no contexto certo", desc: <>Valores fora do alvo definido por si, <Highlight>sempre com a tendência</Highlight> e nunca só o último número.</> },
        { title: "Plano do utente e mensagens", desc: "O plano do dia (o que tomar, que exames fazer) e conversa direta com o utente, sem sair do portal." },
      ],
      planBadge: "Plano de médico",
      annualNote: "€{m} por mês, ou €{a} por ano com plano anual. Por médico.",
      planDesc: "Acesso total ao portal, a título individual. Cancela quando quiser. IVA incluído.",
      planNote: "Trabalha numa clínica com 2 ou mais profissionais? Veja a vista de clínica.",
      featuresTitle: "Tudo o que precisa no portal.",
      features: [
        { title: "Histórico com tendência", desc: "Cada marcador ao longo do tempo, com a origem de cada valor." },
        { title: "Planos e documentos num só sítio", desc: "O plano do dia do utente e os documentos, sem andar a procurar em pastas." },
        { title: "Diário clínico privado", desc: "Notas suas, nunca partilhadas com o utente." },
        { title: "Com ou sem app do utente", desc: "Sem app, basta o utente reencaminhar-lhe os resultados e você acrescenta-os ao historial." },
        { title: "Mensagens diretas", desc: "Conversa com o utente com histórico permanente da troca." },
        { title: "Exportação a qualquer momento", desc: "Os dados saem num formato aberto, sempre que necessário." },
      ],
    },
    clinic: {
      stepsBadge: "Para a equipa",
      stepsTitle: <>Vários profissionais, <em>um só historial.</em></>,
      steps: [
        ["01", "Abra o acesso da clínica", "Falamos consigo e acertamos condições e suporte para a equipa."],
        ["02", "Convide os profissionais", "Cada um com o seu acesso e o seu nível de permissões."],
        ["03", "Partilhe o utente", "Médicos, enfermeiros e nutricionistas veem o mesmo historial, cada um no seu perfil."],
        ["04", "Acompanhem em conjunto", "Notas internas só entre a equipa. A decisão clínica continua a ser dos médicos."],
      ],
      cards: [
        { title: "Um só historial por utente", desc: "Toda a equipa trabalha sobre o mesmo registo, sem versões soltas em pastas e emails." },
        { title: "Acesso por perfil", desc: <>Cada profissional vê <Highlight>o que o seu papel exige</Highlight>, e o utente continua a decidir quem acede aos seus dados.</> },
        { title: "Notas internas da equipa", desc: "Diário clínico visível só entre profissionais, nunca partilhado com o utente." },
      ],
      team: {
        title: "Equipa",
        rows: [
          ["Médico", "Historial completo e notas", "Total"],
          ["Enfermagem", "Resultados e plano do dia", "Parcial"],
          ["Nutrição", "Plano e resultados", "Parcial"],
        ],
      },
      planBadge: "Plano de clínica",
      price: "Sob consulta",
      planDesc: "Para clínicas com 2 ou mais profissionais. Tudo o que o plano de médico inclui, mais condições e suporte acordados com a equipa.",
      planNote: "O acesso do utente é independente do da clínica e tem plano próprio.",
      planCta: "Falar connosco",
      featuresTitle: "O que a clínica ganha.",
      features: [
        { title: "Tudo do plano de médico", desc: "Historial, alertas, planos, mensagens e exportação para cada profissional." },
        { title: "Vários profissionais, um só historial", desc: "Médicos, enfermeiros e nutricionistas sobre o mesmo registo do utente." },
        { title: "Permissões por perfil", desc: "Cada pessoa vê só o que o seu papel exige." },
        { title: "Notas internas da equipa", desc: "Só entre profissionais, nunca partilhadas com o utente." },
        { title: "Sem depender do sistema da clínica", desc: "A Vivara funciona ao lado do que já usam, sem integrações." },
        { title: "Condições e suporte acordados", desc: "Preço e acompanhamento ajustados ao tamanho da equipa." },
      ],
    },
    start: "Criar conta",
    startClinic: "Falar connosco",
    featuresBadge: "Incluído",
    perDay: "/dia",
    dataTitle: "Os dados são do utente.",
    dataDesc: "Cada utente decide quem vê o seu historial, e os dados podem ser exportados a qualquer momento, num formato aberto. A decisão clínica é sempre do médico.",
  },
  en: {
    header: {
      badge: "For doctors and clinics · Clinical portal",
      title: <>Full context, <em>before every decision.</em></>,
      desc: "For the doctor working on their own and for the clinic with a team. Each patient's lab results, exams and notes, organised chronologically.",
    },
    tabs: { doctor: "Doctor", clinic: "Clinic" },
    doctor: {
      stepsBadge: "Your day to day",
      stepsTitle: <>From the first result <em>to the appointment.</em></>,
      steps: [
        ["01", "Create your account", "Open your access in minutes with your professional licence number, nothing to install."],
        ["02", "Bring in the results", "The patient uploads them in the app or forwards you the email, and you add them to the record."],
        ["03", "Follow between appointments", "Everything on a single timeline, with alerts for out-of-range values."],
        ["04", "Arrive prepared", "Full context on one screen. The clinical decision is always yours."],
      ],
      cards: [
        { title: "Chronological record", desc: "Lab results, exams and appointments on a single timeline, wherever they come from." },
        { title: "Alerts in context", desc: <>Values outside the target you set, <Highlight>always with the trend</Highlight> and never just the latest number.</> },
        { title: "Patient plan and messages", desc: "The daily plan (what to take, which exams to do) and direct conversation with the patient, without leaving the portal." },
      ],
      planBadge: "Doctor plan",
      annualNote: "€{m} a month, or €{a} a year on the annual plan. Per doctor.",
      planDesc: "Full access to the portal, on your own. Cancel anytime. VAT included.",
      planNote: "Work in a clinic with 2 or more professionals? See the clinic view.",
      featuresTitle: "Everything you need in the portal.",
      features: [
        { title: "Record with trends", desc: "Every marker over time, with the source of each value." },
        { title: "Plans and documents in one place", desc: "The patient's daily plan and documents, without digging through folders." },
        { title: "Private clinical diary", desc: "Your own notes, never shared with the patient." },
        { title: "With or without the patient's app", desc: "Without the app, the patient simply forwards you the results and you add them to the record." },
        { title: "Direct messaging", desc: "Talk to the patient with a permanent record of the exchange." },
        { title: "Export at any time", desc: "Data leaves in an open format whenever needed." },
      ],
    },
    clinic: {
      stepsBadge: "For the team",
      stepsTitle: <>Several professionals, <em>one record.</em></>,
      steps: [
        ["01", "Open the clinic's access", "We talk to you and agree conditions and support for the team."],
        ["02", "Invite the professionals", "Each with their own access and permission level."],
        ["03", "Share the patient", "Doctors, nurses and nutritionists see the same record, each from their own profile."],
        ["04", "Follow up together", "Internal notes stay between the team. The clinical decision remains with the doctors."],
      ],
      cards: [
        { title: "One record per patient", desc: "The whole team works on the same record, with no loose versions in folders and emails." },
        { title: "Access by profile", desc: <>Each professional sees <Highlight>what their role requires</Highlight>, and the patient still decides who accesses their data.</> },
        { title: "Internal team notes", desc: "A clinical diary visible only between professionals, never shared with the patient." },
      ],
      team: {
        title: "Team",
        rows: [
          ["Doctor", "Full record and notes", "Full"],
          ["Nursing", "Results and daily plan", "Partial"],
          ["Nutrition", "Plan and results", "Partial"],
        ],
      },
      planBadge: "Clinic plan",
      price: "On request",
      planDesc: "For clinics with 2 or more professionals. Everything the doctor plan includes, plus conditions and support agreed with the team.",
      planNote: "Patient access is independent from the clinic's and has its own plan.",
      planCta: "Talk to us",
      featuresTitle: "What the clinic gets.",
      features: [
        { title: "Everything in the doctor plan", desc: "Record, alerts, plans, messaging and export for each professional." },
        { title: "Several professionals, one record", desc: "Doctors, nurses and nutritionists on the same patient record." },
        { title: "Permissions by profile", desc: "Each person sees only what their role requires." },
        { title: "Internal team notes", desc: "Only between professionals, never shared with the patient." },
        { title: "No dependence on the clinic's system", desc: "Vivara runs alongside what you already use, with no integrations." },
        { title: "Agreed conditions and support", desc: "Pricing and support matched to the size of the team." },
      ],
    },
    start: "Create an account",
    startClinic: "Talk to us",
    featuresBadge: "Included",
    perDay: "/day",
    dataTitle: "The data belongs to the patient.",
    dataDesc: "Each patient decides who sees their record, and the data can be exported at any time, in an open format. The clinical decision always belongs to the doctor.",
  },
};

function TeamMock({ data }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-7">
      <p className="text-xs uppercase tracking-[0.15em] text-brand-muted/50">{data.title}</p>
      <ul className="mt-3 divide-y divide-black/10">
        {data.rows.map(([role, meta, level]) => (
          <li key={role} className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-medium">{role}</p>
              <p className="mt-0.5 text-xs text-brand-muted/60">{meta}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#e9f0e1] px-3 py-1 text-xs font-medium text-brand-green-dark">{level}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Medicos() {
  const t = useT();
  const L = t(T);
  const { lang } = useLang();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("vista") === "clinica" ? "clinic" : "doctor");
  const D = L[tab];
  const isClinic = tab === "clinic";
  const m = PRICES.medico.monthly;
  const a = PRICES.medico.annual;
  const fmt = (x) => (lang === "pt" ? x : x.replace(",", "."));
  const day = fmt(dayPrice(m));
  const note = !isClinic ? D.annualNote.replace("{m}", fmt(m)).replace("{a}", a) : null;
  return (
    <>
      <PhotoHeader name="medicos" fallback={doctorPhoto} position="50% 28%" badge={L.header.badge} title={L.header.title} desc={L.header.desc} cta={{ label: L.start, to: "/comecar?perfil=medico" }} />

      <div className="bg-white pt-8">
        <div className="sticky top-24 z-20 flex justify-center px-6 pb-2">
          <div role="tablist" className="inline-flex rounded-full border border-black/10 bg-white/90 p-1 shadow-sm backdrop-blur">
            {["doctor", "clinic"].map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${tab === k ? "bg-brand-dark text-white" : "text-brand-muted/70 hover:text-brand-dark"}`}
              >
                {L.tabs[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <section className="-mt-14 bg-white pb-16 pt-28 md:pb-24">
            <div className="mx-auto max-w-6xl px-6">
              <SectionBadge>{D.stepsBadge}</SectionBadge>
              <h2 className="mt-5 max-w-3xl font-serif text-4xl font-light tracking-tight md:text-5xl">{D.stepsTitle}</h2>
              <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {D.steps.map(([n, title, desc], i) => (
                  <Reveal key={n} delay={i * 0.08}>
                    <p className="mb-3 font-serif text-5xl text-brand-olive/25 md:text-6xl">{n}</p>
                    <h3 className="mb-2 font-serif text-2xl">{title}</h3>
                    <p className="leading-relaxed text-brand-muted/80">{desc}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-brand-beige py-16 md:py-24">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
              <div className="space-y-5 md:order-2">
                {D.cards.map((c, i) => (
                  <Reveal key={c.title} delay={i * 0.1}>
                    <div className="rounded-2xl border border-black/10 bg-white p-6">
                      <h3 className="mb-2 font-serif text-xl">{c.title}</h3>
                      <p className="text-sm leading-relaxed text-brand-muted/80">{c.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="md:order-1">
                {isClinic ? <TeamMock data={D.team} /> : <TimelineMock />}
              </Reveal>
            </div>
          </section>

          <section className="bg-white py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-6">
              <Reveal>
                <SectionBadge>{D.planBadge}</SectionBadge>
                {isClinic ? (
                  <h2 className="mt-5 font-serif text-4xl font-light md:text-5xl">{D.price}</h2>
                ) : (
                  <>
                    <h2 className="mt-5 font-serif text-4xl font-light md:text-5xl">
                      €{day} <span className="text-2xl text-brand-muted/60">{L.perDay}</span>
                    </h2>
                    <p className="mt-1 text-sm text-brand-muted/60">{note}</p>
                  </>
                )}
                <p className="mt-4 leading-relaxed text-brand-muted/80">{D.planDesc}</p>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted/70">
                  {D.planNote}{" "}
                  {!isClinic && (
                    <button onClick={() => setTab("clinic")} className="underline underline-offset-2">
                      {L.tabs.clinic} →
                    </button>
                  )}
                </p>
                <Link to={isClinic ? "/contacto?perfil=medico" : "/precos"}>
                  <CTAButton className="mt-8">{isClinic ? D.planCta : lang === "pt" ? "Ver planos" : "See plans"}</CTAButton>
                </Link>
              </Reveal>
            </div>
          </section>

          <section className="bg-brand-dark py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-6 text-white">
              <Reveal>
                <span className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90">{L.featuresBadge}</span>
                <h2 className="mt-5 max-w-2xl font-serif text-4xl font-light md:text-5xl">{D.featuresTitle}</h2>
              </Reveal>
              <div className="mt-10 grid gap-x-12 gap-y-6 md:grid-cols-2">
                {D.features.map((it, i) => (
                  <Reveal key={it.title} delay={i * 0.05}>
                    <div className="flex items-start gap-3">
                      <Check className="mt-0.5 size-5 shrink-0 text-brand-lime" />
                      <div>
                        <p className="font-medium text-white/90">{it.title}</p>
                        <p className="mt-0.5 text-sm text-white/50">{it.desc}</p>
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
                <h2 className="font-serif text-3xl font-light md:text-5xl">{L.dataTitle}</h2>
                <p className="mt-6 text-lg leading-relaxed text-brand-muted/80">{L.dataDesc}</p>
              </Reveal>
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
