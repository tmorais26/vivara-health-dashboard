import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PhotoHeader from "../components/PhotoHeader";
import PhoneApp from "../components/PhoneApp";
import photo from "../assets/pages/como-funciona.webp";
import { SectionBadge, Reveal } from "../components/ui";
import { useT } from "../i18n";

// Três passos, uma só vista de cada vez: o interruptor muda texto e ecrã de todos os passos.
const T = {
  pt: {
    header: {
      badge: "Como funciona",
      title: <>Três passos, <em>duas vistas.</em></>,
      desc: "Os resultados chegam de vários laboratórios e ficam num só sítio. Cada um vê o que precisa.",
      cta: "Começar",
    },
    views: { patient: "Vista do utente", doctor: "Vista do médico" },
    steps: [
      {
        title: "Tudo num só sítio",
        text: {
          patient: "Crie a sua conta e carregue o PDF ou uma fotografia das análises, venha do laboratório que vier.",
          doctor: "Crie a sua conta, individual ou da clínica, e acrescente os resultados que o utente lhe reencaminha.",
        },
        panel: {
          patient: {
            title: "Cofre de resultados",
            rows: [
              ["Análises", "PDF · 22 mai", "Guardado"],
              ["Ecografia", "Fotografia · 03 mai", "Guardado"],
              ["Hemograma", "PDF · 11 mar", "Guardado"],
            ],
          },
          doctor: {
            title: "Historial do utente",
            rows: [
              ["Conta de profissional", "Criada em minutos", "Pronto"],
              ["Resultados por email", "Reencaminhados pelo utente", "Adicionar"],
              ["Hemograma completo", "Já no historial", "Feito"],
            ],
          },
        },
      },
      {
        title: "A evolução à vista",
        text: {
          patient: "Veja o que mudou, o que se mantém e o que precisa de atenção, com sono e atividade ao lado.",
          doctor: "A mesma linha do tempo entre consultas, com alerta quando um valor sai do alvo.",
        },
        panel: {
          patient: {
            phone: true,
            title: "Evolução",
            chart: true,
            rows: [
              ["Vitamina D", "24 → 41 ng/mL", "A melhorar"],
              ["Sono (wearable)", "7 h 20 de média", "Estável"],
            ],
          },
          doctor: {
            title: "Entre consultas",
            rows: [
              ["Vitamina D", "24 ng/mL · alvo 50–80", "Fora do alvo", true],
              ["Colesterol LDL", "98 mg/dL · alvo < 100", "No alvo"],
              ["Hemoglobina", "13,8 g/dL", "No alvo"],
            ],
          },
        },
      },
      {
        title: "A consulta começa com contexto",
        text: {
          patient: "Leve o historial completo e saia com um resumo escrito do que foi decidido.",
          doctor: "Chegue com tudo num só ecrã. A decisão clínica é sempre sua.",
        },
        panel: {
          patient: {
            title: "Resumo da consulta",
            rows: [
              ["Decidido", "Repetir análises em 3 meses"],
              ["Plano do dia", "O que tomar e que exames fazer"],
              ["Lembrete", "Próxima consulta em junho"],
            ],
          },
          doctor: {
            title: "Antes da consulta",
            rows: [
              ["Historial completo", "12 análises · 3 exames"],
              ["Alertas", "1 valor fora do alvo", "", true],
              ["Notas internas", "Visíveis só à equipa"],
            ],
          },
        },
      },
    ],
    startBadge: "Por onde começar",
    startTitle: <>Cada um começa <em>no seu lado.</em></>,
    starts: [
      { who: "Utente", title: "Carregue o primeiro resultado", cta: "Ver a vista do utente", to: "/utentes" },
      { who: "Médico", title: "Crie a conta e comece a acompanhar", cta: "Ver a vista do médico", to: "/medicos" },
    ],
    startNote: "Os dois acessos são independentes e funcionam em conjunto.",
    principles: [
      ["Privacidade total", "Dados só visíveis a quem os detém e a quem escolher."],
      ["Cada dado, com a sua origem", "Análise, registo ou wearable: nunca se misturam."],
      ["A decisão é do médico", "A Vivara organiza e avisa. Não diagnostica nem sugere tratamentos."],
    ],
  },
  en: {
    header: {
      badge: "How it works",
      title: <>Three steps, <em>two views.</em></>,
      desc: "Results arrive from many labs and end up in one place. Everyone sees what they need.",
      cta: "Get started",
    },
    views: { patient: "Patient view", doctor: "Doctor view" },
    steps: [
      {
        title: "Everything in one place",
        text: {
          patient: "Create your account and upload the PDF or a photo of your results, whichever lab they came from.",
          doctor: "Create your account, individual or for your clinic, and add the results the patient forwards to you.",
        },
        panel: {
          patient: {
            title: "Results vault",
            rows: [
              ["Lab results", "PDF · 22 May", "Saved"],
              ["Ultrasound", "Photo · 03 May", "Saved"],
              ["Blood count", "PDF · 11 Mar", "Saved"],
            ],
          },
          doctor: {
            title: "Patient record",
            rows: [
              ["Professional account", "Created in minutes", "Ready"],
              ["Results by email", "Forwarded by the patient", "Add"],
              ["Full blood count", "Already in the record", "Done"],
            ],
          },
        },
      },
      {
        title: "The trend at a glance",
        text: {
          patient: "See what changed, what holds steady and what needs attention, with sleep and activity alongside.",
          doctor: "The same timeline between appointments, with an alert when a value leaves its target.",
        },
        panel: {
          patient: {
            phone: true,
            title: "Trend",
            chart: true,
            rows: [
              ["Vitamin D", "24 → 41 ng/mL", "Improving"],
              ["Sleep (wearable)", "7 h 20 average", "Steady"],
            ],
          },
          doctor: {
            title: "Between appointments",
            rows: [
              ["Vitamin D", "24 ng/mL · target 50–80", "Out of target", true],
              ["LDL cholesterol", "98 mg/dL · target < 100", "On target"],
              ["Haemoglobin", "13.8 g/dL", "On target"],
            ],
          },
        },
      },
      {
        title: "The appointment starts with context",
        text: {
          patient: "Take the full record along and leave with a written summary of what was decided.",
          doctor: "Arrive with everything on one screen. The clinical decision is always yours.",
        },
        panel: {
          patient: {
            title: "Appointment summary",
            rows: [
              ["Decided", "Repeat tests in 3 months"],
              ["Daily plan", "What to take and which exams to do"],
              ["Reminder", "Next appointment in June"],
            ],
          },
          doctor: {
            title: "Before the appointment",
            rows: [
              ["Full record", "12 lab results · 3 exams"],
              ["Alerts", "1 value out of target", "", true],
              ["Internal notes", "Visible to the team only"],
            ],
          },
        },
      },
    ],
    startBadge: "Where to start",
    startTitle: <>Everyone starts <em>on their own side.</em></>,
    starts: [
      { who: "Patient", title: "Upload your first result", cta: "See the patient view", to: "/utentes" },
      { who: "Doctor", title: "Create your account and start following", cta: "See the doctor view", to: "/medicos" },
    ],
    startNote: "The two accesses are independent and work together.",
    principles: [
      ["Total privacy", "Data visible only to its owner and whoever they choose."],
      ["Every data point, with its source", "Lab result, entry or wearable: never mixed."],
      ["The decision is the doctor's", "Vivara organises and alerts. It does not diagnose or suggest treatments."],
    ],
  },
};

function Panel({ data }) {
  if (data.phone) return <PhoneApp />;
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-7">
      <p className="text-xs uppercase tracking-[0.15em] text-brand-muted/50">{data.title}</p>
      {data.chart && (
        <svg viewBox="0 0 320 70" className="mb-1 mt-4 h-16 w-full" aria-hidden="true">
          <polyline points="0,56 50,50 100,44 150,40 200,28 250,20 320,10" fill="none" stroke="var(--color-brand-green-dark)" strokeWidth="2.5" />
        </svg>
      )}
      <ul className="mt-3 divide-y divide-black/10">
        {data.rows.map(([label, meta, pill, alert]) => (
          <li key={label} className="flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-0.5 truncate text-xs text-brand-muted/60">{meta}</p>
            </div>
            {pill !== undefined && pill !== "" && (
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${alert ? "bg-red-50 text-red-700" : "bg-[#e9f0e1] text-brand-green-dark"}`}>
                {pill}
              </span>
            )}
            {pill === "" && alert && (
              <span className="shrink-0 size-2.5 rounded-full bg-red-400" aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ComoFunciona() {
  const t = useT();
  const L = t(T);
  const [view, setView] = useState("patient");
  return (
    <>
      <PhotoHeader
        name="como-funciona"
        fallback={photo}
        position="72% 28%"
        badge={L.header.badge}
        title={L.header.title}
        desc={L.header.desc}
        cta={{ label: L.header.cta, to: "/comecar" }}
      />

      <div className="bg-white pt-8">
      <div className="sticky top-24 z-20 flex justify-center px-6 pb-2">
        <div role="tablist" className="inline-flex rounded-full border border-black/10 bg-white/90 p-1 shadow-sm backdrop-blur">
          {["patient", "doctor"].map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={view === k}
              onClick={() => setView(k)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${view === k ? "bg-brand-dark text-white" : "text-brand-muted/70 hover:text-brand-dark"}`}
            >
              {L.views[k]}
            </button>
          ))}
        </div>
      </div>
      </div>

      {L.steps.map((s, i) => (
        <section key={s.title} className={`-mt-14 pt-28 pb-16 md:pb-24 ${i % 2 === 0 ? "bg-white" : "bg-brand-beige"}`}>
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:gap-16">
            <Reveal className={i % 2 === 1 ? "md:order-2" : ""}>
              <p className="font-serif text-6xl text-brand-olive/20 md:text-7xl">0{i + 1}</p>
              <h2 className="mt-2 font-serif text-4xl font-light md:text-5xl">{s.title}</h2>
              <div className="relative mt-5 min-h-[5.5rem]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={view}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-md text-lg leading-relaxed text-brand-muted/80"
                  >
                    {s.text[view]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Panel data={s.panel[view]} />
                </motion.div>
              </AnimatePresence>
            </Reveal>
          </div>
        </section>
      ))}

      <section className="bg-brand-dark py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {L.principles.map(([tt, d], i) => (
              <Reveal key={tt} delay={i * 0.08}>
                <h3 className="font-serif text-2xl">{tt}</h3>
                <p className="mt-2 leading-relaxed text-white/60">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-beige py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionBadge>{L.startBadge}</SectionBadge>
            <h2 className="mt-5 max-w-2xl font-serif text-4xl font-light md:text-5xl">{L.startTitle}</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {L.starts.map((c, i) => (
              <Reveal key={c.who} delay={i * 0.1}>
                <Link to={c.to} className="group flex h-full flex-col rounded-3xl border border-black/10 bg-white p-8 transition-shadow hover:shadow-md">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-muted/50">{c.who}</p>
                  <h3 className="mb-6 mt-1 font-serif text-2xl">{c.title}</h3>
                  <span className="mt-auto text-sm font-medium underline underline-offset-4">{c.cta} →</span>
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-brand-muted/60">{L.startNote}</p>
        </div>
      </section>
    </>
  );
}
