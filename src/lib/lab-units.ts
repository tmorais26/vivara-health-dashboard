// Unidades das análises: uma unidade de referência por marcador e as
// conversões a partir das unidades que outros laboratórios usam.
//
// Porquê: o mesmo marcador chega em unidades diferentes conforme o
// laboratório (Vitamina D em ng/mL ou nmol/L, glicose em mg/dL ou mmol/L…).
// Para a série no tempo fazer sentido, todos os valores ficam na mesma unidade.
// O valor original, tal como vem no documento, é SEMPRE guardado e mostrado
// ao lado, para a pessoa poder confirmar o que é o quê.
//
// Só se convertem unidades com fator fixo e consensual. Onde a conversão
// depende do método do laboratório (Lp(a) mg/dL ↔ nmol/L, prolactina mUI/L ↔
// ng/mL, insulina pmol/L ↔ µU/mL), NÃO se converte: o valor fica para revisão.

export interface UnitRule {
  /** Unidade em que a app mostra e compara o marcador. */
  canonical: string;
  /** Grafias equivalentes à canónica (fator 1). */
  same?: string[];
  /** Conversões: valor_canónico = valor × factor (+ offset). */
  convert?: { from: string; factor: number; offset?: number }[];
}

// Fatores de conversão de uso corrente em química clínica.
export const MARKER_UNITS: Record<string, UnitRule> = {
  // Hormonas
  "Estradiol":          { canonical: "pg/mL", convert: [{ from: "pmol/L", factor: 1 / 3.671 }] },
  "FSH":                { canonical: "mUI/mL", same: ["UI/L", "mU/mL", "IU/L", "mIU/mL"] },
  "LH":                 { canonical: "mUI/mL", same: ["UI/L", "mU/mL", "IU/L", "mIU/mL"] },
  "Progesterona":       { canonical: "ng/mL", convert: [{ from: "nmol/L", factor: 1 / 3.18 }] },
  "Testosterona total": { canonical: "ng/dL", convert: [{ from: "nmol/L", factor: 28.84 }, { from: "ng/mL", factor: 100 }] },
  "SHBG":               { canonical: "nmol/L" },
  "DHEA-S":             { canonical: "µg/dL", same: ["ug/dL"], convert: [{ from: "µmol/L", factor: 36.81 }, { from: "umol/L", factor: 36.81 }] },
  "Cortisol matinal":   { canonical: "µg/dL", same: ["ug/dL"], convert: [{ from: "nmol/L", factor: 1 / 27.59 }] },
  "Prolactina":         { canonical: "ng/mL", same: ["µg/L", "ug/L"] },
  "AMH":                { canonical: "ng/mL", convert: [{ from: "pmol/L", factor: 1 / 7.14 }] },
  // Lípidos
  "ApoB":               { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "Apo A1":             { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "LDL-C":              { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 38.67 }] },
  "HDL-C":              { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 38.67 }] },
  "Colesterol total":   { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 38.67 }] },
  "Triglicéridos":      { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 88.57 }] },
  "Lp(a)":              { canonical: "mg/dL" },          // nmol/L depende do método: não se converte
  // Metabolismo
  "HbA1c":              { canonical: "%", convert: [{ from: "mmol/mol", factor: 0.09148, offset: 2.152 }] },
  "Glicose":            { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 18.016 }] },
  "Insulina":           { canonical: "µU/mL", same: ["uU/mL", "mU/L", "mUI/L"] },
  "HOMA-IR":            { canonical: "" },               // índice sem unidade
  "Peptídeo C":         { canonical: "ng/mL", convert: [{ from: "nmol/L", factor: 3.021 }] },
  // Tiroide
  "TSH":                { canonical: "mUI/L", same: ["mU/L", "mU/mL", "µU/mL", "uU/mL", "mUI/mL", "µUI/mL"] },
  "T4 livre":           { canonical: "ng/dL", convert: [{ from: "pmol/L", factor: 1 / 12.87 }] },
  "T3 livre":           { canonical: "pg/mL", convert: [{ from: "pmol/L", factor: 1 / 1.536 }] },
  "Anti-TPO":           { canonical: "UI/mL", same: ["U/mL", "IU/mL", "kUI/L", "KU/L"] },
  // Inflamação
  "PCR-us":             { canonical: "mg/L", convert: [{ from: "mg/dL", factor: 10 }] },
  "Homocisteína":       { canonical: "µmol/L", same: ["umol/L"] },
  "Fibrinogénio":       { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "Ácido úrico":        { canonical: "mg/dL", convert: [{ from: "µmol/L", factor: 1 / 59.48 }, { from: "umol/L", factor: 1 / 59.48 }] },
  // Vitaminas e minerais
  "Vitamina D":         { canonical: "ng/mL", convert: [{ from: "nmol/L", factor: 1 / 2.496 }] },
  "Vitamina B12":       { canonical: "pg/mL", convert: [{ from: "pmol/L", factor: 1.355 }] },
  "Folato":             { canonical: "ng/mL", convert: [{ from: "nmol/L", factor: 1 / 2.266 }] },
  "Ferritina":          { canonical: "ng/mL", same: ["µg/L", "ug/L"] },
  "Ferro sérico":       { canonical: "µg/dL", same: ["ug/dL"], convert: [{ from: "µmol/L", factor: 5.585 }, { from: "umol/L", factor: 5.585 }] },
  "Transferrina":       { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "Magnésio":           { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 2.431 }] },
  "Zinco":              { canonical: "µg/dL", same: ["ug/dL"], convert: [{ from: "µmol/L", factor: 6.538 }, { from: "umol/L", factor: 6.538 }] },
  "Selénio":            { canonical: "µg/L", same: ["ug/L"], convert: [{ from: "µmol/L", factor: 78.96 }, { from: "umol/L", factor: 78.96 }] },
  "Cálcio":             { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 4.008 }] },
  "PTH":                { canonical: "pg/mL", same: ["ng/L"], convert: [{ from: "pmol/L", factor: 9.43 }] },
  "Fósforo":            { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 3.097 }] },
  // Fígado e rim
  "ALT":                { canonical: "U/L", same: ["UI/L", "IU/L"] },
  "AST":                { canonical: "U/L", same: ["UI/L", "IU/L"] },
  "GGT":                { canonical: "U/L", same: ["UI/L", "IU/L"] },
  "Fosfatase alcalina": { canonical: "U/L", same: ["UI/L", "IU/L"] },
  "Bilirrubina total":  { canonical: "mg/dL", convert: [{ from: "µmol/L", factor: 1 / 17.1 }, { from: "umol/L", factor: 1 / 17.1 }] },
  "Albumina":           { canonical: "g/dL", convert: [{ from: "g/L", factor: 0.1 }] },
  "Proteína total":     { canonical: "g/dL", convert: [{ from: "g/L", factor: 0.1 }] },
  "Creatinina":         { canonical: "mg/dL", convert: [{ from: "µmol/L", factor: 1 / 88.42 }, { from: "umol/L", factor: 1 / 88.42 }] },
  "TFG estimada":       { canonical: "mL/min/1,73m²", same: ["mL/min/1.73m2", "mL/min/1.73m²", "mL/min/1,73m2", "mL/min"] },
  "Ureia":              { canonical: "mg/dL", convert: [{ from: "mmol/L", factor: 6.006 }] },
  "Cistatina C":        { canonical: "mg/L" },
  // Hemograma
  "Hemoglobina":        { canonical: "g/dL", convert: [{ from: "g/L", factor: 0.1 }] },
  "Hematócrito":        { canonical: "%" },
  "Eritrócitos":        { canonical: "x10^12/L", same: ["10^12/L", "x1012/L", "10^6/µL", "10^6/uL"] },
  "VGM":                { canonical: "fL" },
  "HGM":                { canonical: "pg" },
  "RDW":                { canonical: "%" },
  "Leucócitos":         { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L", "x109/L"] },
  "Neutrófilos":        { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "Linfócitos":         { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "Plaquetas":          { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "Eosinófilos":        { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "CHGM":               { canonical: "g/dL", convert: [{ from: "g/L", factor: 0.1 }] },
  "Monócitos":          { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "Basófilos":          { canonical: "x10^9/L", same: ["10^9/L", "10^3/µL", "10^3/uL", "10*9/L"] },
  "Plaquetócrito":      { canonical: "%" },
  "VPM":                { canonical: "fL" },
  // Imunologia
  "IgA":                { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "IgG":                { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "IgM":                { canonical: "mg/dL", convert: [{ from: "g/L", factor: 100 }] },
  "IgE total":          { canonical: "KU/L", same: ["kU/L", "UI/mL", "IU/mL", "KUA/L"] },
  // Proteinograma: a fração em % (o g/dL é outra grandeza e não se converte).
  "Alfa-1-Globulina":   { canonical: "%" },
  "Alfa-2-Globulina":   { canonical: "%" },
  "Beta-Globulina":     { canonical: "%" },
  "Gama-Globulina":     { canonical: "%" },
};

/** Compara unidades ignorando maiúsculas, espaços, «^», «*» e µ/u. */
export const unitKey = (u: string): string =>
  (u ?? "").trim().toLowerCase().replace(/µ/g, "u").replace(/[\s^*·.]/g, "").replace(/²/g, "2");

/** Todas as unidades que a app sabe ler para um marcador. */
export function knownUnits(marker: string): string[] {
  const r = MARKER_UNITS[marker];
  if (!r) return [];
  return [r.canonical, ...(r.same ?? []), ...(r.convert ?? []).map((c) => c.from)].filter(Boolean);
}

/** Arredonda para mostrar: mais casas decimais em valores pequenos. */
export function roundForDisplay(n: number): number {
  const abs = Math.abs(n);
  const dec = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

export type UnitResult =
  | { status: "same"; value: number; unit: string }
  | { status: "converted"; value: number; unit: string; factor: number; offset: number }
  | { status: "missing" }      // o documento não traz unidade
  | { status: "unknown" }      // unidade que a app não sabe converter para este marcador
  | { status: "no-rule" };     // marcador sem regra de unidades

/** Passa um valor para a unidade de referência do marcador. */
export function toCanonical(marker: string, value: number, unit: string): UnitResult {
  const r = MARKER_UNITS[marker];
  if (!r) return { status: "no-rule" };
  const k = unitKey(unit);
  if (!k) return r.canonical === "" ? { status: "same", value, unit: "" } : { status: "missing" };
  if ([r.canonical, ...(r.same ?? [])].some((u) => unitKey(u) === k)) return { status: "same", value, unit: r.canonical };
  const c = (r.convert ?? []).find((x) => unitKey(x.from) === k);
  if (!c) return { status: "unknown" };
  const offset = c.offset ?? 0;
  return { status: "converted", value: roundForDisplay(value * c.factor + offset), unit: r.canonical, factor: c.factor, offset };
}

/**
 * Converte os números de um intervalo de referência («30 – 100», «< 5»,
 * «≥ 1,2»). Devolve "" se não conseguir: mais vale não mostrar referência do
 * que mostrar uma referência noutra unidade ao lado do valor convertido.
 */
export function convertRef(ref: string, factor: number, offset = 0): string {
  if (!ref) return "";
  const nums = ref.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length > 2) return "";
  return ref.replace(/\d+(?:[.,]\d+)?/g, (m) => String(roundForDisplay(Number(m.replace(",", ".")) * factor + offset)));
}

/** Formata número com vírgula decimal em PT. */
export const fmtNum = (n: number | string, lang: "pt" | "en"): string => {
  const s = String(n);
  return lang === "pt" ? s.replace(/\./g, ",") : s;
};
