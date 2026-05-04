// Mock data for Maria Antunes — 18 months of longevity history
// Generated deterministically so the dashboard is stable across renders.

export type Categoria =
  | "analises"
  | "composicao"
  | "wearable"
  | "genomica"
  | "prescricoes";

export type Estado = "ok" | "atencao" | "alerta";

export type DirecaoBoa = "baixar" | "subir" | "estavel";

export type Fonte = "laboratorio" | "wearable" | "balanca" | "manual";

export type Medicao = {
  data: string; // ISO
  valor: number;
  fonte: Fonte;
};

export type Marcador = {
  id: string;
  nome: string;
  nomeCurto: string;
  categoria: Categoria;
  unidade: string;
  intervaloLab: [number, number];
  alvoFuncional: [number, number];
  direcaoBoa: DirecaoBoa;
  notaMedica?: string;
  proximaRecolha?: string;
  serie: Medicao[];
  explicacaoSimples?: string;
  porqueImporta?: string;
  percentilPares?: number;
  coorteDescricao?: string;
};

export type Alerta = {
  id: string;
  marcadorId: string;
  titulo: string;
  detalhe: string;
  estado: Estado;
};

export type Prescricao = {
  id: string;
  nome: string;
  tipo: "receita" | "manipulado" | "suplemento";
  posologia: string;
  desde: string;
  proximaRenovacao?: string;
};

export type VarianteGenomica = {
  gene: string;
  variante: string;
  impacto: string;
  relevancia: "alta" | "media" | "baixa";
};

export type TipoTarefa = "suplemento" | "medicacao" | "analise";

export type HorarioToma = "pequeno-almoço" | "almoço" | "jantar" | "ao deitar" | "em jejum" | "livre";

export type TarefaPlano = {
  id: string;
  tipo: TipoTarefa;
  titulo: string;
  detalhe: string;
  marcadorId?: string;
  criadaEm: string; // ISO
  prazo?: string; // ISO ou descritivo
  hora?: string; // ex: "08:00"
  comRefeicao?: HorarioToma;
  feita: boolean;
  feitaEm?: string;
};

export type HorarioToma = "pequeno-almoço" | "almoço" | "jantar" | "ao deitar" | "em jejum" | "livre";

export type Mensagem = {
  id: string;
  autor: "medica" | "utente" | "sistema";
  texto: string;
  enviadaEm: string;
  lida: boolean;
  marcadorId?: string;
};

export type Conversa = {
  id: string;
  com: string;
  papel: string;
  iniciais: string;
  mensagens: Mensagem[];
};

export type Consulta = {
  id: string;
  data: string;
  hora: string;
  duracao: string;
  tipo: "presencial" | "video";
  motivo: string;
  estado: "agendada" | "realizada" | "cancelada";
  resumo?: string;
  preparacao?: string[];
};

export type Conteudo = {
  id: string;
  titulo: string;
  descricao: string;
  formato: "artigo" | "video" | "audio";
  duracao: string;
  marcadorId?: string;
  curadoPor: string;
  novo?: boolean;
};

export type EntradaDiario = {
  id: string;
  data: string;
  humor: 1 | 2 | 3 | 4 | 5;
  energia: 1 | 2 | 3 | 4 | 5;
  sintomas: string[];
  nota?: string;
};

export type Notificacao = {
  id: string;
  tipo: "resumo" | "lembrete" | "agenda" | "consulta" | "sistema";
  severidade?: "info" | "atencao" | "alerta";
  titulo: string;
  detalhe: string;
  quando: string; // ISO
  marcadorId?: string;
  consultaId?: string;
  lida: boolean;
  cta?: string;
};

export type ValorExtraido = {
  marcadorId: string;
  marcadorNome: string;
  unidade: string;
  valor: number;
  confianca: number; // 0-1
  precisaRevisao?: boolean;
  alternativas?: number[];
};

export type UploadAnalise = {
  id: string;
  ficheiro: string;
  origem: "camara" | "pdf";
  dataUpload: string; // ISO
  estado: "processado" | "a_processar";
  numValores: number;
};

// Ficha clínica preenchida na primeira consulta — apenas visível ao médico
export type FichaClinica = {
  preenchidaEm: string; // ISO
  preenchidaPor: string;
  antecedentesPessoais: string[];
  medicacaoHabitual: { nome: string; posologia: string; desde?: string }[];
  suplementacao: { nome: string; posologia: string; desde?: string }[];
  antecedentesCirurgicos: { intervencao: string; ano: string; nota?: string }[];
  antecedentesFamiliares: { familiar: string; condicao: string; idadeDiagnostico?: string }[];
  alergiasMedicamentos: { substancia: string; reacao: string; gravidade: "leve" | "moderada" | "grave" }[];
  habitos?: { tabaco?: string; alcool?: string; exercicio?: string; sono?: string };
  notasGerais?: string;
};

// Diário privado do médico — uma entrada por consulta
export type NotaConsultaMedico = {
  id: string;
  consultaId?: string;
  data: string; // ISO
  autor: string;
  tipo: "primeira" | "seguimento" | "intercorrencia";
  subjetivo?: string; // o que a utente relatou
  objetivo?: string; // exame, observação
  avaliacao?: string; // raciocínio clínico
  plano?: string; // próximos passos
  proximaRevisao?: string;
};

export type Utente = {
  id: string;
  nome: string;
  idade: number;
  cidade: string;
  plano: string;
  medicaResponsavel: string;
  ultimaConsulta: string;
  proximaConsulta: string;
  marcadores: Marcador[];
  alertas: Alerta[];
  prescricoes: Prescricao[];
  genomica: VarianteGenomica[];
  plano_tarefas: TarefaPlano[];
  conversas: Conversa[];
  consultas: Consulta[];
  conteudos: Conteudo[];
  diario: EntradaDiario[];
  streakDias: number;
  notificacoes: Notificacao[];
  uploadsRecentes: UploadAnalise[];
  fichaClinica: FichaClinica;
  notasMedicas: NotaConsultaMedico[];
};

// Deterministic pseudo-random
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function mesesAtras(n: number): string {
  // UTC explícito para evitar mismatches SSR/cliente entre fusos horários
  const d = new Date(Date.UTC(2026, 3, 15));
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

function diasAtras(n: number): string {
  const d = new Date(Date.UTC(2026, 3, 15));
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Análises clínicas: ~6 colheitas distribuídas em 18 meses
function serieAnalise(
  seed: number,
  start: number,
  end: number,
  drift: number,
  noise: number,
): Medicao[] {
  const rand = seeded(seed);
  const meses = [17, 14, 11, 8, 5, 2, 0];
  return meses.map((m, i) => {
    const t = i / (meses.length - 1);
    const base = start + (end - start) * t + drift * t;
    const valor = base + (rand() - 0.5) * noise;
    return {
      data: mesesAtras(m),
      valor: Number(valor.toFixed(2)),
      fonte: "laboratorio" as Fonte,
    };
  });
}

// Wearable: 1 ponto por semana ~ 78 pontos
function serieWearable(
  seed: number,
  base: number,
  amp: number,
  trend: number,
): Medicao[] {
  const rand = seeded(seed);
  const pontos: Medicao[] = [];
  for (let semana = 78; semana >= 0; semana--) {
    const t = (78 - semana) / 78;
    const valor = base + Math.sin(semana / 4) * amp + trend * t + (rand() - 0.5) * amp;
    pontos.push({
      data: diasAtras(semana * 7),
      valor: Number(valor.toFixed(1)),
      fonte: "wearable" as Fonte,
    });
  }
  return pontos;
}

// Composição corporal: 1 medição por semana
function serieBalanca(seed: number, base: number, trend: number, noise: number): Medicao[] {
  const rand = seeded(seed);
  const pontos: Medicao[] = [];
  for (let semana = 78; semana >= 0; semana--) {
    const t = (78 - semana) / 78;
    const valor = base + trend * t + (rand() - 0.5) * noise;
    pontos.push({
      data: diasAtras(semana * 7),
      valor: Number(valor.toFixed(1)),
      fonte: "balanca" as Fonte,
    });
  }
  return pontos;
}

const marcadores: Marcador[] = [
  // === ANÁLISES ===
  {
    id: "ldl",
    nome: "LDL-Colesterol",
    nomeCurto: "LDL-C",
    categoria: "analises",
    unidade: "mg/dL",
    intervaloLab: [0, 130],
    alvoFuncional: [60, 100],
    direcaoBoa: "baixar",
    notaMedica:
      "Tendência ascendente nos últimos 8 meses. Reforçar fibras solúveis e considerar ezetimibe se >150 na próxima colheita.",
    proximaRecolha: "Maio 2026",
    serie: serieAnalise(11, 118, 142, 14, 6),
    explicacaoSimples:
      "É o colesterol que pode acumular-se nas artérias. Quanto mais baixo, melhor para o coração a longo prazo.",
    porqueImporta:
      "LDL elevado durante anos é o principal motor de doença cardiovascular. Em medicina de longevidade, mantê-lo baixo cedo evita placa.",
    percentilPares: 78,
    coorteDescricao: "mulheres 45–50 anos",
  },
  {
    id: "hdl",
    nome: "HDL-Colesterol",
    nomeCurto: "HDL-C",
    categoria: "analises",
    unidade: "mg/dL",
    intervaloLab: [40, 100],
    alvoFuncional: [60, 90],
    direcaoBoa: "subir",
    serie: serieAnalise(7, 54, 58, 2, 4),
    explicacaoSimples: "É o colesterol 'limpa-vasos'. Mais alto costuma ser melhor.",
    percentilPares: 42,
    coorteDescricao: "mulheres 45–50 anos",
  },
  {
    id: "trig",
    nome: "Triglicéridos",
    nomeCurto: "TG",
    categoria: "analises",
    unidade: "mg/dL",
    intervaloLab: [0, 150],
    alvoFuncional: [40, 90],
    direcaoBoa: "baixar",
    serie: serieAnalise(13, 92, 88, -4, 10),
    explicacaoSimples: "Gorduras circulantes. Sobem com excesso de açúcar, álcool e sedentarismo.",
    percentilPares: 35,
  },
  {
    id: "hba1c",
    nome: "Hemoglobina A1c",
    nomeCurto: "HbA1c",
    categoria: "analises",
    unidade: "%",
    intervaloLab: [4, 5.7],
    alvoFuncional: [4.5, 5.3],
    direcaoBoa: "baixar",
    serie: serieAnalise(17, 5.6, 5.4, -0.15, 0.1),
    explicacaoSimples: "A média do teu açúcar no sangue dos últimos 3 meses.",
    porqueImporta: "Marcador-chave para risco de diabetes e envelhecimento metabólico.",
    percentilPares: 28,
    coorteDescricao: "mulheres 45–50 anos",
  },
  {
    id: "glic",
    nome: "Glicose em jejum",
    nomeCurto: "Glicose",
    categoria: "analises",
    unidade: "mg/dL",
    intervaloLab: [70, 100],
    alvoFuncional: [75, 90],
    direcaoBoa: "estavel",
    serie: serieAnalise(19, 92, 88, -2, 4),
  },
  {
    id: "ferritina",
    nome: "Ferritina",
    nomeCurto: "Ferritina",
    categoria: "analises",
    unidade: "ng/mL",
    intervaloLab: [15, 200],
    alvoFuncional: [70, 150],
    direcaoBoa: "estavel",
    serie: serieAnalise(23, 92, 98, 4, 6),
  },
  {
    id: "vitd",
    nome: "Vitamina D (25-OH)",
    nomeCurto: "Vit D",
    categoria: "analises",
    unidade: "ng/mL",
    intervaloLab: [30, 100],
    alvoFuncional: [50, 80],
    direcaoBoa: "subir",
    notaMedica: "Queda no inverno apesar da suplementação. Avaliar absorção e considerar 5000 UI/dia.",
    serie: serieAnalise(29, 38, 24, -10, 3),
    explicacaoSimples:
      "Hormona-vitamina ligada à imunidade, ossos e humor. Em Portugual baixa muito no inverno.",
    porqueImporta: "Níveis baixos sustentados associam-se a fadiga, dor muscular e maior infecção.",
    percentilPares: 18,
    coorteDescricao: "mulheres 45–50 anos",
  },
  {
    id: "b12",
    nome: "Vitamina B12",
    nomeCurto: "B12",
    categoria: "analises",
    unidade: "pg/mL",
    intervaloLab: [200, 900],
    alvoFuncional: [500, 800],
    direcaoBoa: "estavel",
    serie: serieAnalise(31, 540, 620, 60, 30),
  },
  {
    id: "tsh",
    nome: "Hormona estimuladora da tiróide",
    nomeCurto: "TSH",
    categoria: "analises",
    unidade: "mUI/L",
    intervaloLab: [0.4, 4.0],
    alvoFuncional: [1.0, 2.5],
    direcaoBoa: "estavel",
    serie: serieAnalise(37, 2.0, 2.1, 0.05, 0.2),
  },
  {
    id: "hscrp",
    nome: "Proteína C reativa de alta sensibilidade",
    nomeCurto: "hsCRP",
    categoria: "analises",
    unidade: "mg/L",
    intervaloLab: [0, 3.0],
    alvoFuncional: [0, 1.0],
    direcaoBoa: "baixar",
    notaMedica: "Inflamação sistémica baixa-moderada. Correlacionar com sono reduzido e ganho de % gordura visceral.",
    serie: serieAnalise(41, 1.6, 2.8, 1.0, 0.3),
    explicacaoSimples: "Mede inflamação no corpo todo. Subidas crónicas aceleram o envelhecimento.",
    percentilPares: 65,
  },
  {
    id: "homocist",
    nome: "Homocisteína",
    nomeCurto: "Homocist.",
    categoria: "analises",
    unidade: "µmol/L",
    intervaloLab: [5, 15],
    alvoFuncional: [5, 8],
    direcaoBoa: "baixar",
    serie: serieAnalise(43, 9.2, 7.8, -1.2, 0.6),
  },
  {
    id: "testo",
    nome: "Testosterona total",
    nomeCurto: "Testo. total",
    categoria: "analises",
    unidade: "ng/dL",
    intervaloLab: [15, 70],
    alvoFuncional: [30, 60],
    direcaoBoa: "estavel",
    serie: serieAnalise(47, 38, 42, 4, 4),
  },

  // === COMPOSIÇÃO CORPORAL ===
  {
    id: "peso",
    nome: "Peso corporal",
    nomeCurto: "Peso",
    categoria: "composicao",
    unidade: "kg",
    intervaloLab: [55, 75],
    alvoFuncional: [62, 68],
    direcaoBoa: "estavel",
    serie: serieBalanca(53, 68.4, 0.8, 0.4),
  },
  {
    id: "imc",
    nome: "Índice de massa corporal",
    nomeCurto: "IMC",
    categoria: "composicao",
    unidade: "kg/m²",
    intervaloLab: [18.5, 25],
    alvoFuncional: [21, 23.5],
    direcaoBoa: "estavel",
    serie: serieBalanca(59, 22.8, 0.3, 0.15),
  },
  {
    id: "gordura",
    nome: "Massa gorda",
    nomeCurto: "% gordura",
    categoria: "composicao",
    unidade: "%",
    intervaloLab: [21, 33],
    alvoFuncional: [22, 27],
    direcaoBoa: "baixar",
    serie: serieBalanca(61, 26.0, 2.4, 0.6),
  },
  {
    id: "magra",
    nome: "Massa magra",
    nomeCurto: "Massa magra",
    categoria: "composicao",
    unidade: "kg",
    intervaloLab: [40, 55],
    alvoFuncional: [46, 52],
    direcaoBoa: "subir",
    serie: serieBalanca(67, 47.5, -0.8, 0.4),
  },
  {
    id: "agua",
    nome: "Água corporal",
    nomeCurto: "% água",
    categoria: "composicao",
    unidade: "%",
    intervaloLab: [45, 60],
    alvoFuncional: [50, 58],
    direcaoBoa: "estavel",
    serie: serieBalanca(71, 53, -0.4, 0.5),
  },
  {
    id: "idademet",
    nome: "Idade metabólica",
    nomeCurto: "Idade metab.",
    categoria: "composicao",
    unidade: "anos",
    intervaloLab: [35, 55],
    alvoFuncional: [38, 45],
    direcaoBoa: "baixar",
    serie: serieBalanca(73, 44, 1.5, 0.5),
  },

  // === WEARABLE ===
  {
    id: "sono",
    nome: "Sono total",
    nomeCurto: "Sono",
    categoria: "wearable",
    unidade: "h",
    intervaloLab: [6, 9],
    alvoFuncional: [7.0, 8.5],
    direcaoBoa: "subir",
    notaMedica: "Redução progressiva nos últimos 6 meses. Coincide com aumento de hsCRP.",
    serie: serieWearable(79, 7.2, 0.4, -1.0).map((m) => ({ ...m, valor: Number(m.valor.toFixed(2)) })),
    explicacaoSimples: "Quantas horas dormes por noite, em média.",
    porqueImporta: "É a maior alavanca de longevidade que controlas todos os dias.",
    percentilPares: 38,
  },
  {
    id: "hrv",
    nome: "Variabilidade da frequência cardíaca",
    nomeCurto: "HRV",
    categoria: "wearable",
    unidade: "ms",
    intervaloLab: [25, 80],
    alvoFuncional: [50, 75],
    direcaoBoa: "subir",
    notaMedica: "Linha de base era 55ms há 1 ano. Avaliar carga de stress e qualidade de recuperação.",
    serie: serieWearable(83, 50, 6, -8),
    explicacaoSimples:
      "A variação entre batidas. Mais alta = sistema nervoso recuperado. Mais baixa = stress acumulado.",
    porqueImporta: "Indicador precoce de sobrecarga, doença ou má recuperação.",
    percentilPares: 34,
  },
  {
    id: "fcrep",
    nome: "Frequência cardíaca em repouso",
    nomeCurto: "FC repouso",
    categoria: "wearable",
    unidade: "bpm",
    intervaloLab: [50, 80],
    alvoFuncional: [55, 65],
    direcaoBoa: "baixar",
    serie: serieWearable(89, 62, 3, 4),
  },
  {
    id: "spo2",
    nome: "Saturação de oxigénio",
    nomeCurto: "SpO₂",
    categoria: "wearable",
    unidade: "%",
    intervaloLab: [94, 100],
    alvoFuncional: [96, 100],
    direcaoBoa: "subir",
    serie: serieWearable(97, 97, 0.5, -0.2),
  },
  {
    id: "passos",
    nome: "Passos diários (média semanal)",
    nomeCurto: "Passos",
    categoria: "wearable",
    unidade: "/dia",
    intervaloLab: [4000, 12000],
    alvoFuncional: [8000, 11000],
    direcaoBoa: "subir",
    serie: serieWearable(101, 7400, 800, -600),
  },
  {
    id: "temp",
    nome: "Temperatura cutânea (desvio)",
    nomeCurto: "Temp. cutânea",
    categoria: "wearable",
    unidade: "°C",
    intervaloLab: [-0.5, 0.5],
    alvoFuncional: [-0.2, 0.2],
    direcaoBoa: "estavel",
    serie: serieWearable(103, 0.05, 0.15, 0),
  },
];

const alertas: Alerta[] = [
  {
    id: "a1",
    marcadorId: "ldl",
    titulo: "LDL-C acima do alvo funcional",
    detalhe: "142 mg/dL · alvo ≤100 · 4ª subida consecutiva",
    estado: "alerta",
  },
  {
    id: "a2",
    marcadorId: "vitd",
    titulo: "Vitamina D em queda sustentada",
    detalhe: "24 ng/mL · alvo 50–80 · –37% em 9 meses",
    estado: "alerta",
  },
  {
    id: "a3",
    marcadorId: "hrv",
    titulo: "HRV abaixo da linha de base",
    detalhe: "42 ms · linha de base 55 ms · –24% em 6 meses",
    estado: "atencao",
  },
];

const prescricoes: Prescricao[] = [
  {
    id: "p1",
    nome: "Estradiol transdérmico 50 µg",
    tipo: "receita",
    posologia: "1 adesivo a cada 3,5 dias",
    desde: "2024-09-12",
    proximaRenovacao: "2026-06-15",
  },
  {
    id: "p2",
    nome: "Progesterona micronizada 100 mg",
    tipo: "manipulado",
    posologia: "1 cápsula ao deitar (cíclica, dias 1–25)",
    desde: "2024-09-12",
    proximaRenovacao: "2026-05-20",
  },
  {
    id: "p3",
    nome: "Vitamina D3 4000 UI + K2 100 µg",
    tipo: "suplemento",
    posologia: "1 cápsula ao pequeno-almoço",
    desde: "2024-03-04",
  },
  {
    id: "p4",
    nome: "Magnésio bisglicinato 300 mg",
    tipo: "suplemento",
    posologia: "1 cápsula ao deitar",
    desde: "2024-11-02",
  },
  {
    id: "p5",
    nome: "Ómega-3 EPA/DHA 2 g",
    tipo: "suplemento",
    posologia: "2 cápsulas ao almoço",
    desde: "2024-05-18",
  },
];

const genomica: VarianteGenomica[] = [
  { gene: "APOE", variante: "ε3/ε4", impacto: "Risco aumentado cardiovascular e neurodegenerativo", relevancia: "alta" },
  { gene: "MTHFR", variante: "C677T heterozigótica", impacto: "Metabolismo do folato reduzido", relevancia: "media" },
  { gene: "FTO", variante: "AA", impacto: "Predisposição a ganho de massa gorda", relevancia: "media" },
  { gene: "CYP1A2", variante: "*1F/*1F", impacto: "Metabolizadora rápida de cafeína", relevancia: "baixa" },
];

const plano_tarefas: TarefaPlano[] = [
  {
    id: "t1",
    tipo: "suplemento",
    titulo: "Vitamina D3 5000 UI + K2",
    detalhe: "1 cápsula ao pequeno-almoço, com gordura. Substitui a dose anterior de 4000 UI.",
    marcadorId: "vitd",
    criadaEm: "2026-03-12",
    prazo: "Diário, 8 semanas",
    feita: false,
  },
  {
    id: "t2",
    tipo: "suplemento",
    titulo: "Berberina 500 mg",
    detalhe: "1 cápsula antes do almoço e do jantar. Para apoio do perfil lipídico.",
    marcadorId: "ldl",
    criadaEm: "2026-03-12",
    prazo: "Diário, até reavaliação",
    feita: true,
    feitaEm: "2026-03-14",
  },
  {
    id: "t3",
    tipo: "analise",
    titulo: "Repetir painel lipídico completo",
    detalhe: "Inclui ApoB e Lp(a). Jejum de 12h. Trazer resultado antes da próxima consulta.",
    marcadorId: "ldl",
    criadaEm: "2026-03-12",
    prazo: "Até 15 Maio 2026",
    feita: false,
  },
  {
    id: "t4",
    tipo: "analise",
    titulo: "Repetir 25-OH Vitamina D",
    detalhe: "Após 8 semanas de suplementação ajustada.",
    marcadorId: "vitd",
    criadaEm: "2026-03-12",
    prazo: "Até 8 Junho 2026",
    feita: false,
  },
  {
    id: "t5",
    tipo: "medicacao",
    titulo: "Ezetimibe 10 mg",
    detalhe: "1 comprimido ao deitar. Iniciar apenas se LDL >150 na próxima colheita.",
    marcadorId: "ldl",
    criadaEm: "2026-03-12",
    prazo: "Condicional",
    feita: false,
  },
];

export const utente: Utente = {
  id: "maria-antunes",
  nome: "Maria Antunes",
  idade: 47,
  cidade: "Lisboa",
  plano: "Longevidade Premium",
  medicaResponsavel: "Dra. Sofia Cardoso",
  ultimaConsulta: "2026-03-12",
  proximaConsulta: "2026-06-08",
  marcadores,
  alertas,
  prescricoes,
  genomica,
  plano_tarefas,
  conversas: [
    {
      id: "c-sofia",
      com: "Dra. Sofia Cardoso",
      papel: "Médica de longevidade",
      iniciais: "SC",
      mensagens: [
        {
          id: "m1",
          autor: "medica",
          texto:
            "Maria, ajustei a Vitamina D para 5000 UI. Vamos reavaliar em 8 semanas. Continua a caminhar.",
          enviadaEm: "2026-04-27T09:14:00",
          lida: true,
        },
        {
          id: "m2",
          autor: "utente",
          texto: "Obrigada Dra. Tomei a primeira hoje ao pequeno-almoço. Algum efeito que deva esperar?",
          enviadaEm: "2026-04-27T11:02:00",
          lida: true,
        },
        {
          id: "m3",
          autor: "medica",
          texto:
            "Nenhum efeito agudo. Se notares dor de cabeça ou náusea avisa-me. Caso contrário, continuamos.",
          enviadaEm: "2026-04-27T15:40:00",
          lida: true,
          marcadorId: "vitd",
        },
        {
          id: "m4",
          autor: "medica",
          texto:
            "Vi os teus dados de sono desta semana — média 6h12. Queres que marquemos uma chamada curta?",
          enviadaEm: "2026-04-28T18:25:00",
          lida: false,
          marcadorId: "sono",
        },
      ],
    },
    {
      id: "c-nutri",
      com: "Inês Carvalho",
      papel: "Nutricionista",
      iniciais: "IC",
      mensagens: [
        {
          id: "n1",
          autor: "medica",
          texto:
            "Enviei-te o plano alimentar de Maio. Foco em fibras solúveis para apoiar o LDL.",
          enviadaEm: "2026-04-26T10:00:00",
          lida: false,
          marcadorId: "ldl",
        },
      ],
    },
  ],
  consultas: [
    {
      id: "k1",
      data: "2026-06-08",
      hora: "10:30",
      duracao: "60 min",
      tipo: "presencial",
      motivo: "Reavaliação de perfil lipídico e Vitamina D",
      estado: "agendada",
      preparacao: [
        "Trazer análises do painel lipídico repetido",
        "Jejum de 12h se análise no próprio dia",
        "Anotar 3 perguntas que queiras discutir",
      ],
    },
    {
      id: "k2",
      data: "2026-03-12",
      hora: "11:00",
      duracao: "75 min",
      tipo: "presencial",
      motivo: "Consulta trimestral de longevidade",
      estado: "realizada",
      resumo:
        "Ajustada Vit D para 5000 UI. Adicionada Berberina. Pedido painel lipídico completo com ApoB e Lp(a).",
    },
    {
      id: "k3",
      data: "2025-12-04",
      hora: "09:30",
      duracao: "45 min",
      tipo: "video",
      motivo: "Follow-up de wearables",
      estado: "realizada",
      resumo: "Revisto sono e HRV. Recomendada higiene de sono e teste de saturação noturna.",
    },
  ],
  conteudos: [
    {
      id: "ed1",
      titulo: "Porque é que o teu LDL está a subir?",
      descricao:
        "O que muda na perimenopausa, como a fibra solúvel actua e quando faz sentido medicar.",
      formato: "artigo",
      duracao: "6 min",
      marcadorId: "ldl",
      curadoPor: "Dra. Sofia Cardoso",
      novo: true,
    },
    {
      id: "ed2",
      titulo: "HRV em linguagem simples",
      descricao: "O que mede, o que não mede, e como interpretar a tua tendência semanal.",
      formato: "video",
      duracao: "4 min",
      marcadorId: "hrv",
      curadoPor: "Equipa Vivara",
    },
    {
      id: "ed3",
      titulo: "Vitamina D no inverno português",
      descricao: "Porque a tua dose de manutenção pode não chegar entre Outubro e Março.",
      formato: "artigo",
      duracao: "5 min",
      marcadorId: "vitd",
      curadoPor: "Dra. Sofia Cardoso",
      novo: true,
    },
    {
      id: "ed4",
      titulo: "Higiene de sono em 7 passos",
      descricao: "Áudio guiado para implementares esta semana.",
      formato: "audio",
      duracao: "12 min",
      marcadorId: "sono",
      curadoPor: "Inês Carvalho",
    },
    {
      id: "ed5",
      titulo: "Treino de força depois dos 45",
      descricao: "Porque é a alavanca mais subestimada de longevidade saudável.",
      formato: "video",
      duracao: "8 min",
      curadoPor: "Equipa Vivara",
    },
  ],
  diario: [
    {
      id: "d1",
      data: "2026-04-28",
      humor: 4,
      energia: 3,
      sintomas: ["Sono leve"],
      nota: "Acordei 2x durante a noite.",
    },
    {
      id: "d2",
      data: "2026-04-27",
      humor: 4,
      energia: 4,
      sintomas: [],
      nota: "Caminhada longa ao fim da tarde.",
    },
    {
      id: "d3",
      data: "2026-04-26",
      humor: 3,
      energia: 2,
      sintomas: ["Cefaleia ligeira"],
    },
  ],
  streakDias: 12,
  notificacoes: [
    {
      id: "n-resumo",
      tipo: "resumo",
      titulo: "Resumo da consulta",
      detalhe:
        "Plano actualizado. Manter Metformina 500mg 2×/dia. Aumentar Magnésio para 400mg ao deitar. Pedir painel hormonal completo em 6 semanas.",
      quando: "2026-04-29T18:42:00",
      consultaId: "k2",
      lida: false,
      cta: "Abrir resumo",
    },
    {
      id: "n-suplemento",
      tipo: "lembrete",
      titulo: "Suplementos da manhã",
      detalhe: "Vitamina D3 4000 UI · Ómega-3 EPA/DHA",
      quando: "2026-04-29T09:00:00",
      lida: false,
      cta: "Marcar como tomado",
    },
    {
      id: "n-receita",
      tipo: "lembrete",
      titulo: "Receita Metformina termina em 18 dias",
      detalhe:
        "Renovação automática agendada. A Dra. Sofia recebe pedido na próxima sessão.",
      quando: "2026-04-30T08:00:00",
      lida: true,
      cta: "Ver detalhes",
    },
    {
      id: "n-analises",
      tipo: "agenda",
      titulo: "Pedido de análises agendado",
      detalhe: "Painel hormonal: FSH, LH, progesterona, SHBG.",
      quando: "2026-06-01T10:00:00",
      lida: true,
      cta: "Ver pedido",
    },
    {
      id: "n-consulta",
      tipo: "consulta",
      titulo: "Próxima consulta",
      detalhe: "Discussão sobre TRH personalizada · Clínica Lumiar",
      quando: "2026-06-08T10:30:00",
      consultaId: "k1",
      lida: true,
    },
  ],
  uploadsRecentes: [
    {
      id: "u-1",
      ficheiro: "Synlab_Analises_22Abr.pdf",
      origem: "pdf",
      dataUpload: "2026-04-22T11:14:00",
      estado: "processado",
      numValores: 14,
    },
    {
      id: "u-2",
      ficheiro: "Painel hormonal Mar 26",
      origem: "camara",
      dataUpload: "2026-04-08T19:02:00",
      estado: "processado",
      numValores: 6,
    },
  ],
  fichaClinica: {
    preenchidaEm: "2024-10-14",
    preenchidaPor: "Dra. Sofia Cardoso",
    antecedentesPessoais: [
      "Hipotiroidismo subclínico (diagnóstico em 2019)",
      "Enxaqueca catamenial — episódica",
      "Insulinorresistência ligeira (HOMA-IR 2.6 em 2023)",
      "Défice crónico de vitamina D",
    ],
    medicacaoHabitual: [
      { nome: "Levotiroxina 50 mcg", posologia: "1 cp em jejum, 30 min antes do pequeno-almoço", desde: "2019-05" },
      { nome: "Sumatriptano 50 mg", posologia: "SOS em crise de enxaqueca, máx. 2/mês", desde: "2021-02" },
    ],
    suplementacao: [
      { nome: "Vitamina D3 5000 UI", posologia: "1 cápsula ao pequeno-almoço", desde: "2026-04" },
      { nome: "Magnésio bisglicinato 300 mg", posologia: "1 ao deitar", desde: "2025-09" },
      { nome: "Ómega-3 EPA/DHA 2 g", posologia: "1 ao almoço", desde: "2025-06" },
      { nome: "Creatina monohidratada 5 g", posologia: "1 dose diária", desde: "2025-11" },
    ],
    antecedentesCirurgicos: [
      { intervencao: "Apendicectomia", ano: "2002", nota: "Sem complicações" },
      { intervencao: "Cesariana eletiva", ano: "2014", nota: "Gravidez de termo, recém-nascido saudável" },
    ],
    antecedentesFamiliares: [
      { familiar: "Pai", condicao: "Enfarte agudo do miocárdio", idadeDiagnostico: "58" },
      { familiar: "Pai", condicao: "Hipertensão arterial", idadeDiagnostico: "45" },
      { familiar: "Mãe", condicao: "Cancro da mama (ER+)", idadeDiagnostico: "62" },
      { familiar: "Mãe", condicao: "Hipotiroidismo de Hashimoto", idadeDiagnostico: "50" },
      { familiar: "Avô materno", condicao: "Diabetes tipo 2", idadeDiagnostico: "60" },
    ],
    alergiasMedicamentos: [
      { substancia: "Penicilina", reacao: "Urticária generalizada", gravidade: "moderada" },
      { substancia: "AINEs (ibuprofeno)", reacao: "Dispepsia marcada", gravidade: "leve" },
    ],
    habitos: {
      tabaco: "Não fumadora (ex-fumadora social até 2015)",
      alcool: "1–2 copos de vinho por semana",
      exercicio: "Caminhada 5x/semana, força 2x/semana",
      sono: "Média 6h30, deitar inconsistente",
    },
    notasGerais:
      "Utente muito aderente, boa literacia em saúde. Foco principal: redução de risco cardiovascular (história paterna) e otimização hormonal na transição perimenopausa.",
  },
  notasMedicas: [
    {
      id: "nm-1",
      data: "2024-10-14",
      autor: "Dra. Sofia Cardoso",
      tipo: "primeira",
      subjetivo:
        "Primeira consulta de longevidade. Procura abordagem preventiva pela história familiar cardiovascular. Refere fadiga vespertina e sono fragmentado.",
      objetivo:
        "TA 118/76, FC 68, IMC 23.4. Tiroide sem nódulos palpáveis. Restante exame sem alterações.",
      avaliacao:
        "Perfil de risco moderado (ApoB elevada, LDL 142). Hipotiroidismo bem controlado. Sinais precoces de perimenopausa.",
      plano:
        "Painel completo (lipidograma avançado, hormonal, metabólico). DEXA. CGM 14 dias. Reavaliar em 8 semanas.",
      proximaRevisao: "2024-12-10",
    },
    {
      id: "nm-2",
      consultaId: "cons-2",
      data: "2025-06-18",
      autor: "Dra. Sofia Cardoso",
      tipo: "seguimento",
      subjetivo: "Refere melhoria da energia. Sono ainda inconsistente, deita-se tarde 2–3x/semana.",
      objetivo: "Composição corporal estável. Massa muscular +0.8 kg desde basal.",
      avaliacao: "Boa resposta à intervenção nutricional e força. ApoB ainda acima do alvo.",
      plano:
        "Iniciar ómega-3 2 g/dia. Reforçar treino de força. Manter CGM ocasional. Reavaliar lipidograma em 3 meses.",
      proximaRevisao: "2025-09-20",
    },
    {
      id: "nm-3",
      data: "2026-03-12",
      autor: "Dra. Sofia Cardoso",
      tipo: "seguimento",
      subjetivo:
        "Mais ativa, refere mais clareza mental. Episódio único de enxaqueca em fevereiro. Preocupada com ondas de calor noturnas.",
      objetivo: "TA 116/74. Composição corporal mantida. HRV em melhoria progressiva.",
      avaliacao:
        "ApoB descida para 92 mg/dL. Vitamina D 22 ng/mL — necessita reposição. Quadro compatível com perimenopausa inicial.",
      plano:
        "Vitamina D3 5000 UI/dia 12 semanas. Discutir TRH em próxima consulta. Pedido de FSH/LH/Estradiol seriado.",
      proximaRevisao: "2026-06-08",
    },
  ],
};

// Helpers
export function calcularEstado(m: Marcador): Estado {
  const v = m.serie[m.serie.length - 1].valor;
  const [a, b] = m.alvoFuncional;
  const [la, lb] = m.intervaloLab;
  if (v >= a && v <= b) return "ok";
  // dentro do intervalo lab mas fora do alvo funcional → atenção
  if (v >= la && v <= lb) return "atencao";
  return "alerta";
}

export function calcularDirecao(m: Marcador): "up" | "down" | "flat" {
  const s = m.serie;
  if (s.length < 2) return "flat";
  const recente = s.slice(-3).reduce((acc, p) => acc + p.valor, 0) / Math.min(3, s.length);
  const anterior = s.slice(-6, -3);
  if (anterior.length === 0) return "flat";
  const base = anterior.reduce((acc, p) => acc + p.valor, 0) / anterior.length;
  const delta = (recente - base) / Math.max(Math.abs(base), 0.001);
  if (Math.abs(delta) < 0.02) return "flat";
  return delta > 0 ? "up" : "down";
}

export function formatarValor(m: Marcador): string {
  const v = m.serie[m.serie.length - 1].valor;
  if (m.id === "sono") {
    const h = Math.floor(v);
    const min = Math.round((v - h) * 60);
    return `${h}h${String(min).padStart(2, "0")}`;
  }
  if (m.id === "passos") return Math.round(v).toLocaleString("pt-PT");
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(v < 10 ? 2 : 1);
}

export function formatarData(iso: string): string {
  // Determinístico (evita mismatches SSR/cliente por timezone/locale)
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${d} ${meses[Number(mo) - 1]} ${y}`;
}

export function formatarDataCurta(iso: string): string {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, , mo, d] = m;
  return `${d} ${meses[Number(mo) - 1]}`;
}

export function formatarDataHora(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, , , d, h, mi] = m;
  return `${d} · ${h}:${mi}`;
}

/**
 * Score de longevidade 0–100 derivado dos marcadores.
 * Determinístico: cada marcador contribui com 1 (ok), 0.6 (atenção), 0.2 (alerta).
 */
export function calcularScoreLongevidade(): number {
  const pesos = { ok: 1, atencao: 0.6, alerta: 0.2 } as const;
  const usados = marcadores.filter(
    (m) => m.categoria === "analises" || m.categoria === "wearable" || m.categoria === "composicao",
  );
  const soma = usados.reduce((acc, m) => acc + pesos[calcularEstado(m)], 0);
  return Math.round((soma / usados.length) * 100);
}

export function scoreBreakdown(): { pilar: string; valor: number }[] {
  const pilares: { pilar: string; cats: Categoria[] }[] = [
    { pilar: "Cardio-metabólico", cats: ["analises"] },
    { pilar: "Composição", cats: ["composicao"] },
    { pilar: "Recuperação", cats: ["wearable"] },
  ];
  const pesos = { ok: 1, atencao: 0.6, alerta: 0.2 } as const;
  return pilares.map(({ pilar, cats }) => {
    const lista = marcadores.filter((m) => cats.includes(m.categoria));
    const soma = lista.reduce((acc, m) => acc + pesos[calcularEstado(m)], 0);
    return { pilar, valor: Math.round((soma / lista.length) * 100) };
  });
}
