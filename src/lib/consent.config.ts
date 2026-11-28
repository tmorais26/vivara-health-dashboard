// Configuração dos consentimentos da app do utente.
//
// O texto das caixas foi definido pela Vivara: NÃO alterar sem aprovação.
// Se uma versão dos Termos ou da Política mudar de forma relevante, sobe-se a
// versão aqui (p.ex. "termos-v2") e o utente tem de voltar a aceitar no acesso
// seguinte. O servidor guarda o hash do texto mostrado, por isso qualquer
// alteração de texto também fica visível no registo.

export type ConsentLang = "pt" | "en";

/** URLs dos documentos legais. Configuráveis por variável de ambiente. */
export const LEGAL_URLS = {
  terms: (import.meta.env?.VITE_LEGAL_TERMS_URL as string | undefined) || "https://dist-coral-one-31.vercel.app/termos",
  privacy: (import.meta.env?.VITE_LEGAL_PRIVACY_URL as string | undefined) || "https://dist-coral-one-31.vercel.app/privacidade",
};

/** Versões em vigor. Mudar quando o documento muda de forma relevante. */
export const DOC_VERSIONS = {
  terms: "termos-v1",
  privacy: "privacidade-v1",
} as const;

export type SignupCheckboxId = "signup-age" | "signup-legal" | "signup-health" | "signup-marketing";

/**
 * Caixas do registo. `text` é o texto completo, usado para o hash do registo;
 * a caixa "signup-legal" é mostrada com os dois nomes como links.
 */
export const SIGNUP_CHECKBOXES: { id: SignupCheckboxId; required: boolean; text: Record<ConsentLang, string> }[] = [
  {
    id: "signup-age",
    required: true,
    text: {
      pt: "Tenho 18 anos ou mais.",
      en: "I am 18 years of age or older.",
    },
  },
  {
    id: "signup-legal",
    required: true,
    text: {
      pt: "Li e aceito os Termos de Serviço e tomei conhecimento da Política de Privacidade.",
      en: "I have read and accept the Terms of Service and have read the Privacy Policy.",
    },
  },
  {
    id: "signup-health",
    required: true,
    text: {
      pt: "Dou o meu consentimento explícito para a Vivara tratar os meus dados de saúde (análises, exames e registos que carregar) para me prestar o serviço. Posso retirar o consentimento a qualquer momento.",
      en: "I give my explicit consent for Vivara to process my health data (lab results, exams and records I upload) to provide me with the service. I can withdraw this consent at any time.",
    },
  },
  {
    id: "signup-marketing",
    required: false,
    text: {
      pt: "Quero receber novidades da Vivara por email.",
      en: "I want to receive news from Vivara by email.",
    },
  },
];

/** Partes da caixa "signup-legal", para mostrar os nomes dos documentos como links. */
export const LEGAL_LINK_PARTS: Record<ConsentLang, { before: string; terms: string; middle: string; privacy: string; after: string }> = {
  pt: { before: "Li e aceito os ", terms: "Termos de Serviço", middle: " e tomei conhecimento da ", privacy: "Política de Privacidade", after: "." },
  en: { before: "I have read and accept the ", terms: "Terms of Service", middle: " and have read the ", privacy: "Privacy Policy", after: "." },
};

/** Texto da nova aceitação, quando muda a versão dos Termos ou da Política. */
export const RECONSENT_CHECKBOX = {
  id: "reconsent-legal",
  text: SIGNUP_CHECKBOXES[1].text,
};

/** Pedido de autorização antes de ligar um wearable. */
export const wearablePrompt = (name: string, lang: ConsentLang) =>
  lang === "en" ? `Do you authorise Vivara to receive data from ${name}?` : `Autoriza a Vivara a receber os dados do ${name}?`;

/**
 * Aviso de leitura automática (IA). Desligado: a leitura atual é extração de
 * texto e OCR no próprio telemóvel, sem fornecedor de IA. Ligar quando houver
 * fornecedor escolhido e ele constar da Política de Privacidade.
 */
export const AI_READING_NOTICE = {
  enabled: false,
  text: {
    pt: "Os valores são lidos automaticamente e podem ter erros. Confirme-os no documento original, que aparece sempre ao lado.",
    en: "Values are read automatically and may contain errors. Check them against the original document, which is always shown alongside.",
  } as Record<ConsentLang, string>,
};

/** Dias de exportação disponível depois de encerrar a conta. */
export const EXPORT_WINDOW_DAYS = 90;

/**
 * Consentimento para a orientação nutricional com IA (pedido na primeira
 * utilização). [Revisão jurídica: confirmar com o advogado antes de publicar.]
 */
export const NUTRITION_AI_CONSENT = {
  id: "nutri-ai-consent",
  text: {
    pt: "Autorizo a Vivara a enviar alguns valores das minhas análises (só os que têm relação com a alimentação), a minha faixa etária, sexo, IMC e cintura a um serviço de inteligência artificial (Anthropic), para gerar uma orientação alimentar geral. Não são enviados o meu nome, contactos, condições, medicação nem documentos. Posso retirar esta autorização a qualquer momento.",
    en: "I authorise Vivara to send some of my lab values (only those related to diet), my age band, sex, BMI and waist to an artificial intelligence service (Anthropic) to generate general dietary guidance. My name, contact details, conditions, medication and documents are not sent. I can withdraw this authorisation at any time.",
  } as Record<ConsentLang, string>,
};
