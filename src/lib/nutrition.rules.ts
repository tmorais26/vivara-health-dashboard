// Orientação nutricional com IA — regras de segurança (sem IA, sem rede).
//
// Tudo o que decide SE a IA é chamada, O QUE lhe é enviado e SE a resposta
// pode ser mostrada vive aqui, em código determinístico e testado. A IA só
// escreve o texto dentro destes limites.
//
// [Revisão clínica obrigatória antes de abrir a utentes: os limites críticos,
// as condições sensíveis e as palavras proibidas devem ser revistos por um
// médico e por um nutricionista.]

export const NUTRITION_PROMPT_VERSION = "nutri-v1";

export type NutritionLang = "pt" | "en";

/** Marcadores com relevância nutricional: só estes vão para a IA. */
export const RELEVANT_MARKERS = [
  "LDL-C", "HDL-C", "Colesterol total", "Triglicéridos", "ApoB", "Lp(a)",
  "Glicose", "HbA1c", "Insulina", "HOMA-IR",
  "Vitamina D", "Vitamina B12", "Folato", "Ferritina", "Ferro sérico",
  "Ácido úrico", "PCR-us", "Homocisteína", "Magnésio", "Cálcio", "Zinco",
] as const;

/**
 * Zona crítica: se algum marcador estiver aqui, NÃO há orientação automática —
 * a app diz para falar com um profissional. Usa também marcadores que não vão
 * para a IA (p.ex. função renal). `max`: crítico se valor ≥ max; `min`: crítico
 * se valor < min. Valores na unidade de referência da app (lab-units.ts).
 * [Revisão clínica obrigatória.]
 */
export const CRITICAL_LIMITS: Record<string, { min?: number; max?: number; unit: string }> = {
  "HbA1c":          { max: 6.5, unit: "%" },
  "Glicose":        { max: 126, unit: "mg/dL" },
  "Triglicéridos":  { max: 500, unit: "mg/dL" },
  "LDL-C":          { max: 190, unit: "mg/dL" },
  "Ferritina":      { min: 15, unit: "ng/mL" },
  "Hemoglobina":    { min: 10, unit: "g/dL" },
  "Vitamina D":     { min: 10, unit: "ng/mL" },
  "Vitamina B12":   { min: 150, unit: "pg/mL" },
  "Ácido úrico":    { max: 10, unit: "mg/dL" },
  "Creatinina":     { max: 1.5, unit: "mg/dL" },
  "TFG estimada":   { min: 60, unit: "mL/min/1,73m²" },
  "ALT":            { max: 150, unit: "U/L" },
  "AST":            { max: 150, unit: "U/L" },
  "PCR-us":         { max: 10, unit: "mg/L" },
};

/**
 * Condições sensíveis (registadas pela pessoa em «Condições»): sem orientação
 * automática. Comparação sem acentos e sem maiúsculas, por palavra-chave.
 * [Revisão clínica obrigatória.]
 */
export const SENSITIVE_CONDITION_KEYWORDS = [
  "diabet", "renal", "rim", "rins", "nefro", "dialise", "gravid", "gestac", "amament", "lactac",
  "anorex", "bulim", "compulsao alimentar", "perturbacao alimentar", "perturbacao do comportamento alimentar",
  "cancro", "oncolog", "quimioterapia", "cirrose", "hepatic", "insuficiencia cardiaca",
  "doenca celiaca", "celiac", "fenilceton", "gota", "pancreatit", "crohn", "colite ulcerosa",
];

export interface MarkerReading {
  name: string;
  value: number;
  unit: string;
  ref?: string;
  /** Data da colheita (AAAA-MM-DD). */
  date: string;
}

export interface NutritionProfile {
  age: number | null;
  sex: "F" | "M" | null;
  bmi: number | null;
  waistCm: number | null;
}

export interface GateInput {
  markers: MarkerReading[];
  conditions: string[];
  pregnantOrBreastfeeding: boolean;
  age: number | null;
}

export type GateReason =
  | { kind: "critical"; marker: string; value: number; unit: string }
  | { kind: "condition"; condition: string }
  | { kind: "pregnancy" }
  | { kind: "minor" }
  | { kind: "no-markers" };

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/** O valor mais recente de cada marcador. */
export function latestByMarker(markers: MarkerReading[]): MarkerReading[] {
  const by = new Map<string, MarkerReading>();
  for (const m of markers) {
    if (!Number.isFinite(m.value)) continue;
    const prev = by.get(m.name);
    if (!prev || m.date > prev.date) by.set(m.name, m);
  }
  return [...by.values()];
}

/** Decide se a orientação automática pode ser gerada. Sem motivos = pode. */
export function gate(input: GateInput): GateReason[] {
  const reasons: GateReason[] = [];
  if (input.age != null && input.age < 18) reasons.push({ kind: "minor" });
  if (input.pregnantOrBreastfeeding) reasons.push({ kind: "pregnancy" });
  for (const c of input.conditions) {
    const f = fold(c);
    if (SENSITIVE_CONDITION_KEYWORDS.some((k) => new RegExp(`(^|[^a-z])${k}`).test(f))) reasons.push({ kind: "condition", condition: c });
  }
  for (const m of latestByMarker(input.markers)) {
    const lim = CRITICAL_LIMITS[m.name];
    if (!lim) continue;
    if ((lim.max != null && m.value >= lim.max) || (lim.min != null && m.value < lim.min)) {
      reasons.push({ kind: "critical", marker: m.name, value: m.value, unit: m.unit });
    }
  }
  if (!latestByMarker(input.markers).some((m) => (RELEVANT_MARKERS as readonly string[]).includes(m.name))) {
    reasons.push({ kind: "no-markers" });
  }
  return reasons;
}

export interface AiInput {
  lang: NutritionLang;
  /** Faixa etária, não a idade exata. */
  ageBand: string | null;
  sex: "F" | "M" | null;
  bmi: number | null;
  waistCm: number | null;
  markers: { name: string; value: number; unit: string; ref: string | null; date: string }[];
}

const ageBand = (age: number | null) => {
  if (age == null) return null;
  const lo = Math.floor(age / 10) * 10;
  return `${lo}-${lo + 9}`;
};

/**
 * O que vai para a IA: só marcadores com relevância nutricional (o mais
 * recente de cada), faixa etária, sexo, IMC e cintura. Nunca nome, email,
 * condições, medicação, suplementos ou identificadores.
 */
export function selectAiInput(markers: MarkerReading[], profile: NutritionProfile, lang: NutritionLang): AiInput {
  const rel = latestByMarker(markers)
    .filter((m) => (RELEVANT_MARKERS as readonly string[]).includes(m.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({ name: m.name, value: m.value, unit: m.unit, ref: m.ref?.trim() || null, date: m.date }));
  return {
    lang,
    ageBand: ageBand(profile.age),
    sex: profile.sex,
    bmi: profile.bmi != null ? Math.round(profile.bmi * 10) / 10 : null,
    waistCm: profile.waistCm,
    markers: rel,
  };
}

/** JSON com chaves ordenadas: o mesmo conteúdo dá sempre o mesmo texto (e o mesmo hash). */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

export async function inputHash(input: AiInput): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableStringify(input)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Resposta da IA ──────────────────────────────────────────────────────────

export interface GuidanceItem {
  tipo: "privilegiar" | "reduzir";
  alimento: string;
  marcador: string;
  porque: string;
}

export interface GuidanceContent {
  itens: GuidanceItem[];
  nota: string;
}

/** Esquema JSON da resposta (structured outputs). */
export const GUIDANCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["itens", "nota"],
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tipo", "alimento", "marcador", "porque"],
        properties: {
          tipo: { type: "string", enum: ["privilegiar", "reduzir"] },
          alimento: { type: "string" },
          marcador: { type: "string" },
          porque: { type: "string" },
        },
      },
    },
    nota: { type: "string" },
  },
} as const;

/**
 * Padrões proibidos na resposta. Qualquer um faz a resposta ser rejeitada.
 * [Revisão clínica obrigatória.]
 */
const BANNED: { re: RegExp; why: string }[] = [
  // doses e quantidades de suplementos/medicamentos
  { re: /\b\d+(?:[.,]\d+)?\s*(?:mg|µg|ug|mcg|ui|iu|unidades|units|c[aá]psulas?|capsules?|comprimidos?|tablets?|gotas|drops)\b/i, why: "dose" },
  { re: /\bdoses?\b|\bposologia\b|\bdosage\b/i, why: "dose" },
  { re: /c[aá]psulas?|comprimidos?|capsules?|\btablets?\b|\bpills?\b|\bampolas?\b|saquetas?/i, why: "forma farmacêutica" },
  // suplementos e medicação
  { re: /suplement|supplement/i, why: "suplemento" },
  { re: /medica[cç][aã]o|medicament|f[aá]rmac|medication|medicine|\bdrug/i, why: "medicação" },
  { re: /metformina|metformin|estatina|statin|insulina\s+(?:injet|basal|r[aá]pida)|levotiroxin|levothyrox|varfarin|warfarin|anticoagula/i, why: "medicação" },
  { re: /(?:deixar|parar|suspender|interromper|reduzir|aumentar|alterar)\s+(?:de\s+)?(?:tomar|a\s+medica|a\s+dose)|stop\s+taking|change\s+your\s+(?:dose|medication)/i, why: "alterar medicação" },
  // linguagem de diagnóstico
  { re: /diagn[oó]stic|diagnos/i, why: "diagnóstico" },
  { re: /\btem\s+(?:diabetes|pr[eé]-?diabetes|anemia|hipotiroidismo|dislipidemia|s[ií]ndrome)|\byou\s+have\s+(?:diabetes|prediabetes|anaemia|anemia)/i, why: "diagnóstico" },
  { re: /pr[eé]-?diabet|prediabet|\bdiabetes\b|\bdiabetic|\bdiab[eé]tic/i, why: "diagnóstico" },
];

export type OutputProblem =
  | { kind: "empty" }
  | { kind: "too-many"; count: number }
  | { kind: "unknown-marker"; marker: string }
  | { kind: "banned"; field: string; why: string }
  | { kind: "too-long"; field: string };

/** Verifica a resposta da IA. Sem problemas = pode ser mostrada. */
export function checkOutput(out: GuidanceContent, sentMarkers: string[]): OutputProblem[] {
  const problems: OutputProblem[] = [];
  if (!out || !Array.isArray(out.itens) || out.itens.length === 0) return [{ kind: "empty" }];
  if (out.itens.length > 12) problems.push({ kind: "too-many", count: out.itens.length });
  const sent = new Set(sentMarkers.map(fold));
  const scan = (field: string, text: string, max: number) => {
    if (typeof text !== "string") return;
    if (text.length > max) problems.push({ kind: "too-long", field });
    for (const b of BANNED) if (b.re.test(text)) { problems.push({ kind: "banned", field, why: b.why }); break; }
  };
  out.itens.forEach((it, i) => {
    if (!sent.has(fold(it.marcador))) problems.push({ kind: "unknown-marker", marker: it.marcador });
    scan(`itens[${i}].alimento`, it.alimento, 80);
    scan(`itens[${i}].porque`, it.porque, 280);
  });
  scan("nota", out.nota, 400);
  return problems;
}

/** Instruções fixas para a IA (o pedido leva só os dados). */
export function systemPrompt(lang: NutritionLang): string {
  const out = lang === "en" ? "British English" : "português europeu, tratando a pessoa por «você»";
  return [
    "És um assistente de orientação alimentar geral da Vivara Health. Escreves para pessoas sem formação em saúde.",
    "Recebes alguns marcadores de análises ao sangue de um adulto (valor, unidade, referência do laboratório e data), a faixa etária, o sexo, o IMC e a cintura.",
    "Dá orientação alimentar GERAL e de BAIXO RISCO: alimentos ou grupos de alimentos a privilegiar e a reduzir, cada um ligado a UM dos marcadores recebidos, com o motivo numa frase simples.",
    "Regras absolutas:",
    "- Não faças diagnósticos nem nomeies doenças ou síndromes. Não digas que a pessoa tem ou pode ter uma doença.",
    "- Não fales de suplementos, medicamentos ou doses, nem sugiras alterar, parar ou começar qualquer medicação ou suplemento.",
    "- Não indiques quantidades em mg, UI, cápsulas ou comprimidos. Podes usar porções do dia a dia (\"um punhado\", \"duas a três vezes por semana\").",
    "- Usa só os marcadores recebidos; no campo \"marcador\" escreve o nome exatamente como foi recebido.",
    "- Se um marcador está dentro da referência, podes sugerir manter hábitos; não inventes problemas.",
    "- Entre 3 e 10 itens. \"alimento\" curto (até 60 caracteres). \"porque\" com uma frase (até 200 caracteres).",
    "- \"nota\": uma ou duas frases gerais a lembrar que isto não substitui o acompanhamento de um profissional.",
    `Escreve em ${out}.`,
  ].join("\n");
}

export function userPrompt(input: AiInput): string {
  return `Dados (JSON):\n${stableStringify(input)}`;
}
