// Idade biológica pelo PhenoAge (Levine et al., 2018, Aging).
//
// É uma fórmula publicada, calculada aqui localmente a partir de 9
// marcadores de uma análise ao sangue mais a idade real. Não há modelo
// treinado nem pesos escolhidos por nós: os coeficientes são os do artigo.
//
// O resultado é uma ESTIMATIVA DE BEM-ESTAR. O modelo foi desenvolvido para
// prever mortalidade em populações, não para diagnosticar uma pessoa.
//
// Nunca se calcula com marcadores em falta: devolve-se a lista do que falta,
// em vez de preencher buracos com valores de demonstração ou médias.

export interface PhenoValue {
  name: string;   // nome canónico do marcador (o mesmo do painel)
  value: number;
  unit: string;   // como veio no documento; vazio = unidade convencional PT
  iso?: string;   // data da colheita
}

// Os 9 marcadores do modelo, na terminologia do painel. O "% de linfócitos"
// não está aqui porque se deriva de Linfócitos ÷ Leucócitos.
export const PHENO_NEEDS = [
  "Albumina",
  "Creatinina",
  "Glicose",
  "PCR-us",
  "Linfócitos",
  "VGM",
  "RDW",
  "Fosfatase alcalina",
  "Leucócitos",
] as const;

const unitKey = (u: string) => u.toLowerCase().replace(/[^a-z0-9µ/]/g, "");

// Converte para as unidades do artigo. Se a unidade for desconhecida ou o
// resultado cair fora do fisicamente possível, devolve null: preferível não
// calcular a calcular com um valor que provavelmente está noutra unidade.
function toModelUnit(v: PhenoValue): number | null {
  const u = unitKey(v.unit);
  const x = v.value;
  let out: number | null = null;
  switch (v.name) {
    case "Albumina": // → g/L
      out = u === "g/l" ? x : x * 10; // convencional PT: g/dL
      return out >= 15 && out <= 65 ? out : null;
    case "Creatinina": // → µmol/L
      out = u === "µmol/l" || u === "umol/l" ? x : x * 88.4; // convencional PT: mg/dL
      return out >= 20 && out <= 400 ? out : null;
    case "Glicose": // → mmol/L
      out = u === "mmol/l" ? x : x / 18.016; // convencional PT: mg/dL
      return out >= 1.5 && out <= 40 ? out : null;
    case "PCR-us": // → mg/dL (o artigo usa ln da PCR em mg/dL)
      out = u === "mg/dl" ? x : x / 10; // convencional PT: mg/L
      return out >= 0 && out <= 30 ? Math.max(out, 0.01) : null;
    case "VGM": return x >= 50 && x <= 130 ? x : null;
    case "RDW": return x >= 8 && x <= 30 ? x : null;
    case "Fosfatase alcalina": return x >= 10 && x <= 800 ? x : null;
    case "Leucócitos": return x > 0 && x <= 60 ? x : null; // 10^9/L = mil/µL
    case "Linfócitos": return x >= 0 && x <= 60 ? x : null; // 10^9/L
    default: return null;
  }
}

export type PhenoResult =
  | { status: "ok"; age: number; span: number | null }
  | { status: "missing"; missing: string[]; invalid: string[] }
  | { status: "age" };

export function phenoAge(values: PhenoValue[], chronoAge: number): PhenoResult {
  // O modelo foi construído com adultos; fora disto não se afirma nada.
  if (!Number.isFinite(chronoAge) || chronoAge < 20 || chronoAge > 100) return { status: "age" };

  const byName = new Map<string, PhenoValue>();
  for (const v of values) byName.set(v.name, v);

  const missing: string[] = [];
  const invalid: string[] = [];
  const m: Record<string, number> = {};
  for (const name of PHENO_NEEDS) {
    const v = byName.get(name);
    if (!v || !Number.isFinite(v.value)) { missing.push(name); continue; }
    const conv = toModelUnit(v);
    if (conv == null) { invalid.push(name); continue; }
    m[name] = conv;
  }
  if (missing.length || invalid.length) return { status: "missing", missing, invalid };

  const lymphPct = (m["Linfócitos"] / m["Leucócitos"]) * 100;
  if (!(lymphPct > 0 && lymphPct < 100)) return { status: "missing", missing: [], invalid: ["Linfócitos"] };

  const xb =
    -19.9067
    - 0.0336 * m["Albumina"]
    + 0.0095 * m["Creatinina"]
    + 0.1953 * m["Glicose"]
    + 0.0954 * Math.log(m["PCR-us"])
    - 0.0120 * lymphPct
    + 0.0268 * m["VGM"]
    + 0.3306 * m["RDW"]
    + 0.00188 * m["Fosfatase alcalina"]
    + 0.0554 * m["Leucócitos"]
    + 0.0804 * chronoAge;

  // Mortalidade a 120 meses: M = 1 − exp(−1,51714·e^xb / 0,0076927).
  // PhenoAge = 141,50225 + ln(−0,00553·ln(1 − M)) / 0,090165. Como
  // ln(1 − M) = −1,51714·e^xb / 0,0076927, simplifica-se sem passar por M, o
  // que evita estouros numéricos quando xb é grande.
  const arg = (0.00553 * 1.51714 * Math.exp(xb)) / 0.0076927;
  const age = 141.50225 + Math.log(arg) / 0.090165;
  if (!Number.isFinite(age)) return { status: "missing", missing: [], invalid: [...PHENO_NEEDS] };

  // Intervalo entre as colheitas usadas, em dias — para avisar quando os
  // valores vêm de datas muito afastadas.
  const dates = PHENO_NEEDS.map((n) => byName.get(n)?.iso).filter((d): d is string => !!d).map((d) => new Date(d).getTime());
  const span = dates.length > 1 ? Math.round((Math.max(...dates) - Math.min(...dates)) / 86_400_000) : null;

  return { status: "ok", age: Math.round(age * 10) / 10, span };
}
