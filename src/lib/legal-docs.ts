// URLs configuráveis por variável de ambiente (o domínio final será o do site da Vivara).
// Aumentar a versão de um documento força nova aceitação no acesso seguinte.
export const LEGAL_DOCS = {
  termos: {
    url: import.meta.env.VITE_LEGAL_TERMOS_URL ?? "https://dist-coral-one-31.vercel.app/termos",
    versao: "termos-v1",
  },
  acordo: {
    url: import.meta.env.VITE_LEGAL_ACORDO_URL ?? "https://dist-coral-one-31.vercel.app/acordo-medicos",
    versao: "acordo-v1",
  },
  privacidade: {
    url: import.meta.env.VITE_LEGAL_PRIVACIDADE_URL ?? "https://dist-coral-one-31.vercel.app/privacidade",
    versao: "privacidade-v1",
  },
} as const;

export const CAIXA_IDS = {
  documentos: "aceite-termos-acordo",
  habilitacao: "declaracao-habilitacao",
  marketing: "marketing-email",
} as const;
