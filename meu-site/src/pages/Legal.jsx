import { PageHeader, Reveal } from "../components/ui";
import { useT } from "../i18n";

const T = {
  pt: {
    privacidade: {
      badge: "Legal",
      title: <>Política de <em>Privacidade.</em></>,
      updated: "Última atualização: junho de 2026",
      sections: [
        ["Responsável pelo tratamento", "Vivara Health, Lda., com sede em Lisboa, Portugal. Contacto: privacidade@vivara.health."],
        ["Dados que recolhemos", "Dados de conta, dados clínicos (marcadores, exames, wearables) e dados técnicos mínimos para segurança."],
        ["Como usamos os dados", "Apenas para prestar o serviço. Nunca para publicidade nem para treinar modelos de IA. Nunca partilhamos com terceiros sem consentimento."],
        ["Onde estão guardados", "Em servidores na União Europeia, encriptados em repouso e em trânsito, em conformidade com o RGPD."],
        ["Os seus direitos", "Acesso, retificação, apagamento, portabilidade e oposição. Para exercer: privacidade@vivara.health."],
      ],
    },
    termos: {
      badge: "Legal",
      title: <>Termos de <em>Serviço.</em></>,
      updated: "Última atualização: junho de 2026",
      sections: [
        ["O serviço", "A Vivara é uma plataforma de acompanhamento de saúde longitudinal. Não substitui aconselhamento médico nem é um dispositivo de diagnóstico."],
        ["Conta", "A conta é pessoal e intransmissível. É responsável por manter as suas credenciais seguras."],
        ["Pagamentos", "Os planos são faturados conforme escolhido. Pode cancelar a qualquer momento; os dados ficam exportáveis durante 90 dias."],
        ["Responsabilidade", "As decisões clínicas são sempre do profissional de saúde. Estes termos regem-se pela lei portuguesa."],
      ],
    },
  },
  en: {
    privacidade: {
      badge: "Legal",
      title: <>Privacy <em>Policy.</em></>,
      updated: "Last updated: June 2026",
      sections: [
        ["Data controller", "Vivara Health, Lda., headquartered in Lisbon, Portugal. Contact: privacidade@vivara.health."],
        ["Data we collect", "Account data, clinical data (markers, exams, wearables) and the minimum technical data needed for security."],
        ["How we use the data", "Only to provide the service. Never for advertising and never to train AI models. We never share with third parties without consent."],
        ["Where it is stored", "On servers in the European Union, encrypted at rest and in transit, in compliance with the GDPR."],
        ["Your rights", "Access, rectification, erasure, portability and objection. To exercise them: privacidade@vivara.health."],
      ],
    },
    termos: {
      badge: "Legal",
      title: <>Terms of <em>Service.</em></>,
      updated: "Last updated: June 2026",
      sections: [
        ["The service", "Vivara is a longitudinal health tracking platform. It does not replace medical advice and is not a diagnostic device."],
        ["Account", "The account is personal and non-transferable. You are responsible for keeping your credentials secure."],
        ["Payments", "Plans are billed as chosen. You can cancel at any time; data remains exportable for 90 days."],
        ["Liability", "Clinical decisions always belong to the healthcare professional. These terms are governed by Portuguese law."],
      ],
    },
  },
};

export default function Legal({ kind }) {
  const t = useT();
  const c = t(T)[kind];
  return (
    <>
      <PageHeader badge={c.badge} title={c.title} />
      <div className="bg-brand-beige -mt-6 pb-4">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-sm text-brand-muted/60">{c.updated}</p>
        </div>
      </div>
      <section className="bg-brand-beige pb-24">
        <div className="mx-auto max-w-2xl px-6 space-y-10">
          {c.sections.map(([h, p]) => (
            <Reveal key={h}>
              <h2 className="font-serif text-2xl mb-3">{h}</h2>
              <p className="text-brand-muted/80 leading-relaxed">{p}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
