import { useSyncExternalStore } from "react";

/**
 * Idioma do portal clínico — PT (por defeito) e EN.
 * Persistido em localStorage e alterável nas Definições.
 * Os dados clínicos de demonstração permanecem em PT.
 */
export type Idioma = "pt" | "en";

const STORAGE_KEY = "vivara-idioma";

function lerInicial(): Idioma {
  if (typeof window === "undefined") return "pt";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "en" ? "en" : "pt";
}

let idioma: Idioma = lerInicial();
const listeners = new Set<() => void>();

export function setIdioma(novo: Idioma) {
  idioma = novo;
  try {
    localStorage.setItem(STORAGE_KEY, novo);
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function useIdioma(): Idioma {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => idioma,
    () => "pt" as Idioma,
  );
}

const pt = {
  nav: {
    utentes: "Utentes",
    agenda: "Agenda",
    prescricoes: "Prescrições",
    definicoes: "Definições",
    sair: "Sair",
    dadosSaude: "Dados de saúde · Acesso registado",
    mfaActivo: "MFA activo",
  },
  comum: {
    portal: "Portal",
    portalClinico: "Portal clínico",
    fechar: "Fechar",
    demoNota: "Versão demonstrativa — apenas o perfil de Maria Antunes está disponível para navegação detalhada.",
  },
  sessao: {
    expiraEm: "A sua sessão expira em",
    renovar: "Pressione qualquer botão para renovar.",
    renovarAgora: "Renovar agora",
  },
  lista: {
    titulo: "Os meus utentes",
    subtitulo: (n: number) => `${n} utentes activos. Cada utente é uma série temporal que se lê como um livro.`,
    novoUtente: "Novo utente",
    pesquisar: "Pesquisar por nome ou cidade…",
    ordenar: "Ordenar",
    ordAlertas: "Alertas (desc)",
    ordProxima: "Próxima consulta",
    ordUltima: "Última consulta",
    ordNome: "Nome (A–Z)",
    novosDados: "Novos dados",
    plano: "Plano",
    ultima: "Última",
    proxima: "Próxima",
    alertas: "Alertas",
    foraDoAlvo: "Fora do alvo",
    marcadores: "Marcadores",
    verAppUtente: "Ver app da utente",
    appV2: "App v2 (novo design)",
  },
  agenda: {
    titulo: "Agenda",
    subtitulo: "Próximas consultas. Clique num utente para abrir o perfil clínico.",
    consulta: "consulta",
    consultas: "consultas",
    preparar: "Preparar",
    prepararConsulta: "Preparar consulta",
    iniciar: "Iniciar",
    iniciarConsulta: "Iniciar consulta",
    alertasClinicos: "Alertas clínicos",
    semAlertas: "Sem alertas activos.",
    anamneseResumo: "Anamnese · resumo",
    alergias: "Alergias a medicamentos",
    semAlergias: "Sem alergias conhecidas",
    antPessoais: "Antecedentes pessoais",
    medicacao: "Medicação habitual",
    suplementacao: "Suplementação",
    antCirurgicos: "Antecedentes cirúrgicos",
    antFamiliares: "Antecedentes familiares",
    semRegistos: "Sem registos",
    verFichaCompleta: "Ver ficha clínica completa →",
    ultimaNota: "Última nota de consulta",
    semNotas: "Sem notas registadas. Esta poderá ser a primeira consulta.",
    adesao: "Adesão · últimos 7 dias",
    abrirPerfil: "Abrir perfil completo",
  },
  prescricoes: {
    titulo: "Prescrições pendentes",
    subtitulo: "Receitas e manipulados perto do fim. Renovar antecipadamente evita falhas de adesão.",
    expiraEm: (d: number) => `Expira em ${d} d`,
    renovar: "Renovar",
  },
  definicoes: {
    titulo: "Definições",
    idioma: "Idioma / Language",
    idiomaSub: "Aplica-se à interface do portal",
    idiomaNota: "Os dados clínicos de demonstração permanecem em português.",
    notifGlobais: "Notificações globais",
    notifGlobaisSub: "Aplicado a todos os utentes (default)",
    notifPorUtente: "Notificações por utente",
    notifPorUtenteSub: "Sobrepõem-se às definições globais",
    notifForaAlvo: "Valor fora do alvo",
    notifLembrete: "Lembrete de consulta",
    notifNovoDoc: "Novo upload de documento",
    notifFalhaAdesao: "Falha de adesão (>3 dias)",
    seguranca: "Segurança da conta",
    segurancaSub: "MFA activo · sessão expira em 15 min de inactividade",
    mfa: "Autenticação multifactor",
    timeout: "Timeout de sessão",
    timeoutValor: "15 minutos",
    ultimaSessao: "Última sessão",
    acessos: "Acessos delegados",
    acessosSub: "Quem mais vê estes utentes",
    notificacoes: "Notificações",
    notificacoesSub: "Como prefere ser avisada",
    notifNovosDados: "Novos dados de utente",
    notifPrescricoes: "Prescrições a expirar",
    notifCriticos: "Alertas críticos",
    clinica: "Clínica",
    clinicaSub: "Identidade institucional",
    contactos: "Contactos",
    demoRodape: "Versão demonstrativa — alterações reais ficam disponíveis quando a conta for activada.",
  },
  utente: {
    tabClinico: "Clínico",
    tabGenomica: "Genómica",
    tabPlano: "Plano",
    tabPrescricoes: "Prescrições",
    tabConsultasDocs: "Consultas & Docs",
    subAnalises: "Análises",
    subComposicao: "Composição",
    subWearable: "Wearable",
    subComparar: "Comparar",
    subConsultas: "Consultas",
    subDocumentos: "Documentos",
    anamnese: "Anamnese",
    anamneseDesc: "Ficha clínica · alergias, antecedentes, medicação, hábitos",
    marcadores: "marcadores",
    meses18: "18 meses",
    foraDoAlvo: "Fora do alvo",
    noAlvo: "No alvo",
    naoEncontrado: "Utente não encontrado",
    voltarLista: "← Voltar à lista",
  },
};

type Dicionario = typeof pt;

const en: Dicionario = {
  nav: {
    utentes: "Patients",
    agenda: "Schedule",
    prescricoes: "Prescriptions",
    definicoes: "Settings",
    sair: "Sign out",
    dadosSaude: "Health data · Access logged",
    mfaActivo: "MFA enabled",
  },
  comum: {
    portal: "Portal",
    portalClinico: "Clinical portal",
    fechar: "Close",
    demoNota: "Demo version — only Maria Antunes' profile is available for detailed navigation.",
  },
  sessao: {
    expiraEm: "Your session expires in",
    renovar: "Press any button to renew.",
    renovarAgora: "Renew now",
  },
  lista: {
    titulo: "My patients",
    subtitulo: (n: number) => `${n} active patients. Each patient is a time series that reads like a book.`,
    novoUtente: "New patient",
    pesquisar: "Search by name or city…",
    ordenar: "Sort",
    ordAlertas: "Alerts (desc)",
    ordProxima: "Next appointment",
    ordUltima: "Last appointment",
    ordNome: "Name (A–Z)",
    novosDados: "New data",
    plano: "Plan",
    ultima: "Last",
    proxima: "Next",
    alertas: "Alerts",
    foraDoAlvo: "Out of range",
    marcadores: "Markers",
    verAppUtente: "View patient app",
    appV2: "App v2 (new design)",
  },
  agenda: {
    titulo: "Schedule",
    subtitulo: "Upcoming appointments. Click a patient to open their clinical profile.",
    consulta: "appointment",
    consultas: "appointments",
    preparar: "Prepare",
    prepararConsulta: "Prepare appointment",
    iniciar: "Start",
    iniciarConsulta: "Start appointment",
    alertasClinicos: "Clinical alerts",
    semAlertas: "No active alerts.",
    anamneseResumo: "History · summary",
    alergias: "Drug allergies",
    semAlergias: "No known allergies",
    antPessoais: "Personal history",
    medicacao: "Current medication",
    suplementacao: "Supplements",
    antCirurgicos: "Surgical history",
    antFamiliares: "Family history",
    semRegistos: "No records",
    verFichaCompleta: "View full clinical record →",
    ultimaNota: "Last visit note",
    semNotas: "No notes recorded. This may be the first appointment.",
    adesao: "Adherence · last 7 days",
    abrirPerfil: "Open full profile",
  },
  prescricoes: {
    titulo: "Pending prescriptions",
    subtitulo: "Prescriptions and compounded medicines nearing expiry. Renewing early avoids adherence gaps.",
    expiraEm: (d: number) => `Expires in ${d} d`,
    renovar: "Renew",
  },
  definicoes: {
    titulo: "Settings",
    idioma: "Idioma / Language",
    idiomaSub: "Applies to the portal interface",
    idiomaNota: "Demo clinical data remains in Portuguese.",
    notifGlobais: "Global notifications",
    notifGlobaisSub: "Applied to all patients (default)",
    notifPorUtente: "Per-patient notifications",
    notifPorUtenteSub: "Override the global settings",
    notifForaAlvo: "Value out of range",
    notifLembrete: "Appointment reminder",
    notifNovoDoc: "New document upload",
    notifFalhaAdesao: "Adherence gap (>3 days)",
    seguranca: "Account security",
    segurancaSub: "MFA enabled · session expires after 15 min of inactivity",
    mfa: "Multi-factor authentication",
    timeout: "Session timeout",
    timeoutValor: "15 minutes",
    ultimaSessao: "Last session",
    acessos: "Delegated access",
    acessosSub: "Who else sees these patients",
    notificacoes: "Notifications",
    notificacoesSub: "How you prefer to be notified",
    notifNovosDados: "New patient data",
    notifPrescricoes: "Expiring prescriptions",
    notifCriticos: "Critical alerts",
    clinica: "Clinic",
    clinicaSub: "Institutional identity",
    contactos: "Contacts",
    demoRodape: "Demo version — real changes become available once the account is activated.",
  },
  utente: {
    tabClinico: "Clinical",
    tabGenomica: "Genomics",
    tabPlano: "Plan",
    tabPrescricoes: "Prescriptions",
    tabConsultasDocs: "Visits & Docs",
    subAnalises: "Lab results",
    subComposicao: "Body composition",
    subWearable: "Wearable",
    subComparar: "Compare",
    subConsultas: "Visits",
    subDocumentos: "Documents",
    anamnese: "History",
    anamneseDesc: "Clinical record · allergies, history, medication, habits",
    marcadores: "markers",
    meses18: "18 months",
    foraDoAlvo: "Out of range",
    noAlvo: "In range",
    naoEncontrado: "Patient not found",
    voltarLista: "← Back to list",
  },
};

const dicionarios: Record<Idioma, Dicionario> = { pt, en };

export function useT(): Dicionario {
  const atual = useIdioma();
  return dicionarios[atual];
}
