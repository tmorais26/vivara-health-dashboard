import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionBadge, Reveal } from "./ui";

const ITEMS = [
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
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <SectionBadge>FAQ</SectionBadge>
          <h2 className="font-serif font-light tracking-tight text-4xl md:text-5xl mt-5">
            Perguntas que <em>realmente fazem.</em>
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-black/10">
          {ITEMS.map((it, i) => (
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
