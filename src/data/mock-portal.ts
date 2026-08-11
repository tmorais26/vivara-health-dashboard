// Resumos de utentes + agenda para o portal clínico.
// Mock estático: serve a listagem e a agenda da médica.

import { utente as maria } from "./mock-utente";

export type ResumoUtente = {
  id: string;
  nome: string;
  iniciais: string;
  idade: number;
  sexo: "F" | "M";
  cidade: string;
  plano: string;
  alertasAtivos: number;
  marcadoresForaAlvo: number;
  totalMarcadores: number;
  ultimaConsulta: string; // ISO
  proximaConsulta?: string; // ISO
  proximaConsultaHora?: string; // HH:mm
  novosDados?: boolean;
  novosDadosDetalhe?: string;
  acessivel: boolean; // apenas demo: só Maria abre o perfil
};

export const resumosUtentes: ResumoUtente[] = [
  {
    id: maria.id,
    nome: maria.nome,
    iniciais: "MA",
    idade: maria.idade,
    sexo: "F",
    cidade: maria.cidade,
    plano: maria.plano,
    alertasAtivos: maria.alertas.length,
    marcadoresForaAlvo: 11,
    totalMarcadores: maria.marcadores.length,
    ultimaConsulta: maria.ultimaConsulta,
    proximaConsulta: maria.proximaConsulta,
    proximaConsultaHora: "10:30",
    novosDados: true,
    novosDadosDetalhe: "Análise Synlab carregada há 6 dias",
    acessivel: true,
  },
  {
    id: "rui-pereira",
    nome: "Rui Pereira",
    iniciais: "RP",
    idade: 52,
    sexo: "M",
    cidade: "Porto",
    plano: "Longevidade Premium",
    alertasAtivos: 2,
    marcadoresForaAlvo: 7,
    totalMarcadores: 22,
    ultimaConsulta: "2026-02-04",
    proximaConsulta: "2026-05-05",
    proximaConsultaHora: "11:30",
    novosDados: true,
    novosDadosDetalhe: "Painel hormonal carregado ontem",
    acessivel: false,
  },
  {
    id: "ines-rocha",
    nome: "Inês Rocha",
    iniciais: "IR",
    idade: 38,
    sexo: "F",
    cidade: "Lisboa",
    plano: "Longevidade Essencial",
    alertasAtivos: 0,
    marcadoresForaAlvo: 2,
    totalMarcadores: 18,
    ultimaConsulta: "2025-11-18",
    proximaConsulta: "2026-05-12",
    proximaConsultaHora: "10:00",
    acessivel: false,
  },
  {
    id: "joao-marques",
    nome: "João Marques",
    iniciais: "JM",
    idade: 61,
    sexo: "M",
    cidade: "Cascais",
    plano: "Longevidade Premium",
    alertasAtivos: 4,
    marcadoresForaAlvo: 13,
    totalMarcadores: 24,
    ultimaConsulta: "2026-04-22",
    proximaConsulta: "2026-05-04",
    proximaConsultaHora: "09:00",
    acessivel: false,
  },
  {
    id: "catarina-silva",
    nome: "Catarina Silva",
    iniciais: "CS",
    idade: 44,
    sexo: "F",
    cidade: "Sintra",
    plano: "Longevidade Essencial",
    alertasAtivos: 1,
    marcadoresForaAlvo: 4,
    totalMarcadores: 18,
    ultimaConsulta: "2025-09-30",
    proximaConsulta: "2026-05-19",
    proximaConsultaHora: "16:30",
    novosDados: true,
    novosDadosDetalhe: "Dados de wearable sincronizados",
    acessivel: false,
  },
  {
    id: "tiago-costa",
    nome: "Tiago Costa",
    iniciais: "TC",
    idade: 36,
    sexo: "M",
    cidade: "Lisboa",
    plano: "Longevidade Premium",
    alertasAtivos: 0,
    marcadoresForaAlvo: 1,
    totalMarcadores: 22,
    ultimaConsulta: "2026-03-28",
    proximaConsulta: "2026-06-22",
    proximaConsultaHora: "14:00",
    acessivel: false,
  },
  {
    id: "marta-vieira",
    nome: "Marta Vieira",
    iniciais: "MV",
    idade: 49,
    sexo: "F",
    cidade: "Oeiras",
    plano: "Longevidade Premium",
    alertasAtivos: 3,
    marcadoresForaAlvo: 8,
    totalMarcadores: 21,
    ultimaConsulta: "2026-01-20",
    acessivel: false,
  },
];

export type EventoAgenda = {
  id: string;
  utenteId: string;
  utenteNome: string;
  iniciais: string;
  data: string; // ISO date
  hora: string; // HH:mm
  duracao: string;
  tipo: "presencial" | "video";
  motivo: string;
};

export const agendaSemana: EventoAgenda[] = [
  {
    id: "ag-1",
    utenteId: "joao-marques",
    utenteNome: "João Marques",
    iniciais: "JM",
    data: "2026-05-04",
    hora: "09:00",
    duracao: "60 min",
    tipo: "presencial",
    motivo: "Reavaliação cardiovascular após escalada de estatina",
  },
  {
    id: "ag-2",
    utenteId: "rui-pereira",
    utenteNome: "Rui Pereira",
    iniciais: "RP",
    data: "2026-05-05",
    hora: "11:30",
    duracao: "45 min",
    tipo: "video",
    motivo: "Discussão de painel hormonal",
  },
  {
    id: "ag-3",
    utenteId: "ines-rocha",
    utenteNome: "Inês Rocha",
    iniciais: "IR",
    data: "2026-05-12",
    hora: "10:00",
    duracao: "60 min",
    tipo: "presencial",
    motivo: "Consulta semestral",
  },
  {
    id: "ag-4",
    utenteId: "catarina-silva",
    utenteNome: "Catarina Silva",
    iniciais: "CS",
    data: "2026-05-19",
    hora: "16:30",
    duracao: "45 min",
    tipo: "video",
    motivo: "Follow-up wearable e composição",
  },
  {
    id: "ag-5",
    utenteId: "maria-antunes",
    utenteNome: "Maria Antunes",
    iniciais: "MA",
    data: "2026-06-08",
    hora: "10:30",
    duracao: "60 min",
    tipo: "presencial",
    motivo: "Reavaliação lipídica e Vitamina D",
  },
];

export type AcessoPortal = {
  utenteId: string;
  utenteNome: string;
  ultimaConsulta?: string;
  proximaConsulta?: string;
};

/**
 * Diferença entre "fora do alvo funcional" e "alerta clínico":
 * - fora do alvo = qualquer marcador fora do intervalo definido pela médica
 * - alerta clínico = subset com tendência preocupante OU clínica relevante
 *   (subidas consecutivas, queda sustentada, magnitude do desvio).
 */
export const ALERTA_VS_ALVO_EXPLICACAO =
  "Fora do alvo: qualquer marcador fora do intervalo funcional. Alerta clínico: subset com tendência ou magnitude relevante que pede acção.";