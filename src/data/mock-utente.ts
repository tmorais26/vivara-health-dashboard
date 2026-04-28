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

export type TarefaPlano = {
  id: string;
  tipo: TipoTarefa;
  titulo: string;
  detalhe: string;
  marcadorId?: string;
  criadaEm: string; // ISO
  prazo?: string; // ISO ou descritivo
  feita: boolean;
  feitaEm?: string;
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
  const d = new Date(2026, 3, 15); // 15 Abril 2026 (estável)
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

function diasAtras(n: number): string {
  const d = new Date(2026, 3, 15);
  d.setDate(d.getDate() - n);
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
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}
