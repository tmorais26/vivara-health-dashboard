// Validação do pedido de orientação vindo do telemóvel (sem rede; testável).
import type { MarkerReading, NutritionLang, NutritionProfile } from "./nutrition.rules";

export interface GenInput {
  markers: MarkerReading[];
  conditions: string[];
  pregnantOrBreastfeeding: boolean;
  profile: NutritionProfile;
  lang: NutritionLang;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function validateGenInput(raw: unknown): GenInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const markersRaw = Array.isArray(r.markers) ? r.markers.slice(0, 120) : [];
  const markers: MarkerReading[] = [];
  for (const m of markersRaw as Record<string, unknown>[]) {
    const value = typeof m?.value === "number" && Number.isFinite(m.value) ? m.value : null;
    const date = typeof m?.date === "string" && DATE_RE.test(m.date) ? m.date : null;
    const name = str(m?.name, 60).trim();
    if (!name || value == null || !date) continue;
    markers.push({ name, value, unit: str(m?.unit, 30), ref: str(m?.ref, 60) || undefined, date });
  }
  const conditions = (Array.isArray(r.conditions) ? r.conditions.slice(0, 60) : []).map((c) => str(c, 120)).filter(Boolean);
  const p = (r.profile ?? {}) as Record<string, unknown>;
  return {
    markers,
    conditions,
    pregnantOrBreastfeeding: r.pregnantOrBreastfeeding === true,
    profile: {
      age: num(p.age, 0, 120),
      sex: p.sex === "F" || p.sex === "M" ? p.sex : null,
      bmi: num(p.bmi, 10, 80),
      waistCm: num(p.waistCm, 30, 250),
    },
    lang: r.lang === "en" ? "en" : "pt",
  };
}

