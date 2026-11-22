// URLs configuráveis por variável de ambiente (o domínio final será o do site da Vivara).
// Aumentar a versão de um documento força nova aceitação no acesso seguinte.
export const LEGAL_DOCS = {
  termos: {
    url: import.meta.env.VITE_LEGAL_TERMOS_URL ?? "https://dist-coral-one-31.vercel.app/termos",
    versao: "termos-v1",
  },
  acordo: {
    url:
      import.meta.env.VITE_LEGAL_ACORDO_URL ??
      "https://dist-coral-one-31.vercel.app/acordo-medicos",
    versao: "acordo-v1",
  },
  privacidade: {
    url:
      import.meta.env.VITE_LEGAL_PRIVACIDADE_URL ??
      "https://dist-coral-one-31.vercel.app/privacidade",
    versao: "privacidade-v1",
  },
} as const;

export const CAIXA_IDS = {
  documentos: "aceite-termos-acordo",
  habilitacao: "declaracao-habilitacao",
  funcoes: "declaracao-funcoes",
  marketing: "marketing-email",
} as const;

// Ligações de convite (configuráveis; o domínio final será o da Vivara).
export const URL_APP_UTENTE =
  import.meta.env.VITE_APP_UTENTE_URL ?? "https://dist-coral-one-31.vercel.app";

export function ligacaoUtente(codigo: string) {
  return `${URL_APP_UTENTE}/registo?codigo=${encodeURIComponent(codigo)}`;
}

export function ligacaoColega(codigo: string, origem: string) {
  return `${origem}/auth?codigo=${encodeURIComponent(codigo)}`;
}

// Prescrição Eletrónica Médica do SNS (gratuita para os médicos). Confirmar o endereço em uso com a SPMS.
export const URL_PEM_SPMS = import.meta.env.VITE_URL_PEM ?? "https://pem.min-saude.pt";
