import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";
import { useT } from "../i18n";

const T = {
  pt: {
    badge: "FAQ",
    title: (
      <>
        Perguntas que <em>realmente fazem.</em>
      </>
    ),
    items: [
      {
        q: "Para quem é a Vivara?",
        a: "Para médicos e clínicas que querem acompanhar utentes entre consultas, e para utentes que querem ter os seus exames, resultados e registos médicos num só lugar. Uma plataforma, dois acessos.",
      },
      {
        q: "Quem vê os meus dados?",
        a: "Apenas você e a equipa clínica que escolheu. Os dados são privados por defeito, encriptados e alojados na União Europeia. Nunca vendemos dados.",
      },
      {
        q: "A Vivara é uma ferramenta de diagnóstico?",
        a: "Não. A plataforma organiza, visualiza e avisa. As decisões clínicas são sempre do médico.",
      },
      {
        q: "Que wearables são suportados?",
        a: "Apple Health, Oura e Whoop. Os dados dos wearables são sempre distinguidos das análises medidas em laboratório.",
      },
      {
        q: "Os utentes pagam?",
        a: "Os médicos e clínicas têm os seus planos; o utente tem um plano próprio com acesso completo à app. Os acessos são independentes.",
      },
      {
        q: "E se o meu médico ainda não usar a Vivara?",
        a: "Pode começar sozinho como utente. O seu historial fica organizado e pronto para partilhar com a sua equipa clínica assim que ela se juntar à Vivara.",
      },
      {
        q: "Posso cancelar a qualquer momento?",
        a: "Sim, sem período de fidelização. Depois de cancelar, os seus dados ficam disponíveis para exportação durante 90 dias.",
      },
      {
        q: "O que acontece aos meus dados se sair da Vivara?",
        a: "Pode exportar tudo — histórico, análises e documentos — num formato aberto a qualquer momento, mesmo depois de cancelar.",
      },
      {
        q: "Como funciona o suporte?",
        a: "Por email para todos os planos, com suporte prioritário nos planos Equipa e Instituição. Respondemos em 1-2 dias úteis.",
      },
    ],
  },
  en: {
    badge: "FAQ",
    title: (
      <>
        Questions people <em>actually ask.</em>
      </>
    ),
    items: [
      {
        q: "Who is Vivara for?",
        a: "For doctors and clinics who want to follow patients between appointments, and for patients who want their exams, results and medical records in one place. One platform, two kinds of access.",
      },
      {
        q: "Who can see my data?",
        a: "Only you and the care team you choose. Data is private by default, encrypted and hosted in the European Union. We never sell data.",
      },
      {
        q: "Is Vivara a diagnostic tool?",
        a: "No. The platform organises, visualises and alerts. Clinical decisions always belong to the doctor.",
      },
      {
        q: "Which wearables are supported?",
        a: "Apple Health, Oura and Whoop. Wearable data is always kept distinct from lab-measured results.",
      },
      {
        q: "Do patients pay?",
        a: "Doctors and clinics have their own plans; patients have their own plan with full access to the app. The two are independent.",
      },
      {
        q: "What if my doctor doesn't use Vivara yet?",
        a: "You can start on your own as a patient. Your record stays organised and ready to share with your care team as soon as they join Vivara.",
      },
      {
        q: "Can I cancel at any time?",
        a: "Yes, with no lock-in period. After cancelling, your data remains available for export for 90 days.",
      },
      {
        q: "What happens to my data if I leave Vivara?",
        a: "You can export everything — history, lab results and documents — in an open format at any time, even after cancelling.",
      },
      {
        q: "How does support work?",
        a: "By email on all plans, with priority support on the Team and Institution plans. We reply within 1-2 business days.",
      },
    ],
  },
};

export default function FAQ() {
  const t = useT();
  const L = t(T);
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <SectionBadge>{L.badge}</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5">
            {L.title}
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-black/10">
          {L.items.map((it, i) => (
            <div key={it.q}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-xl md:text-2xl">{it.q}</span>
                <span className={`text-2xl transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-brand-muted/80 leading-relaxed">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
