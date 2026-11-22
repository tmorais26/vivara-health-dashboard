// Catálogo de marcadores comuns, só para sugerir o nome e a unidade ao registar.
// Os intervalos de referência NÃO vêm daqui: variam por laboratório e são escritos a partir do relatório.
export type MarcadorCatalogo = { nome: string; unidade: string; grupo: string };

export const CATALOGO_MARCADORES: MarcadorCatalogo[] = [
  // Hemograma
  { nome: "Hemoglobina", unidade: "g/dL", grupo: "Hemograma" },
  { nome: "Hematócrito", unidade: "%", grupo: "Hemograma" },
  { nome: "Eritrócitos", unidade: "10^12/L", grupo: "Hemograma" },
  { nome: "VGM", unidade: "fL", grupo: "Hemograma" },
  { nome: "Leucócitos", unidade: "10^9/L", grupo: "Hemograma" },
  { nome: "Neutrófilos", unidade: "10^9/L", grupo: "Hemograma" },
  { nome: "Linfócitos", unidade: "10^9/L", grupo: "Hemograma" },
  { nome: "Plaquetas", unidade: "10^9/L", grupo: "Hemograma" },
  // Metabolismo
  { nome: "Glicose em jejum", unidade: "mg/dL", grupo: "Metabolismo" },
  { nome: "HbA1c", unidade: "%", grupo: "Metabolismo" },
  { nome: "Insulina em jejum", unidade: "µUI/mL", grupo: "Metabolismo" },
  { nome: "HOMA-IR", unidade: "", grupo: "Metabolismo" },
  { nome: "Ácido úrico", unidade: "mg/dL", grupo: "Metabolismo" },
  // Lípidos
  { nome: "Colesterol total", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Colesterol LDL", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Colesterol HDL", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Triglicerídeos", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Colesterol não-HDL", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Apolipoproteína B", unidade: "mg/dL", grupo: "Lípidos" },
  { nome: "Lipoproteína(a)", unidade: "nmol/L", grupo: "Lípidos" },
  // Rim
  { nome: "Creatinina", unidade: "mg/dL", grupo: "Rim" },
  { nome: "TFG estimada", unidade: "mL/min/1,73m²", grupo: "Rim" },
  { nome: "Ureia", unidade: "mg/dL", grupo: "Rim" },
  { nome: "Sódio", unidade: "mmol/L", grupo: "Rim" },
  { nome: "Potássio", unidade: "mmol/L", grupo: "Rim" },
  { nome: "Microalbuminúria", unidade: "mg/g", grupo: "Rim" },
  // Fígado
  { nome: "ALT (TGP)", unidade: "U/L", grupo: "Fígado" },
  { nome: "AST (TGO)", unidade: "U/L", grupo: "Fígado" },
  { nome: "GGT", unidade: "U/L", grupo: "Fígado" },
  { nome: "Fosfatase alcalina", unidade: "U/L", grupo: "Fígado" },
  { nome: "Bilirrubina total", unidade: "mg/dL", grupo: "Fígado" },
  { nome: "Albumina", unidade: "g/dL", grupo: "Fígado" },
  // Tiroide
  { nome: "TSH", unidade: "µUI/mL", grupo: "Tiroide" },
  { nome: "T4 livre", unidade: "ng/dL", grupo: "Tiroide" },
  { nome: "T3 livre", unidade: "pg/mL", grupo: "Tiroide" },
  // Ferro e vitaminas
  { nome: "Ferritina", unidade: "ng/mL", grupo: "Ferro e vitaminas" },
  { nome: "Ferro sérico", unidade: "µg/dL", grupo: "Ferro e vitaminas" },
  { nome: "Transferrina (saturação)", unidade: "%", grupo: "Ferro e vitaminas" },
  { nome: "Vitamina D (25-OH)", unidade: "ng/mL", grupo: "Ferro e vitaminas" },
  { nome: "Vitamina B12", unidade: "pg/mL", grupo: "Ferro e vitaminas" },
  { nome: "Ácido fólico", unidade: "ng/mL", grupo: "Ferro e vitaminas" },
  { nome: "Magnésio", unidade: "mg/dL", grupo: "Ferro e vitaminas" },
  // Inflamação e outros
  { nome: "PCR", unidade: "mg/L", grupo: "Inflamação" },
  { nome: "PCR ultrassensível", unidade: "mg/L", grupo: "Inflamação" },
  { nome: "VS", unidade: "mm/h", grupo: "Inflamação" },
  { nome: "Homocisteína", unidade: "µmol/L", grupo: "Inflamação" },
  { nome: "PSA total", unidade: "ng/mL", grupo: "Outros" },
  { nome: "Cortisol", unidade: "µg/dL", grupo: "Outros" },
  { nome: "Testosterona total", unidade: "ng/dL", grupo: "Outros" },
  { nome: "Estradiol", unidade: "pg/mL", grupo: "Outros" },
  // Sinais e composição
  { nome: "Peso", unidade: "kg", grupo: "Sinais e composição" },
  { nome: "IMC", unidade: "kg/m²", grupo: "Sinais e composição" },
  { nome: "Perímetro abdominal", unidade: "cm", grupo: "Sinais e composição" },
  { nome: "Tensão arterial sistólica", unidade: "mmHg", grupo: "Sinais e composição" },
  { nome: "Tensão arterial diastólica", unidade: "mmHg", grupo: "Sinais e composição" },
  { nome: "Frequência cardíaca", unidade: "bpm", grupo: "Sinais e composição" },
  { nome: "Massa gorda", unidade: "%", grupo: "Sinais e composição" },
];

export const normalizarMarcador = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function grupoDe(nome: string) {
  const n = normalizarMarcador(nome);
  return CATALOGO_MARCADORES.find((m) => normalizarMarcador(m.nome) === n)?.grupo ?? "Outros";
}

// Aceita "5,4", "5.4", "1 234,5". Devolve null se não for número.
export function lerNumero(s: string): number | null {
  const t = s.trim().replace(/\s/g, "");
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : null;
}

export type EstadoRef = "baixo" | "normal" | "alto" | "sem_ref";

export function estadoReferencia(
  v: number | null,
  min: number | null,
  max: number | null,
): EstadoRef {
  if (v === null || (min === null && max === null)) return "sem_ref";
  if (min !== null && v < min) return "baixo";
  if (max !== null && v > max) return "alto";
  return "normal";
}

export function foraDoAlvo(v: number | null, min: number | null, max: number | null): boolean {
  if (v === null || (min === null && max === null)) return false;
  return (min !== null && v < min) || (max !== null && v > max);
}

export const formatarNumero = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("pt-PT", { maximumFractionDigits: 2 });

// "70–100", "≤ 100" ou "≥ 70", conforme os limites que existem.
export function formatarIntervalo(min: number | null, max: number | null) {
  if (min !== null && max !== null) return `${formatarNumero(min)}–${formatarNumero(max)}`;
  if (max !== null) return `≤ ${formatarNumero(max)}`;
  if (min !== null) return `≥ ${formatarNumero(min)}`;
  return "—";
}
