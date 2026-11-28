import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useContext, createContext, useRef, useCallback, useEffect, type ReactNode } from "react";
import { whoopAuthUrl, whoopExchange, whoopStatus, whoopDisconnect, type WhoopStatus } from "@/lib/whoop.server";
import { translate, LANG_STORAGE_KEY, type Lang } from "@/lib/app-v2-i18n";
import type { ExtractedDoc, ParsedValue } from "@/lib/lab-parse";
import { toCanonical, fmtNum } from "@/lib/lab-units";
import type { StoredUpload, UploadKind } from "@/lib/uploads.store";
import { phenoAge, PHENO_NEEDS, type PhenoValue } from "@/lib/bioage";
import { answer as answerQuestion, type Facts as AsstFacts, type Action as AsstAction } from "@/lib/assistant-rules";
import { CONDITION_LIST, searchConditions } from "@/lib/conditions";
import { dayKey, dayOf, monthGrid, monthName, shiftMonth } from "@/lib/calendar";
import {
  loadReminders, addReminder, removeReminder, loadConditions, saveCondition, removeCondition, loadRead, markRead,
  type Reminder, type PatientCondition, type ConditionStatus,
} from "@/lib/patient.store";
import { supabase } from "@/integrations/supabase/client";
import {
  signUpPatient, getConsentStatus, recordConsent, closeAccount, exportServerData, type ConsentStatus,
} from "@/lib/consent.functions";
import { validateSignup, type SignupField } from "@/lib/consent.validate";
import {
  LEGAL_URLS, LEGAL_LINK_PARTS, SIGNUP_CHECKBOXES, RECONSENT_CHECKBOX, EXPORT_WINDOW_DAYS, NUTRITION_AI_CONSENT, wearablePrompt,
  type SignupCheckboxId,
} from "@/lib/consent.config";
import { getMyFreeMonths } from "@/lib/referral.functions";
import {
  normalizeCode, normalizeInvite, referralParams, doctorSignupLink, asReferralResult, type ReferralResult, type FreeMonth,
} from "@/lib/referral";
import { gerarOrientacaoNutricional, getOrientacoesNutricionais, pedirValidacaoNutricional, type OrientacaoView, type OrientacoesState } from "@/lib/nutrition.functions";
import { gate, selectAiInput, inputHash, stableStringify, type GateReason, type MarkerReading, type NutritionProfile } from "@/lib/nutrition.rules";
import { DEMO_GUIDANCE } from "@/lib/nutrition.demo";
import "../app-v2.css";

export const Route = createFileRoute("/app-v2")({
  head: () => ({
    meta: [
      { title: "Vivara Health — App v2" },
      { name: "description", content: "Vivara Health app do utente — v2" },
    ],
  }),
  component: AppV2Page,
});

// ─── Types ───────────────────────────────────────────
type RouteId =
  | "home" | "data" | "upload" | "messages" | "alerts"
  | "diary" | "consultas" | "profile" | "marker" | "summary" | "schedule" | "devices" | "assistente"
  | "recomendar" | "subscricao" | "orientacao" | "pesquisa" | "notificacoes" | "privacidade" | "equipa" | "laboratorios" | "farmacia" | "exportar"
  | "sintomas" | "nutricao" | "registos" | "documento" | "guardadas" | "calendario" | "condicoes";

type NavRoute =
  | RouteId
  | { route: "marker"; marker: BioMarker }
  | { route: "documento"; docId: string }
  | { route: "registos"; view: "calendario" };

interface NavCtxValue {
  go: (r: NavRoute) => void;
  current: NavRoute;
  showToast: (msg: string) => void;
  logout: () => void;
}

type BioState = "optimal" | "good" | "attention" | "nodata";

interface BioMarker {
  name: string;
  value: string;
  unit: string;
  target: string;
  targetRange: { min: number | null; max: number | null };
  delta: string;
  spark: number[];
  tone?: "alert" | "watch";
  state: BioState;
  panel: string;
  fromUpload?: boolean; // valor veio de uma análise carregada pela utente
  /** Pontos das análises carregadas, do mais antigo para o mais recente. */
  points?: MarkerPoint[];
}

/** Um valor no historial, com a origem e o valor tal como veio no documento. */
interface MarkerPoint {
  iso: string;
  value: number;
  unit: string;
  lab: string | null;
  origValue?: string;
  origUnit?: string;
  /** Outro valor do mesmo marcador no mesmo dia, noutro documento. */
  sameDay?: { value: number; unit: string; lab: string | null }[];
}

// ─── Contexts ────────────────────────────────────────
const NavCtx = createContext<NavCtxValue>({ go: () => {}, current: "home", showToast: () => {}, logout: () => {} });
const useNav = () => useContext(NavCtx);

interface LangCtxValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  L: (pt: string, en: string) => string;
}
const LangCtx = createContext<LangCtxValue>({ lang: "pt", setLang: () => {}, t: (k) => k, L: (pt) => pt });
const useLang = () => useContext(LangCtx);

// ─── Icons ───────────────────────────────────────────
const Icon = {
  search:   <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M12 12 L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  bell:     <svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 8 a4 4 0 0 1 8 0 v3 l1 2 H4 l1-2 z M7.5 14 a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M9 1 V3.5 M9 14.5 V17 M1 9 H3.5 M14.5 9 H17 M3.4 3.4 L5.2 5.2 M12.8 12.8 L14.6 14.6 M3.4 14.6 L5.2 12.8 M12.8 5.2 L14.6 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  back:     <svg width="18" height="18" viewBox="0 0 18 18"><path d="M11 4 L5 9 L11 14" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chev:     <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3 L9 7 L5 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus:     <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 4 V16 M4 10 H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  upload:   <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 3 V12 M5 7 L9 3 L13 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M3 13 V15 H15 V13" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  share:    <svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 13 V3 M6 7 L10 3 L14 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M5 11 V16 H15 V11" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy:     <svg width="20" height="20" viewBox="0 0 20 20"><rect x="6" y="3" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M14 6 H4 a2 2 0 0 0 -2 2 V17 a2 2 0 0 0 2 2 H12 a2 2 0 0 0 2-2 V8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  home:     <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 11 L11 3 L19 11 V18 H13 V13 H9 V18 H3 Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  data:     <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 16 L8 10 L12 13 L19 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/></svg>,
  bellTab:  <svg width="22" height="22" viewBox="0 0 22 22"><path d="M6 10 a5 5 0 0 1 10 0 v4 l1.5 2 H4.5 l1.5-2 z M9 18 a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  profile:  <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 19 a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>,
  moon:     <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 9 a5 5 0 0 1 -7 -6 a5 5 0 1 0 7 6 z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>,
  heart:    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 13 L3 8 a3 3 0 0 1 5-3 a3 3 0 0 1 5 3 z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>,
  steps:    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 2 L4 7 L7 8 L6 13 M11 3 L10 8 L13 9 L12 14" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  zap:      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M9 1 L3 9 H7 L6 15 L13 7 H9 Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>,
  pill:     <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="5" width="10" height="4" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" transform="rotate(-30 7 7)"/><path d="M5.5 4.7 L8.3 7.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
  flask:    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5.5 2 V6 L3 11 a1.5 1.5 0 0 0 1.5 2 H9.5 a1.5 1.5 0 0 0 1.5 -2 L8.5 6 V2 Z M4.5 3 H9.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/></svg>,
  doc:      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1 H8.5 L11 3.5 V13 H3 Z M8.5 1 V3.5 H11" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>,
  bars:     <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 14.5 V9 M9 14.5 V3.5 M14 14.5 V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  watch:    <svg width="14" height="14" viewBox="0 0 14 14"><rect x="4" y="3" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M5.5 1 H8.5 M5.5 13 H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  sparkle:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 L13.9 9.1 L20 11 L13.9 12.9 L12 19 L10.1 12.9 L4 11 L10.1 9.1 Z"/><path d="M19 3 V6 M17.5 4.5 H20.5" strokeLinecap="round"/><path d="M5 17.5 V20.5 M3.5 19 H6.5" strokeLinecap="round"/></svg>,
  chat:     <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 5 a2 2 0 0 1 2 -2 H17 a2 2 0 0 1 2 2 V13 a2 2 0 0 1 -2 2 H8 L4 19 V15 H5 a2 2 0 0 1 -2 -2 Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
  smile:    <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="8" cy="9.5" r="1" fill="currentColor"/><circle cx="14" cy="9.5" r="1" fill="currentColor"/><path d="M7.5 13.5 Q 11 16 14.5 13.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  cal:      <svg width="22" height="22" viewBox="0 0 22 22"><rect x="3" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 9 H19 M7 3 V7 M15 3 V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  shield:   <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 L12 3.5 V7 C12 10 9.5 12.5 7 13 C4.5 12.5 2 10 2 7 V3.5 Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M5 7 L6.5 8.5 L9 5.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pulse:    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 7 H4 L5.5 2.5 L8 11 L9.5 7 H13" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
} as const;

// ─── Spark ───────────────────────────────────────────
// bandMin/bandMax (opcional): desenha faixas subtis de zona de referência atrás
// da linha — verde dentro do intervalo, vermelho fora — usando o mesmo domínio
// vertical dos dados, sem alterar o traçado nem o comportamento dos outros usos.
function Spark({ pts, color = "currentColor", w = 80, h = 22, bandMin, bandMax }: { pts: number[]; color?: string; w?: number; h?: number; bandMin?: number | null; bandMax?: number | null }) {
  // Marcadores ainda sem colheita chegam com série vazia — sem pontos não há
  // linha para desenhar, e Math.min([]) devolveria Infinity.
  if (pts.length < 2) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" x2={w} y1={h / 2} y2={h / 2} stroke="var(--fg-15)" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round"/>
      </svg>
    );
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((p) => h - 2 - ((p - min) / range) * (h - 4));
  const d = pts.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`).join(" ");
  const hasBands = bandMin !== undefined || bandMax !== undefined;
  const toY = (v: number) => Math.min(h, Math.max(0, h - 2 - ((v - min) / range) * (h - 4)));
  const yTop = hasBands && bandMax != null ? toY(bandMax) : 0;
  const yBot = hasBands && bandMin != null ? toY(bandMin) : h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {hasBands && (
        <>
          <rect x="0" y={yTop} width={w} height={Math.max(0, yBot - yTop)} fill="var(--lime)" opacity="0.18"/>
          {bandMax != null && yTop > 0 && <rect x="0" y="0" width={w} height={yTop} fill="var(--alert)" opacity="0.18"/>}
          {bandMin != null && yBot < h && <rect x="0" y={yBot} width={w} height={h - yBot} fill="var(--alert)" opacity="0.18"/>}
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2" fill={color}/>
    </svg>
  );
}

// ─── Count-up ────────────────────────────────────────
function useCountUp(target: number, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const factor = Math.pow(10, decimals);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target * factor) / factor);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);
  return value;
}

// ─── Info drawer ─────────────────────────────────────
function InfoDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("rv-no-fab");
    return () => document.body.classList.remove("rv-no-fab");
  }, []);
  return (
    <div className="rv-drawer-wrap">
      <div className="rv-drawer-backdrop" onClick={onClose} aria-label="Fechar"/>
      <div className="rv-drawer" role="dialog" aria-modal="true">
        <div className="rv-drawer-handle"/>
        <div className="rv-drawer-title">{title}</div>
        <div className="rv-drawer-body">{children}</div>
        <button type="button" className="rv-drawer-close" onClick={onClose}>Percebi</button>
      </div>
    </div>
  );
}

// ─── Idade biológica ─────────────────────────────────
// Calculada a partir de uma análise ao sangue (PhenoAge, ver lib/bioage.ts).
// Não há número fixo: se faltarem marcadores, o cartão diz quais faltam em vez
// de estimar. Os wearables não entram no número — não existe fórmula validada
// que os combine com análises, e teríamos de inventar os pesos. Ficam ao lado,
// como "ritmo" face ao próprio histórico do utente.
const IDADE_REAL = 47; // idade da persona de demonstração; o utente pode alterá-la
const AGE_KEY = "rv-profile-age-v1";

function useChronoAge(): [number, (n: number) => void] {
  const [age, setAge] = useState(IDADE_REAL);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(AGE_KEY));
      if (Number.isFinite(v) && v >= 18 && v <= 110) setAge(v);
    } catch { /* modo privado */ }
  }, []);
  const set = useCallback((n: number) => {
    setAge(n);
    try { localStorage.setItem(AGE_KEY, String(n)); } catch { /* modo privado */ }
  }, []);
  return [age, set];
}

// Valores das análises carregadas: o mais recente de cada marcador. Só estes
// contam quando há análises carregadas — misturar com os valores de
// demonstração daria uma idade calculada com metade de cada pessoa.
function phenoInputsFromUploads(uploads: StoredUpload[]): PhenoValue[] {
  const latest = new Map<string, PhenoValue>();
  for (const u of [...uploads].sort((a, b) => a.collectedISO.localeCompare(b.collectedISO))) {
    for (const v of u.values) {
      if (!v.marker) continue;
      const n = Number(v.value);
      if (!Number.isFinite(n)) continue;
      latest.set(v.marker, { name: v.marker, value: n, unit: v.unit, iso: u.collectedISO });
    }
  }
  return [...latest.values()];
}

const DEMO_PANEL_ISO = "2026-04-22"; // colheita Synlab do painel de demonstração
function phenoInputsFromDemo(): PhenoValue[] {
  return PHENO_NEEDS.flatMap((name) => {
    const b = BIOMARKERS.find((m) => m.name === name);
    return b && Number.isFinite(Number(b.value))
      ? [{ name, value: Number(b.value), unit: b.unit, iso: DEMO_PANEL_ISO }]
      : [];
  });
}

// Compara o último valor com a mediana dos anteriores. Sem juízo de valor: um
// HRV mais alto ou uma FC mais baixa não são "bons" nem "maus" por si só.
function rhythmOf(hist: number[]): { latest: number; delta: number; n: number } | null {
  if (hist.length < 4) return null;
  const latest = hist[hist.length - 1];
  const prev = hist.slice(0, -1);
  const base = median(prev);
  if (base == null) return null;
  return { latest, delta: Math.round(latest - base), n: prev.length };
}

const InfoGlyph = <span className="rv-info"><svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="1.8" r="1.1" fill="currentColor"/><path d="M5 4.4 V8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>;

function BioAgeCard({ whoop }: { whoop: WhoopStatus | null }) {
  const { t, L, lang } = useLang();
  const { go } = useNav();
  const uploads = useUploads();
  const [realAge, setRealAge] = useChronoAge();
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState(false);

  const fromUploads = uploads.length > 0;
  const inputs = fromUploads ? phenoInputsFromUploads(uploads) : phenoInputsFromDemo();
  const result = phenoAge(inputs, realAge);
  const bio = result.status === "ok" ? Math.round(result.age) : null;
  const shown = useCountUp(bio ?? 0);

  const dates = inputs.map((v) => v.iso).filter((d): d is string => !!d).sort();
  const source = fromUploads
    ? L("As suas análises carregadas", "Your uploaded labs") +
      (dates.length ? ` · ${fmtDay(dates[0], lang, true)}${dates[0] !== dates[dates.length - 1] ? ` – ${fmtDay(dates[dates.length - 1], lang, true)}` : ""}` : "")
    : L(`Análise de ${fmtDay(DEMO_PANEL_ISO, lang, true)} · Synlab (demonstração)`, `Lab from ${fmtDay(DEMO_PANEL_ISO, lang, true)} · Synlab (demo)`);

  const commitAge = (raw: string) => {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= 18 && n <= 110) setRealAge(n);
    setEditing(false);
  };
  const ageControl = editing ? (
    <input className="rv-bioage-age-input" type="number" inputMode="numeric" min={18} max={110}
      defaultValue={realAge} autoFocus
      onBlur={(e) => commitAge(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") commitAge((e.target as HTMLInputElement).value); }}
      aria-label={L("Idade real","Actual age")}/>
  ) : (
    <button type="button" className="rv-bioage-age-btn" onClick={() => setEditing(true)} aria-label={L("Alterar idade real","Change actual age")}>
      {realAge}
    </button>
  );

  // Ritmo face ao próprio histórico — só com dados reais da Whoop.
  const wm = whoop?.connected ? whoop.metrics : null;
  const rhythm = wm
    ? [
        { label: L("FC repouso","Resting HR"), unit: "bpm", r: rhythmOf(wm.history.restingHr) },
        { label: "HRV", unit: "ms", r: rhythmOf(wm.history.hrv) },
        { label: L("Sono profundo","Deep sleep"), unit: "min", r: rhythmOf(wm.history.deepSleepMin) },
      ].filter((x) => x.r != null)
    : [];

  const diff = bio != null ? realAge - bio : 0;
  const younger = diff > 0;
  const unitWord = Math.abs(diff) === 1 ? t("bioage.year") : t("bioage.years");
  const missingList = result.status === "missing" ? [...result.missing, ...result.invalid] : [];

  return (
    <>
      <div className="rv-bioage-card">
        <button type="button" className="rv-bioage-eyebrow rv-score-eyebrow-btn" onClick={() => setInfo(true)}>
          {t("bioage.eyebrow")} {InfoGlyph}
        </button>

        {result.status === "ok" && bio != null ? (
          <>
            <div className="rv-bioage-main">
              <div className="rv-bioage-num">{shown}<span className="rv-bioage-unit">{t("bioage.unit")}</span></div>
              {diff !== 0 && (
                <span className="rv-bioage-badge" data-good={younger}>
                  {younger ? "−" : "+"}{Math.abs(diff)} {unitWord}
                </span>
              )}
            </div>
            <div className="rv-bioage-sub">{t("bioage.sub")}</div>
            <div className="rv-bioage-compare">
              <div className="rv-bioage-row">
                <span className="rv-bioage-row-label">{t("bioage.biological")}</span>
                <div className="rv-bioage-bar"><div className="rv-bioage-fill" data-good={younger} style={{width: `${Math.min(100, (bio / realAge) * 100)}%`}}/></div>
                <span className="rv-bioage-row-val">{bio}</span>
              </div>
              <div className="rv-bioage-row">
                <span className="rv-bioage-row-label">{t("bioage.real")}</span>
                <div className="rv-bioage-bar"><div className="rv-bioage-fill" style={{width: "100%"}}/></div>
                <span className="rv-bioage-row-val">{ageControl}</span>
              </div>
            </div>
            <div className="rv-bioage-method">
              <strong>PhenoAge</strong> · {source}
            </div>
            {result.span != null && result.span > 90 && (
              <div className="rv-bioage-warn">
                {L(`Valores de colheitas com ${result.span} dias de intervalo — o ideal é uma única análise.`,
                   `Values from samples ${result.span} days apart — a single panel is ideal.`)}
              </div>
            )}
          </>
        ) : (
          <div className="rv-bioage-pending">
            {result.status === "age" ? (
              <>
                <div className="rv-bioage-pending-title">{L("Indique a idade real","Enter your actual age")}</div>
                <div className="rv-bioage-pending-text">{L("O cálculo é para adultos entre os 20 e os 100 anos.","The calculation is for adults aged 20 to 100.")}</div>
              </>
            ) : (
              <>
                <div className="rv-bioage-pending-title">
                  {L(`Faltam ${missingList.length} marcadores para calcular`, `${missingList.length} markers missing to calculate`)}
                </div>
                <div className="rv-bioage-pending-text">
                  {fromUploads
                    ? L("Calculada só com as suas análises carregadas, sem valores de demonstração.","Calculated only from your uploaded labs, with no demo values.")
                    : L("A idade biológica precisa de uma análise ao sangue com estes marcadores.","Biological age needs a blood panel with these markers.")}
                </div>
                <div className="rv-bioage-chips">
                  {missingList.map((m) => <span key={m} className="rv-bioage-chip">{m}</span>)}
                </div>
                {result.status === "missing" && result.invalid.length > 0 && (
                  <div className="rv-bioage-pending-text" style={{marginTop: 6}}>
                    {L("Os marcadores a vermelho estão com uma unidade que não reconheço — corrija-os na revisão.","Markers with an unrecognised unit — correct them in the review.")}
                  </div>
                )}
                <button className="rv-cta-ghost" style={{margin: "12px 0 0", width: "100%"}} onClick={() => go("upload")}>
                  {L("Carregar análise","Upload lab result")}
                </button>
              </>
            )}
            <div className="rv-bioage-pending-age">
              {L("Idade real usada","Actual age used")}: {ageControl}
            </div>
          </div>
        )}

        {rhythm.length > 0 && (
          <div className="rv-bioage-rhythm">
            <div className="rv-bioage-rhythm-head">{L("Ritmo · Whoop · face ao seu histórico","Rhythm · Whoop · vs your own history")}</div>
            {rhythm.map((x) => (
              <div key={x.label} className="rv-bioage-rhythm-row">
                <span>{x.label}</span>
                <span className="rv-bioage-rhythm-val">
                  {x.r!.latest} {x.unit}
                  <span className="rv-bioage-rhythm-delta">
                    {x.r!.delta === 0 ? "=" : x.r!.delta > 0 ? `▲ ${x.r!.delta}` : `▼ ${Math.abs(x.r!.delta)}`}
                  </span>
                </span>
              </div>
            ))}
            <div className="rv-bioage-rhythm-note">
              {L("Compara o último dia com a mediana dos anteriores. Não é uma idade e não entra no número acima.",
                 "Compares the latest day with the median of the previous ones. It isn't an age and isn't part of the number above.")}
            </div>
          </div>
        )}
      </div>
      {info && (
        <InfoDrawer title={t("bioage.drawerTitle")} onClose={() => setInfo(false)}>
          <p>{t("bioage.drawerP1a")}<strong>{t("bioage.drawerP1strong")}</strong>{t("bioage.drawerP1b")}</p>
          <p>{L("Usa a fórmula publicada PhenoAge (Levine et al., 2018) com 9 marcadores: albumina, creatinina, glicose, PCR, % de linfócitos, VGM, RDW, fosfatase alcalina e leucócitos. Se faltar algum, não se calcula.",
                "Uses the published PhenoAge formula (Levine et al., 2018) with 9 markers: albumin, creatinine, glucose, CRP, lymphocyte %, MCV, RDW, alkaline phosphatase and white cells. If any is missing, it isn't calculated.")}</p>
          <p>{L("Os dados dos wearables não entram neste número: não existe uma fórmula validada que os combine com análises. Aparecem à parte, como ritmo face ao seu próprio histórico.",
                "Wearable data isn't part of this number: there's no validated formula that combines it with labs. It appears separately, as rhythm against your own history.")}</p>
          <div className="rv-drawer-note">{t("bioage.drawerNotePre")}<strong>{t("bioage.drawerNoteStrong")}</strong>{t("bioage.drawerNotePost")}</div>
        </InfoDrawer>
      )}
    </>
  );
}

// ─── Score de longevidade ────────────────────────────
// Cardio-metabólica e Composição ainda não têm fonte de dados real ligada
// (dependem de análises e peso/composição corporal) — ficam como estimativa
// de demonstração até isso existir. Recuperação usa o recovery score da
// Whoop em tempo real assim que há um dispositivo ligado.
const SCORE_MOCK = { cardio: 71, composicao: 68, recuperacao: 82 };
const SCORE_LONGEVIDADE_MOCK = 77;

function ScoreLongevidadeCard() {
  const { t, L } = useLang();
  const getStatus = useServerFn(whoopStatus);
  const [whoop, setWhoop] = useState<WhoopStatus | null>(null);
  useEffect(() => {
    getStatus().then(setWhoop).catch(() => {});
  }, [getStatus]);

  const liveRecovery = whoop?.connected ? whoop.metrics?.recovery ?? null : null;
  const recuperacaoValor = liveRecovery ?? SCORE_MOCK.recuperacao;
  const scoreTotal = liveRecovery != null
    ? Math.round((SCORE_MOCK.cardio + SCORE_MOCK.composicao + liveRecovery) / 3)
    : SCORE_LONGEVIDADE_MOCK;

  const pilares: { key: string; valor: number; tone?: "watch"; live?: boolean }[] = [
    { key: "score.cardio",      valor: SCORE_MOCK.cardio,      tone: "watch" },
    { key: "score.composition", valor: SCORE_MOCK.composicao,  tone: "watch" },
    { key: "score.recovery",    valor: recuperacaoValor,       live: liveRecovery != null },
  ];

  const circumference = 2 * Math.PI * 27;
  const targetOffset = circumference * (1 - scoreTotal / 100);
  const [offset, setOffset] = useState(circumference);
  const [info, setInfo] = useState(false);
  const shown = useCountUp(scoreTotal);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOffset(targetOffset));
    return () => cancelAnimationFrame(raf);
  }, [targetOffset]);
  return (
    <>
      <div className="rv-score-card">
        <button type="button" className="rv-score-card-eyebrow rv-score-eyebrow-btn" onClick={() => setInfo(true)}>
          {t("score.eyebrow")} {InfoGlyph}
        </button>
        <div className="rv-score-card-value">
          <div className="rv-score-ring">
            <svg viewBox="0 0 64 64" width="52" height="52">
              <circle cx="32" cy="32" r={27} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none"/>
              <circle cx="32" cy="32" r={27} stroke="var(--lime)" strokeWidth="5" fill="none"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                transform="rotate(-90 32 32)"
                style={{transition: "stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1)"}}/>
            </svg>
          </div>
          <div className="rv-score-numblock">
            <div>
              <span className="rv-score-card-num">{shown}</span>
              <span className="rv-score-card-max">/100</span>
            </div>
            <span className="rv-score-card-delta">{t("score.delta")}</span>
          </div>
        </div>
        <div className="rv-score-card-disclaim">
          {t("score.disclaim")}
        </div>
        <div className="rv-score-breakdown">
          {pilares.map((p) => (
            <div key={p.key} className="rv-score-dim" data-tone={p.tone}>
              <div className="rv-score-dim-label">
                {t(p.key)}
                {p.live
                  ? <span className="rv-score-dim-tag" data-live="true">Whoop</span>
                  : <span className="rv-score-dim-tag">{L("estimativa","estimate")}</span>}
              </div>
              <div className="rv-score-dim-val">{p.valor}</div>
              <div className="rv-score-dim-bar"><div className="rv-score-dim-fill" style={{width: `${p.valor}%`}}/></div>
            </div>
          ))}
        </div>
      </div>
      {info && (
        <InfoDrawer title={t("score.drawerTitle")} onClose={() => setInfo(false)}>
          <p>{t("score.drawerP1a")}<strong>{t("score.drawerP1strong")}</strong>{t("score.drawerP1b")}</p>
          <ul>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--lime)"}}/><span><strong>{t("score.pillarCardioStrong")}</strong>{t("score.pillarCardio")}</span></li>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--watch)"}}/><span><strong>{t("score.pillarCompStrong")}</strong>{t("score.pillarComp")}</span></li>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--accent)"}}/><span><strong>{t("score.pillarRecStrong")}</strong>{t("score.pillarRec")}</span></li>
          </ul>
          <p>{t("score.drawerP2")}</p>
          <div className="rv-drawer-note">{t("score.drawerNotePre")}<strong>{t("score.drawerNoteStrong")}</strong>{t("score.drawerNotePost")}</div>
        </InfoDrawer>
      )}
    </>
  );
}

// ─── Whoop na home ────────────────────────────────────
// Hook partilhado: um único pedido de estado da Whoop, reutilizável em
// qualquer ecrã (home, dispositivos, perfil) sem duplicar a lógica de fetch.
function useWhoopStatus() {
  const getStatus = useServerFn(whoopStatus);
  const [status, setStatus] = useState<WhoopStatus | null>(null);
  const refresh = useCallback(async () => {
    try {
      setStatus(await getStatus());
    } catch {
      setStatus({ configured: false, connected: false, metrics: null });
    }
  }, [getStatus]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { status, refresh };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10 : sorted[mid];
}

function WhoopHomeCard({ status }: { status: WhoopStatus | null }) {
  const { go } = useNav();
  const { L } = useLang();

  if (!status?.connected || !status.metrics) return null;
  const m = status.metrics;

  return (
    <button type="button" className="rv-whoop-card rv-whoop-home" data-connected="true" onClick={() => go("devices")}>
      <div className="rv-whoop-head">
        <div className="rv-whoop-logo">W</div>
        <div className="rv-whoop-meta">
          <div className="rv-whoop-name">{L("Whoop hoje","Whoop today")}</div>
          <div className="rv-whoop-sub">{L("Sincronizado","Synced")} {formatRelative(new Date(m.lastSyncISO).getTime())}</div>
        </div>
        <span className="rv-chev">{Icon.chev}</span>
      </div>
      {/* Só métricas fixas da manhã: são todas comparáveis entre si e estáveis
          ao longo do dia. O strain acumula e vive no cartão de Dispositivos. */}
      <div className="rv-whoop-metrics">
        <WhoopMetric label={L("Recuperação","Recovery")} value={m.recovery} unit="%" />
        <WhoopMetric label="HRV" value={m.hrv} unit="ms" />
        <WhoopMetric label={L("FC repouso","Resting HR")} value={m.restingHr} unit="bpm" />
        <WhoopMetric label={L("Sono","Sleep")} value={m.sleepHours} unit="h" />
      </div>
    </button>
  );
}

// ─── Chrome ──────────────────────────────────────────
function StatusBar() {
  return (
    <div className="rv-statusbar">
      <span className="rv-statusbar-time">09:41</span>
      <span className="rv-statusbar-icons">
        <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" rx="0.8" fill="currentColor"/><rect x="4.3" y="5" width="3" height="6" rx="0.8" fill="currentColor"/><rect x="8.6" y="2.5" width="3" height="8.5" rx="0.8" fill="currentColor" opacity="0.35"/><rect x="12.9" y="0" width="3" height="11" rx="0.8" fill="currentColor" opacity="0.35"/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor"/><path d="M22 3.5 V7.5 a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.4"/></svg>
      </span>
    </div>
  );
}

// Nome pelo qual a app trata a utente (persona fictícia de demonstração).
const PATIENT_FIRST_NAME = "Maria";

function TabBar({ active }: { active: string }) {
  const { go } = useNav();
  const { t } = useLang();
  const tabs = [
    { id: "home",     label: t("tab.home"),     icon: Icon.home },
    { id: "data",     label: t("tab.data"),     icon: Icon.data },
    { id: "messages", label: t("tab.messages"), icon: Icon.chat, badge: 2, badgeTone: "alert" as const },
    { id: "profile",  label: t("tab.profile"),  icon: Icon.profile },
  ];
  return (
    <nav className="rv-tabbar">
      {tabs.map((t) => (
        <button key={t.id} className="rv-tab" data-active={active === t.id} onClick={() => go(t.id as RouteId)}>
          {t.icon}
          <span>{t.label}</span>
          {t.badge ? <span className="rv-tab-badge" data-tone={t.badgeTone}>{t.badge}</span> : null}
        </button>
      ))}
    </nav>
  );
}

// ─── Plano de hoje ───────────────────────────────────
type PlanItemType = "medication" | "supplement" | "activity";
const PLANO_HOJE: { key: string; subKey: string; time: string; free: boolean; done: boolean; type: PlanItemType }[] = [
  { key: "plan.item2", subKey: "plan.item2sub", time: "08:00", free: false, done: true,  type: "medication" },
  { key: "plan.item1", subKey: "plan.item1sub", time: "08:00", free: false, done: true,  type: "supplement" },
  { key: "plan.item3", subKey: "plan.item3sub", time: "19:00", free: false, done: false, type: "supplement" },
  { key: "plan.item4", subKey: "plan.item4sub", time: "22:30", free: false, done: false, type: "supplement" },
  { key: "plan.item5", subKey: "plan.item5sub", time: "",      free: true,  done: false, type: "activity" },
];

function PlanoHoje() {
  const { showToast, go } = useNav();
  const { t, L } = useLang();
  const [done, setDone] = useState<boolean[]>(PLANO_HOJE.map((p) => p.done));
  const toggle = (i: number) => {
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      if (next[i]) showToast(`${t(PLANO_HOJE[i].key).split(" · ")[0]} · ${t("plan.done")}`);
      return next;
    });
  };
  const groups: { type: PlanItemType; label: string }[] = [
    { type: "medication", label: L("Medicação","Medication") },
    { type: "supplement", label: L("Suplementos","Supplements") },
    { type: "activity",   label: L("Atividade","Activity") },
  ];
  return (
    <section className="rv-section">
      <div className="rv-section-head">
        <h3>{t("plan.title")}</h3>
        <span className="rv-plan-streak"><span className="rv-emoji">🔥</span> {t("plan.streak")}</span>
      </div>
      <div className="rv-plan">
        {groups.map((g) => {
          const rows = PLANO_HOJE.map((p, i) => ({ p, i })).filter(({ p }) => p.type === g.type);
          if (rows.length === 0) return null;
          return (
            <div key={g.type}>
              <div className="rv-plan-group-head">{g.label}</div>
              {rows.map(({ p, i }, gi) => (
                <button key={p.key} type="button" className="rv-plan-row" data-done={done[i] || undefined}
                  style={gi === 0 ? {borderTop: "none"} : undefined}
                  onClick={() => toggle(i)} aria-pressed={done[i]}>
                  <div className="rv-plan-check">{done[i] ? "✓" : ""}</div>
                  <div>
                    <div className="rv-plan-name">{t(p.key)}</div>
                    <div className="rv-plan-sub">{t(p.subKey)}</div>
                  </div>
                  <div className="rv-plan-time">{p.free ? t("plan.free") : p.time}</div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <a style={{display: "block", textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--fg-50)", cursor: "pointer", fontWeight: 500}} onClick={() => go("nutricao")}>
        {L("Nutrição & Suplementos — dose, objetivo e histórico","Nutrition & Supplements — dose, goal and history")}
      </a>
    </section>
  );
}

// ─── 00 Home ─────────────────────────────────────────
function HomeScreenV2() {
  const { go } = useNav();
  const { t, L } = useLang();
  const { status: whoop } = useWhoopStatus();
  const { firstName } = useAccount();
  const unreadCount = useNotifications().unread.length;
  const wm = whoop?.connected ? whoop.metrics : null;

  const deepSleepHist = wm?.history.deepSleepMin ?? [];
  const hrvHist = wm?.history.hrv ?? [];
  const restHrHist = wm?.history.restingHr ?? [];

  const deepSleepLive = deepSleepHist.length >= 2 ? median(deepSleepHist) : null;
  const hrvLive = hrvHist.length >= 2 ? wm?.hrv ?? null : null;
  const restHrLive = restHrHist.length >= 2 ? median(restHrHist) : null;

  // Cada sinal declara de onde vem, segundo a fonte principal escolhida em
  // Dispositivos — nunca há dois dispositivos a alimentar a mesma linha.
  const sleepSrc = useSourceName("sleep");
  const hrvSrc = useSourceName("hrv");
  const stepsSrc = useSourceName("steps");
  const restHrSrc = useSourceName("restingHr");
  const withSrc = (base: string, src: string | null) => (src ? `${base} · ${src}` : base);
  // Há wearable ligado mas não fornece passos (a Whoop): a linha diz isso em vez
  // de mostrar um valor de demonstração com a origem de outro dispositivo.
  const activeW = useActiveWearable();
  const stepsMissing = !!activeW && !WEARABLE_PROVIDES[activeW].includes("steps");

  return (
    <div className="rv-screen">
      <StatusBar />

      <div className="rv-home-greet">
        <div className="rv-home-greet-text">
          <div className="rv-home-greet-hi">{t("home.hi")}, {firstName}</div>
          <div className="rv-home-greet-name">{t("home.title")}</div>
        </div>
        <div className="rv-home-greet-actions">
        <button className="rv-home-bell" onClick={() => go({ route: "registos", view: "calendario" })} aria-label={L("Calendário dos seus registos", "Calendar of your records")}>
          {CalIcon}
        </button>
        <button className="rv-home-bell" onClick={() => go("alerts")} aria-label={t("home.bell")}>
          {Icon.bell}
          {unreadCount > 0 && <span className="rv-home-bell-dot"/>}
        </button>
        <button className="rv-home-avatar" onClick={() => go("profile")} aria-label={t("home.profile")}>
          <svg width="18" height="18" viewBox="0 0 22 22"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 19 a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>
        </button>
        </div>
      </div>

      <div className="rv-body">
        <BioAgeCard whoop={whoop} />
        <ScoreLongevidadeCard />
        <WhoopHomeCard status={whoop} />

        <div className="rv-actions">
          <button className="rv-action" data-accent="lime" onClick={() => go("upload")}>
            <span className="rv-action-icon">{Icon.upload}</span>
            <span>{t("action.upload")}</span>
          </button>
          <button className="rv-action" data-accent="blue" onClick={() => go("data")}>
            <span className="rv-action-icon">{Icon.bars}</span>
            <span>{t("action.analyses")}</span>
          </button>
          <button className="rv-action" data-accent="violet" onClick={() => go("summary")}>
            <span className="rv-action-icon">{Icon.doc}</span>
            <span>{t("action.summary")}</span>
          </button>
        </div>

        <section className="rv-section">
          <div className="rv-section-head">
            <h3>{t("home.signalTitle")}</h3>
            <a style={{cursor: "pointer"}} onClick={() => go("diary")}>{t("home.history")}</a>
          </div>
          <div className="rv-insight">
            <div className="rv-insight-head">
              <span className="rv-insight-head-dot"/>{t("home.observation")}
            </div>
            <div className="rv-insight-text">
              {t("home.insightPre")}<strong>{t("home.insightStrong1")}</strong>{t("home.insightMid")}<strong>{t("home.insightStrong2")}</strong>{t("home.insightPost")}
            </div>
            <div className="rv-insight-foot">
              {hrvSrc
                ? `${L("Fonte","Source")}: ${hrvSrc} · ${L("sincronizado há 4 min","synced 4 min ago")}`
                : L("Sem dispositivo ligado","No device connected")}
            </div>
          </div>
        </section>

        <section className="rv-section">
          <div className="rv-section-head">
            <h3>{t("home.last7")}</h3>
            <a style={{cursor: "pointer"}} onClick={() => go("data")}>{t("home.seeData")}</a>
          </div>
          <div className="rv-signals">
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.moon}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.deepSleep")}</span>
                <span className="rv-signal-sub">{withSrc(t("signal.deepSleepSub"), sleepSrc)}</span>
              </div>
              <span className="rv-signal-val">{deepSleepLive ?? 68} <span style={{color: "var(--fg-50)", fontSize: 11}}>min</span></span>
              <Spark pts={deepSleepHist.length >= 2 ? deepSleepHist : [60,72,54,68,80,52,68]} color="var(--lime)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.heart}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.hrv")}</span>
                <span className="rv-signal-sub">{withSrc(t("signal.hrvSub"), hrvSrc)}</span>
              </div>
              <span className="rv-signal-val">{hrvLive ?? 42} <span style={{color: "var(--fg-50)", fontSize: 11}}>ms</span></span>
              <Spark pts={hrvHist.length >= 2 ? hrvHist : [48,52,46,40,38,44,42]} color="var(--watch)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.steps}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.steps")}</span>
                <span className="rv-signal-sub">
                  {stepsMissing && activeW
                    ? L(`Não disponível em ${wearableName(activeW)}`, `Not available on ${wearableName(activeW)}`)
                    : withSrc(t("signal.stepsSub"), stepsSrc)}
                </span>
              </div>
              {stepsMissing
                ? <span className="rv-signal-val" style={{color: "var(--fg-30)"}}>—</span>
                : <>
                    <span className="rv-signal-val">7,2k</span>
                    <Spark pts={[6800,8200,5400,9100,7600,6900,7200]} color="var(--accent)"/>
                  </>}
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.zap}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.restHr")}</span>
                <span className="rv-signal-sub">{withSrc(t("signal.restHrSub"), restHrSrc)}</span>
              </div>
              <span className="rv-signal-val">{restHrLive ?? 58} <span style={{color: "var(--fg-50)", fontSize: 11}}>bpm</span></span>
              <Spark pts={restHrHist.length >= 2 ? restHrHist : [62,60,58,57,59,56,58]} color="var(--lime)"/>
            </div>
          </div>
        </section>

        <PlanoHoje />

        <section className="rv-section">
          <div className="rv-next" onClick={() => go("consultas")} style={{cursor: "pointer"}}>
            <div className="rv-next-when">
              <div className="rv-next-when-day">12</div>
              <div className="rv-next-when-month">Mai</div>
            </div>
            <div className="rv-next-meta">
              <div className="rv-next-eyebrow">{t("home.nextEyebrow")}</div>
              <div className="rv-next-name">{t("home.nextName")}</div>
              <div className="rv-next-sub">{t("home.nextSub")}</div>
            </div>
          </div>
        </section>

        <section className="rv-section">
          <div className="rv-diary-prompt" onClick={() => go("diary")}>
            <div className="rv-diary-prompt-text">
              <div className="rv-diary-prompt-title">{t("home.diaryTitle")}</div>
              <div className="rv-diary-prompt-sub">{t("home.diarySub")}</div>
            </div>
            <div className="rv-diary-prompt-faces">
              <span>😔</span><span>😐</span><span>🙂</span><span style={{opacity: 1}}>😊</span><span>🤩</span>
            </div>
          </div>
        </section>

        <div style={{height: 20}}/>
      </div>

      <TabBar active="home" />
    </div>
  );
}

// ─── Data ────────────────────────────────────────────
// Painel completo de demonstração. A série de 7 pontos de cada marcador é
// gerada de forma determinística a partir do valor atual e da variação — tem
// de ser determinística (nada de Math.random) senão o servidor e o cliente
// desenham gráficos diferentes e a hidratação parte.
const SPARK_WOBBLE = [0, 0.35, -0.2, 0.5, -0.15, 0.25, 0];

function roundLike(v: number, ref: number): number {
  if (Math.abs(ref) >= 100) return Math.round(v);
  if (Math.abs(ref) >= 10) return Math.round(v * 10) / 10;
  return Math.round(v * 100) / 100;
}

function mkSpark(end: number, deltaPct: number): number[] {
  const start = deltaPct === 0 ? end * 0.98 : end / (1 + deltaPct / 100);
  const span = end - start;
  const amp = Math.abs(span) * 0.25 || Math.abs(end) * 0.015;
  return SPARK_WOBBLE.map((w, i) => roundLike(start + span * (i / 6) + w * amp, end));
}

function deltaLabel(pct: number): string {
  if (pct === 0) return "→";
  return `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}%`;
}

// [nome, valor, unidade, alvo legível, min, max, variação %, estado, painel]
type BioRowTuple = [string, string, string, string, number | null, number | null, number, BioState, string];

const BIO_TABLE: BioRowTuple[] = [
  // Hormonal
  ["Estradiol",              "38",   "pg/mL",   "60–150",  60,   150,  -36.7, "attention", "hormonal"],
  ["FSH",                    "18.4", "mUI/mL",  "3–20",    3,    20,    22,   "good",      "hormonal"],
  ["LH",                     "9.2",  "mUI/mL",  "2–15",    2,    15,    14,   "good",      "hormonal"],
  ["Progesterona",           "0.8",  "ng/mL",   "0.2–1.5", 0.2,  1.5,  -12,   "optimal",   "hormonal"],
  ["Testosterona total",     "32",   "ng/dL",   "15–70",   15,   70,     6,   "optimal",   "hormonal"],
  ["SHBG",                   "62",   "nmol/L",  "30–90",   30,   90,     9,   "optimal",   "hormonal"],
  ["DHEA-S",                 "148",  "µg/dL",   "65–380",  65,   380,   -8,   "optimal",   "hormonal"],
  ["Cortisol matinal",       "16.2", "µg/dL",   "6–19",    6,    19,    11,   "good",      "hormonal"],
  ["Prolactina",             "12.4", "ng/mL",   "4–23",    4,    23,    -5,   "optimal",   "hormonal"],
  ["AMH",                    "0.42", "ng/mL",   "> 0.5",   0.5,  null, -28,   "attention", "hormonal"],
  ["Testosterona livre",     "—",    "pg/mL",   "0.5–5.0", 0.5,  5.0,    0,   "nodata",    "hormonal"],
  ["Cortisol salivar 23h",   "—",    "nmol/L",  "< 3.0",   null, 3.0,    0,   "nodata",    "hormonal"],
  // Cardiometabólico
  ["ApoB",                   "102",  "mg/dL",   "≤ 80",    null, 80,    -7.3, "attention", "cardio"],
  ["LDL-C",                  "118",  "mg/dL",   "≤ 100",   null, 100,   -4,   "attention", "cardio"],
  ["HDL-C",                  "62",   "mg/dL",   "≥ 60",    60,   null,   1.6, "good",      "cardio"],
  ["Colesterol total",       "218",  "mg/dL",   "< 200",   null, 200,   -3,   "attention", "cardio"],
  ["Triglicéridos",          "92",   "mg/dL",   "< 100",   null, 100,   -6,   "good",      "cardio"],
  ["Lp(a)",                  "24",   "nmol/L",  "< 75",    null, 75,     0,   "optimal",   "cardio"],
  ["Apo A1",                 "168",  "mg/dL",   "> 140",   140,  null,   5,   "optimal",   "cardio"],
  ["Rácio ApoB/ApoA1",       "0.61", "—",       "< 0.6",   null, 0.6,   -6,   "good",      "cardio"],
  ["HbA1c",                  "5.7",  "%",       "≤ 5.4",   null, 5.4,   -3.4, "attention", "cardio"],
  ["Glicose",                "98",   "mg/dL",   "70–99",   70,   99,    -2,   "good",      "cardio"],
  ["Insulina",               "12.4", "µU/mL",   "< 10",    null, 10,    -5,   "attention", "cardio"],
  ["HOMA-IR",                "3.0",  "—",       "< 2.0",   null, 2.0,   -6,   "attention", "cardio"],
  ["Rácio TG/HDL",           "1.5",  "—",       "< 2.0",   null, 2.0,   -8,   "optimal",   "cardio"],
  ["Peptídeo C",             "2.4",  "ng/mL",   "0.8–3.9", 0.8,  3.9,   -4,   "good",      "cardio"],
  ["Frutosamina",            "232",  "µmol/L",  "205–285", 205,  285,   -2,   "good",      "cardio"],
  ["NT-proBNP",              "42",   "pg/mL",   "< 125",   null, 125,    0,   "optimal",   "cardio"],
  ["Insulina pós-prandial",  "—",    "µU/mL",   "< 60",    null, 60,     0,   "nodata",    "cardio"],
  // Tiroide
  ["TSH",                    "2.1",  "mUI/L",   "0.5–2.5", 0.5,  2.5,    0,   "optimal",   "tiroide"],
  ["T4 livre",               "1.15", "ng/dL",   "0.9–1.7", 0.9,  1.7,    2,   "optimal",   "tiroide"],
  ["T3 livre",               "3.1",  "pg/mL",   "2.3–4.2", 2.3,  4.2,   -3,   "optimal",   "tiroide"],
  ["Anti-TPO",               "12",   "UI/mL",   "< 34",    null, 34,    -4,   "optimal",   "tiroide"],
  ["Anti-tiroglobulina",     "15",   "UI/mL",   "< 115",   null, 115,    0,   "optimal",   "tiroide"],
  // Inflamação
  ["PCR-us",                 "1.2",  "mg/L",    "< 1.0",   null, 1.0,   -8,   "attention", "inflam"],
  ["Homocisteína",           "6.4",  "µmol/L",  "< 8",     null, 8,      0,   "optimal",   "inflam"],
  ["Fibrinogénio",           "312",  "mg/dL",   "200–400", 200,  400,    3,   "optimal",   "inflam"],
  ["Velocidade de sedim.",   "14",   "mm/h",    "< 20",    null, 20,   -12,   "optimal",   "inflam"],
  ["IL-6",                   "2.8",  "pg/mL",   "< 3.0",   null, 3.0,   -6,   "good",      "inflam"],
  ["Ácido úrico",            "5.2",  "mg/dL",   "2.5–6.0", 2.5,  6.0,    4,   "good",      "inflam"],
  // Vitaminas e minerais
  ["Vitamina D",             "48",   "ng/mL",   "40–60",   40,   60,    14,   "optimal",   "vitaminas"],
  ["Vitamina B12",           "512",  "pg/mL",   "400–900", 400,  900,    9,   "optimal",   "vitaminas"],
  ["Folato",                 "11.2", "ng/mL",   "> 5.0",   5.0,  null,   6,   "optimal",   "vitaminas"],
  ["Ferritina",              "68",   "ng/mL",   "30–200",  30,   200,   12,   "optimal",   "vitaminas"],
  ["Ferro sérico",           "92",   "µg/dL",   "60–170",  60,   170,    4,   "optimal",   "vitaminas"],
  ["Transferrina",           "268",  "mg/dL",   "200–360", 200,  360,   -2,   "optimal",   "vitaminas"],
  ["Sat. transferrina",      "26",   "%",       "20–45",   20,   45,     3,   "optimal",   "vitaminas"],
  ["Magnésio",               "2.1",  "mg/dL",   "1.8–2.4", 1.8,  2.4,    5,   "optimal",   "vitaminas"],
  ["Zinco",                  "88",   "µg/dL",   "70–120",  70,   120,    7,   "optimal",   "vitaminas"],
  ["Selénio",                "98",   "µg/L",    "70–150",  70,   150,    2,   "optimal",   "vitaminas"],
  ["Cobre",                  "102",  "µg/dL",   "70–140",  70,   140,    0,   "optimal",   "vitaminas"],
  ["Vitamina A",             "0.52", "mg/L",    "0.3–0.8", 0.3,  0.8,    3,   "optimal",   "vitaminas"],
  ["Vitamina E",             "12.4", "mg/L",    "5–18",    5,    18,     4,   "optimal",   "vitaminas"],
  ["Iodo urinário",          "118",  "µg/L",    "100–200", 100,  200,   -6,   "good",      "vitaminas"],
  ["Cálcio",                 "9.4",  "mg/dL",   "8.6–10.2",8.6,  10.2,   1,   "optimal",   "vitaminas"],
  ["PTH",                    "42",   "pg/mL",   "15–65",   15,   65,    -6,   "optimal",   "vitaminas"],
  ["Fósforo",                "3.4",  "mg/dL",   "2.5–4.5", 2.5,  4.5,    0,   "optimal",   "vitaminas"],
  ["Índice Ómega-3",         "—",    "%",       "> 8",     8,    null,   0,   "nodata",    "vitaminas"],
  // Fígado e rim
  ["ALT",                    "22",   "U/L",     "< 33",    null, 33,    -8,   "optimal",   "figado"],
  ["AST",                    "20",   "U/L",     "< 32",    null, 32,    -5,   "optimal",   "figado"],
  ["GGT",                    "28",   "U/L",     "< 40",    null, 40,   -12,   "optimal",   "figado"],
  ["Fosfatase alcalina",     "68",   "U/L",     "35–105",  35,   105,    2,   "optimal",   "figado"],
  ["Bilirrubina total",      "0.6",  "mg/dL",   "0.2–1.2", 0.2,  1.2,   -4,   "optimal",   "figado"],
  ["Albumina",               "4.4",  "g/dL",    "3.5–5.0", 3.5,  5.0,    1,   "optimal",   "figado"],
  ["Proteína total",         "7.1",  "g/dL",    "6.4–8.3", 6.4,  8.3,    0,   "optimal",   "figado"],
  ["Creatinina",             "0.82", "mg/dL",   "0.5–1.0", 0.5,  1.0,    2,   "optimal",   "figado"],
  ["TFG estimada",           "92",   "mL/min",  "> 90",    90,   null,  -3,   "good",      "figado"],
  ["Ureia",                  "32",   "mg/dL",   "15–45",   15,   45,     5,   "optimal",   "figado"],
  ["Cistatina C",            "0.88", "mg/L",    "0.6–1.0", 0.6,  1.0,    3,   "good",      "figado"],
  ["Rácio alb./creat.",      "12",   "mg/g",    "< 30",    null, 30,    -6,   "optimal",   "figado"],
  // Hematologia
  ["Hemoglobina",            "13.4", "g/dL",    "12–16",   12,   16,     2,   "optimal",   "hemato"],
  ["Hematócrito",            "40.2", "%",       "36–46",   36,   46,     1,   "optimal",   "hemato"],
  ["Eritrócitos",            "4.6",  "10¹²/L",  "4.0–5.2", 4.0,  5.2,    0,   "optimal",   "hemato"],
  ["VGM",                    "88",   "fL",      "80–100",  80,   100,    1,   "optimal",   "hemato"],
  ["HGM",                    "29.4", "pg",      "27–33",   27,   33,     0,   "optimal",   "hemato"],
  ["RDW",                    "13.1", "%",       "11.5–14.5",11.5,14.5,  -2,   "optimal",   "hemato"],
  ["Leucócitos",             "6.2",  "10⁹/L",   "4.0–10.0",4.0,  10.0,  -4,   "optimal",   "hemato"],
  ["Neutrófilos",            "3.6",  "10⁹/L",   "1.8–7.0", 1.8,  7.0,   -3,   "optimal",   "hemato"],
  ["Linfócitos",             "2.0",  "10⁹/L",   "1.0–3.5", 1.0,  3.5,    2,   "optimal",   "hemato"],
  ["Rácio neutr./linf.",     "1.8",  "—",       "< 2.5",   null, 2.5,   -5,   "good",      "hemato"],
  ["Plaquetas",              "248",  "10⁹/L",   "150–400", 150,  400,    3,   "optimal",   "hemato"],
  ["Eosinófilos",            "0.18", "10⁹/L",   "0.0–0.5", 0.0,  0.5,   -8,   "optimal",   "hemato"],
];

// O tom antigo ("alert"/"watch"/ausente) continua a comandar a cor das linhas
// e sparklines já existentes; deriva-se do estado para não haver duas fontes
// de verdade sobre o mesmo marcador.
function toneFromState(state: BioState, deltaPct: number): "alert" | "watch" | undefined {
  if (state !== "attention") return undefined;
  return Math.abs(deltaPct) >= 20 ? "alert" : "watch";
}

const BIOMARKERS: BioMarker[] = BIO_TABLE.map(([name, value, unit, target, min, max, deltaPct, state, panel]) => ({
  name, value, unit, target,
  targetRange: { min, max },
  delta: state === "nodata" ? "—" : deltaLabel(deltaPct),
  spark: state === "nodata" ? [] : mkSpark(Number(value), deltaPct),
  tone: toneFromState(state, deltaPct),
  state, panel,
}));

// ─── Análises carregadas entram no historial ─────────
// Depois de confirmados na revisão, os valores lidos passam a ser os valores
// do marcador: substituem o do painel de demonstração e, havendo mais do que
// uma colheita, formam a linha de tendência. Marcadores que o painel não
// tinha são acrescentados. O que fica em memória é sempre a colheita mais
// recente — as anteriores ficam na série.
function parseRefRange(ref: string): { min: number | null; max: number | null } {
  const range = ref.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)$/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const upper = ref.match(/^[<≤]\s*(-?\d+(?:\.\d+)?)$/);
  if (upper) return { min: null, max: Number(upper[1]) };
  const lower = ref.match(/^[>≥]\s*(-?\d+(?:\.\d+)?)$/);
  if (lower) return { min: Number(lower[1]), max: null };
  return { min: null, max: null };
}

function stateFromRange(v: number, r: { min: number | null; max: number | null }): BioState {
  if (r.min == null && r.max == null) return "good";
  if (r.min != null && v < r.min) return "attention";
  if (r.max != null && v > r.max) return "attention";
  return "optimal";
}

function mergeUploads(base: BioMarker[], uploads: StoredUpload[]): BioMarker[] {
  if (uploads.length === 0) return base;

  // Série por marcador, da colheita mais antiga para a mais recente. Se o
  // mesmo marcador aparece no mesmo dia em dois documentos, fica o do
  // documento mais completo e o outro é mostrado como nota nesse ponto.
  const series = new Map<string, (MarkerPoint & { ref: string; docSize: number })[]>();
  for (const u of [...uploads].sort((a, b) => a.collectedISO.localeCompare(b.collectedISO))) {
    for (const v of u.values) {
      if (!v.marker) continue;
      const num = Number(v.value);
      if (!Number.isFinite(num)) continue;
      if (!series.has(v.marker)) series.set(v.marker, []);
      const list = series.get(v.marker)!;
      const day = u.collectedISO.slice(0, 10);
      const pt: MarkerPoint & { ref: string; docSize: number } = { iso: u.collectedISO, value: num, unit: v.unit, ref: v.ref, lab: u.lab, origValue: v.origValue, origUnit: v.origUnit, docSize: u.values.length };
      const same = list.find((p) => p.iso.slice(0, 10) === day);
      if (!same) { list.push(pt); continue; }
      if (same.value === num && same.unit === v.unit) continue;   // o mesmo valor repetido
      const keepNew = pt.docSize > same.docSize;
      const winner = keepNew ? pt : same;
      const loser = keepNew ? same : pt;
      winner.sameDay = [...(same.sameDay ?? []), { value: loser.value, unit: loser.unit, lab: loser.lab }];
      if (keepNew) list[list.indexOf(same)] = winner;
    }
  }
  if (series.size === 0) return base;

  const shape = (name: string, pts: (MarkerPoint & { ref: string })[], prev?: BioMarker): BioMarker => {
    const last = pts[pts.length - 1];
    const range = prev && (prev.targetRange.min != null || prev.targetRange.max != null)
      ? prev.targetRange
      : parseRefRange(last.ref);
    const first = pts[0];
    const pct = pts.length >= 2 && first.value !== 0
      ? Math.round(((last.value - first.value) / Math.abs(first.value)) * 1000) / 10
      : 0;
    const state = stateFromRange(last.value, range);
    return {
      name,
      value: String(last.value),
      unit: last.unit || prev?.unit || "",
      target: prev?.target || last.ref || "—",
      targetRange: range,
      delta: pts.length >= 2 ? deltaLabel(pct) : "→",
      spark: pts.length >= 2 ? pts.map((p) => p.value) : [],
      tone: toneFromState(state, pct),
      state,
      panel: prev?.panel ?? "carregados",
      fromUpload: true,
      points: pts.map(({ iso, value, unit, lab, origValue, origUnit, sameDay }) => ({ iso, value, unit, lab, origValue, origUnit, sameDay })),
    };
  };

  const merged = base.map((b) => {
    const pts = series.get(b.name);
    return pts ? shape(b.name, pts, b) : b;
  });
  const known = new Set(base.map((b) => b.name));
  for (const [name, pts] of series) if (!known.has(name)) merged.push(shape(name, pts));
  return merged;
}

const BIOS_ALERT = BIOMARKERS.filter((b) => b.state === "attention");
const BIOS_OK = BIOMARKERS.filter((b) => b.state === "optimal" || b.state === "good");
const BIOS_NODATA = BIOMARKERS.filter((b) => b.state === "nodata");

// Painéis temáticos: agrupamento definido pela equipa clínica no portal do
// médico e refletido aqui. "Painel de Recuperação" não entra porque HRV, sono
// e FC repouso são sinais do wearable (cartão Whoop), não análises de sangue
// com alvo laboratorial como as desta lista.
interface BioPanel { id: string; namePt: string; nameEn: string; icon: ReactNode }
const BIO_PANELS: BioPanel[] = [
  { id: "hormonal",  namePt: "Hormonal",           nameEn: "Hormonal",          icon: Icon.flask },
  { id: "cardio",    namePt: "Cardiometabólico",   nameEn: "Cardiometabolic",   icon: Icon.heart },
  { id: "tiroide",   namePt: "Tiroide",            nameEn: "Thyroid",           icon: Icon.zap },
  { id: "inflam",    namePt: "Inflamação",         nameEn: "Inflammation",      icon: Icon.pulse },
  { id: "vitaminas", namePt: "Vitaminas e minerais", nameEn: "Vitamins & minerals", icon: Icon.pill },
  { id: "figado",    namePt: "Fígado e rim",       nameEn: "Liver & kidney",    icon: Icon.flask },
  { id: "hemato",    namePt: "Hematologia",        nameEn: "Haematology",       icon: Icon.heart },
  { id: "carregados", namePt: "Das suas análises", nameEn: "From your labs", icon: Icon.doc },
];

// Notas de contexto clínico escritas pela equipa médica. Ficam aqui em vez de
// embutidas no ecrã de detalhe porque a ferramenta de pesquisa também as
// mostra — e tem de mostrar exactamente o mesmo texto, nunca uma paráfrase.
interface ClinicalNote { pt: string; en: string; byPt: string; byEn: string; iso: string }

const CLINICAL_NOTES: Record<string, ClinicalNote> = {
  "Estradiol": {
    pt: "Tendência descendente consistente nos últimos 6 meses, compatível com transição peri-menopáusica. Pedida nova colheita até 10 mai para confirmar valor antes de iniciar plano de reposição.",
    en: "Consistent downward trend over the last 6 months, compatible with peri-menopausal transition. New sample requested by 10 May to confirm the value before starting a replacement plan.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "ApoB": {
    pt: "Em descida progressiva desde o início da Berberina (jan 26). Manter plano actual e reavaliar em 8 semanas.",
    en: "Progressively decreasing since Berberine started (Jan 26). Keep the current plan and reassess in 8 weeks.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "HbA1c": {
    pt: "Descida lenta mas sustentada desde o ajuste da Metformina. Objectivo mantém-se em ≤ 5.4. Reavaliar na próxima colheita.",
    en: "Slow but sustained decrease since the Metformin adjustment. Target remains ≤ 5.4. Reassess at the next sample.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "LDL-C": {
    pt: "Acompanha a descida do ApoB. Sem alteração à medicação nesta fase — a prioridade é o ApoB como marcador principal.",
    en: "Tracking the ApoB decrease. No medication change at this stage — ApoB remains the primary marker.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "Insulina": {
    pt: "Em melhoria gradual. Associada ao HOMA-IR — os dois são reavaliados em conjunto na próxima consulta.",
    en: "Gradually improving. Linked to HOMA-IR — both are reassessed together at the next appointment.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "PCR-us": {
    pt: "Ligeiramente acima do alvo, sem sinais de infecção activa. A vigiar em conjunto com o perfil lipídico.",
    en: "Slightly above target, with no signs of active infection. Monitored alongside the lipid profile.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "Vitamina D": {
    pt: "Subiu de 28 para 48 ng/mL com a dose actual de 4000 UI. Manter dose e reavaliar no inverno.",
    en: "Rose from 28 to 48 ng/mL on the current 4000 IU dose. Keep the dose and reassess in winter.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
  "AMH": {
    pt: "Valor esperado para a fase de transição. Não requer acção isolada — interpretado em conjunto com Estradiol e FSH.",
    en: "Expected for this transition stage. No isolated action needed — interpreted together with Estradiol and FSH.",
    byPt: "Médica responsável", byEn: "Responsible doctor", iso: "2026-04-22",
  },
};

const BIO_STATE_META: { state: BioState; color: string; pt: string; en: string }[] = [
  { state: "optimal",   color: "var(--lime)",     pt: "Optimizado",      en: "Optimised" },
  { state: "good",      color: "var(--bio-good)", pt: "Bom",             en: "Good" },
  { state: "attention", color: "var(--watch)",    pt: "Precisa atenção", en: "Needs attention" },
  { state: "nodata",    color: "var(--fg-15)",    pt: "Sem dados",       en: "No data" },
];

// Resumo do painel numa faixa: uma barra de proporção e as contagens. A
// grelha de pontos que estava aqui foi retirada — 82 pontos abstractos
// ocupavam meio ecrã acima da lista sem dizer nada que a contagem não diga,
// e empurravam para baixo os valores, que são o que interessa ler.
function BioStateSummary({ markers }: { markers: BioMarker[] }) {
  const { L } = useLang();
  const counts = BIO_STATE_META.map((meta) => ({
    ...meta,
    n: markers.filter((m) => m.state === meta.state).length,
  })).filter((c) => c.n > 0);
  const total = markers.length || 1;

  return (
    <div className="rv-biosum">
      <div className="rv-biosum-bar">
        {counts.map((c) => (
          <span key={c.state} style={{ background: c.color, width: `${(c.n / total) * 100}%` }}/>
        ))}
      </div>
      <div className="rv-biosum-counts">
        {counts.map((c) => (
          <span key={c.state} className="rv-biosum-item">
            <span className="rv-biosum-dot" style={{ background: c.color }}/>
            <strong>{c.n}</strong> {L(c.pt, c.en)}
          </span>
        ))}
      </div>
    </div>
  );
}

function BioRow({ b }: { b: BioMarker }) {
  const { go } = useNav();
  const { L } = useLang();
  const valTone = b.tone || "ok";
  const sparkCol = b.tone === "alert" ? "var(--alert)" : b.tone === "watch" ? "var(--watch)" : "var(--lime)";
  return (
    <div className="rv-bio-row" data-status={valTone} onClick={() => go({ route: "marker", marker: b })} style={{cursor: "pointer"}}>
      <div className="rv-bio-row-meta">
        <div className="rv-bio-row-name">
          {b.name}
          {b.fromUpload && <span className="rv-bio-mine">{L("seu","yours")}</span>}
        </div>
        <div className="rv-bio-row-target">{L("alvo","target")} {b.target}</div>
      </div>
      <Spark pts={b.spark} color={sparkCol} w={90} h={26} bandMin={b.targetRange.min} bandMax={b.targetRange.max}/>
      <div className="rv-bio-row-vals">
        <div className="rv-bio-row-val" data-tone={valTone}>{b.value}</div>
        <div className="rv-bio-row-delta">{b.delta}</div>
      </div>
    </div>
  );
}

function PeriodChips({ className = "rv-dados-period" }: { className?: string }) {
  const { t } = useLang();
  const [p, setP] = useState("period.1y");
  const opts = ["period.3m", "period.6m", "period.1y", "period.2y", "period.all"];
  return (
    <div className={className}>
      {opts.map((o) => (
        <button key={o} className="rv-period-chip" data-active={p === o ? "true" : undefined} onClick={() => setP(o)}>{t(o)}</button>
      ))}
    </div>
  );
}

// ─── 01 Dados ────────────────────────────────────────
function DadosScreen() {
  const { go } = useNav();
  const { t, L } = useLang();
  const [panelId, setPanelId] = useState<string | null>(null);
  const uploads = useUploads();
  // Os valores confirmados nas análises carregadas substituem os do painel de
  // demonstração — é aqui que "ir para o histórico" acontece.
  const markers = mergeUploads(BIOMARKERS, uploads);
  // "Das suas análises" agrupa por proveniência, não por painel temático: um
  // marcador carregado continua a pertencer ao painel dele (a glicose é
  // cardiometabólica venha de onde vier), e o que muda é a origem do valor.
  const inPanel = (b: BioMarker) =>
    panelId === null || (panelId === "carregados" ? !!b.fromUpload : b.panel === panelId);
  const gridList = markers.filter(inPanel);
  const alertList = markers.filter((b) => b.state === "attention").filter(inPanel);
  const okList = markers.filter((b) => b.state === "optimal" || b.state === "good").filter(inPanel);
  const noDataList = markers.filter((b) => b.state === "nodata").filter(inPanel);
  const uploadedCount = markers.filter((b) => b.fromUpload).length;

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">{t("data.title")}</div>
        <button className="rv-header-btn" onClick={() => go("pesquisa")} aria-label={t("data.search")}>{Icon.search}</button>
      </header>

      <div className="rv-body">
        <PeriodChips />

        <div className="rv-panel-chips">
          <button className="rv-period-chip" data-active={panelId === null || undefined} onClick={() => setPanelId(null)}>{L("Ver tudo","View all")}</button>
          {BIO_PANELS.filter((p) => p.id !== "carregados" || uploadedCount > 0).map((p) => (
            <button key={p.id} className="rv-period-chip" data-active={panelId === p.id || undefined} onClick={() => setPanelId(p.id)}>
              <span style={{display: "inline-flex", verticalAlign: "-3px", marginRight: 4}}>{p.icon}</span>{L(p.namePt, p.nameEn)}
            </button>
          ))}
        </div>

        <BioStateSummary markers={gridList} />
        {uploadedCount > 0 && (
          <div className="rv-bio-fromyou">
            {L(`${uploadedCount} valores vêm das suas análises carregadas`,
               `${uploadedCount} values come from your uploaded labs`)}
          </div>
        )}

        <div className="rv-list">
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("registos")}>
            <div className="rv-list-icon">{Icon.doc}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Registos","Records")}</span>
              <span className="rv-list-sub">{L("Sintomas, consultas, medicação e análises","Symptoms, appointments, medication and labs")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("orientacao")}>
            <div className="rv-list-icon">{Icon.sparkle}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Ver orientação nutricional","See dietary guidance")}</span>
              <span className="rv-list-sub">{L("Gerado por AI a partir das suas análises","AI-generated from your lab results")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("sintomas")}>
            <div className="rv-list-icon">{Icon.pulse}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Sintomas","Symptoms")}</span>
              <span className="rv-list-sub">{L("Registo, histórico e tendências","Log, history and trends")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
        </div>

        {alertList.length > 0 && (
          <>
            <div className="rv-bio-section-head" data-tone="alert">
              <span className="rv-dot"/>{L("Fora do alvo","Off target")} · {alertList.length}
            </div>
            <div className="rv-bio-list">
              {alertList.map((b, i) => <BioRow key={i} b={b}/>)}
            </div>
          </>
        )}

        {okList.length > 0 && (
          <>
            <div className="rv-bio-section-head">
              <span className="rv-dot"/>{L("Dentro do alvo","On target")} · {okList.length}
            </div>
            <div className="rv-bio-list">
              {okList.map((b, i) => <BioRow key={i} b={b}/>)}
            </div>
          </>
        )}

        {noDataList.length > 0 && (
          <>
            <div className="rv-bio-section-head" style={{color: "var(--fg-30)"}}>
              <span className="rv-dot"/>{L("Sem dados","No data")} · {noDataList.length}
            </div>
            <div className="rv-bio-list">
              {noDataList.map((b, i) => <BioRow key={i} b={b}/>)}
            </div>
          </>
        )}

        <div style={{height: 100}}/>
      </div>

      <button className="rv-fab" aria-label={t("data.uploadAnalysis")} onClick={() => go("upload")}>{Icon.plus}</button>
      <TabBar active="data" />
    </div>
  );
}

// ─── Marker Detail ───────────────────────────────────
function MarkerDetail({ marker }: { marker?: BioMarker }) {
  const { go } = useNav();
  const { t, L, lang } = useLang();
  const m: BioMarker = marker ?? BIOMARKERS[0];
  const note = CLINICAL_NOTES[m.name];
  const tone = m.tone || "ok";
  const col = tone === "alert" ? "var(--alert)" : tone === "watch" ? "var(--watch)" : "var(--lime)";
  const pts = m.spark;
  const hasSeries = pts.length >= 2;
  const min = hasSeries ? Math.min(...pts) * 0.75 : 0;
  const max = hasSeries ? Math.max(...pts) * 1.25 : 1;
  const W = 360, H = 180;
  const xs = pts.map((_, i) => 10 + (i / (pts.length - 1)) * (W - 20));
  const ys = pts.map((p) => H - 10 - ((p - min) / (max - min)) * (H - 20));
  const path = pts.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  // Sem pontos não há área para fechar — xs[-1] seria undefined.
  const area = hasSeries ? `${path} L ${xs[xs.length-1].toFixed(1)} ${H-10} L ${xs[0].toFixed(1)} ${H-10} Z` : "";
  const toY = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 20);
  const bandY1 = m.targetRange.max != null ? toY(m.targetRange.max) : null; // limite superior
  const bandY2 = m.targetRange.min != null ? toY(m.targetRange.min) : null; // limite inferior
  // Pontos reais (análises carregadas): onde muda o laboratório desenha-se uma
  // linha, e no historial cada valor diz de onde veio.
  const real = m.points && m.points.length === pts.length ? m.points : null;
  const labOf = (p: MarkerPoint) => p.lab ?? L("Laboratório não identificado", "Unidentified lab");
  const labChanges = real ? real.map((p, i) => i > 0 && labOf(p) !== labOf(real[i - 1])) : [];
  const labsCount = real ? new Set(real.map(labOf)).size : 0;

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("data")}>{Icon.back}</button>
        <div className="rv-header-title">{m.name}</div>
        <div style={{width: 36}} />
      </header>

      <div className="rv-body">
        <div className="rv-marker-hero">
          <div className="rv-marker-hero-row">
            <div className="rv-marker-hero-val" style={{color: col}}>{m.value}<span className="rv-marker-hero-unit">{m.unit}</span></div>
            <div className="rv-marker-hero-delta" data-tone={tone}>{m.delta}</div>
          </div>
          <div className="rv-marker-hero-target">
            {L("alvo","target")} {m.target}
            {hasSeries
              ? ` · ${real ? L(`última colheita ${fmtDay(real[real.length - 1].iso.slice(0, 10), "pt", true)}`, `last sample ${fmtDay(real[real.length - 1].iso.slice(0, 10), "en", true)}`) : t("marker.lastCollection")}`
              : ` · ${L("sem colheita","no sample yet")}`}
          </div>
        </div>

        {hasSeries && <PeriodChips className="rv-marker-period" />}

        {hasSeries ? (
          <div className="rv-marker-chart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
              {bandY1 != null && bandY2 != null && (
                <rect x="0" y={bandY1} width={W} height={bandY2 - bandY1} fill="var(--lime)" opacity="0.10"/>
              )}
              {bandY1 != null && <line x1="0" x2={W} y1={bandY1} y2={bandY1} stroke="var(--lime)" strokeOpacity="0.5" strokeDasharray="3 3"/>}
              {bandY2 != null && <line x1="0" x2={W} y1={bandY2} y2={bandY2} stroke="var(--lime)" strokeOpacity="0.5" strokeDasharray="3 3"/>}
              <path d={area} fill={col} opacity="0.15"/>
              <path d={path} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {labChanges.map((ch, i) => ch && (
                <line key={`lab-${i}`} x1={(xs[i] + xs[i - 1]) / 2} x2={(xs[i] + xs[i - 1]) / 2} y1="4" y2={H - 4}
                  stroke="var(--fg-50)" strokeOpacity="0.6" strokeDasharray="2 4"/>
              ))}
              {pts.map((_, i) => (
                <circle key={i} cx={xs[i]} cy={ys[i]} r={i === pts.length - 1 ? 4.5 : 2.5}
                  fill={i === pts.length - 1 ? col : "var(--bg-elev)"} stroke={col} strokeWidth="1.5"/>
              ))}
            </svg>
            <div className="rv-marker-chart-axis">
              {real
                ? <><span>{fmtDay(real[0].iso.slice(0, 10), lang, true)}</span><span>{fmtDay(real[real.length - 1].iso.slice(0, 10), lang, true)}</span></>
                : <><span>out 25</span><span>dez 25</span><span>fev 26</span><span>abr 26</span></>}
            </div>
            {labsCount > 1 && (
              <div className="rv-marker-labnote">
                <span className="rv-marker-labnote-line" aria-hidden="true"/>
                {L("Linha tracejada: mudança de laboratório.", "Dashed line: change of lab.")}
              </div>
            )}
          </div>
        ) : (
          <div className="rv-info-note" style={{margin: "0 20px 14px"}}>
            <strong>{L("Ainda sem colheita","No sample yet")}</strong>
            <span>{L("Este marcador faz parte do seu painel mas ainda não foi medido. Aparece na próxima requisição da equipa clínica.","This marker is part of your panel but hasn't been measured yet. It will be included in your clinical team's next request.")}</span>
          </div>
        )}

        {/* A nota da equipa clínica é sobre os valores de demonstração: com
            valores carregados pela pessoa não se mostra, para não contradizer. */}
        {hasSeries && !real && <div className="rv-marker-context">
          <div className="rv-marker-context-head">
            <span className="rv-dot" data-tone={tone}/>{t("marker.contextHead")}
          </div>
          <div className="rv-marker-context-body">
            {note
              ? L(note.pt, note.en)
              : L("Valor em monitorização. Sem alteração ao plano nesta consulta.",
                  "Value under monitoring. No change to the plan at this appointment.")}
          </div>
        </div>}

        {hasSeries && (
          <div className="rv-marker-history">
            <div className="rv-section-head" style={{margin: "0 0 8px"}}>
              <h3>{t("marker.history")}</h3>
              <a>{t("marker.seeAll")}</a>
            </div>
            {real ? (
              <>
                {labsCount > 1 && (
                  <div className="rv-info-note" style={{margin: "0 0 10px"}}>
                    <strong>{L("Valores de laboratórios diferentes", "Values from different labs")}</strong>
                    <span>{L("Cada laboratório tem o seu método e os seus valores de referência, por isso podem existir pequenas diferenças só por isso. Para saber o que significam, fale com a sua equipa clínica.",
                             "Each lab has its own method and reference values, so small differences can come from that alone. To know what they mean, talk to your clinical team.")}</span>
                  </div>
                )}
                <div className="rv-marker-rows">
                  {[...real].reverse().map((p, i, arr) => {
                    const prevLab = arr[i + 1] ? labOf(arr[i + 1]) : null;
                    const changed = prevLab != null && prevLab !== labOf(p);
                    return (
                      <div key={p.iso + i} className="rv-marker-row rv-marker-row--real">
                        <span className="rv-marker-row-date">{fmtDay(p.iso.slice(0, 10), lang, true)}</span>
                        <span className="rv-marker-row-lab">
                          {labOf(p)}
                          {changed && <span className="rv-marker-row-badge">{L("outro laboratório", "different lab")}</span>}
                        </span>
                        <span className="rv-marker-row-val" style={i === 0 ? {color: col} : undefined}>{fmtNum(p.value, lang)} <small>{p.unit}</small></span>
                        {p.origUnit && (
                          <span className="rv-marker-row-note">
                            {L(`No documento: ${fmtNum(p.origValue ?? "", "pt")} ${p.origUnit} (convertido para ${p.unit} para comparar)`,
                               `In the document: ${p.origValue} ${p.origUnit} (converted to ${p.unit} to compare)`)}
                          </span>
                        )}
                        {p.sameDay?.map((d, k) => (
                          <span key={k} className="rv-marker-row-note">
                            {L(`Noutro documento do mesmo dia: ${fmtNum(d.value, "pt")} ${d.unit}${d.lab ? ` (${d.lab})` : ""}. Mostramos o do documento mais completo.`,
                               `In another document from the same day: ${d.value} ${d.unit}${d.lab ? ` (${d.lab})` : ""}. We show the one from the more complete document.`)}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
            <div className="rv-marker-rows">
              <div className="rv-marker-row"><span className="rv-marker-row-date">22 abr 2026</span><span className="rv-marker-row-lab">Synlab</span><span className="rv-marker-row-val" style={{color: col}}>{m.value}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">18 fev 2026</span><span className="rv-marker-row-lab">Synlab</span><span className="rv-marker-row-val">{pts[pts.length - 2]}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">06 dez 2025</span><span className="rv-marker-row-lab">CUF</span><span className="rv-marker-row-val">{pts[pts.length - 3]}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">14 set 2025</span><span className="rv-marker-row-lab">CUF</span><span className="rv-marker-row-val">{pts[0]}</span></div>
            </div>
            )}
          </div>
        )}

        {tone === "alert" && (
          <div className="rv-info-note">
            <strong>{L("Reanálise pedida pela equipa clínica", "Re-test requested by your clinical team")}</strong>
            <span>{L("Repetir colheita até 10 mai 2026. A marcação é feita diretamente no laboratório.", "Repeat the sample by 10 May 2026. Booking is done directly with the lab.")}</span>
          </div>
        )}
        <div style={{height: 80}}/>
      </div>
    </div>
  );
}

// ─── Sintomas ────────────────────────────────────────
interface SymptomEntry { id: string; namePt: string; nameEn: string; intensity: number; at: string; notePt?: string; noteEn?: string }

const SYMPTOM_PRESETS: { id: string; namePt: string; nameEn: string }[] = [
  { id: "afrontamentos",    namePt: "Afrontamentos",   nameEn: "Hot flushes" },
  { id: "insonia",          namePt: "Insónia",         nameEn: "Insomnia" },
  { id: "cefaleia",         namePt: "Cefaleia",        nameEn: "Headache" },
  { id: "ansiedade",        namePt: "Ansiedade",       nameEn: "Anxiety" },
  { id: "dor-articular",    namePt: "Dor articular",   nameEn: "Joint pain" },
  { id: "dor-abdominal",    namePt: "Dor abdominal",   nameEn: "Abdominal pain" },
  { id: "cansaco",          namePt: "Cansaço",         nameEn: "Fatigue" },
  { id: "nevoa-mental",     namePt: "Névoa mental",    nameEn: "Brain fog" },
  { id: "palpitacoes",      namePt: "Palpitações",     nameEn: "Palpitations" },
  { id: "suores-noturnos",  namePt: "Suores noturnos", nameEn: "Night sweats" },
];

const SYMPTOM_LOG: SymptomEntry[] = [
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 4, at: "2026-01-22T09:30:00" },
  { id: "afrontamentos",   namePt: "Afrontamentos",   nameEn: "Hot flushes",  intensity: 3, at: "2026-01-25T14:00:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 3, at: "2026-02-05T08:15:00" },
  { id: "insonia",         namePt: "Insónia",         nameEn: "Insomnia",     intensity: 3, at: "2026-02-09T23:00:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 4, at: "2026-02-19T18:40:00" },
  { id: "afrontamentos",   namePt: "Afrontamentos",   nameEn: "Hot flushes",  intensity: 2, at: "2026-02-22T11:00:00" },
  { id: "dor-articular",   namePt: "Dor articular",   nameEn: "Joint pain",   intensity: 2, at: "2026-03-02T07:50:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 2, at: "2026-03-11T09:00:00" },
  { id: "afrontamentos",   namePt: "Afrontamentos",   nameEn: "Hot flushes",  intensity: 3, at: "2026-03-14T16:20:00" },
  { id: "cansaco",         namePt: "Cansaço",         nameEn: "Fatigue",      intensity: 3, at: "2026-03-20T20:00:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 2, at: "2026-03-29T08:00:00" },
  { id: "insonia",         namePt: "Insónia",         nameEn: "Insomnia",     intensity: 2, at: "2026-04-03T23:30:00" },
  { id: "afrontamentos",   namePt: "Afrontamentos",   nameEn: "Hot flushes",  intensity: 2, at: "2026-04-10T13:10:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 1, at: "2026-04-15T09:00:00",
    notePt: "Melhorou depois do ajuste de magnésio", noteEn: "Improved after the magnesium adjustment" },
  { id: "afrontamentos",   namePt: "Afrontamentos",   nameEn: "Hot flushes",  intensity: 2, at: "2026-04-20T15:45:00" },
  { id: "cefaleia",        namePt: "Cefaleia",        nameEn: "Headache",     intensity: 1, at: "2026-04-25T08:30:00" },
];

// Data de referência usada em todo o /app-v2 para "hoje" (ver home.observation,
// diary.eyebrow). Os dados de demonstração vivem à volta desta data, por isso
// filtros relativos ("últimos 30 dias") têm de contar a partir daqui e não do
// relógio real, senão não apanhariam nada.
const APP_TODAY = new Date("2026-04-27T09:00:00");

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = segunda
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// A escala 1–5 do registo tem nome em cada nível: "3/5" obriga a traduzir
// mentalmente, "Moderado" lê-se de imediato. Os rótulos ficam em HTML e não
// dentro do SVG porque o gráfico usa preserveAspectRatio="none" — texto lá
// dentro sairia esticado na horizontal.
const INTENSITY_LEVELS: { level: number; pt: string; en: string }[] = [
  { level: 5, pt: "Muito forte",   en: "Very severe" },
  { level: 4, pt: "Forte",         en: "Severe" },
  { level: 3, pt: "Moderado",      en: "Moderate" },
  { level: 2, pt: "Ligeiro",       en: "Mild" },
  { level: 1, pt: "Muito ligeiro", en: "Very mild" },
];

function SymptomTrendCard({ entries }: { entries: SymptomEntry[] }) {
  const { L, lang } = useLang();
  const W = 320, H = 132, PAD = 12;
  const sorted = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const toY = (v: number) => H - PAD - ((v - 1) / 4) * (H - PAD * 2);
  const xs = sorted.map((_, i) => PAD + (sorted.length === 1 ? (W - PAD * 2) / 2 : (i / (sorted.length - 1)) * (W - PAD * 2)));
  const ys = sorted.map((e) => toY(e.intensity));
  const path = sorted.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const yRedBot = toY(3.5);
  const yGreenTop = toY(2.5);
  const fmt = (iso: string) => fmtDay(iso, lang);

  return (
    <div className="rv-marker-chart" style={{margin: "0 20px 16px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8}}>
        <span style={{fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em"}}>{L(sorted[0].namePt, sorted[0].nameEn)}</span>
        <span style={{fontSize: 11, color: "var(--fg-50)"}}>{sorted.length} {L("registos", "entries")}</span>
      </div>
      <div className="rv-sym-chart" style={{height: H}}>
        <div className="rv-sym-axis">
          {INTENSITY_LEVELS.map((lv) => (
            <span key={lv.level} className="rv-sym-axis-label" style={{top: `${toY(lv.level)}px`}}>
              {L(lv.pt, lv.en)}
            </span>
          ))}
        </div>
        <svg className="rv-sym-plot" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
          <rect x="0" y="0" width={W} height={yRedBot} fill="var(--alert)" opacity="0.10"/>
          <rect x="0" y={yRedBot} width={W} height={Math.max(0, yGreenTop - yRedBot)} fill="var(--watch)" opacity="0.10"/>
          <rect x="0" y={yGreenTop} width={W} height={Math.max(0, H - yGreenTop)} fill="var(--lime)" opacity="0.10"/>
          {INTENSITY_LEVELS.map((lv) => (
            <line key={lv.level} x1="0" x2={W} y1={toY(lv.level)} y2={toY(lv.level)}
              stroke="var(--fg)" strokeOpacity="0.07" strokeWidth="1"/>
          ))}
          <path d={path} fill="none" stroke="var(--watch)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {sorted.map((_, i) => (
            <circle key={i} cx={xs[i]} cy={ys[i]} r={i === sorted.length - 1 ? 4 : 2.5}
              fill={i === sorted.length - 1 ? "var(--watch)" : "var(--bg-elev)"} stroke="var(--watch)" strokeWidth="1.5"/>
          ))}
        </svg>
      </div>
      <div className="rv-marker-chart-axis rv-sym-xaxis"><span>{fmt(sorted[0].at)}</span><span>{fmt(sorted[sorted.length - 1].at)}</span></div>
    </div>
  );
}

function SintomasScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const [entries, setEntries] = useState<SymptomEntry[]>(SYMPTOM_LOG);
  const [showForm, setShowForm] = useState(false);
  const [formSymptom, setFormSymptom] = useState(SYMPTOM_PRESETS[2].id);
  const [formIntensity, setFormIntensity] = useState(3);
  const [formNote, setFormNote] = useState("");

  const sorted = [...entries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const weekMap = new Map<number, SymptomEntry[]>();
  for (const e of sorted) {
    const wk = startOfWeek(new Date(e.at)).getTime();
    if (!weekMap.has(wk)) weekMap.set(wk, []);
    weekMap.get(wk)!.push(e);
  }
  const todayWeek = startOfWeek(APP_TODAY).getTime();
  const weekEntries = [...weekMap.entries()].sort((a, b) => b[0] - a[0]);
  const thisWeekCount = weekMap.get(todayWeek)?.length ?? 0;

  const weekLabel = (wkTime: number) => {
    const diffWeeks = Math.round((todayWeek - wkTime) / (7 * 86400000));
    if (diffWeeks === 0) return L("Esta semana", "This week");
    if (diffWeeks === 1) return L("Semana passada", "Last week");
    const monday = new Date(wkTime);
    const sunday = new Date(wkTime);
    sunday.setDate(sunday.getDate() + 6);
    const fmt = (d: Date) => fmtDay(d, lang);
    return `${fmt(monday)} – ${fmt(sunday)}`;
  };

  const byName = new Map<string, SymptomEntry[]>();
  for (const e of entries) {
    if (!byName.has(e.id)) byName.set(e.id, []);
    byName.get(e.id)!.push(e);
  }
  const recurring = [...byName.values()]
    .filter((g) => g.length >= 2)
    .sort((a, b) => b.length - a.length);

  const saveEntry = () => {
    const preset = SYMPTOM_PRESETS.find((s) => s.id === formSymptom)!;
    const next: SymptomEntry = {
      id: preset.id, namePt: preset.namePt, nameEn: preset.nameEn,
      intensity: formIntensity, at: APP_TODAY.toISOString(),
      notePt: formNote || undefined, noteEn: formNote || undefined,
    };
    setEntries((prev) => [next, ...prev]);
    setShowForm(false);
    setFormNote("");
    setFormIntensity(3);
  };

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("data")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Sintomas", "Symptoms")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-consent">
          <div className="rv-consent-title">{L("Visível à sua equipa clínica", "Visible to your clinical team")}</div>
          <p className="rv-consent-text">
            {L(`${thisWeekCount} registo(s) esta semana. `, `${thisWeekCount} entr${thisWeekCount === 1 ? "y" : "ies"} this week. `)}
            {L("Os seus registos aparecem no processo clínico antes da próxima consulta.", "Your entries appear in your clinical record before your next appointment.")}
          </p>
        </div>

        {showForm && (
          <div className="rv-diary-section" style={{background: "var(--bg-elev-2)", padding: 16, borderRadius: "var(--radius)", margin: "0 20px 20px"}}>
            <div className="rv-diary-label">{L("Sintoma", "Symptom")}</div>
            <div className="rv-diary-chips" style={{marginBottom: 16}}>
              {SYMPTOM_PRESETS.map((s) => (
                <button key={s.id} type="button" className="rv-diary-chip" data-active={formSymptom === s.id} onClick={() => setFormSymptom(s.id)}>
                  {L(s.namePt, s.nameEn)}
                </button>
              ))}
            </div>
            <div className="rv-diary-label">{L("Intensidade", "Intensity")}</div>
            <div className="rv-energy-row" style={{marginBottom: 16}}>
              {Array.from({length: 5}).map((_, i) => (
                <button key={i} type="button" className="rv-energy-dot" data-active={i <= formIntensity - 1} onClick={() => setFormIntensity(i + 1)}/>
              ))}
              <span className="rv-energy-label">{formIntensity}/5</span>
            </div>
            <div className="rv-diary-label">{L("Nota · opcional", "Note · optional")}</div>
            <textarea className="rv-diary-textarea" rows={2} value={formNote} onChange={(e) => setFormNote(e.target.value)}
              placeholder={L("ex: depois do treino", "e.g. after training")}/>
            <div style={{display: "flex", gap: 8, marginTop: 14}}>
              <button className="rv-cta-ghost" style={{flex: 1}} onClick={() => setShowForm(false)}>{L("Cancelar", "Cancel")}</button>
              <button className="rv-cta-primary" style={{flex: 1}} onClick={saveEntry}>{L("Guardar", "Save")}</button>
            </div>
          </div>
        )}

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>{L("Tendências", "Trends")}</h3></div>
        {recurring.length === 0 ? (
          <div style={{margin: "0 20px 20px", fontSize: 12.5, color: "var(--fg-50)"}}>
            {L("Ainda sem sintomas recorrentes (2+ registos) para mostrar tendência.", "No recurring symptoms yet (2+ entries) to show a trend.")}
          </div>
        ) : (
          recurring.map((g) => <SymptomTrendCard key={g[0].id} entries={g}/>)
        )}

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>{L("Histórico", "History")}</h3></div>
        {weekEntries.map(([wk, list]) => (
          <div key={wk}>
            <div className="rv-sub-section-head">{weekLabel(wk)}</div>
            <div className="rv-marker-rows" style={{margin: "0 20px 16px"}}>
              {list.map((e, i) => (
                <div key={i} className="rv-marker-row">
                  <span className="rv-marker-row-date">
                    {L(e.namePt, e.nameEn)}
                    {e.notePt ? <span style={{color: "var(--fg-50)"}}> · {L(e.notePt, e.noteEn ?? e.notePt)}</span> : null}
                  </span>
                  <span className="rv-marker-row-lab">{fmtDay(e.at, lang)}</span>
                  <span className="rv-marker-row-val">{e.intensity}/5</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{height: 90}}/>
      </div>

      <button className="rv-fab" aria-label={L("Registar sintoma", "Log symptom")} onClick={() => setShowForm(true)}>{Icon.plus}</button>
    </div>
  );
}

// ─── Registos (timeline unificada) ───────────────────
type RecordType = "sintoma" | "consulta" | "medicacao" | "analise";
// De onde veio o registo: um PDF carregado e lido por OCR, algo que a utente
// escreveu na app, ou algo lançado pela equipa clínica. Muda o ícone e a tag.
type RecordOrigin = "upload" | "manual" | "clinic";

interface RecordEntry {
  id: string;
  type: RecordType;
  origin: RecordOrigin;
  iso: string;
  titlePt: string; titleEn: string;
  subPt: string; subEn: string;
  sourcePt?: string; sourceEn?: string;
  go?: NavRoute;
}

const RECORD_META: Record<RecordType, { color: string; pt: string; en: string }> = {
  sintoma:   { color: "var(--watch)",    pt: "Sintoma",   en: "Symptom" },
  consulta:  { color: "var(--bio-good)", pt: "Consulta",  en: "Appointment" },
  medicacao: { color: "var(--violet)",   pt: "Medicação", en: "Medication" },
  analise:   { color: "var(--lime)",     pt: "Análise",   en: "Lab" },
};

const ORIGIN_ICON: Record<RecordOrigin, ReactNode> = {
  upload: <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1 H8.5 L11 3.5 V13 H3 Z M8.5 1 V3.5 H11" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/><path d="M5 7.5 H9 M5 10 H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  manual: <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M2.5 12.5 a4.5 4.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>,
  clinic: <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1.5 L11.5 3.5 V7 C11.5 9.8 9.4 12 7 12.5 C4.6 12 2.5 9.8 2.5 7 V3.5 Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/><path d="M7 5 V9 M5 7 H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

// ─── Documentos carregados + extracção automática ────
// Simula o percurso real: a utente carrega um PDF do laboratório, o sistema
// lê-o e propõe os valores. O ecrã de documento mostra as duas coisas — a
// linha original tal como saiu do OCR e o campo que dela foi extraído — para
// que dê para conferir sem sair da app.
interface LabDocRow { raw: string; name: string; value: string; unit: string; ref: string; marker?: string }
interface LabDoc {
  id: string; lab: string; iso: string; filename: string; sizeKb: number; pages: number;
  titlePt: string; titleEn: string; totalExtracted: number; rows: LabDocRow[];
}

const LAB_DOCS: LabDoc[] = [
  {
    id: "a-2026-04-22", lab: "Synlab", iso: "2026-04-22", filename: "synlab_22042026_painel_completo.pdf",
    sizeKb: 412, pages: 4, totalExtracted: 82,
    titlePt: "Painel completo", titleEn: "Full panel",
    rows: [
      { raw: "ESTRADIOL (E2) ............ 38 pg/mL   [60 - 150]",   name: "Estradiol",        value: "38",   unit: "pg/mL", ref: "60 – 150",  marker: "Estradiol" },
      { raw: "FSH ....................... 18.4 mUI/mL [3 - 20]",     name: "FSH",              value: "18.4", unit: "mUI/mL", ref: "3 – 20",   marker: "FSH" },
      { raw: "APOLIPOPROTEINA B ......... 102 mg/dL  [< 80]",        name: "ApoB",             value: "102",  unit: "mg/dL", ref: "≤ 80",     marker: "ApoB" },
      { raw: "COLESTEROL LDL ............ 118 mg/dL  [< 100]",       name: "LDL-C",            value: "118",  unit: "mg/dL", ref: "≤ 100",    marker: "LDL-C" },
      { raw: "COLESTEROL HDL ............ 62 mg/dL   [> 60]",        name: "HDL-C",            value: "62",   unit: "mg/dL", ref: "≥ 60",     marker: "HDL-C" },
      { raw: "HEMOGLOBINA A1c ........... 5.7 %      [< 5.4]",       name: "HbA1c",            value: "5.7",  unit: "%",     ref: "≤ 5.4",    marker: "HbA1c" },
      { raw: "GLICOSE JEJUM ............. 98 mg/dL   [70 - 99]",     name: "Glicose",          value: "98",   unit: "mg/dL", ref: "70 – 99",  marker: "Glicose" },
      { raw: "INSULINA .................. 12.4 uU/mL [< 10]",        name: "Insulina",         value: "12.4", unit: "µU/mL", ref: "< 10",     marker: "Insulina" },
      { raw: "PCR ULTRASSENSIVEL ........ 1.2 mg/L   [< 1.0]",       name: "PCR-us",           value: "1.2",  unit: "mg/L",  ref: "< 1.0",    marker: "PCR-us" },
      { raw: "25-OH VITAMINA D .......... 48 ng/mL   [40 - 60]",     name: "Vitamina D",       value: "48",   unit: "ng/mL", ref: "40 – 60",  marker: "Vitamina D" },
      { raw: "FERRITINA ................. 68 ng/mL   [30 - 200]",    name: "Ferritina",        value: "68",   unit: "ng/mL", ref: "30 – 200", marker: "Ferritina" },
      { raw: "TSH ....................... 2.1 mUI/L  [0.5 - 2.5]",   name: "TSH",              value: "2.1",  unit: "mUI/L", ref: "0.5 – 2.5", marker: "TSH" },
    ],
  },
  {
    id: "a-2026-02-18", lab: "Synlab", iso: "2026-02-18", filename: "synlab_18022026_cardiometabolico.pdf",
    sizeKb: 188, pages: 2, totalExtracted: 17,
    titlePt: "Painel cardiometabólico", titleEn: "Cardiometabolic panel",
    rows: [
      { raw: "APOLIPOPROTEINA B ......... 110 mg/dL  [< 80]",        name: "ApoB",             value: "110",  unit: "mg/dL", ref: "≤ 80",     marker: "ApoB" },
      { raw: "COLESTEROL LDL ............ 125 mg/dL  [< 100]",       name: "LDL-C",            value: "125",  unit: "mg/dL", ref: "≤ 100",    marker: "LDL-C" },
      { raw: "HEMOGLOBINA A1c ........... 5.8 %      [< 5.4]",       name: "HbA1c",            value: "5.8",  unit: "%",     ref: "≤ 5.4",    marker: "HbA1c" },
      { raw: "TRIGLICERIDOS ............. 98 mg/dL   [< 100]",       name: "Triglicéridos",    value: "98",   unit: "mg/dL", ref: "< 100",    marker: "Triglicéridos" },
      { raw: "INSULINA .................. 13.0 uU/mL [< 10]",        name: "Insulina",         value: "13.0", unit: "µU/mL", ref: "< 10",     marker: "Insulina" },
    ],
  },
  {
    id: "a-2025-12-06", lab: "CUF", iso: "2025-12-06", filename: "cuf_06122025_painel_completo.pdf",
    sizeKb: 356, pages: 3, totalExtracted: 76,
    titlePt: "Painel completo", titleEn: "Full panel",
    rows: [
      { raw: "ESTRADIOL (E2) ............ 58 pg/mL   [60 - 150]",   name: "Estradiol",        value: "58",   unit: "pg/mL", ref: "60 – 150", marker: "Estradiol" },
      { raw: "APOLIPOPROTEINA B ......... 115 mg/dL  [< 80]",        name: "ApoB",             value: "115",  unit: "mg/dL", ref: "≤ 80",     marker: "ApoB" },
      { raw: "25-OH VITAMINA D .......... 35 ng/mL   [40 - 60]",     name: "Vitamina D",       value: "35",   unit: "ng/mL", ref: "40 – 60",  marker: "Vitamina D" },
      { raw: "HEMOGLOBINA ............... 13.2 g/dL  [12 - 16]",     name: "Hemoglobina",      value: "13.2", unit: "g/dL",  ref: "12 – 16",  marker: "Hemoglobina" },
      { raw: "CREATININA ................ 0.80 mg/dL [0.5 - 1.0]",   name: "Creatinina",       value: "0.80", unit: "mg/dL", ref: "0.5 – 1.0", marker: "Creatinina" },
    ],
  },
  {
    id: "a-2025-09-14", lab: "CUF", iso: "2025-09-14", filename: "cuf_14092025_painel_inicial.pdf",
    sizeKb: 298, pages: 3, totalExtracted: 68,
    titlePt: "Painel inicial", titleEn: "Baseline panel",
    rows: [
      { raw: "ESTRADIOL (E2) ............ 78 pg/mL   [60 - 150]",   name: "Estradiol",        value: "78",   unit: "pg/mL", ref: "60 – 150", marker: "Estradiol" },
      { raw: "APOLIPOPROTEINA B ......... 125 mg/dL  [< 80]",        name: "ApoB",             value: "125",  unit: "mg/dL", ref: "≤ 80",     marker: "ApoB" },
      { raw: "25-OH VITAMINA D .......... 28 ng/mL   [40 - 60]",     name: "Vitamina D",       value: "28",   unit: "ng/mL", ref: "40 – 60",  marker: "Vitamina D" },
      { raw: "HEMOGLOBINA A1c ........... 6.1 %      [< 5.4]",       name: "HbA1c",            value: "6.1",  unit: "%",     ref: "≤ 5.4",    marker: "HbA1c" },
    ],
  },
];

const CONSULTA_ENTRIES: RecordEntry[] = [
  { id: "c-2026-05-12", type: "consulta", origin: "clinic", iso: "2026-05-12T14:30:00", go: "consultas",
    sourcePt: "Clínica Lumiar", sourceEn: "Lumiar Clinic",
    titlePt: "Discussão sobre TRH personalizada", titleEn: "Personalised HRT discussion",
    subPt: "Agendada · 14:30 · marcada pelo médico", subEn: "Scheduled · 14:30 · booked by the doctor" },
  { id: "c-2026-05-20", type: "consulta", origin: "clinic", iso: "2026-05-20T09:00:00", go: "calendario",
    sourcePt: "Clínica Lumiar", sourceEn: "Lumiar Clinic",
    titlePt: "Colheita de sangue", titleEn: "Blood draw",
    subPt: "Agendada · 09:00 · marcada pelo médico", subEn: "Scheduled · 09:00 · booked by the doctor" },
  { id: "c-2026-04-22", type: "consulta", origin: "clinic", iso: "2026-04-22T10:00:00", go: "summary",
    sourcePt: "Clínica Lumiar", sourceEn: "Lumiar Clinic",
    titlePt: "Revisão trimestral",                 titleEn: "Quarterly review",
    subPt: "45 min · 3 alterações ao plano",       subEn: "45 min · 3 plan changes" },
  { id: "c-2026-02-03", type: "consulta", origin: "clinic", iso: "2026-02-03T10:00:00", go: "consultas",
    sourcePt: "Clínica Lumiar", sourceEn: "Lumiar Clinic",
    titlePt: "Revisão de resultados",              titleEn: "Results review",
    subPt: "30 min · 1 alteração ao plano",        subEn: "30 min · 1 plan change" },
  { id: "c-2025-12-10", type: "consulta", origin: "clinic", iso: "2025-12-10T10:00:00", go: "consultas",
    sourcePt: "Clínica Lumiar", sourceEn: "Lumiar Clinic",
    titlePt: "Primeira consulta",                  titleEn: "First appointment",
    subPt: "75 min · 4 alterações ao plano",       subEn: "75 min · 4 plan changes" },
];

// As análises vêm dos documentos carregados — mesma lista, para o título, a
// data e o laboratório não poderem divergir do que o documento diz.
const ANALISE_ENTRIES: RecordEntry[] = LAB_DOCS.map((doc) => ({
  id: doc.id,
  type: "analise" as const,
  origin: "upload" as const,
  iso: `${doc.iso}T08:00:00`,
  go: { route: "documento" as const, docId: doc.id },
  sourcePt: doc.lab, sourceEn: doc.lab,
  titlePt: doc.titlePt, titleEn: doc.titleEn,
  subPt: `${doc.totalExtracted} valores extraídos · PDF ${doc.pages} pág.`,
  subEn: `${doc.totalExtracted} values extracted · ${doc.pages}-page PDF`,
}));

// Análises carregadas pela utente, lidas do armazenamento do dispositivo.
// Começa vazio e só lê depois de montar: no servidor não há localStorage, e
// devolver conteúdo diferente dos dois lados partiria a hidratação.
function useUploads(): StoredUpload[] {
  const [uploads, setUploads] = useState<StoredUpload[]>([]);
  useEffect(() => {
    let alive = true;
    import("@/lib/uploads.store").then((m) => { if (alive) setUploads(m.loadUploads()); });
    return () => { alive = false; };
  }, []);
  return uploads;
}

function uploadTitle(u: StoredUpload, lang: Lang): string {
  const base = lang === "pt" ? "Análise" : "Lab result";
  return u.lab ? `${base} · ${u.lab}` : base;
}

// A timeline é montada a partir das mesmas fontes que alimentam os outros
// ecrãs — não há aqui uma segunda cópia dos dados a divergir com o tempo.
function buildTimeline(uploads: StoredUpload[] = []): RecordEntry[] {
  const carregadas: RecordEntry[] = uploads.map((u) => ({
    id: u.id,
    type: "analise" as const,
    origin: "upload" as const,
    iso: `${u.collectedISO}T08:00:00`,
    go: { route: "documento" as const, docId: u.id },
    sourcePt: u.lab ?? "Carregado por si", sourceEn: u.lab ?? "Uploaded by you",
    titlePt: uploadTitle(u, "pt"), titleEn: uploadTitle(u, "en"),
    subPt: `${u.values.length} valores lidos · PDF ${u.pages} pág.`,
    subEn: `${u.values.length} values read · ${u.pages}-page PDF`,
  }));
  return [...carregadas, ...buildMockTimeline()].sort(
    (a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime(),
  );
}

function buildMockTimeline(): RecordEntry[] {
  const sintomas: RecordEntry[] = SYMPTOM_LOG.map((s, i) => ({
    id: `s-${i}`,
    type: "sintoma",
    origin: "manual",
    iso: s.at,
    go: "sintomas",
    sourcePt: "Registo manual", sourceEn: "Manual entry",
    titlePt: s.namePt, titleEn: s.nameEn,
    subPt: `Intensidade ${s.intensity}/5${s.notePt ? ` · ${s.notePt}` : ""}`,
    subEn: `Intensity ${s.intensity}/5${s.noteEn ? ` · ${s.noteEn}` : ""}`,
  }));

  const medicacao: RecordEntry[] = SUPPLEMENTS.flatMap((sup) =>
    sup.history.map((h, i) => ({
      id: `m-${sup.id}-${i}`,
      type: "medicacao" as const,
      origin: "clinic" as const,
      iso: `${h.iso}T09:00:00`,
      go: "nutricao" as NavRoute,
      sourcePt: h.byPt, sourceEn: h.byEn,
      titlePt: sup.namePt, titleEn: sup.nameEn,
      subPt: h.eventPt,
      subEn: h.eventEn,
    })),
  );

  return [...sintomas, ...medicacao, ...CONSULTA_ENTRIES, ...ANALISE_ENTRIES]
    .sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime());
}

const RANGE_OPTIONS: { id: string; months: number | null; pt: string; en: string }[] = [
  { id: "1m",  months: 1,    pt: "30 dias", en: "30 days" },
  { id: "3m",  months: 3,    pt: "3M",      en: "3M" },
  { id: "6m",  months: 6,    pt: "6M",      en: "6M" },
  { id: "1y",  months: 12,   pt: "1A",      en: "1Y" },
  { id: "all", months: null, pt: "Tudo",    en: "All" },
];

const MONTHS_LONG_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MONTHS_LONG_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function RegistosScreen({ initialView = "lista" }: { initialView?: "lista" | "calendario" }) {
  const { go } = useNav();
  const { L, lang } = useLang();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RecordType | "all">("all");
  const [range, setRange] = useState("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Lista ou calendário: os mesmos registos, vistos por mês.
  const [view, setView] = useState<"lista" | "calendario">(initialView);
  const todayKey = dayKey(APP_TODAY);
  const [ym, setYm] = useState({ year: APP_TODAY.getFullYear(), month: APP_TODAY.getMonth() });
  const [selDay, setSelDay] = useState(todayKey);
  const uploads = useUploads();

  const all = buildTimeline(uploads);
  const term = q.trim().toLowerCase();

  // O intervalo conta para trás a partir da data de referência da app, não do
  // relógio real — os dados de demonstração são de 2026 e um "últimos 30 dias"
  // ancorado no relógio devolveria uma lista vazia.
  const months = RANGE_OPTIONS.find((r) => r.id === range)?.months ?? null;
  const cutoff = months == null ? null : new Date(new Date(APP_TODAY).setMonth(APP_TODAY.getMonth() - months));

  const matches = (e: RecordEntry) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (!term) return true;
    const hay = norm(`${e.titlePt} ${e.titleEn} ${e.subPt} ${e.subEn} ${e.sourcePt ?? ""} ${e.sourceEn ?? ""} ${RECORD_META[e.type].pt} ${RECORD_META[e.type].en}`);
    return hay.includes(norm(term));
  };
  const entries = all.filter((e) => {
    if (!matches(e)) return false;
    // Entradas futuras (consultas agendadas) escapam ao corte: não faz sentido
    // "últimos 30 dias" esconder a consulta da semana que vem.
    if (cutoff && new Date(e.iso) < cutoff && new Date(e.iso) <= APP_TODAY) return false;
    return true;
  });
  // No calendário o período não se aplica: navega-se pelos meses.
  const calEntries = all.filter(matches);
  const onDay = (key: string) => calEntries.filter((e) => dayOf(e.iso) === key);
  const grid = monthGrid(ym.year, ym.month);
  const weekdays = lang === "pt" ? ["S", "T", "Q", "Q", "S", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const typeOrder: RecordType[] = ["analise", "consulta", "sintoma", "medicacao"];

  // Agrupamento cronológico: o que ainda está para vir fica destacado no topo,
  // o resto agrupa por mês.
  const groups: { key: string; label: string; items: RecordEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.iso);
    const future = d > APP_TODAY;
    const key = future ? "upcoming" : `${d.getFullYear()}-${d.getMonth()}`;
    const label = future
      ? L("Próximos", "Upcoming")
      : `${(lang === "pt" ? MONTHS_LONG_PT : MONTHS_LONG_EN)[d.getMonth()]} ${d.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, label, items: [e] });
  }

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filters: { id: RecordType | "all"; label: string }[] = [
    { id: "all",       label: L("Tudo","All") },
    { id: "analise",   label: L("Análises","Labs") },
    { id: "consulta",  label: L("Consultas","Appointments") },
    { id: "sintoma",   label: L("Sintomas","Symptoms") },
    { id: "medicacao", label: L("Medicação","Medication") },
  ];

  const fmtDate = (iso: string) => fmtDay(iso, lang, true);

  const row = (e: RecordEntry) => {
    const meta = RECORD_META[e.type];
    return (
                        <button key={e.id} type="button" className="rv-rec-row" onClick={() => e.go && go(e.go)}>
                          <span className="rv-rec-bar" style={{background: meta.color}}/>
                          <span className="rv-rec-origin" data-origin={e.origin}
                            aria-label={e.origin === "upload" ? L("Documento carregado","Uploaded document") : e.origin === "manual" ? L("Registo manual","Manual entry") : L("Equipa clínica","Clinical team")}>
                            {ORIGIN_ICON[e.origin]}
                          </span>
                          <span className="rv-rec-body">
                            <span className="rv-rec-top">
                              <span className="rv-rec-tag" style={{color: meta.color, borderColor: meta.color}}>{L(meta.pt, meta.en)}</span>
                              <span className="rv-rec-date">{fmtDate(e.iso)}</span>
                            </span>
                            <span className="rv-rec-title">{L(e.titlePt, e.titleEn)}</span>
                            <span className="rv-rec-sub">{L(e.subPt, e.subEn)}</span>
                            {(e.sourcePt || e.sourceEn) && (
                              <span className="rv-rec-source">{L(e.sourcePt ?? "", e.sourceEn ?? "")}</span>
                            )}
                          </span>
                          <span className="rv-chev">{Icon.chev}</span>
                        </button>
                      );
  };

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("data")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Registos","Records")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div style={{padding: "4px 20px 12px"}}>
          <input
            className="rv-rec-search"
            placeholder={L("Pesquisar nos seus registos…","Search your records…")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="rv-rec-views" role="tablist" aria-label={L("Vista","View")}>
          <button type="button" role="tab" aria-selected={view === "lista"} className="rv-rec-view" data-active={view === "lista" || undefined} onClick={() => setView("lista")}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4 H14 M5.5 8 H14 M5.5 12 H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="2.5" cy="4" r="1.1" fill="currentColor"/><circle cx="2.5" cy="8" r="1.1" fill="currentColor"/><circle cx="2.5" cy="12" r="1.1" fill="currentColor"/></svg><span>{L("Lista","List")}</span>
          </button>
          <button type="button" role="tab" aria-selected={view === "calendario"} className="rv-rec-view" data-active={view === "calendario" || undefined} onClick={() => setView("calendario")}>
            {CalIcon}<span>{L("Calendário","Calendar")}</span>
          </button>
        </div>

        <div className="rv-panel-chips">
          {filters.map((f) => (
            <button key={f.id} className="rv-period-chip" data-active={filter === f.id || undefined} onClick={() => setFilter(f.id)}>
              {f.id !== "all" && <span className="rv-rec-chip-dot" style={{background: RECORD_META[f.id as RecordType].color}}/>}
              {f.label}
            </button>
          ))}
        </div>

        {view === "lista" ? (<>
        <div className="rv-panel-chips rv-range-chips">
          <span className="rv-range-label">{L("Período","Period")}</span>
          {RANGE_OPTIONS.map((r) => (
            <button key={r.id} className="rv-period-chip" data-active={range === r.id || undefined} onClick={() => setRange(r.id)}>
              {L(r.pt, r.en)}
            </button>
          ))}
        </div>

        <div className="rv-bio-section-head" style={{color: "var(--fg-50)"}}>
          <span className="rv-dot"/>{entries.length} {entries.length === 1 ? L("registo","record") : L("registos","records")}
        </div>

        {entries.length === 0 ? (
          <div style={{padding: "20px", textAlign: "center", color: "var(--fg-50)", fontSize: 13}}>
            {L("Nada encontrado para estes filtros.","Nothing found for these filters.")}
          </div>
        ) : (
          groups.map((g) => {
            const isOpen = !collapsed.has(g.key);
            return (
              <div key={g.key} className="rv-rec-group">
                <button type="button" className="rv-rec-group-head" onClick={() => toggleGroup(g.key)} aria-expanded={isOpen}>
                  <span className="rv-rec-group-chev" data-open={isOpen || undefined}>{Icon.chev}</span>
                  <span className="rv-rec-group-label">{g.label}</span>
                  <span className="rv-rec-group-count">{g.items.length}</span>
                </button>
                {isOpen && (
                  <div className="rv-rec-list">
                    {g.items.map(row)}
                  </div>
                )}
              </div>
            );
          })
        )}

        </>) : (<>
          <div className="rv-cal-nav">
            <button type="button" className="rv-cal-nav-btn" onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))} aria-label={L("Mês anterior", "Previous month")}>‹</button>
            <div className="rv-cal-month" aria-live="polite">{monthName(ym.month, lang)} {ym.year}</div>
            <button type="button" className="rv-cal-nav-btn" onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))} aria-label={L("Mês seguinte", "Next month")}>›</button>
          </div>
          <div className="rv-cal-grid" role="grid" aria-label={`${monthName(ym.month, lang)} ${ym.year}`}>
            {weekdays.map((w, i) => <div key={i} className="rv-cal-wd" aria-hidden="true">{w}</div>)}
            {grid.map((c) => {
              const items = onDay(c.key);
              const types = typeOrder.filter((t) => items.some((e) => e.type === t));
              return (
                <button key={c.key} type="button" className="rv-cal-cell"
                  data-in={c.inMonth || undefined} data-today={c.key === todayKey || undefined} data-sel={c.key === selDay || undefined}
                  aria-pressed={c.key === selDay}
                  aria-label={`${c.day} ${monthName(new Date(c.key + "T00:00").getMonth(), lang)}${items.length ? `, ${items.length} ${items.length === 1 ? L("registo", "record") : L("registos", "records")}` : ""}`}
                  onClick={() => setSelDay(c.key)}>
                  <span className="rv-cal-num">{c.day}</span>
                  <span className="rv-cal-dots" aria-hidden="true">
                    {types.map((t) => <span key={t} className="rv-cal-dot" style={{background: RECORD_META[t].color}}/>)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="rv-cal-legend rv-rec-legend">
            {typeOrder.map((t) => <span key={t}><span className="rv-cal-dot" style={{background: RECORD_META[t].color}}/>{L(RECORD_META[t].pt, RECORD_META[t].en)}</span>)}
          </div>
          <div className="rv-sub-section-head">{fmtDay(selDay, lang, true)}</div>
          {onDay(selDay).length === 0
            ? <div className="rv-cal-empty">{L("Sem registos neste dia.", "No records on this day.")}</div>
            : <div className="rv-rec-list">{onDay(selDay).map(row)}</div>}
        </>)}

        <div style={{height: 90}}/>
      </div>
    </div>
  );
}

// ─── Documento carregado + valores extraídos ─────────
// O pedido era mostrar o documento e os valores "lado a lado". A 430 px de
// largura, duas colunas dariam ~195 px cada e o documento ficaria ilegível —
// o mesmo erro do strain a mostrar "0.1". Aqui a emparelhação é feita por
// linha: tocar num valor realça a linha do documento de onde saiu, que é a
// verificação que o lado a lado serve para fazer.
// Vista única para os dois casos: os documentos de demonstração e as análises
// que a utente carregou. Ambos se reduzem à mesma forma antes de desenhar, para
// não haver dois ecrãs quase iguais a divergir.
interface DocView {
  id: string;
  lab: string;
  iso: string;
  filename: string;
  sizeKb: number;
  pages: number;
  title: string;
  lines: string[];
  totalExtracted: number;
  rows: { raw: string; name: string; value: string; unit: string; ref: string; marker?: string }[];
  fromUpload: boolean;
  hasFile: boolean;
}

function docViewFromMock(d: LabDoc, lang: Lang): DocView {
  return {
    id: d.id, lab: d.lab, iso: d.iso, filename: d.filename, sizeKb: d.sizeKb, pages: d.pages,
    title: lang === "pt" ? d.titlePt : d.titleEn,
    lines: d.rows.map((r) => r.raw),
    totalExtracted: d.totalExtracted,
    rows: d.rows,
    fromUpload: false, hasFile: false,
  };
}

function docViewFromUpload(u: StoredUpload, lang: Lang): DocView {
  return {
    id: u.id,
    lab: u.lab ?? (lang === "pt" ? "Laboratório não identificado" : "Lab not identified"),
    iso: u.collectedISO,
    filename: u.filename, sizeKb: u.sizeKb, pages: u.pages,
    title: uploadTitle(u, lang),
    lines: u.lines,
    totalExtracted: u.values.length,
    rows: u.values.map((v) => ({
      raw: v.raw, name: v.marker ?? v.label, value: v.value, unit: v.unit, ref: v.ref,
      marker: v.marker ?? undefined,
    })),
    fromUpload: true, hasFile: u.hasFile,
  };
}

// Mostra o documento verdadeiro, lido do armazenamento do dispositivo: as
// páginas do PDF desenhadas uma a uma, ou a imagem, conforme o que foi
// carregado. Nada é pedido à rede.
function DocPages({ docId, lab }: { docId: string; lab: string }) {
  const { L } = useLang();
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    setState("loading");
    (async () => {
      try {
        const { getFile } = await import("@/lib/uploads.store");
        const file = await getFile(docId);
        if (!file) { if (alive) setState("fail"); return; }
        if (file.type.startsWith("image/")) {
          objectUrl = URL.createObjectURL(file);
          if (!alive) return;
          setUrl(objectUrl);
          setPages(1);
        } else {
          const { renderPdfPage } = await import("@/lib/lab-ocr");
          const r = await renderPdfPage(file, page);
          if (!alive) return;
          setUrl(r.url);
          setPages(r.pages);
        }
        if (alive) setState("ok");
      } catch {
        if (alive) setState("fail");
      }
    })();
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [docId, page]);

  if (state === "fail") return null; // sem ficheiro guardado, não se finge que há

  return (
    <>
      <div className="rv-sub-section-head">
        {L("Documento original","Original document")}
        {pages > 1 && ` · ${pages} ${L("páginas","pages")}`}
      </div>
      <div className="rv-docview">
        <div className="rv-docview-bar">
          <span className="rv-doc-lab">{lab}</span>
          {pages > 1 && (
            <span className="rv-docview-nav">
              <button type="button" onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page <= 1} aria-label={L("Página anterior","Previous page")}>‹</button>
              <span className="rv-docview-n">{page} / {pages}</span>
              <button type="button" onClick={() => setPage((n) => Math.min(pages, n + 1))} disabled={page >= pages} aria-label={L("Página seguinte","Next page")}>›</button>
            </span>
          )}
        </div>
        <div className="rv-docview-stage">
          {state === "loading" && <div className="rv-up-spinner" style={{margin: "40px auto"}}/>}
          {url && <img src={url} alt={`${L("Página","Page")} ${page}`} style={{opacity: state === "loading" ? 0.4 : 1}}/>}
        </div>
      </div>
    </>
  );
}

function DocumentoScreen({ docId }: { docId?: string }) {
  const { go, showToast } = useNav();
  const { L, lang } = useLang();
  const uploads = useUploads();
  const [selected, setSelected] = useState<number | null>(null);

  const mock = LAB_DOCS.find((d) => d.id === docId);
  const uploaded = uploads.find((u) => u.id === docId);
  const doc: DocView | null = mock
    ? docViewFromMock(mock, lang)
    : uploaded
    ? docViewFromUpload(uploaded, lang)
    : uploads.length === 0 && docId?.startsWith("u-")
    ? null // ainda a carregar do armazenamento
    : docViewFromMock(LAB_DOCS[0], lang);

  async function openOriginal() {
    if (!doc) return;
    const { getFile } = await import("@/lib/uploads.store");
    const f = await getFile(doc.id);
    if (!f) {
      showToast(L("Original já não está guardado", "Original is no longer stored"));
      return;
    }
    const url = URL.createObjectURL(f);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (!doc) {
    return (
      <div className="rv-screen">
        <StatusBar />
        <header className="rv-header">
          <button className="rv-header-btn" onClick={() => go("registos")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
          <div className="rv-header-title">{L("Documento","Document")}</div>
          <div style={{width: 36}}/>
        </header>
        <div className="rv-body"><div className="rv-up-center"><div className="rv-up-spinner"/></div></div>
      </div>
    );
  }

  const hitLine = selected != null ? doc.rows[selected]?.raw : null;

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("registos")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{doc.title}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-doc-meta">
          <div className="rv-doc-file">
            <span className="rv-doc-file-icon">{ORIGIN_ICON.upload}</span>
            <span className="rv-doc-file-name">{doc.filename}</span>
          </div>
          <div className="rv-doc-file-sub">
            {doc.lab} · {fmtDay(doc.iso, lang, true)} · {doc.pages} {L("pág.","pages")} · {doc.sizeKb} KB
          </div>
          {doc.fromUpload && (
            <div className="rv-doc-local">
              {L("Guardado neste telemóvel","Stored on this phone")}
              {doc.hasFile && (
                <button className="rv-doc-open" onClick={openOriginal}>{L("Abrir PDF","Open PDF")}</button>
              )}
            </div>
          )}
        </div>

        {/* Análises carregadas mostram o documento a sério, página a página.
            As de demonstração não têm ficheiro nenhum por trás, por isso
            continuam a mostrar o texto — e quando não há nem uma coisa nem
            outra, a secção não aparece de todo, em vez de um rectângulo
            branco vazio. */}
        {doc.fromUpload ? (
          doc.hasFile && <DocPages docId={doc.id} lab={doc.lab} />
        ) : (
          <>
            <div className="rv-sub-section-head">{L("Documento original","Original document")}</div>
            <div className="rv-doc-page">
              <div className="rv-doc-page-head">
                <span className="rv-doc-lab">{doc.lab}</span>
                <span className="rv-doc-page-n">1 / {doc.pages}</span>
              </div>
              <div className="rv-doc-lines" data-scroll={doc.lines.length > 18 || undefined}>
                {doc.lines.map((line, i) => (
                  <div key={i} className="rv-doc-line" data-hit={hitLine != null && line === hitLine ? "true" : undefined}>{line}</div>
                ))}
                {doc.totalExtracted > doc.rows.length && (
                  <div className="rv-doc-line rv-doc-line-more">
                    {L(`… mais ${doc.totalExtracted - doc.rows.length} parâmetros nas páginas seguintes`,
                       `… ${doc.totalExtracted - doc.rows.length} more parameters on the following pages`)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="rv-sub-section-head">
          {L("Valores extraídos","Extracted values")} · {doc.rows.length}
          {!doc.fromUpload && ` ${L("de","of")} ${doc.totalExtracted}`}
        </div>
        <div className="rv-doc-note">
          {L("Lidos automaticamente do PDF. Toque num valor para ver a linha original de onde foi extraído.",
             "Read automatically from the PDF. Tap a value to see the original line it came from.")}
        </div>
        <div className="rv-doc-rows">
          {doc.rows.map((r, i) => {
            const marker = r.marker ? BIOMARKERS.find((b) => b.name === r.marker) : undefined;
            return (
              <div key={i} className="rv-doc-row" data-sel={selected === i || undefined}>
                <button type="button" className="rv-doc-row-main" onClick={() => setSelected(selected === i ? null : i)}>
                  <span className="rv-doc-row-name">{r.name}</span>
                  <span className="rv-doc-row-val">{r.value}<span className="rv-doc-row-unit">{r.unit}</span></span>
                  {r.ref && <span className="rv-doc-row-ref">{L("ref","ref")} {r.ref}</span>}
                </button>
                {selected === i && (
                  <div className="rv-doc-row-detail">
                    <div className="rv-doc-row-raw">{r.raw}</div>
                    {marker ? (
                      <button className="rv-doc-row-link" onClick={() => go({ route: "marker", marker })}>
                        {L("Abrir","Open")} {marker.name} →
                      </button>
                    ) : (
                      <span className="rv-doc-row-unmatched">{L("Sem marcador associado","No linked marker")}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rv-doc-foot">
          {doc.fromUpload
            ? L("Estes valores estão guardados apenas neste telemóvel. A equipa clínica ainda não os vê.",
                "These values are stored on this phone only. Your clinical team can't see them yet.")
            : L("Os valores foram conferidos pela sua equipa clínica antes de entrarem no seu historial.",
                "These values were checked by your clinical team before entering your record.")}
        </div>
        <div style={{height: 90}}/>
      </div>
    </div>
  );
}

// ─── Carregar análise (leitura no dispositivo) ───────
// Três caminhos, todos no browser:
//   PDF com texto  → pdf.js extrai o texto (exacto)
//   PDF de scan    → páginas desenhadas em canvas e lidas por OCR
//   Imagem/foto    → OCR directo
// Nenhum deles envia o ficheiro para lado nenhum.
type UploadStep = "pick" | "reading" | "review" | "saved" | "error";
type UploadErr = "notext" | "novalues" | "failed";

function ShareUploadScreen() {
  const { go, showToast } = useNav();
  const { L, lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>("pick");
  const [errorKind, setErrorKind] = useState<UploadErr>("failed");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [doc, setDoc] = useState<ExtractedDoc | null>(null);
  const [kind, setKind] = useState<UploadKind>("pdf-text");
  const [values, setValues] = useState<ParsedValue[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedFile, setSavedFile] = useState(true);
  const [persisted, setPersisted] = useState(false);
  const [phase, setPhase] = useState("");
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo ficheiro outra vez
    if (!f) return;
    setFile(f);
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return f.type.startsWith("image/") ? URL.createObjectURL(f) : null; });
    setStep("reading");
    setPct(null);

    try {
      const { parseValues } = await import("@/lib/lab-parse");
      const isImage = f.type.startsWith("image/");
      let lines: string[] = [];
      let pages = 1;
      let usedKind: UploadKind = "image";

      // Ter linhas não é o mesmo que ter texto útil: há PDFs digitalizados com
      // uma camada de texto vazia, e PDFs cujas fontes não trazem mapa de
      // caracteres, dos quais se extraem linhas sem uma única letra. Nesses
      // casos o texto não serve e é preciso ler a imagem à mesma.
      const usefulText = (ls: string[]) =>
        ls.join("").replace(/[^\p{L}\p{N}]/gu, "").length >= 40;

      if (isImage) {
        setPhase(L("A ler a imagem…", "Reading the image…"));
        const { ocrImageFile } = await import("@/lib/lab-ocr");
        lines = await ocrImageFile(f, setPct);
      } else {
        setPhase(L("A abrir o PDF…", "Opening the PDF…"));
        const { extractFromPdf } = await import("@/lib/lab-parse");
        const extracted = await extractFromPdf(f);
        pages = extracted.pages;
        lines = extracted.lines;
        usedKind = "pdf-text";

        // Recorre-se ao OCR quando não há texto aproveitável, e também quando
        // há texto mas dele não sai nenhum parâmetro — nesse caso o texto
        // existe mas não diz nada de útil, e a imagem ainda pode dizer.
        const needsOcr = !usefulText(lines) || parseValues(lines).length === 0;
        if (needsOcr) {
          setPhase(L("PDF digitalizado — a reconhecer o texto…", "Scanned PDF — recognising text…"));
          const { ocrScannedPdf } = await import("@/lib/lab-ocr");
          const ocrLines = await ocrScannedPdf(f, setPct);
          // Fica-se pelo OCR se ele produzir parâmetros que o texto não deu.
          if (parseValues(ocrLines).length > parseValues(lines).length) {
            lines = ocrLines;
            usedKind = "pdf-ocr";
          }
        }
      }

      const { detectFromLines } = await import("@/lib/lab-parse");
      const meta = detectFromLines(lines);
      const extractedDoc: ExtractedDoc = { lines, pages, lab: meta.lab, collectedISO: meta.collectedISO };
      const parsed = parseValues(lines);
      setDoc(extractedDoc);
      setKind(usedKind);

      if (!usefulText(lines)) {
        setErrorKind("notext");
        setStep("error");
        return;
      }
      if (parsed.length === 0) {
        setErrorKind("novalues");
        setStep("error");
        return;
      }
      setValues(parsed);
      setStep("review");
    } catch {
      setErrorKind("failed");
      setStep("error");
    }
  }

  async function save() {
    if (!file || !doc) return;
    const store = await import("@/lib/uploads.store");
    // Vírgula decimal (como se escreve em PT) passa a ponto antes de guardar;
    // sem isto, «5,7» escrito à mão não entrava no historial.
    const kept = values
      .filter((v) => v.keep && v.value.trim() !== "")
      .map((v) => ({ ...v, value: v.value.trim().replace(",", "."), origValue: v.origValue?.trim().replace(",", ".") }));
    const upload = store.makeUpload(file, doc, kept, kind);

    // Pede ao browser para não apagar isto sozinho. Sem este pedido, o que
    // aqui fica é descartável e o Safari limpa-o ao fim de uma semana.
    const persisted = await store.requestPersistence();

    const room = await store.hasRoomFor(file.size);
    upload.hasFile = room ? await store.putFile(upload.id, file) : false;
    store.saveUpload(upload);
    setSavedId(upload.id);
    setSavedFile(upload.hasFile);
    setPersisted(persisted);
    setStep("saved");
    showToast(L(`${kept.length} valores guardados`, `${kept.length} values saved`));
  }

  const reset = () => { setStep("pick"); setFile(null); setDoc(null); setValues([]); setPct(null); };
  const toggle = (i: number) => setValues((p) => p.map((v, k) => (k === i ? { ...v, keep: !v.keep } : v)));
  // Valor convertido: a pessoa corrige o número tal como está no documento
  // (na unidade original) e a app recalcula o valor na unidade de referência.
  const edit = (i: number, val: string) => setValues((p) => p.map((v, k) => {
    if (k !== i) return v;
    if (!v.origUnit || !v.marker) return { ...v, value: val };
    const n = Number(val.replace(",", "."));
    const u = Number.isFinite(n) && val.trim() ? toCanonical(v.marker, n, v.origUnit) : null;
    return { ...v, origValue: val, value: u && (u.status === "converted" || u.status === "same") ? String(u.value) : "" };
  }));
  const keptCount = values.filter((v) => v.keep && v.value.trim() !== "").length;
  const isOcr = kind !== "pdf-text";

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("data")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Carregar análise","Upload lab result")}</div>
        <div style={{width: 36}}/>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.webp"
        style={{display: "none"}}
        onChange={onPick}
      />

      <div className="rv-body">
        {step === "pick" && (
          <>
            <button type="button" className="rv-up-drop" onClick={() => fileRef.current?.click()}>
              <span className="rv-up-drop-icon">{Icon.upload}</span>
              <span className="rv-up-drop-title">{L("Escolher ficheiro","Choose file")}</span>
              <span className="rv-up-drop-sub">{L("PDF ou fotografia · dos Ficheiros, Fotos, Mail ou Drive","PDF or photo · from Files, Photos, Mail or Drive")}</span>
            </button>

            <div className="rv-up-privacy">
              <div className="rv-up-privacy-head">
                <span className="rv-up-privacy-icon">{Icon.shield}</span>
                {L("O ficheiro não sai do seu telemóvel","The file never leaves your phone")}
              </div>
              <p>
                {L("É lido aqui dentro da app, incluindo o reconhecimento de texto em fotografias. Os valores ficam guardados neste telemóvel e não são enviados para nenhum servidor.",
                   "It's read here inside the app, including text recognition on photos. The values are stored on this phone and are not sent to any server.")}
              </p>
            </div>

            <div className="rv-up-note">
              {L("PDFs do laboratório são lidos com exactidão. Fotografias e digitalizações são reconhecidas por leitura automática — confirme sempre os valores antes de guardar.",
                 "Lab PDFs are read exactly. Photos and scans go through automatic recognition — always check the values before saving.")}
            </div>
          </>
        )}

        {step === "reading" && (
          <div className="rv-up-center">
            <div className="rv-up-spinner"/>
            <div className="rv-up-center-title">{phase || L("A ler…","Reading…")}</div>
            <div className="rv-up-center-sub">{file?.name}</div>
            {pct != null && (
              <div className="rv-up-progress"><div style={{width: `${pct}%`}}/></div>
            )}
          </div>
        )}

        {step === "error" && (
          <div style={{padding: "10px 0"}}>
            <div className="rv-up-center" style={{padding: "20px 28px 12px"}}>
              <div className="rv-up-center-title">
                {errorKind === "notext"
                  ? L("Não consegui ler texto","Couldn't read any text")
                  : errorKind === "novalues"
                  ? L("Não reconheci parâmetros","No parameters recognised")
                  : L("Não consegui abrir o ficheiro","Couldn't open the file")}
              </div>
              <div className="rv-up-center-sub">
                {errorKind === "notext"
                  ? L("A imagem pode estar desfocada, escura ou torta. Tente uma fotografia mais direita e com boa luz, ou peça o PDF ao laboratório.",
                      "The image may be blurry, dark or skewed. Try a straighter, well-lit photo, or ask the lab for the PDF.")
                  : errorKind === "novalues"
                  ? L("O documento foi lido, mas nenhum dos nomes de parâmetros me é familiar. Em baixo está o que consegui ler — envie-o à equipa Vivara para acrescentarmos este laboratório.",
                      "The document was read, but none of the parameter names are familiar. Below is what was read — send it to the Vivara team so we can add this lab.")
                  : L("O ficheiro pode estar protegido por palavra-passe ou danificado.",
                      "The file may be password-protected or damaged.")}
              </div>
            </div>

            {doc && (
              <>
                <div className="rv-sub-section-head">
                  {L("Texto lido do documento","Text read from the document")} · {doc.lines.length} {L("linhas","lines")} · {doc.lines.join("").length} {L("caracteres","chars")}
                </div>
                <div className="rv-doc-page">
                  {doc.lines.length === 0 ? (
                    <div className="rv-doc-line rv-doc-line-more">{L("(nada foi extraído)","(nothing was extracted)")}</div>
                  ) : (
                    <div className="rv-doc-lines" data-scroll="true">
                      {doc.lines.slice(0, 80).map((line, i) => (
                        <div key={i} className={line.trim() ? "rv-doc-line" : "rv-doc-line rv-doc-line-more"}>
                          {line.trim() ? line : L("(linha vazia)","(empty line)")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rv-q-actions" style={{margin: "0 20px 12px"}}>
                  <button className="rv-cta-ghost" onClick={async () => {
                    const dump = `${file?.name} · ${kind} · ${doc.lines.length} linhas\n\n${doc.lines.join("\n")}`;
                    try {
                      await navigator.clipboard.writeText(dump);
                      showToast(L("Texto copiado","Text copied"));
                    } catch {
                      showToast(L("Não foi possível copiar","Couldn't copy"));
                    }
                  }}>{L("Copiar texto lido","Copy the text read")}</button>
                </div>
              </>
            )}

            <div className="rv-q-actions" style={{margin: "4px 20px 0"}}>
              <button className="rv-cta-primary" onClick={reset}>{L("Escolher outro ficheiro","Choose another file")}</button>
            </div>
          </div>
        )}

        {step === "review" && doc && (
          <>
            <div className="rv-doc-meta">
              <div className="rv-doc-file">
                <span className="rv-doc-file-icon">{ORIGIN_ICON.upload}</span>
                <span className="rv-doc-file-name">{file?.name}</span>
              </div>
              <div className="rv-doc-file-sub">
                {doc.lab ?? L("Laboratório não identificado","Lab not identified")}
                {kind !== "image" ? ` · ${doc.pages} ${L("pág.","pages")}` : ""}
                {doc.collectedISO ? ` · ${L("colheita","sample")} ${fmtDay(doc.collectedISO, lang, true)}` : ""}
              </div>
            </div>

            {preview && (
              <div className="rv-up-preview">
                <img src={preview} alt={L("Imagem carregada","Uploaded image")}/>
              </div>
            )}

            {isOcr && (
              <div className="rv-up-warn">
                <strong>{L("Valores lidos automaticamente","Values read automatically")}</strong>
                <span>
                  {L("O reconhecimento de imagem engana-se, sobretudo em dígitos. Compare cada valor com o original e corrija o que estiver errado — toque no número para editar.",
                     "Image recognition makes mistakes, especially with digits. Compare each value with the original and fix anything wrong — tap a number to edit.")}
                </span>
              </div>
            )}

            {values.some((v) => v.suspect) && (
              <div className="rv-up-warn" data-tone="alert">
                <strong>{L("Há valores fora do possível","Some values look impossible")}</strong>
                <span>
                  {L("Marcados com “confirmar”. Costuma ser a vírgula decimal perdida na leitura — 5,7 lido como 57. Corrija-os ou exclua-os.",
                     "Marked “check”. Usually a decimal point lost in reading — 5.7 read as 57. Correct or exclude them.")}
                </span>
              </div>
            )}
            {values.some((v) => v.origUnit) && (
              <div className="rv-up-warn" data-tone="info">
                <strong>{L("Alguns valores vêm noutra unidade","Some values are in a different unit")}</strong>
                <span>
                  {L("Para os comparar com as suas outras análises, mostramos também o valor na unidade usada na app. O número do documento fica guardado tal como está.",
                     "To compare them with your other results, we also show the value in the unit the app uses. The number from the document is kept exactly as it is.")}
                </span>
              </div>
            )}
            {values.some((v) => v.unitAssumed) && (
              <div className="rv-up-warn" data-tone="alert">
                <strong>{L("Há valores sem unidade","Some values have no unit")}</strong>
                <span>
                  {L("O documento não indica a unidade destes valores. Assumimos a habitual (marcada com “unidade?”). Confirme no original e exclua o valor se não corresponder.",
                     "The document doesn't state the unit for these values. We've assumed the usual one (marked “unit?”). Check the original and exclude the value if it doesn't match.")}
                </span>
              </div>
            )}
            <div className="rv-up-summary">
              <strong>{values.length}</strong> {L("parâmetros reconhecidos","parameters recognised")}
              <span>{L("Toque na caixa para excluir, ou no número para corrigir.","Tap the box to exclude, or the number to correct.")}</span>
            </div>

            <div className="rv-doc-rows">
              {values.map((v, i) => (
                <div key={i} className="rv-up-row" data-off={!v.keep || undefined} data-suspect={v.suspect || undefined}>
                  <button type="button" className="rv-up-check" data-on={v.keep || undefined}
                    onClick={() => toggle(i)} aria-label={v.keep ? L("Excluir","Exclude") : L("Incluir","Include")}>
                    {v.keep ? "✓" : ""}
                  </button>
                  <span className="rv-up-row-body">
                    <span className="rv-up-row-name">
                      {v.marker}
                      {v.suspect && <span className="rv-up-flag">{L("confirmar","check")}</span>}
                      {v.unitAssumed && <span className="rv-up-flag">{L("unidade?","unit?")}</span>}
                    </span>
                    <span className="rv-up-row-raw">{v.label}</span>
                    {v.origUnit && (
                      <span className="rv-up-conv">
                        {v.value
                          ? L(`Na app: ${fmtNum(v.value, "pt")} ${v.unit} (convertido de ${v.origUnit})`, `In the app: ${v.value} ${v.unit} (converted from ${v.origUnit})`)
                          : L("Escreva o valor do documento", "Enter the value from the document")}
                      </span>
                    )}
                    {v.unitAssumed && (
                      <span className="rv-up-conv">{L(`Sem unidade no documento: assumimos ${v.unit}`, `No unit in the document: we assumed ${v.unit}`)}</span>
                    )}
                  </span>
                  <span className="rv-up-row-vals">
                    <span className="rv-up-edit">
                      <input
                        className="rv-up-input"
                        inputMode="decimal"
                        value={fmtNum(v.origUnit ? v.origValue ?? "" : v.value, lang)}
                        onChange={(e) => edit(i, e.target.value)}
                        aria-label={`${v.marker} ${L("valor no documento","value in the document")}${v.origUnit ? ` (${v.origUnit})` : ""}`}
                      />
                      <span className="rv-doc-row-unit">{v.origUnit ?? v.unit}</span>
                    </span>
                    {(v.origUnit ? v.origRef : v.ref) && <span className="rv-doc-row-ref">ref {fmtNum(v.origUnit ? v.origRef ?? "" : v.ref, lang)}</span>}
                  </span>
                </div>
              ))}
            </div>

            <div className="rv-q-actions" style={{margin: "0 20px"}}>
              <button className="rv-cta-ghost" onClick={reset}>{L("Cancelar","Cancel")}</button>
              <button className="rv-cta-primary" disabled={keptCount === 0} onClick={save}>
                {L(`Guardar ${keptCount}`, `Save ${keptCount}`)}
              </button>
            </div>
            <div className="rv-doc-foot" style={{marginTop: 14}}>
              {L("Fica guardado neste telemóvel. A equipa clínica só vê depois de confirmar a partilha.",
                 "Stored on this phone. Your clinical team only sees it after you confirm sharing.")}
            </div>
          </>
        )}

        {step === "saved" && (
          <div className="rv-up-center">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-up-center-title">{L("Análise guardada","Lab result saved")}</div>
            <div className="rv-up-center-sub">
              {L(`${keptCount} valores guardados neste telemóvel.`, `${keptCount} values stored on this phone.`)}
            </div>
            {!savedFile && (
              <div className="rv-up-warn" data-tone="alert" style={{margin: "14px 20px 0"}}>
                <strong>{L("O PDF original não coube","The original PDF didn't fit")}</strong>
                <span>{L("Os valores ficaram guardados, mas não há espaço para o documento. Liberte espaço em Perfil › Análises carregadas.","The values were saved, but there's no room for the document. Free up space in Profile › Uploaded labs.")}</span>
              </div>
            )}
            {!persisted && (
              <div className="rv-up-warn" style={{margin: "14px 20px 0"}}>
                <strong>{L("Adicione a app ao ecrã principal","Add the app to your Home Screen")}</strong>
                <span>{L("O browser ainda não garante que guarda isto para sempre. No iPhone: Partilhar › Adicionar ao ecrã principal. Passa a ser tratado como uma app instalada e deixa de ser apagado sozinho.","The browser doesn't yet guarantee this is kept. On iPhone: Share › Add to Home Screen. It's then treated as an installed app and stops being cleared automatically.")}</span>
              </div>
            )}
            <div style={{display: "flex", gap: 8, marginTop: 20, width: "100%", padding: "0 20px"}}>
              <button className="rv-cta-ghost" style={{flex: 1, margin: 0}} onClick={() => go("registos")}>{L("Ver registos","See records")}</button>
              <button className="rv-cta-primary" style={{flex: 1, margin: 0}}
                onClick={() => savedId && go({ route: "documento", docId: savedId })}>
                {L("Abrir","Open")}
              </button>
            </div>
          </div>
        )}

        <div style={{height: 90}}/>
      </div>
    </div>
  );
}

// ─── Avisos ──────────────────────────────────────────
// Caixa de notificações. Um único sítio para tudo o que há de novo; o chat só
// mostra a bolinha de mensagens por ler e o assistente responde a «o que há de
// novo?» sem enviar nada.
function AvisosScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const notifs = useNotifications();

  const tone = (k: AppNotif["kind"]) => (k === "analise" ? "success" : k === "pedido" ? "alert" : "info");
  const icon = (k: AppNotif["kind"]) => (k === "consulta" ? CalIcon : k === "pedido" ? Icon.bell : Icon.doc);

  const open = (n: AppNotif) => {
    notifs.markRead([n.id]);
    go(n.to);
  };

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">{L("Notificações", "Notifications")}</div>
        <button className="rv-header-btn" onClick={() => go("notificacoes")} aria-label={L("Preferências de notificações", "Notification preferences")}>{Icon.settings}</button>
      </header>

      <div className="rv-body">
        {notifs.unread.length > 0 && (
          <div className="rv-notif-bar">
            <span>{notifs.unread.length} {L("por ler", "unread")}</span>
            <button type="button" className="rv-notif-markall" onClick={() => notifs.markRead(notifs.items.map((n) => n.id))}>
              {L("Marcar tudo como lido", "Mark all as read")}
            </button>
          </div>
        )}

        {notifs.items.map((n) => {
          const unread = !notifs.isRead(n);
          return (
            <button key={n.id} type="button" className="rv-aviso rv-notif" data-tone={tone(n.kind)} data-unread={unread || undefined} onClick={() => open(n)}>
              <div className="rv-aviso-icon">{icon(n.kind)}</div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{fmtDay(n.iso, lang)}{hhmm(n.iso) ? ` · ${hhmm(n.iso)}` : ""}</div>
                <div className="rv-aviso-title">{L(n.titlePt, n.titleEn)}</div>
                <div className="rv-aviso-body">{L(n.bodyPt, n.bodyEn)}</div>
              </div>
              {unread && <div className="rv-aviso-unread" aria-label={L("Por ler", "Unread")}/>}
            </button>
          );
        })}
        <div style={{height: 20}}/>
      </div>

      <TabBar active="alerts" />
    </div>
  );
}

// ─── Mensagens ───────────────────────────────────────
function MensagensScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const [input, setInput] = useState("");
  const [sent, setSent] = useState<{ text: string; time: string }[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (sent.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sent.length]);
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header rv-msg-header">
        <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
        <div className="rv-msg-header-meta">
          <div className="rv-msg-header-avatar">SC</div>
          <div>
            <div className="rv-msg-header-name">Dra. Sofia Cardoso</div>
            <div className="rv-msg-header-status"><span className="rv-msg-dot"/>Online</div>
          </div>
        </div>
        <button className="rv-header-btn" onClick={() => go("consultas")} aria-label={L("Consultas", "Appointments")}>{Icon.cal}</button>
      </header>

      <div className="rv-body rv-msg-body">
        <div className="rv-msg-day">{L("Hoje", "Today")}</div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-bubble">
            Bom dia, Maria. Vi os resultados do Synlab que carregou ontem — peço-lhe que repita o Estradiol antes da nossa consulta de 12 de maio.
          </div>
          <div className="rv-msg-time">09:14</div>
        </div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-action-card">
            <div className="rv-msg-action-card-icon" data-tone="alert">
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 V11 M9 14 V14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
            </div>
            <div className="rv-msg-action-card-meta">
              <div className="rv-msg-action-card-eyebrow">Pedido clínico</div>
              <div className="rv-msg-action-card-title">Reanalisar Estradiol</div>
              <div className="rv-msg-action-card-sub">até 10 mai · em jejum</div>
            </div>
            <span className="rv-msg-action-card-cta" style={{color: "var(--fg-50)"}}>Lembrete</span>
          </div>
          <div className="rv-msg-time">09:14</div>
        </div>

        <div className="rv-msg rv-msg--user">
          <div className="rv-msg-bubble">
            Bom dia! Sim, vou marcar para esta semana. Posso fazer no Synlab do Lumiar?
          </div>
          <div className="rv-msg-time">09:42 · vista</div>
        </div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-bubble">
            Sim, perfeito. Aproveite para fazer também FSH e LH — já lhe enviei o pedido. Como se tem sentido com os afrontamentos?
          </div>
          <div className="rv-msg-time">09:48</div>
        </div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-attach">
            <div className="rv-msg-attach-icon">{Icon.flask}</div>
            <div className="rv-msg-attach-meta">
              <div className="rv-msg-attach-name">Synlab_Pedido_FSH_LH.pdf</div>
              <div className="rv-msg-attach-sub">enviado pela Dra. · 192 KB</div>
            </div>
          </div>
          <div className="rv-msg-time">09:48</div>
        </div>

        <div className="rv-msg-day">Ontem</div>

        <div className="rv-msg rv-msg--sys">
          <div className="rv-msg-sys-bubble">
            <span className="rv-msg-sys-icon">✓</span>
            <span>14 marcadores extraídos do PDF Synlab · <a onClick={() => go("data")} style={{cursor: "pointer"}}>ver dados</a></span>
          </div>
        </div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-bubble">
            Atualizei o plano depois da consulta de quinta. Magnésio sobe para 400mg ao deitar.
          </div>
          <div className="rv-msg-time">16:42</div>
        </div>

        <div className="rv-msg rv-msg--doc">
          <div className="rv-msg-action-card" onClick={() => go("summary")}>
            <div className="rv-msg-action-card-icon" data-tone="info">
              <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 8 H13 M5 11 H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div className="rv-msg-action-card-meta">
              <div className="rv-msg-action-card-eyebrow">Resumo</div>
              <div className="rv-msg-action-card-title">Consulta de 22 abr</div>
              <div className="rv-msg-action-card-sub">plano atualizado · 3 alterações</div>
            </div>
            <span className="rv-msg-action-card-cta">Abrir →</span>
          </div>
          <div className="rv-msg-time">16:42</div>
        </div>

        {sent.map((m, i) => (
          <div key={i} className="rv-msg rv-msg--user">
            <div className="rv-msg-bubble">{m.text}</div>
            <div className="rv-msg-time">{m.time}</div>
          </div>
        ))}

        <div style={{height: 16}} ref={endRef}/>
      </div>

      <div className="rv-msg-compose">
        <button className="rv-msg-compose-attach" onClick={() => showToast(L("Anexo · imagem.jpg", "Attachment · image.jpg"))} aria-label={L("Anexar", "Attach")}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 4 V14 M4 9 H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <input className="rv-msg-compose-input" placeholder={L("Mensagem para a Dra. Sofia…", "Message to Dr. Sofia…")}
          value={input} onChange={(e) => setInput(e.target.value)}/>
        <button
          className="rv-msg-compose-send"
          data-active={input.length > 0}
          aria-label={L("Enviar", "Send")}
          onClick={() => {
            const text = input.trim();
            if (!text) return;
            const now = new Date();
            const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            setSent((prev) => [...prev, { text, time }]);
            setInput("");
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9 L15 3 L11 15 L9 10 Z" fill="currentColor"/></svg>
        </button>
      </div>

      <TabBar active="messages" />
    </div>
  );
}

// ─── Consultas da clínica, notificações e dados do utente ──
// Consultas: marcadas pela clínica (aparecem sempre como «marcada pelo médico»); o utente só as vê.
// Lembretes: do próprio utente, privados, nunca chegam à clínica.
interface ClinicAppt {
  id: string;
  iso: string; // "2026-05-12T14:30:00"
  titlePt: string; titleEn: string;
  placePt: string; placeEn: string;
}

const CLINIC_APPTS: ClinicAppt[] = [
  { id: "c-2026-05-12", iso: "2026-05-12T14:30:00", titlePt: "Discussão sobre TRH personalizada", titleEn: "Personalised HRT discussion", placePt: "Clínica Lumiar", placeEn: "Lumiar Clinic" },
  { id: "c-2026-05-20", iso: "2026-05-20T09:00:00", titlePt: "Colheita de sangue", titleEn: "Blood draw", placePt: "Clínica Lumiar", placeEn: "Lumiar Clinic" },
  { id: "c-2026-04-22", iso: "2026-04-22T10:00:00", titlePt: "Revisão trimestral", titleEn: "Quarterly review", placePt: "Clínica Lumiar", placeEn: "Lumiar Clinic" },
  { id: "c-2026-02-03", iso: "2026-02-03T10:00:00", titlePt: "Revisão de resultados", titleEn: "Results review", placePt: "Clínica Lumiar", placeEn: "Lumiar Clinic" },
  { id: "c-2025-12-10", iso: "2025-12-10T10:00:00", titlePt: "Primeira consulta", titleEn: "First appointment", placePt: "Clínica Lumiar", placeEn: "Lumiar Clinic" },
];

// A etiqueta diz quem marcou — pelo papel, não pelo nome.
const apptByLabel = (L: (pt: string, en: string) => string) => L("Marcada pelo médico", "Booked by the doctor");

const hhmm = (iso: string) => (iso.slice(11, 16) && iso.slice(11, 16) !== "00:00" ? iso.slice(11, 16) : "");

// Notificações simples. O texto não leva valores nem interpretação: o que há
// para ver está no documento ou na consulta, não na notificação.
interface AppNotif {
  id: string;
  iso: string;
  kind: "consulta" | "analise" | "pedido" | "resumo";
  titlePt: string; titleEn: string;
  bodyPt: string; bodyEn: string;
  to: NavRoute;
  readByDefault?: boolean;
}

const APP_NOTIFS: AppNotif[] = [
  { id: "n-pedido", iso: "2026-04-27T09:18:00", kind: "pedido", titlePt: "Pedido da equipa clínica", titleEn: "Request from the clinical team",
    bodyPt: "Há um pedido novo para si.", bodyEn: "There's a new request for you.", to: "consultas" },
  { id: "n-appt-20", iso: "2026-04-27T08:40:00", kind: "consulta", titlePt: "Consulta marcada", titleEn: "Appointment booked",
    bodyPt: "20 mai · 09:00 · marcada pelo médico", bodyEn: "20 May · 09:00 · booked by the doctor", to: "calendario" },
  { id: "n-appt-12", iso: "2026-04-24T11:02:00", kind: "consulta", titlePt: "Consulta marcada", titleEn: "Appointment booked",
    bodyPt: "12 mai · 14:30 · marcada pelo médico", bodyEn: "12 May · 14:30 · booked by the doctor", to: "calendario" },
  { id: "n-resumo", iso: "2026-04-22T18:05:00", kind: "resumo", titlePt: "Resumo da consulta disponível", titleEn: "Appointment summary available",
    bodyPt: "Consulta de 22 abr", bodyEn: "22 Apr appointment", to: "summary", readByDefault: true },
  { id: "n-lab", iso: "2026-04-22T16:42:00", kind: "analise", titlePt: "Análise nova", titleEn: "New lab result",
    bodyPt: "Synlab · 22 abr 2026", bodyEn: "Synlab · 22 Apr 2026", to: { route: "documento", docId: "a-2026-04-22" }, readByDefault: true },
];

function useReminders() {
  const [list, setList] = useState<Reminder[]>([]);
  useEffect(() => { setList(loadReminders()); }, []);
  return { list, add: (r: { day: string; time: string | null; text: string }) => setList(addReminder(r)), remove: (id: string) => setList(removeReminder(id)) };
}

function useConditions() {
  const [list, setList] = useState<PatientCondition[]>([]);
  useEffect(() => { setList(loadConditions()); }, []);
  return {
    list,
    save: (c: Parameters<typeof saveCondition>[0]) => setList(saveCondition(c)),
    remove: (id: string) => setList(removeCondition(id)),
  };
}

function useNotifications() {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => { setRead(loadRead()); }, []);
  const isRead = (n: AppNotif) => !!n.readByDefault || read.includes(n.id);
  const items = [...APP_NOTIFS].sort((a, b) => b.iso.localeCompare(a.iso));
  return {
    items,
    isRead,
    unread: items.filter((n) => !isRead(n)),
    markRead: (ids: string[]) => setRead(markRead(ids)),
  };
}

// ─── Calendário ──────────────────────────────────────
const CalIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="4" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 7.5 H15 M6.5 2.5 V5 M11.5 2.5 V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
);

function CalendarioScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const reminders = useReminders();
  const todayKey = dayKey(APP_TODAY);
  const [ym, setYm] = useState({ year: APP_TODAY.getFullYear(), month: APP_TODAY.getMonth() });
  const [sel, setSel] = useState(todayKey);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const grid = monthGrid(ym.year, ym.month);
  const apptsOn = (key: string) => CLINIC_APPTS.filter((a) => dayOf(a.iso) === key);
  const remindersOn = (key: string) => reminders.list.filter((r) => r.day === key);
  const weekdays = lang === "pt" ? ["S", "T", "Q", "Q", "S", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];

  const selAppts = apptsOn(sel).sort((a, b) => a.iso.localeCompare(b.iso));
  const selRems = remindersOn(sel).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  function closeForm() { setAdding(false); setText(""); setTime(""); setErr(null); }
  function save() {
    if (text.trim().length < 2) { setErr(L("Escreva o que quer lembrar.", "Write what you want to remember.")); return; }
    reminders.add({ day: sel, time: time || null, text });
    closeForm();
  }

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("consultas")} aria-label={L("Voltar", "Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Calendário", "Calendar")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-cal-nav">
          <button type="button" className="rv-cal-nav-btn" onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))} aria-label={L("Mês anterior", "Previous month")}>‹</button>
          <div className="rv-cal-month" aria-live="polite">{monthName(ym.month, lang)} {ym.year}</div>
          <button type="button" className="rv-cal-nav-btn" onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))} aria-label={L("Mês seguinte", "Next month")}>›</button>
        </div>

        <div className="rv-cal-grid" role="grid" aria-label={`${monthName(ym.month, lang)} ${ym.year}`}>
          {weekdays.map((w, i) => <div key={i} className="rv-cal-wd" aria-hidden="true">{w}</div>)}
          {grid.map((c) => {
            const na = apptsOn(c.key).length;
            const nr = remindersOn(c.key).length;
            return (
              <button
                key={c.key}
                type="button"
                className="rv-cal-cell"
                data-in={c.inMonth || undefined}
                data-today={c.key === todayKey || undefined}
                data-sel={c.key === sel || undefined}
                aria-pressed={c.key === sel}
                aria-label={`${c.day} ${monthName(new Date(c.key + "T00:00").getMonth(), lang)}${na ? `, ${na} ${L("consulta(s) da clínica", "clinic appointment(s)")}` : ""}${nr ? `, ${nr} ${L("lembrete(s) seu(s)", "reminder(s) of yours")}` : ""}`}
                onClick={() => { setSel(c.key); closeForm(); }}
              >
                <span className="rv-cal-num">{c.day}</span>
                <span className="rv-cal-dots" aria-hidden="true">
                  {na > 0 && <span className="rv-cal-dot" data-kind="clinic"/>}
                  {nr > 0 && <span className="rv-cal-dot" data-kind="mine"/>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rv-cal-legend">
          <span><span className="rv-cal-dot" data-kind="clinic"/>{L("Marcada pelo médico", "Booked by the doctor")}</span>
          <span><span className="rv-cal-dot" data-kind="mine"/>{L("Lembrete seu", "Your reminder")}</span>
        </div>

        <div className="rv-sub-section-head">{fmtDay(sel, lang, true)}</div>

        {selAppts.length === 0 && selRems.length === 0 && !adding && (
          <div className="rv-cal-empty">{L("Nada neste dia.", "Nothing on this day.")}</div>
        )}

        {selAppts.map((a) => (
          <div key={a.id} className="rv-cal-item" data-kind="clinic">
            <span className="rv-cal-item-tag" data-kind="clinic">{apptByLabel(L)}</span>
            <div className="rv-cal-item-title">{hhmm(a.iso) && <span className="rv-cal-item-time">{hhmm(a.iso)}</span>}{L(a.titlePt, a.titleEn)}</div>
            <div className="rv-cal-item-sub">{L(a.placePt, a.placeEn)}</div>
          </div>
        ))}

        {selRems.map((r) => (
          <div key={r.id} className="rv-cal-item" data-kind="mine">
            <span className="rv-cal-item-tag" data-kind="mine">{L("Lembrete seu", "Your reminder")}</span>
            <div className="rv-cal-item-title">{r.time && <span className="rv-cal-item-time">{r.time}</span>}{r.text}</div>
            <button type="button" className="rv-cal-item-del" onClick={() => reminders.remove(r.id)} aria-label={`${L("Apagar lembrete", "Delete reminder")}: ${r.text}`}>{L("Apagar", "Delete")}</button>
          </div>
        ))}

        {adding ? (
          <div className="rv-cal-form">
            <div className="rv-field">
              <label className="rv-field-label" htmlFor="rem-text">{L("Lembrete", "Reminder")}</label>
              <input id="rem-text" className="rv-field-input" value={text} maxLength={120} autoFocus
                aria-invalid={!!err} aria-describedby={err ? "rem-err" : undefined}
                placeholder={L("Ex.: tenho consulta", "E.g. I have an appointment")}
                onChange={(e) => { setText(e.target.value); setErr(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
              {err && <div id="rem-err" className="rv-field-error" role="alert">{err}</div>}
            </div>
            <div className="rv-field">
              <label className="rv-field-label" htmlFor="rem-time">{L("Hora (opcional)", "Time (optional)")}</label>
              <input id="rem-time" type="time" className="rv-field-input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="rv-q-actions" style={{margin: "4px 0 0"}}>
              <button type="button" className="rv-cta-ghost" onClick={closeForm}>{L("Cancelar", "Cancel")}</button>
              <button type="button" className="rv-cta-primary" onClick={save}>{L("Guardar", "Save")}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="rv-cta-ghost rv-cal-add" onClick={() => setAdding(true)}>
            + {L("Adicionar lembrete neste dia", "Add a reminder on this day")}
          </button>
        )}

        <div className="rv-doc-foot" style={{textAlign: "left", margin: "14px 20px 0"}}>
          {L("Os lembretes são só seus: ficam neste telemóvel e a clínica não os vê. Não criam consultas — servem para si saber que há algo nesse dia.",
             "Reminders are only yours: they stay on this phone and the clinic can't see them. They don't create appointments — they just let you know something is on that day.")}
        </div>
        <div style={{height: 40}}/>
      </div>
    </div>
  );
}

// ─── Condições ───────────────────────────────────────
// Registadas pelo próprio utente, sem precisar de diagnóstico. É um registo
// seu: a app não as interpreta nem altera nada com base nelas.
function CondicoesScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const conds = useConditions();
  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [since, setSince] = useState("");
  const [status, setStatus] = useState<ConditionStatus>("active");
  const [note, setNote] = useState("");
  const [errs, setErrs] = useState<{ name?: string; since?: string }>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const thisYear = APP_TODAY.getFullYear();

  const suggestions = view === "form" && name.trim().length >= 2 && !CONDITION_LIST.some(([pt, en]) => pt === name || en === name)
    ? searchConditions(name) : [];

  function openForm(c?: PatientCondition) {
    setEditId(c?.id ?? null);
    setName(c?.name ?? ""); setSince(c?.sinceYear ? String(c.sinceYear) : "");
    setStatus(c?.status ?? "active"); setNote(c?.note ?? ""); setErrs({});
    setView("form");
  }

  function save() {
    const e: typeof errs = {};
    const n = name.trim();
    if (n.length < 2) e.name = L("Escreva ou escolha uma condição.", "Write or choose a condition.");
    const y = since.trim() === "" ? null : Number(since);
    if (y != null && (!Number.isInteger(y) || y < 1900 || y > thisYear)) e.since = L(`Indique um ano entre 1900 e ${thisYear}.`, `Enter a year between 1900 and ${thisYear}.`);
    setErrs(e);
    if (e.name || e.since) return;
    const custom = !CONDITION_LIST.some(([pt, en]) => pt === n || en === n);
    conds.save({ id: editId ?? undefined, name: n, custom, sinceYear: y, status, note });
    setView("list");
  }

  const statusLabel = (s: ConditionStatus) => (s === "active" ? L("Ativa", "Active") : L("Resolvida", "Resolved"));

  return (
    <SubScreen title={L("Condições", "Conditions")} onBack={() => (view === "form" ? setView("list") : go("profile"))}>
      {view === "list" ? (
        <>
          <p className="rv-cond-intro">
            {L("Registe aqui as condições com que vive no dia a dia, das mais comuns às mais raras. Não precisa de um diagnóstico para começar. É um registo seu: não é um diagnóstico e fica neste telemóvel.",
               "Record here the conditions you live with day to day, from the most common to the rarest. You don't need a diagnosis to start. It's your own record: it isn't a diagnosis and it stays on this phone.")}
          </p>

          {conds.list.length === 0 ? (
            <div className="rv-cond-empty">{L("Ainda não registou nenhuma condição.", "You haven't recorded any conditions yet.")}</div>
          ) : (
            <div className="rv-cond-list">
              {conds.list.map((c) => (
                <div key={c.id} className="rv-cond-card">
                  <div className="rv-cond-top">
                    <span className="rv-cond-name">{c.name}</span>
                    <span className="rv-cond-status" data-status={c.status}>{statusLabel(c.status)}</span>
                  </div>
                  <div className="rv-cond-sub">
                    {c.sinceYear ? `${L("Desde", "Since")} ${c.sinceYear}` : L("Sem data", "No date")}
                    {c.custom ? ` · ${L("escrita por si", "written by you")}` : ""}
                  </div>
                  {c.note && <div className="rv-cond-note">{c.note}</div>}
                  <div className="rv-cond-actions">
                    {confirmDel === c.id ? (
                      <>
                        <button type="button" className="rv-device-btn" onClick={() => setConfirmDel(null)}>{L("Não", "No")}</button>
                        <button type="button" className="rv-device-btn" data-tone="danger" onClick={() => { conds.remove(c.id); setConfirmDel(null); }}>{L("Apagar", "Delete")}</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="rv-device-btn" onClick={() => openForm(c)} aria-label={`${L("Editar", "Edit")} ${c.name}`}>{L("Editar", "Edit")}</button>
                        <button type="button" className="rv-device-btn" data-tone="ghost" onClick={() => setConfirmDel(c.id)} aria-label={`${L("Apagar", "Delete")} ${c.name}`}>{L("Apagar", "Delete")}</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{padding: "4px 20px 0"}}>
            <button type="button" className="rv-cta-primary" style={{width: "100%", margin: 0}} onClick={() => openForm()}>
              + {L("Adicionar condição", "Add a condition")}
            </button>
          </div>
        </>
      ) : (
        <form className="rv-cond-form" noValidate onSubmit={(ev) => { ev.preventDefault(); save(); }}>
          <div className="rv-field">
            <label className="rv-field-label" htmlFor="cond-name">{L("Condição", "Condition")}</label>
            <input id="cond-name" className="rv-field-input" value={name} autoFocus autoComplete="off" maxLength={80}
              aria-invalid={!!errs.name} aria-describedby={errs.name ? "cond-name-err" : "cond-name-hint"}
              placeholder={L("Pesquise ou escreva", "Search or type")}
              onChange={(e) => { setName(e.target.value); setErrs((x) => ({ ...x, name: undefined })); }} />
            <div id="cond-name-hint" className="rv-field-hint">{L("Se não encontrar na lista, escreva como quiser.", "If you can't find it in the list, write it as you like.")}</div>
            {errs.name && <div id="cond-name-err" className="rv-field-error" role="alert">{errs.name}</div>}
            {suggestions.length > 0 && (
              <ul className="rv-cond-sugg" aria-label={L("Sugestões", "Suggestions")}>
                {suggestions.map((s) => (
                  <li key={s.pt}>
                    <button type="button" onClick={() => setName(lang === "pt" ? s.pt : s.en)}>{lang === "pt" ? s.pt : s.en}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rv-field">
            <label className="rv-field-label" htmlFor="cond-since">{L("Desde (ano, opcional)", "Since (year, optional)")}</label>
            <input id="cond-since" className="rv-field-input" inputMode="numeric" value={since} maxLength={4}
              aria-invalid={!!errs.since} aria-describedby={errs.since ? "cond-since-err" : undefined}
              onChange={(e) => { setSince(e.target.value.replace(/\D/g, "")); setErrs((x) => ({ ...x, since: undefined })); }} />
            {errs.since && <div id="cond-since-err" className="rv-field-error" role="alert">{errs.since}</div>}
          </div>

          <fieldset className="rv-field rv-field-set">
            <legend className="rv-field-label">{L("Estado", "Status")}</legend>
            {(["active", "resolved"] as const).map((s) => (
              <label key={s} className="rv-radio">
                <input type="radio" name="cond-status" checked={status === s} onChange={() => setStatus(s)} />
                <span>{statusLabel(s)}</span>
              </label>
            ))}
          </fieldset>

          <div className="rv-field">
            <label className="rv-field-label" htmlFor="cond-note">{L("Nota (opcional)", "Note (optional)")}</label>
            <textarea id="cond-note" className="rv-field-input" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="rv-q-actions" style={{margin: "8px 0 0"}}>
            <button type="button" className="rv-cta-ghost" onClick={() => setView("list")}>{L("Cancelar", "Cancel")}</button>
            <button type="submit" className="rv-cta-primary">{L("Guardar", "Save")}</button>
          </div>
        </form>
      )}
    </SubScreen>
  );
}

// ─── Assistente Vivara ───────────────────────────────
// Por regras, sem modelo de linguagem (ver lib/assistant-rules.ts): responde
// sobre datas, documentos, lembretes, notificações e plano. Não interpreta
// resultados nem dá conselhos.
interface AsstMsg { role: "user" | "assistant"; text: string; actions?: AsstAction[] }

function useAssistantFacts(): AsstFacts {
  const uploads = useUploads();
  const reminders = useReminders();
  const conds = useConditions();
  const notifs = useNotifications();
  return {
    today: dayKey(APP_TODAY),
    appts: CLINIC_APPTS.map((a) => ({ id: a.id, iso: a.iso, titlePt: a.titlePt, titleEn: a.titleEn })),
    reminders: reminders.list.map((r) => ({ day: r.day, time: r.time, text: r.text })),
    docs: [
      ...LAB_DOCS.map((d) => ({ id: d.id, iso: d.iso, lab: d.lab, titlePt: d.titlePt, titleEn: d.titleEn, markers: d.rows.map((r) => r.marker).filter((m): m is string => !!m) })),
      ...uploads.map((u) => ({ id: u.id, iso: u.collectedISO, lab: u.lab ?? "—", titlePt: "Análise carregada por si", titleEn: "Lab result you uploaded", markers: u.values.map((v) => v.marker).filter((m): m is string => !!m) })),
    ],
    unread: notifs.unread.map((n) => ({ titlePt: n.titlePt, titleEn: n.titleEn })),
    supplements: PLANO_HOJE.filter((p) => p.type === "supplement").map((p) => ({
      namePt: translate("pt", p.key), nameEn: translate("en", p.key), whenPt: p.time, whenEn: p.time,
    })),
    conditions: conds.list.map((c) => c.name),
  };
}

function AssistenteScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const facts = useAssistantFacts();
  const [messages, setMessages] = useState<AsstMsg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const reply = answerQuestion(text, facts, lang);
    setMessages((prev) => [...prev, { role: "user", text }, { role: "assistant", text: reply.text, actions: reply.actions }]);
    setInput("");
  };

  const intro = answerQuestion("", facts, lang);
  const suggestions = [
    L("Quando é a minha próxima consulta?", "When is my next appointment?"),
    L("Mostra-me os meus exames", "Show me my tests"),
    L("O que há de novo?", "What's new?"),
  ];

  const run = (to: AsstAction["to"]) => go(to as NavRoute);

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header rv-msg-header">
        <button className="rv-header-btn" onClick={() => go("home")} aria-label={L("Voltar", "Back")}>{Icon.back}</button>
        <div className="rv-msg-header-meta">
          <div className="rv-msg-header-avatar" aria-hidden="true">{Icon.sparkle}</div>
          <div>
            <div className="rv-msg-header-name">{L("Assistente Vivara", "Vivara Assistant")}</div>
            <div className="rv-msg-header-status">{L("Os seus dados, ao alcance", "Your data, within reach")}</div>
          </div>
        </div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body rv-asst-body" ref={scrollRef}>
        <div className="rv-asst-msg rv-asst-msg--assistant"><div className="rv-asst-bubble" style={{whiteSpace: "pre-line"}}>{intro.text}</div></div>
        {messages.length === 0 && (
          <div className="rv-asst-suggest">
            {suggestions.map((s) => <button key={s} type="button" className="rv-asst-chip" onClick={() => ask(s)}>{s}</button>)}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`rv-asst-msg rv-asst-msg--${m.role}`}>
            <div className="rv-asst-bubble" style={{whiteSpace: "pre-line"}}>{m.text}</div>
            {m.actions && m.actions.length > 0 && (
              <div className="rv-asst-actions">
                {m.actions.map((a, k) => <button key={k} type="button" className="rv-asst-chip" onClick={() => run(a.to)}>{a.label}</button>)}
              </div>
            )}
          </div>
        ))}
        <div style={{height: 8}}/>
      </div>

      <form className="rv-msg-compose rv-asst-compose" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <label htmlFor="asst-input" className="rv-sr-only">{L("Pergunta", "Question")}</label>
        <input
          id="asst-input"
          className="rv-msg-compose-input rv-asst-input"
          placeholder={L("Pergunte sobre os seus dados…", "Ask about your data…")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="rv-msg-compose-send" data-active={input.trim().length > 0} disabled={input.trim().length === 0} aria-label={L("Enviar", "Send")}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9 L15 3 L11 15 L9 10 Z" fill="currentColor"/></svg>
        </button>
      </form>

      <TabBar active="" />
    </div>
  );
}

// ─── Diário ──────────────────────────────────────────
function DiarioScreen() {
  const { go } = useNav();
  const { L } = useLang();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(2);
  const [sleep, setSleep] = useState("so-so");
  const [symptoms, setSymptoms] = useState(new Set(["afrontamentos"]));
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (s: string) => {
    const next = new Set(symptoms);
    next.has(s) ? next.delete(s) : next.add(s);
    setSymptoms(next);
  };

  const moodFaces = ["😔", "😐", "🙂", "😊", "🤩"];
  const symptomList: [string, string][] = [
    ["afrontamentos", L("Afrontamentos", "Hot flushes")],
    ["insonia", L("Insónia", "Insomnia")],
    ["cefaleia", L("Cefaleia", "Headache")],
    ["ansiedade", L("Ansiedade", "Anxiety")],
    ["dor-articular", L("Dor articular", "Joint pain")],
    ["dor-abdominal", L("Dor abdominal", "Abdominal pain")],
    ["cansaco", L("Cansaço", "Fatigue")],
    ["nevoa-mental", L("Névoa mental", "Brain fog")],
    ["palpitacoes", L("Palpitações", "Palpitations")],
    ["suores-noturnos", L("Suores noturnos", "Night sweats")],
  ];

  if (saved) {
    return (
      <div className="rv-screen">
        <StatusBar />
        <header className="rv-header">
          <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
          <div className="rv-header-title">{L("Diário", "Diary")}</div>
          <div style={{width: 36}}/>
        </header>
        <div className="rv-body">
          <div className="rv-schedule-done">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-import-title">{L("Registo guardado", "Entry saved")}</div>
            <div className="rv-import-sub">{L("A sua equipa clínica verá esta entrada antes da próxima consulta.", "Your clinical team will see this entry before the next appointment.")}</div>
            <div className="rv-schedule-tickets">
              <div className="rv-schedule-ticket"><span>{L("Humor", "Mood")} · {moodFaces[mood]}</span><span className="rv-mono" style={{color: "var(--fg-50)"}}>{L("27 abr", "27 Apr")}</span></div>
              <div className="rv-schedule-ticket"><span>{L("Energia", "Energy")}</span><span className="rv-mono">{energy + 1}/5</span></div>
              <div className="rv-schedule-ticket"><span>{L("Sintomas", "Symptoms")}</span><span className="rv-mono">{symptoms.size}</span></div>
            </div>
            <button className="rv-cta-primary" onClick={() => go("home")}>{L("Voltar ao início", "Back to home")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Diário", "Diary")}</div>
        <button className="rv-header-btn" onClick={() => go("consultas")} aria-label={L("Consultas", "Appointments")}>{Icon.cal}</button>
      </header>

      <div className="rv-body">
        <div className="rv-diary-eyebrow">{L("Hoje · 27 abril", "Today · 27 April")}</div>
        <div className="rv-diary-title">{L("Como se sente?", "How do you feel?")}</div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">{L("Humor", "Mood")}</div>
          <div className="rv-mood-row">
            {moodFaces.map((f, i) => (
              <button key={i} className="rv-mood-face" data-active={mood === i} onClick={() => setMood(i)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">{L("Energia", "Energy")}</div>
          <div className="rv-energy-row">
            {Array.from({length: 5}).map((_, i) => (
              <button key={i} className="rv-energy-dot" data-active={i <= energy} onClick={() => setEnergy(i)}/>
            ))}
            <span className="rv-energy-label">{[L("muito baixa","very low"),L("baixa","low"),L("média","medium"),L("boa","good"),L("alta","high")][energy]}</span>
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">{L("Sono", "Sleep")}</div>
          <div className="rv-diary-pills">
            {([["bad",L("Mau","Poor")],["so-so",L("Médio","Fair")],["good",L("Bom","Good")],["great",L("Ótimo","Great")]] as [string,string][]).map(([v, l]) => (
              <button key={v} className="rv-diary-pill" data-active={sleep === v} onClick={() => setSleep(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label" style={{justifyContent: "space-between", display: "flex"}}>
            <span>{L("Sintomas", "Symptoms")} <span className="rv-diary-label-sub">{L("o que sentiu hoje", "what you felt today")}</span></span>
            <a style={{textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--accent)", cursor: "pointer"}} onClick={() => go("sintomas")}>{L("Histórico →","History →")}</a>
          </div>
          <div className="rv-diary-chips">
            {symptomList.map(([id, label]) => (
              <button key={id} className="rv-diary-chip" data-active={symptoms.has(id)} onClick={() => toggle(id)}>
                {symptoms.has(id) ? "✓ " : "+ "}{label}
              </button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">{L("Nota · opcional", "Note · optional")}</div>
          <textarea className="rv-diary-textarea" placeholder={L("Algo que queira que a equipa clínica saiba?", "Anything you'd like your clinical team to know?")}
            value={note} onChange={(e) => setNote(e.target.value)} rows={3}/>
        </div>

        <button className="rv-cta-primary" onClick={() => setSaved(true)}>{L("Guardar registo", "Save entry")}</button>
        <div style={{height: 24}}/>
      </div>
    </div>
  );
}

// ─── Consultas ───────────────────────────────────────
function ConsultasScreen() {
  const { go } = useNav();
  const { L } = useLang();
  const past = [
    { date: L("22 abr 2026", "22 Apr 2026"), label: L("Revisão trimestral", "Quarterly review"),    duration: "45 min", who: L("Equipa clínica", "Clinical team"), changes: 3 },
    { date: L("03 fev 2026", "03 Feb 2026"), label: L("Revisão de resultados", "Results review"),    duration: "30 min", who: L("Equipa clínica", "Clinical team"), changes: 1 },
    { date: L("10 dez 2025", "10 Dec 2025"), label: L("Primeira consulta", "First appointment"),     duration: "75 min", who: L("Equipa clínica", "Clinical team"), changes: 4 },
  ];
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Consultas", "Appointments")}</div>
        <button className="rv-header-btn" onClick={() => go("calendario")} aria-label={L("Abrir calendário", "Open calendar")}>{CalIcon}</button>
      </header>

      <div className="rv-body">
        <div className="rv-section-head" style={{margin: "0 20px 8px"}}><h3>{L("Próxima", "Next")}</h3></div>
        <div className="rv-upcoming-card">
          <div className="rv-upcoming-head">
            <div className="rv-upcoming-date">
              <div className="rv-upcoming-day">12</div>
              <div className="rv-upcoming-month">{L("Mai", "May")}</div>
            </div>
            <div className="rv-upcoming-meta">
              <div className="rv-upcoming-title">{L("Discussão sobre TRH personalizada", "Personalised HRT discussion")}</div>
              <div className="rv-upcoming-when">{L("14:30 · Clínica Lumiar · 45 min", "14:30 · Lumiar Clinic · 45 min")}</div>
              <div className="rv-upcoming-who">{L("Marcada pelo médico · Clínica Lumiar", "Booked by the doctor · Lumiar Clinic")}</div>
            </div>
          </div>
          <div className="rv-upcoming-prep">
            <div className="rv-upcoming-prep-head">{L("Antes da consulta", "Before the appointment")}</div>
            <div className="rv-upcoming-prep-row" data-done="true">
              <span className="rv-upcoming-check">✓</span>
              <span>{L("Plano de hoje (12 dias seguidos)", "Today's plan (12-day streak)")}</span>
            </div>
            <div className="rv-upcoming-prep-row" data-done="false">
              <span className="rv-upcoming-check"/>
              <span>{L("Reanalisar Estradiol", "Re-test Estradiol")}</span>
              <span className="rv-upcoming-prep-cta" style={{color: "var(--fg-50)", cursor: "default"}}>{L("até 10 mai", "by 10 May")}</span>
            </div>
            <div className="rv-upcoming-prep-row" data-done="false">
              <span className="rv-upcoming-check"/>
              <span>{L("Registar diário (3 das últimas 7 noites)", "Log diary (3 of last 7 nights)")}</span>
              <span className="rv-upcoming-prep-cta" onClick={() => go("diary")}>{L("Abrir", "Open")}</span>
            </div>
          </div>
        </div>

        <div className="rv-section-head" style={{margin: "16px 20px 8px"}}>
          <h3>{L("Anteriores", "Past")}</h3>

        </div>
        {past.map((c, i) => (
          <div key={i} className="rv-past-row" onClick={() => i === 0 ? go("summary") : undefined} style={{cursor: "pointer"}}>
            <div className="rv-past-date">
              <div className="rv-past-day rv-mono">{c.date.split(" ")[0]}</div>
              <div className="rv-past-month">{c.date.split(" ")[1]} {c.date.split(" ")[2]}</div>
            </div>
            <div className="rv-past-meta">
              <div className="rv-past-label">{c.label}</div>
              <div className="rv-past-sub">{c.who} · {c.duration} · {c.changes} {L("alterações no plano", "plan changes")}</div>
            </div>
            <div className="rv-chev">{Icon.chev}</div>
          </div>
        ))}
        <div style={{height: 100}}/>
      </div>

      <TabBar active="home" />
    </div>
  );
}

// ─── Consultation Summary ────────────────────────────
function ConsultationSummary() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("alerts")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Consulta · 22 abr", "Appointment · 22 Apr")}</div>
        <button className="rv-header-btn" onClick={() => shareNative({ title: L("Consulta · 22 abr", "Appointment · 22 Apr"), text: L("Resumo da consulta de 22 abr (Vivara)", "Summary of 22 Apr appointment (Vivara)"), toast: showToast })} aria-label={L("Partilhar", "Share")}>{Icon.share}</button>
      </header>

      <div className="rv-body">
        <div className="rv-summary-hero">
          <div className="rv-summary-doctor">
            <div className="rv-summary-avatar">SC</div>
            <div>
              <div className="rv-summary-name">{L("Equipa clínica", "Clinical team")}</div>
              <div className="rv-summary-sub">{L("Medicina Interna · Lumiar · 45 min", "Internal Medicine · Lumiar · 45 min")}</div>
            </div>
          </div>
          <div className="rv-summary-quote">
            {L("\"Maria, vamos manter o plano metabólico actual mas ajustar magnésio. Quero repetir Estradiol antes de discutir TRH.\"",
               "\"Maria, we'll keep the current metabolic plan but adjust magnesium. I want to repeat Estradiol before discussing HRT.\"")}
          </div>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">{L("Plano actualizado", "Updated plan")}</div>
          <div className="rv-summary-plan">
            <div className="rv-summary-plan-row" data-tag="keep"><span className="rv-summary-plan-tag">{L("manter", "keep")}</span><span>{L("Metformina 500 mg · pequeno-almoço", "Metformin 500 mg · breakfast")}</span></div>
            <div className="rv-summary-plan-row" data-tag="change"><span className="rv-summary-plan-tag">{L("alterar", "change")}</span><span>{L("Magnésio 200 →", "Magnesium 200 →")} <strong>400 mg</strong> {L("ao deitar", "at bedtime")}</span></div>
            <div className="rv-summary-plan-row" data-tag="keep"><span className="rv-summary-plan-tag">{L("manter", "keep")}</span><span>{L("Berberina 500 mg · antes do jantar", "Berberine 500 mg · before dinner")}</span></div>
            <div className="rv-summary-plan-row" data-tag="new"><span className="rv-summary-plan-tag">{L("novo", "new")}</span><span>{L("Reanálise de Estradiol · até 10 mai", "Estradiol re-test · by 10 May")}</span></div>
          </div>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">{L("Notas clínicas", "Clinical notes")}</div>
          <ul className="rv-summary-notes">
            <li>{L("Sintomatologia de afrontamentos noturnos referida pela utente nas últimas 3 semanas.", "Night hot flushes reported by the patient over the last 3 weeks.")}</li>
            <li>{L("Tendência descendente de Estradiol nos últimos 6 meses (78→38 pg/mL).", "Downward Estradiol trend over the last 6 months (78→38 pg/mL).")}</li>
            <li>{L("HbA1c estável em 5.7%, ApoB em descida progressiva.", "HbA1c stable at 5.7%, ApoB progressively decreasing.")}</li>
            <li>{L("Adesão referida ao plano de suplementação: boa.", "Reported adherence to the supplement plan: good.")}</li>
          </ul>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">{L("Próximos passos", "Next steps")}</div>
          <div className="rv-summary-steps">
            <div className="rv-summary-step"><span className="rv-summary-step-when">{L("10 mai", "10 May")}</span><span>{L("Colheita Estradiol", "Estradiol sample")}</span></div>
            <div className="rv-summary-step"><span className="rv-summary-step-when">{L("12 mai · 14:30", "12 May · 14:30")}</span><span>{L("Consulta de follow-up — discussão TRH", "Follow-up appointment — HRT discussion")}</span></div>
          </div>
        </div>

        <div className="rv-info-note">
          <strong>{L("Reanálise pedida", "Re-test requested")}</strong>
          <span>{L("Faça a colheita de Estradiol até 10 mai no seu laboratório habitual. Não precisa de marcar nada na app.", "Take the Estradiol sample by 10 May at your usual lab. No booking needed in the app.")}</span>
        </div>
        <button className="rv-cta-ghost" onClick={() => go("alerts")}>{L("Voltar a avisos", "Back to alerts")}</button>
        <div style={{height: 24}}/>
      </div>
    </div>
  );
}

// ─── Schedule Analysis ───────────────────────────────
function ScheduleAnalysis() {
  const { go } = useNav();
  const { L } = useLang();
  const [step, setStep] = useState<"pick" | "done">("pick");
  const [lab, setLab] = useState("synlab");
  const [date, setDate] = useState(L("06 mai · 08:15", "06 May · 08:15"));
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("alerts")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Marcar reanálise", "Book re-test")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        {step === "pick" ? (
          <>
            <div className="rv-schedule-eyebrow">{L("A pedido da equipa clínica", "Requested by your clinical team")}</div>
            <div className="rv-schedule-title">{L("Reanálise · Estradiol", "Re-test · Estradiol")}</div>
            <div className="rv-schedule-sub">{L("Repetir até", "Repeat by")} <strong>{L("10 mai 2026", "10 May 2026")}</strong>. {L("Confirme laboratório e hora.", "Confirm lab and time.")}</div>

            <div className="rv-schedule-section-head">{L("Laboratório", "Laboratory")}</div>
            <div className="rv-schedule-options">
              {[
                { id: "synlab", name: "Synlab · Lumiar",             meta: "1.2 km · 08:00–12:00", price: L("comparticipado", "covered") },
                { id: "cuf",    name: "CUF Descobertas",             meta: "3.4 km · 07:30–11:00", price: "32 €" },
                { id: "ipo",    name: "Joaquim Chaves · Saldanha",   meta: "5.1 km · 08:00–13:00", price: L("comparticipado", "covered") },
              ].map(l => (
                <button key={l.id} className="rv-schedule-option" data-active={lab === l.id} onClick={() => setLab(l.id)}>
                  <div className="rv-schedule-option-radio"><span/></div>
                  <div className="rv-schedule-option-meta">
                    <div className="rv-schedule-option-name">{l.name}</div>
                    <div className="rv-schedule-option-sub">{l.meta}</div>
                  </div>
                  <div className="rv-schedule-option-price">{l.price}</div>
                </button>
              ))}
            </div>

            <div className="rv-schedule-section-head">{L("Horário disponível", "Available times")}</div>
            <div className="rv-schedule-slots">
              {[L("04 mai · 07:45","04 May · 07:45"),L("05 mai · 08:00","05 May · 08:00"),L("06 mai · 08:15","06 May · 08:15"),L("07 mai · 09:30","07 May · 09:30"),L("09 mai · 08:00","09 May · 08:00")].map(s => (
                <button key={s} className="rv-schedule-slot" data-active={date === s} onClick={() => setDate(s)}>{s}</button>
              ))}
            </div>

            <div className="rv-schedule-note">
              <span className="rv-dot"/>{L("Em jejum 8h · sem actividade física vigorosa nas 24h anteriores", "Fasting 8h · no vigorous exercise in the prior 24h")}
            </div>

            <button className="rv-cta-primary" onClick={() => setStep("done")}>{L("Confirmar marcação", "Confirm booking")}</button>
          </>
        ) : (
          <div className="rv-schedule-done">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-import-title">{L("Marcação confirmada", "Booking confirmed")}</div>
            <div className="rv-import-sub">{L("Reanálise de Estradiol", "Estradiol re-test")}<br/>{date} · Synlab Lumiar</div>
            <div className="rv-schedule-tickets">
              <div className="rv-schedule-ticket"><span>{L("Adicionado ao calendário", "Added to calendar")}</span><span style={{color: "var(--lime)"}}>✓</span></div>
              <div className="rv-schedule-ticket"><span>{L("Lembrete 24h antes", "Reminder 24h before")}</span><span style={{color: "var(--lime)"}}>✓</span></div>
              <div className="rv-schedule-ticket"><span>{L("Equipa clínica notificada", "Clinical team notified")}</span><span style={{color: "var(--lime)"}}>✓</span></div>
            </div>
            <button className="rv-cta-primary" onClick={() => go("home")}>{L("Voltar ao início", "Back to home")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Perfil ──────────────────────────────────────────
function PerfilScreen() {
  const { go, logout } = useNav();
  const { t, lang, setLang, L } = useLang();
  const { status: whoop } = useWhoopStatus();
  const body = whoop?.connected ? whoop.metrics?.body : null;
  const liveHeight = body?.heightCm ?? null;
  const liveWeight = body?.weightKg ?? null;
  const liveImc = body?.imc ?? null;
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">{t("profile.title")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-profile-hero">
          <div className="rv-profile-avatar">MA</div>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="rv-profile-name">Maria Antunes</div>
            <div className="rv-profile-sub">{t("profile.age")}</div>
            <div className="rv-profile-care">{t("profile.care")}</div>
          </div>
        </div>

        <div className="rv-stats">
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.height")}</div><div className="rv-stat-value">{liveHeight ?? 168}<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.weight")}</div><div className="rv-stat-value">{liveWeight ?? 71.2}<span style={{fontSize: 10, color: "var(--fg-50)"}}>kg</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.imc")}</div><div className="rv-stat-value">{liveImc ?? 25.2}</div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.waist")}</div><div className="rv-stat-value">82<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
        </div>
        {liveHeight != null && (
          <div style={{margin: "-6px 20px 14px", fontSize: 10.5, color: "var(--fg-50)"}}>
            {L("Altura e peso via Whoop · cintura continua estimada","Height and weight via Whoop · waist is still an estimate")}
          </div>
        )}

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>{t("profile.goals")}</h3><span style={{fontSize: 11, color: "var(--fg-50)"}}>{t("profile.goalsBy")}</span></div>
        <div className="rv-goals">
          <div className="rv-goal" data-tone="watch"><span className="rv-goal-name">HbA1c &lt; 5.4 %</span><span className="rv-goal-state">5.7 → {L("alvo","target")}</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "55%"}}/></div></div>
          <div className="rv-goal" data-tone="watch"><span className="rv-goal-name">ApoB &lt; 80 mg/dL</span><span className="rv-goal-state">102 → {L("alvo","target")}</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "30%"}}/></div></div>
          <div className="rv-goal"><span className="rv-goal-name">Vit. D &gt; 50 ng/mL</span><span className="rv-goal-state">52 ✓</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "100%"}}/></div></div>
          <div className="rv-goal"><span className="rv-goal-name">{L("Sono profundo","Deep sleep")} ≥ 70 min</span><span className="rv-goal-state">68 ≈ {L("alvo","target")}</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "92%"}}/></div></div>
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>{t("profile.integrations")}</h3></div>
        <div className="rv-list">
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("devices"); }}>
            <div className="rv-list-icon">{Icon.watch}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{t("profile.devices")}</span>
              <span className="rv-list-sub">Apple Health, Oura, Garmin, Whoop…</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("guardadas"); }}>
            <div className="rv-list-icon">{Icon.doc}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Análises carregadas","Uploaded labs")}</span>
              <span className="rv-list-sub">{L("Guardadas no dispositivo · apagar e exportar","Stored on device · delete and export")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("condicoes"); }}>
            <div className="rv-list-icon">{Icon.pulse}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Condições","Conditions")}</span>
              <span className="rv-list-sub">{L("As que tem, num só registo","The ones you have, in one record")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("nutricao"); }}>
            <div className="rv-list-icon">{Icon.pill}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Nutrição & Suplementos","Nutrition & Supplements")}</span>
              <span className="rv-list-sub">{L("Dose, objetivo e histórico","Dose, goal and history")}</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
        </div>


        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>{t("profile.settings")}</h3></div>
        <div className="rv-list">
          <div className="rv-list-row">
            <div className="rv-list-icon"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M1 7 H13 M7 1 a9 9 0 0 1 0 12 a9 9 0 0 1 0-12" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg></div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.language")}</span></div>
            <div className="rv-lang-toggle" role="group" aria-label={t("profile.language")}>
              <button type="button" className="rv-lang-opt" data-active={lang === "pt"} onClick={() => setLang("pt")}>PT</button>
              <button type="button" className="rv-lang-opt" data-active={lang === "en"} onClick={() => setLang("en")}>EN</button>
            </div>
          </div>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("subscricao"); }}>
            <div className="rv-list-icon">{Icon.doc}</div>
            <div className="rv-list-text"><span className="rv-list-name">{L("Subscrição","Subscription")}</span><span className="rv-list-sub">{L("Meses grátis","Free months")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("recomendar"); }}>
            <div className="rv-list-icon">{Icon.share}</div>
            <div className="rv-list-text"><span className="rv-list-name">{L("Recomendar o meu médico","Recommend my doctor")}</span><span className="rv-list-sub">{L("Partilhe o seu código","Share your code")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("notificacoes"); }}>
            <div className="rv-list-icon">{Icon.bell}</div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.notifications")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("privacidade"); }}>
            <div className="rv-list-icon">{Icon.shield}</div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.privacy")}</span><span className="rv-list-sub">{t("profile.privacySub")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("equipa"); }}>
            <div className="rv-list-icon"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M2 13 a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg></div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.teamAccess")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("exportar"); }}>
            <div className="rv-list-icon">{Icon.upload}</div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.export")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{color: "var(--alert)", cursor: "pointer"}} onClick={(e) => { e.preventDefault(); logout(); }}>
            <div className="rv-list-icon" style={{color: "var(--alert)"}}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 4 V2 H2 V12 H9 V10 M5 7 H13 M11 5 L13 7 L11 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-list-text"><span className="rv-list-name">{t("profile.logout")}</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
        </div>

        <div style={{textAlign: "center", fontSize: 10.5, color: "var(--fg-30)", padding: "16px 0 24px"}}>
          {t("profile.version")}
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}

// ─── Análises carregadas (gestão) ────────────────────
// Onde se vê o que está guardado, se o browser se comprometeu a não o
// apagar, e onde se apaga — porque "fica até o utente apagar" exige que
// haja uma forma de apagar.
function AnalisesGuardadasScreen() {
  const { go, showToast } = useNav();
  const { L, lang } = useLang();
  const [uploads, setUploads] = useState<StoredUpload[]>([]);
  const [status, setStatus] = useState<{ persisted: boolean; supported: boolean; usedBytes: number; quotaMb: number } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const store = await import("@/lib/uploads.store");
    setUploads(store.loadUploads());
    setStatus(await store.storageStatus());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const askPersist = async () => {
    const { requestPersistence } = await import("@/lib/uploads.store");
    const ok = await requestPersistence();
    showToast(ok
      ? L("Armazenamento garantido","Storage secured")
      : L("O browser não concedeu — adicione ao ecrã principal","Browser declined — add to Home Screen"));
    refresh();
  };

  const remove = async (id: string) => {
    const { deleteUpload } = await import("@/lib/uploads.store");
    deleteUpload(id);
    setConfirming(null);
    showToast(L("Análise apagada","Lab result deleted"));
    refresh();
  };

  const exportAll = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), uploads }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vivara-analises-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const totalValues = uploads.reduce((n, u) => n + u.values.length, 0);

  return (
    <SubScreen title={L("Análises carregadas","Uploaded labs")} onBack={() => go("profile")}>
      {status && (
        <div className="rv-store-card" data-ok={status.persisted || undefined}>
          <div className="rv-store-head">
            <span className="rv-store-icon">{Icon.shield}</span>
            {status.persisted
              ? L("Guardado até você apagar","Kept until you delete it")
              : L("Ainda sem garantia do browser","No browser guarantee yet")}
          </div>
          <p>
            {status.persisted
              ? L("O browser comprometeu-se a não apagar estes dados por iniciativa própria. Só desaparecem se os apagar aqui, ou se limpar os dados do site.",
                  "The browser has committed not to delete this data on its own. It only goes away if you delete it here, or clear the site's data.")
              : L("Sem esta garantia, o browser pode apagar tudo quando precisar de espaço — e no iPhone o Safari limpa ao fim de 7 dias sem visitas. Adicione a app ao ecrã principal (Partilhar › Adicionar ao ecrã principal) para ficar garantido.",
                  "Without it, the browser may delete everything when it needs space — and on iPhone, Safari clears it after 7 days without visits. Add the app to your Home Screen (Share › Add to Home Screen) to secure it.")}
          </p>
          {status.supported && (
            <div className="rv-store-meta">
              {status.usedBytes < 1048576
                ? `${Math.max(1, Math.round(status.usedBytes / 1024))} KB`
                : `${Math.round((status.usedBytes / 1048576) * 10) / 10} MB`} {L("usados","used")}
              {status.quotaMb > 0 ? ` · ${L("de","of")} ${status.quotaMb} MB ${L("disponíveis","available")}` : ""}
            </div>
          )}
          {!status.persisted && (
            <button className="rv-device-btn" data-tone="primary" style={{marginTop: 10}} onClick={askPersist}>
              {L("Pedir garantia agora","Request guarantee now")}
            </button>
          )}
        </div>
      )}

      <div className="rv-section-head" style={{margin: "0 20px 8px"}}>
        <h3>{L("Guardadas","Stored")}</h3>
        <span style={{fontSize: 11, color: "var(--fg-50)"}}>
          {uploads.length} · {totalValues} {L("valores","values")}
        </span>
      </div>

      {uploads.length === 0 ? (
        <div style={{padding: "0 20px 16px", fontSize: 13, color: "var(--fg-50)"}}>
          {L("Ainda não carregou nenhuma análise.","You haven't uploaded any labs yet.")}
        </div>
      ) : (
        <div className="rv-store-list">
          {uploads.map((u) => (
            <div key={u.id} className="rv-store-row">
              <div className="rv-store-row-main">
                <div className="rv-store-row-name">{u.filename}</div>
                <div className="rv-store-row-sub">
                  {u.lab ? `${u.lab} · ` : ""}{fmtDay(u.collectedISO, lang, true)} · {u.values.length} {L("valores","values")} · {u.sizeKb} KB
                  {!u.hasFile && ` · ${L("sem o original","original missing")}`}
                </div>
              </div>
              {confirming === u.id ? (
                <div className="rv-store-confirm">
                  <button className="rv-device-btn" onClick={() => setConfirming(null)}>{L("Não","No")}</button>
                  <button className="rv-device-btn" data-tone="danger" onClick={() => remove(u.id)}>{L("Apagar","Delete")}</button>
                </div>
              ) : (
                <button className="rv-device-btn" data-tone="ghost" onClick={() => setConfirming(u.id)}>{L("Apagar","Delete")}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploads.length > 0 && (
        <div style={{padding: "4px 20px 0"}}>
          <button className="rv-cta-ghost" style={{width: "100%"}} onClick={exportAll}>
            {L("Exportar cópia dos valores","Export a copy of the values")}
          </button>
          <div className="rv-doc-foot" style={{textAlign: "left", margin: "10px 0 0"}}>
            {L("Guarda um ficheiro com os valores lidos, para ter uma cópia fora da app. Os PDFs originais abrem-se um a um a partir de cada análise.",
               "Saves a file with the values read, so you have a copy outside the app. The original PDFs can be opened one by one from each lab result.")}
          </div>
        </div>
      )}
    </SubScreen>
  );
}

// ─── Nutrição & Suplementos ──────────────────────────
interface SupplementChange { iso: string; datePt: string; dateEn: string; byPt: string; byEn: string; eventPt: string; eventEn: string }
interface Supplement {
  id: string;
  namePt: string; nameEn: string;
  time: string;
  goalPt: string; goalEn: string;
  notePt: string; noteEn: string;
  history: SupplementChange[];
}

const SUPPLEMENTS: Supplement[] = [
  {
    id: "d3-omega3",
    namePt: "Vitamina D3 4000 UI · Ómega-3", nameEn: "Vitamin D3 4000 IU · Omega-3",
    time: "08:00",
    goalPt: "Suporte ósseo e perfil lipídico", goalEn: "Bone support and lipid profile",
    notePt: "Vitamina D estava em 28 ng/mL em set 25 — subiu para 48 com a dose atual. Manter.",
    noteEn: "Vitamin D was at 28 ng/mL in Sep 25 — rose to 48 with the current dose. Keep as is.",
    history: [
      { iso: "2026-04-22", datePt: "22 abr 2026", dateEn: "22 Apr 2026", byPt: "Médica responsável", byEn: "Responsible doctor", eventPt: "Dose mantida após reavaliação", eventEn: "Dose kept after review" },
      { iso: "2025-12-06", datePt: "06 dez 2025", dateEn: "06 Dec 2025", byPt: "Médica responsável", byEn: "Responsible doctor", eventPt: "Dose aumentada para 4000 UI", eventEn: "Dose increased to 4000 IU" },
      { iso: "2025-09-14", datePt: "14 set 2025", dateEn: "14 Sep 2025", byPt: "Médica responsável", byEn: "Responsible doctor", eventPt: "Prescrito · 2000 UI", eventEn: "Prescribed · 2000 IU" },
    ],
  },
  {
    id: "berberina",
    namePt: "Berberina 500 mg", nameEn: "Berberine 500 mg",
    time: "19:00",
    goalPt: "Suporte à sensibilidade à insulina", goalEn: "Insulin sensitivity support",
    notePt: "ApoB em descida progressiva desde o início (jan 26). Manter o plano atual e reavaliar em 8 semanas.",
    noteEn: "ApoB progressively decreasing since it started (Jan 26). Keep the current plan and reassess in 8 weeks.",
    history: [
      { iso: "2026-02-18", datePt: "18 fev 2026", dateEn: "18 Feb 2026", byPt: "Médica responsável", byEn: "Responsible doctor", eventPt: "Mantida após 1º controlo de ApoB", eventEn: "Kept after 1st ApoB check" },
      { iso: "2026-01-20", datePt: "20 jan 2026", dateEn: "20 Jan 2026", byPt: "Médica responsável", byEn: "Responsible doctor", eventPt: "Prescrita · 500 mg antes do jantar", eventEn: "Prescribed · 500 mg before dinner" },
    ],
  },
  {
    id: "magnesio",
    namePt: "Magnésio 400 mg", nameEn: "Magnesium 400 mg",
    time: "22:30",
    goalPt: "Sono e relaxamento muscular", goalEn: "Sleep and muscle relaxation",
    notePt: "Introduzido após queixas de sono fragmentado. Sono profundo tem melhorado de forma consistente desde então.",
    noteEn: "Introduced after fragmented sleep complaints. Deep sleep has improved consistently since.",
    history: [
      { iso: "2026-03-11", datePt: "11 mar 2026", dateEn: "11 Mar 2026", byPt: "Nutricionista", byEn: "Nutritionist", eventPt: "Prescrito · 400 mg ao deitar", eventEn: "Prescribed · 400 mg at bedtime" },
    ],
  },
];

function NutricaoScreen() {
  const { go } = useNav();
  const { L } = useLang();
  return (
    <SubScreen title={L("Nutrição & Suplementos", "Nutrition & Supplements")} onBack={() => go("profile")}>
      <button type="button" className="rv-nutri-cta" onClick={() => go("orientacao")}>
        <span className="rv-nutri-cta-icon" aria-hidden="true">{Icon.sparkle}</span>
        <span className="rv-nutri-cta-text">
          <strong>{L("Ver orientação nutricional", "See dietary guidance")}</strong>
          <span>{L("Alimentos a privilegiar e a reduzir, ligados às suas análises. Gerado por AI, com validação opcional por um profissional.", "Foods to eat more of and to cut down on, linked to your results. AI-generated, with optional validation by a professional.")}</span>
        </span>
        <span className="rv-chev">{Icon.chev}</span>
      </button>
      <div className="rv-consent">
        <div className="rv-consent-title">{L("Contexto e histórico", "Context and history")}</div>
        <p className="rv-consent-text">
          {L("Definidos pela sua equipa clínica. Para marcar como tomado hoje, use o Plano de hoje na página inicial.", "Set by your clinical team. To mark as taken today, use Today's plan on the home screen.")}
        </p>
      </div>

      {SUPPLEMENTS.map((s) => (
        <div key={s.id} className="rv-supp-card">
          <div className="rv-supp-head">
            <div>
              <div className="rv-supp-name">{L(s.namePt, s.nameEn)}</div>
              <div className="rv-supp-goal">{L(s.goalPt, s.goalEn)}</div>
            </div>
            <div className="rv-plan-time">{s.time}</div>
          </div>

          <div className="rv-supp-note-head">{L("Contexto clínico", "Clinical context")}</div>
          <div className="rv-supp-note-body">{L(s.notePt, s.noteEn)}</div>

          <div className="rv-supp-history">
            <div className="rv-supp-history-head">{L("Histórico de alterações", "Change history")}</div>
            {s.history.map((h, i) => (
              <div key={i} className="rv-supp-history-row">
                <span className="rv-supp-history-date">{L(h.datePt, h.dateEn)}</span>
                <span className="rv-supp-history-event">{L(h.eventPt, h.eventEn)}</span>
                <span className="rv-supp-history-by">{L(h.byPt, h.byEn)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SubScreen>
  );
}

// ─── Dispositivos / Wearables ────────────────────────
type DeviceId = "apple-health" | "oura" | "garmin" | "fitbit" | "google-fit" | "libre-cgm";

interface DeviceDef {
  id: DeviceId;
  name: string;
  vendor: string;
  metrics: string;
  initials: string;
  tint: string;
}

const DEVICES: DeviceDef[] = [
  { id: "apple-health", name: "Apple Watch",         vendor: "Apple",      metrics: "Sono · HRV · passos · FC repouso · VO₂máx", initials: "",  tint: "#ffffff" },
  { id: "oura",         name: "Oura Ring",           vendor: "Oura",       metrics: "Sono · HRV · temperatura · prontidão",      initials: "O", tint: "#c6ff3d" },
  { id: "garmin",       name: "Garmin Connect",      vendor: "Garmin",     metrics: "Treino · VO₂máx · stress · sono",           initials: "G", tint: "#0066ff" },
  { id: "fitbit",       name: "Fitbit",              vendor: "Fitbit",     metrics: "Passos · sono · FC · SpO₂",                 initials: "F", tint: "#25d96b" },
  { id: "google-fit",   name: "Google Health Connect", vendor: "Google",   metrics: "Agregador Android · vários dispositivos",   initials: "G", tint: "#ffbb33" },
  { id: "libre-cgm",    name: "Abbott FreeStyle Libre", vendor: "Abbott",  metrics: "Glicémia contínua",                         initials: "L", tint: "#ff4d4d" },
];

// ─── Whoop (integração real) ─────────────────────────
function WhoopMetric({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="rv-whoop-metric">
      <div className="rv-whoop-metric-val">
        {value == null ? "—" : value}{value != null && unit ? <span className="rv-whoop-metric-unit">{unit}</span> : null}
      </div>
      <div className="rv-whoop-metric-label">{label}</div>
    </div>
  );
}

function WhoopCard({ onRequestReplace }: { onRequestReplace: (proceed: () => void) => void }) {
  const { showToast } = useNav();
  const { L } = useLang();
  const { devices } = useDevices();
  const getAuthUrl = useServerFn(whoopAuthUrl);
  const doDisconnect = useServerFn(whoopDisconnect);
  const { status, refresh } = useWhoopStatus();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const recordConsentFor = useRecordConsent();

  // Primeiro pergunta-se se autoriza; depois, com outro wearable ligado, a
  // Whoop só entra se o utente aceitar substituí-lo — um de cada vez.
  const connect = () => setAsking(true);
  const afterConsent = async () => {
    setAsking(false);
    const ok = await recordConsentFor({ kind: "wearable", id: "whoop", name: "Whoop", granted: true });
    if (!ok) { showToast(L("Não foi possível guardar a autorização","Couldn't save the authorisation")); return; }
    const other = WEARABLE_IDS.find((id) => id !== "whoop" && devices[id as DeviceId]?.connected);
    if (other) onRequestReplace(startOAuth);
    else startOAuth();
  };

  const startOAuth = async () => {
    setBusy(true);
    try {
      const r = await getAuthUrl();
      if (r.configured && r.url) {
        window.location.href = r.url;
        return;
      }
      showToast(L("Integração Whoop por configurar","Whoop integration not configured"));
    } catch {
      showToast(L("Não foi possível ligar agora","Couldn't connect right now"));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await doDisconnect();
      await recordConsentFor({ kind: "wearable", id: "whoop", name: "Whoop", granted: false });
      showToast(L("Whoop desligado","Whoop disconnected"));
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const connected = status?.connected;
  const m = status?.metrics ?? null;

  return (
    <div className="rv-whoop-card" data-connected={connected || undefined}>
      <div className="rv-whoop-head">
        <div className="rv-whoop-logo">W</div>
        <div className="rv-whoop-meta">
          <div className="rv-whoop-name">Whoop</div>
          <div className="rv-whoop-sub">
            {connected
              ? L("Ligado","Connected")
              : L("Recovery · strain · sono · HRV","Recovery · strain · sleep · HRV")}
          </div>
        </div>
        {connected
          ? <span className="rv-list-state" data-state="on"><span className="rv-dot"/>{L("Ligado","Connected")}</span>
          : <button className="rv-device-btn" data-tone="primary" disabled={busy} onClick={connect}>{busy ? "…" : L("Ligar","Connect")}</button>}
      </div>

      {connected && (
        <>
          <div className="rv-whoop-metrics">
            <WhoopMetric label={L("Recuperação","Recovery")} value={m?.recovery ?? null} unit="%" />
            <WhoopMetric label="HRV" value={m?.hrv ?? null} unit="ms" />
            <WhoopMetric label={L("FC repouso","Resting HR")} value={m?.restingHr ?? null} unit="bpm" />
            <WhoopMetric label={L("Sono","Sleep")} value={m?.sleepHours ?? null} unit="h" />
          </div>
          {m?.strain != null && (
            <div className="rv-strain">
              <div className="rv-strain-head">
                <span className="rv-strain-label">{L("Strain de hoje","Today's strain")}</span>
                <span className="rv-strain-val">{m.strain}<span className="rv-strain-max"> / 21</span></span>
              </div>
              <div className="rv-strain-bar"><div className="rv-strain-fill" style={{width: `${Math.min(100, (m.strain / 21) * 100)}%`}}/></div>
              <div className="rv-strain-note">{L("Acumula ao longo do dia — de manhã começa perto de zero.","Accumulates through the day — starts near zero each morning.")}</div>
            </div>
          )}
          {status?.error && <div className="rv-whoop-note">{L("Sem dados recentes do Whoop.","No recent Whoop data.")}</div>}
          <div className="rv-whoop-actions">
            <button className="rv-device-btn" disabled={busy} onClick={refresh}>{L("Sincronizar","Sync")}</button>
            <button className="rv-device-btn" data-tone="ghost" disabled={busy} onClick={disconnect}>{L("Desligar","Disconnect")}</button>
          </div>
        </>
      )}
      {asking && (
        <WearableConsentModal name="Whoop" metrics={L("Recovery · strain · sono · HRV","Recovery · strain · sleep · HRV")} tint="#f5f6f7" initials="W"
          onCancel={() => setAsking(false)} onConfirm={() => void afterConsent()}/>
      )}
    </div>
  );
}

interface DeviceState { connected: boolean; lastSync: number | null }
type DevicesMap = Record<DeviceId, DeviceState>;

// v3: um só wearable ligado por omissão. A chave mudou para que o estado
// guardado pela versão anterior (Apple Watch + Oura ligados) não volte.
const STORAGE_KEY = "rv-devices-v3";
const DEFAULT_DEVICES: DevicesMap = {
  "apple-health": { connected: true,  lastSync: Date.now() - 4 * 60 * 1000 },
  "oura":         { connected: false, lastSync: null },
  "garmin":       { connected: false, lastSync: null },
  "fitbit":       { connected: false, lastSync: null },
  "google-fit":   { connected: false, lastSync: null },
  "libre-cgm":    { connected: false, lastSync: null },
};

function loadDevices(): DevicesMap {
  if (typeof window === "undefined") return DEFAULT_DEVICES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEVICES;
    const merged = { ...DEFAULT_DEVICES, ...JSON.parse(raw) } as DevicesMap;
    // No máximo um wearable ligado: se o armazenamento tiver mais, fica o
    // primeiro da lista de prioridade.
    let kept = false;
    for (const id of WEARABLE_IDS) {
      if (id === "whoop") continue;
      if (merged[id as DeviceId]?.connected) {
        if (kept) merged[id as DeviceId] = { connected: false, lastSync: null };
        kept = true;
      }
    }
    return merged;
  } catch {
    return DEFAULT_DEVICES;
  }
}

function saveDevices(d: DevicesMap) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ─── Um wearable de cada vez ─────────────────────────
// Dois wearables ligados dizem os dois que medem "HRV", mas não medem o
// mesmo: a Whoop mede RMSSD durante o sono, o Apple Watch mede SDNN em
// momentos avulsos. Em vez de pedir ao utente que escolha uma fonte por
// métrica, só pode haver UM wearable de pulso/anel ligado de cada vez — e é
// dele que vem tudo, com a origem sempre visível. O CGM fica fora desta regra
// porque mede glicose, que nenhuma pulseira mede: não concorre com ninguém.
type WearableId = "whoop" | "apple-health" | "oura" | "garmin" | "fitbit" | "google-fit";
type MetricKey = "sleep" | "hrv" | "steps" | "restingHr" | "body";

// Ordem de prioridade só para desempatar dados antigos guardados com mais do
// que um ligado (versões anteriores da app permitiam dois).
const WEARABLE_IDS: WearableId[] = ["whoop", "apple-health", "oura", "garmin", "fitbit", "google-fit"];

// O que cada wearable fornece. Quando o ligado não fornece uma métrica (a API
// da Whoop não expõe passos), a app diz que não está disponível em vez de a
// preencher com um valor de outra origem.
const WEARABLE_PROVIDES: Record<WearableId, MetricKey[]> = {
  "whoop":        ["sleep", "hrv", "restingHr", "body"],
  "apple-health": ["sleep", "hrv", "steps", "restingHr", "body"],
  "oura":         ["sleep", "hrv", "steps", "restingHr"],
  "garmin":       ["sleep", "hrv", "steps", "restingHr", "body"],
  "fitbit":       ["sleep", "steps", "restingHr", "body"],
  "google-fit":   ["sleep", "steps", "restingHr", "body"],
};

const isWearable = (id: DeviceId): boolean => id !== "libre-cgm";

function wearableName(id: WearableId): string {
  return id === "whoop" ? "Whoop" : DEVICES.find((d) => d.id === id)?.name ?? id;
}

// O wearable ativo: a Whoop (integração real) tem precedência; senão o
// primeiro ligado da lista.
function activeWearable(devices: DevicesMap, whoopConnected: boolean): WearableId | null {
  if (whoopConnected) return "whoop";
  return WEARABLE_IDS.find((id) => id !== "whoop" && devices[id as DeviceId]?.connected) ?? null;
}

interface DevicesCtxValue {
  devices: DevicesMap;
  setDevices: (d: DevicesMap) => void;
}
const DevicesCtx = createContext<DevicesCtxValue>({
  devices: DEFAULT_DEVICES, setDevices: () => {},
});
const useDevices = () => useContext(DevicesCtx);

function useActiveWearable(): WearableId | null {
  const { devices } = useDevices();
  const { status } = useWhoopStatus();
  return activeWearable(devices, !!status?.connected);
}

// Nome do wearable ativo para uma métrica, pronto a mostrar em "Fonte: X".
// Devolve null se não há wearable ligado ou se o ligado não fornece a métrica.
function useSourceName(key: MetricKey): string | null {
  const id = useActiveWearable();
  return id && WEARABLE_PROVIDES[id].includes(key) ? wearableName(id) : null;
}

// Formatação de datas sem depender dos dados de locale do dispositivo:
// `toLocaleDateString(..., { month: "short" })` cai para o formato numérico
// em builds com ICU reduzido (e o resultado no servidor pode não coincidir
// com o do cliente, partindo a hidratação).
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDay(iso: string | Date, lang: Lang, withYear = false): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const month = (lang === "pt" ? MONTHS_PT : MONTHS_EN)[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  return withYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`;
}

function formatRelative(ts: number | null): string {
  if (!ts) return "—";
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}

function DispositivosScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const { devices, setDevices } = useDevices();
  const { status: whoopStatusNow } = useWhoopStatus();
  const doWhoopDisconnect = useServerFn(whoopDisconnect);
  const active = activeWearable(devices, !!whoopStatusNow?.connected);
  const [whoopKey, setWhoopKey] = useState(0); // força o cartão Whoop a reler o estado
  const [authorizing, setAuthorizing] = useState<DeviceId | null>(null);
  const [asking, setAsking] = useState<DeviceId | null>(null);
  const recordConsentFor = useRecordConsent();
  // Substituição pendente: quem sai, e o que fazer depois de o utente aceitar.
  const [replacing, setReplacing] = useState<{ from: WearableId; proceed: () => void } | null>(null);

  function persist(next: DevicesMap) {
    setDevices(next);
  }

  // Desliga todos os wearables de pulso/anel, deixando o CGM como está.
  function allWearablesOff(d: DevicesMap): DevicesMap {
    const next = { ...d };
    for (const id of WEARABLE_IDS) if (id !== "whoop") next[id as DeviceId] = { connected: false, lastSync: null };
    return next;
  }

  // Simula a passagem pela conta do fabricante e conclui a ligação.
  function beginAuthorize(id: DeviceId) {
    setAuthorizing(id);
    setTimeout(() => confirmAuthorize(id), 900);
  }

  // Primeiro: «Autoriza a Vivara a receber os dados do […]?»
  function startConnect(id: DeviceId) {
    setAsking(id);
  }

  async function afterConsent(id: DeviceId) {
    setAsking(null);
    const def = DEVICES.find((d) => d.id === id)!;
    const ok = await recordConsentFor({ kind: "wearable", id, name: def.name, granted: true });
    if (!ok) { showToast(L("Não foi possível guardar a autorização","Couldn't save the authorisation")); return; }
    // O CGM não concorre com os wearables; os restantes só entram um de cada vez.
    if (isWearable(id) && active && active !== id) {
      setReplacing({ from: active, proceed: () => beginAuthorize(id) });
      return;
    }
    beginAuthorize(id);
  }

  async function confirmReplace() {
    if (!replacing) return;
    const { from, proceed } = replacing;
    setReplacing(null);
    // A Whoop é a única integração real: sai-se dela no servidor.
    if (from === "whoop") {
      try { await doWhoopDisconnect(); } catch { /* o cookie expira sozinho */ }
      setWhoopKey((k) => k + 1);
    }
    proceed();
  }

  function confirmAuthorize(id: DeviceId) {
    const cur = loadDevices();
    const base = isWearable(id) ? allWearablesOff(cur) : cur;
    persist({ ...base, [id]: { connected: true, lastSync: Date.now() } });
    setAuthorizing(null);
    showToast(L("Dispositivo ligado","Device connected"));
  }

  function disconnect(id: DeviceId) {
    persist({ ...devices, [id]: { connected: false, lastSync: null } });
    const def = DEVICES.find((d) => d.id === id)!;
    void recordConsentFor({ kind: "wearable", id, name: def.name, granted: false });
    showToast(L("Dispositivo desligado","Device disconnected"));
  }

  function syncNow(id: DeviceId) {
    persist({ ...devices, [id]: { ...devices[id], lastSync: Date.now() } });
    showToast(L("Sincronizado","Synced"));
  }

  // O que está de facto "ligado" no ecrã: o wearable ativo e o CGM. Se a
  // Whoop é a ativa, os outros wearables não contam, mesmo que o armazenamento
  // ainda os marque como ligados.
  const shownConnected = (d: DeviceDef) => (isWearable(d.id) ? active === d.id : devices[d.id].connected);
  const connectedCount = DEVICES.filter(shownConnected).length + (active === "whoop" ? 1 : 0);
  const authorizingDef = authorizing ? DEVICES.find((d) => d.id === authorizing) : null;

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("profile")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Dispositivos","Devices")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-consent">
          <div className="rv-consent-title">{L("Os seus dados são seus","Your data is yours")}</div>
          <p className="rv-consent-text">
            {L("Os dispositivos que liga partilham métricas só com a sua equipa clínica Vivara. Pode desligar qualquer um a qualquer momento. ","The devices you connect share metrics only with your Vivara clinical team. You can disconnect any of them at any time. ")}<a onClick={() => shareNative({ title: L("Privacidade Vivara","Vivara Privacy"), text: L("Como tratamos dados de dispositivos","How we handle device data"), toast: showToast })} style={{cursor:"pointer", color:"var(--accent)"}}>{L("Saber mais","Learn more")}</a>
          </p>
        </div>

        <div className="rv-src-note">
          {L("Só pode ter um wearable ligado de cada vez. Dispositivos diferentes medem de formas diferentes (o HRV, por exemplo), e misturá-los daria valores sem significado. O Abbott Libre mede glicose e pode estar ligado em simultâneo.",
             "Only one wearable can be connected at a time. Different devices measure differently (HRV, for example), and blending them would give meaningless values. The Abbott Libre measures glucose and can be connected alongside.")}
        </div>

        <WhoopCard key={whoopKey} onRequestReplace={(proceed) => active && setReplacing({ from: active, proceed })} />

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}>
          <h3>{L("Ligados","Connected")}</h3>
          <span style={{fontSize: 11, color: "var(--fg-50)"}}>{connectedCount} {L("de","of")} {DEVICES.length + 1}</span>
        </div>
        <div className="rv-devices">
          {DEVICES.filter(shownConnected).map((d) => (
            <div key={d.id} className="rv-device" data-connected="true">
              <div className="rv-device-head">
                <div className="rv-device-logo" style={{background: d.tint, color: "#0b0d0f"}}>{d.initials || Icon.watch}</div>
                <div className="rv-device-meta">
                  <div className="rv-device-name">{d.name}</div>
                  <div className="rv-device-sub">{d.metrics}</div>
                </div>
                <span className="rv-list-state" data-state="on"><span className="rv-dot"/>{L("Ligado","Connected")}</span>
              </div>
              <div className="rv-device-foot">
                <span className="rv-device-sync">{L("Última sinc.","Last sync")} {formatRelative(devices[d.id].lastSync)}</span>
                <div className="rv-device-actions">
                  <button className="rv-device-btn" onClick={() => syncNow(d.id)}>{L("Sincronizar","Sync")}</button>
                  <button className="rv-device-btn" data-tone="ghost" onClick={() => disconnect(d.id)}>{L("Desligar","Disconnect")}</button>
                </div>
              </div>
            </div>
          ))}
          {connectedCount === 0 && (
            <div className="rv-device-empty">{L("Nenhum dispositivo ligado ainda.","No devices connected yet.")}</div>
          )}
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}>
          <h3>{L("Disponíveis","Available")}</h3>
        </div>
        <div className="rv-devices">
          {DEVICES.filter((d) => !shownConnected(d)).map((d) => (
            <div key={d.id} className="rv-device">
              <div className="rv-device-head">
                <div className="rv-device-logo" style={{background: d.tint, color: "#0b0d0f"}}>{d.initials || Icon.watch}</div>
                <div className="rv-device-meta">
                  <div className="rv-device-name">{d.name}</div>
                  <div className="rv-device-sub">{d.metrics}</div>
                </div>
                <button className="rv-device-btn" data-tone="primary" onClick={() => startConnect(d.id)}>{L("Ligar","Connect")}</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign: "center", fontSize: 10.5, color: "var(--fg-30)", padding: "16px 0 24px"}}>
          {L("Não encontra o seu dispositivo? ","Can\u2019t find your device? ")}<a onClick={() => showToast(L("Pedido enviado · suporte@vivara.health","Request sent · support@vivara.health"))} style={{cursor:"pointer", color:"var(--accent)"}}>{L("Pedir suporte","Request support")}</a>
        </div>
      </div>

      {replacing && (
        <div className="rv-overlay" role="dialog" aria-modal="true">
          <div className="rv-modal">
            <div className="rv-modal-title">
              {L("Substituir","Replace")} {wearableName(replacing.from)}?
            </div>
            <div className="rv-modal-text">
              {L("Só pode ter um wearable ligado de cada vez. A partir daqui, o sono, o HRV e a FC passam a vir do novo dispositivo, e os valores do anterior não são misturados com os dele.",
                 "Only one wearable can be connected at a time. From here on, sleep, HRV and heart rate come from the new device, and the previous device's values are not blended with it.")}
            </div>
            <div className="rv-modal-actions">
              <button className="rv-device-btn" data-tone="ghost" onClick={() => setReplacing(null)}>{L("Cancelar","Cancel")}</button>
              <button className="rv-device-btn" data-tone="primary" onClick={confirmReplace}>{L("Substituir","Replace")}</button>
            </div>
          </div>
        </div>
      )}

      {asking && (() => {
        const d = DEVICES.find((x) => x.id === asking)!;
        return <WearableConsentModal name={d.name} metrics={d.metrics} tint={d.tint} initials={d.initials || undefined}
          onCancel={() => setAsking(null)} onConfirm={() => void afterConsent(d.id)}/>;
      })()}

      {authorizing && authorizingDef && (
        <div className="rv-overlay" role="dialog" aria-modal="true" aria-live="polite">
          <div className="rv-modal">
            <div className="rv-modal-spinner"/>
            <div className="rv-modal-title">{L("A abrir","Opening")} {authorizingDef.vendor}…</div>
            <div className="rv-modal-text">{L("A ligar com a sua conta","Connecting with your")} {authorizingDef.vendor}{L(".", " account.")}</div>
          </div>
        </div>
      )}

      <TabBar active="profile" />
    </div>
  );
}

// ─── Router ──────────────────────────────────────────

// ─── Share helper ────────────────────────────────────
async function shareNative(opts: { title: string; text: string; toast: (m: string) => void }) {
  const { title, text, toast } = opts;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      toast("Copiado para a área de transferência");
      return;
    }
    toast("Partilha não disponível");
  } catch {
    // user cancelled — silent
  }
}

// ─── Pesquisa ────────────────────────────────────────
// ─── Pesquisa nos próprios dados ─────────────────────
// Ferramenta de consulta pontual, não um assistente: a resposta é sempre
// montada a partir dos dados que já estão na app por regras determinísticas.
// Não há modelo de linguagem por trás, por isso não existe caminho pelo qual
// possa inventar um valor ou produzir uma interpretação clínica nova. Quando
// a pergunta é de interpretação, devolve a nota que o médico deixou — tal e
// qual — ou encaminha para a conversa com a equipa clínica.
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const INTERPRET_WORDS = [
  "porque", "porque", "porq", "significa", "significado", "quer dizer", "grave", "preocup",
  "devo", "posso", "tenho de", "tratar", "tratamento", "medicar", "risco", "perigo", "mau",
  "normal", "bom sinal", "mau sinal", "o que faco", "que faco", "aconselha", "recomenda",
  "why", "what does", "mean", "should i", "serious", "dangerous", "worry", "worried",
  "treat", "treatment", "risk", "bad", "normal?", "advice", "recommend",
];
const TREND_WORDS = ["tendencia", "evolucao", "evolui", "grafico", "historico", "ultimos", "ao longo", "trend", "evolution", "chart", "history", "over time", "last"];
const SUPP_WORDS = ["suplement", "supplement", "tomo", "tomar", "toma ", "medicacao", "medication", "plano de hoje", "todays plan", "taking"];

type QueryResult =
  | { kind: "marker"; marker: BioMarker; trend: boolean }
  | { kind: "supplements" }
  | { kind: "note"; marker: BioMarker; note: ClinicalNote }
  | { kind: "refer"; marker?: BioMarker }
  | { kind: "none" };

function runQuery(raw: string): QueryResult {
  const q = norm(raw.trim());
  if (!q) return { kind: "none" };

  const hits = (words: string[]) => words.some((w) => q.includes(norm(w)));

  // Marcador mencionado: ganha o nome mais longo que aparece na frase, para
  // "colesterol total" não ser capturado por "colesterol".
  const marker = BIOMARKERS
    .filter((b) => q.includes(norm(b.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];

  if (hits(INTERPRET_WORDS)) {
    const note = marker ? CLINICAL_NOTES[marker.name] : undefined;
    if (marker && note) return { kind: "note", marker, note };
    return { kind: "refer", marker };
  }
  if (hits(SUPP_WORDS)) return { kind: "supplements" };
  if (marker) return { kind: "marker", marker, trend: hits(TREND_WORDS) };
  return { kind: "none" };
}

function PesquisaScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const [q, setQ] = useState("");
  const result = runQuery(q);

  const examples = [
    L("Última análise de Estradiol", "Latest Estradiol result"),
    L("Tendência de ApoB", "ApoB trend"),
    L("Suplementos activos", "Active supplements"),
  ];

  const supplements = PLANO_HOJE.filter((p) => p.type === "supplement");

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("data")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Pesquisar nos seus dados","Search your data")}</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div style={{padding: "4px 20px 14px"}}>
          <input
            autoFocus
            className="rv-rec-search"
            placeholder={L("Marcador, tendência, suplementos…","Marker, trend, supplements…")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {q.trim() === "" ? (
          <>
            <div className="rv-sub-section-head">{L("Experimente","Try")}</div>
            <div className="rv-q-examples">
              {examples.map((ex) => (
                <button key={ex} type="button" className="rv-q-example" onClick={() => setQ(ex)}>
                  <span className="rv-q-example-icon">{Icon.search}</span>{ex}
                </button>
              ))}
            </div>
          </>
        ) : result.kind === "marker" ? (
          <div className="rv-q-card">
            <div className="rv-q-card-head">
              <span className="rv-q-card-label">{L("Última colheita","Latest sample")} · 22 {L("abr","Apr")} 2026</span>
              <span className="rv-q-state" style={{color: BIO_STATE_META.find((s) => s.state === result.marker.state)!.color}}>
                {L(BIO_STATE_META.find((s) => s.state === result.marker.state)!.pt,
                   BIO_STATE_META.find((s) => s.state === result.marker.state)!.en)}
              </span>
            </div>
            <div className="rv-q-card-name">{result.marker.name}</div>
            <div className="rv-q-card-val">
              {result.marker.value}<span className="rv-q-card-unit">{result.marker.unit}</span>
              <span className="rv-q-card-delta">{result.marker.delta}</span>
            </div>
            <div className="rv-q-card-target">{L("alvo","target")} {result.marker.target}</div>
            {result.marker.spark.length >= 2 && (
              <div className="rv-q-card-spark">
                <Spark pts={result.marker.spark} w={280} h={54}
                  color={result.marker.tone === "alert" ? "var(--alert)" : result.marker.tone === "watch" ? "var(--watch)" : "var(--lime)"}
                  bandMin={result.marker.targetRange.min} bandMax={result.marker.targetRange.max}/>
              </div>
            )}
            <button className="rv-cta-primary" style={{margin: "14px 0 0"}} onClick={() => go({ route: "marker", marker: result.marker })}>
              {result.trend ? L("Ver evolução completa","See full trend") : L("Abrir marcador","Open marker")}
            </button>
          </div>
        ) : result.kind === "supplements" ? (
          <div className="rv-q-card">
            <div className="rv-q-card-label" style={{marginBottom: 10}}>
              {L("Suplementos activos","Active supplements")} · {supplements.length}
            </div>
            {supplements.map((s) => (
              <div key={s.key} className="rv-q-supp">
                <span className="rv-q-supp-name">{translate(lang, s.key)}</span>
                <span className="rv-q-supp-when">{translate(lang, s.subKey)} · {s.time}</span>
              </div>
            ))}
            <button className="rv-cta-ghost" style={{margin: "12px 0 0", width: "100%"}} onClick={() => go("nutricao")}>
              {L("Ver dose, objectivo e histórico","See dose, goal and history")}
            </button>
          </div>
        ) : result.kind === "note" ? (
          <div className="rv-q-card">
            <div className="rv-q-card-label">{result.marker.name} · {L("nota da sua equipa clínica","note from your clinical team")}</div>
            <div className="rv-q-note">{L(result.note.pt, result.note.en)}</div>
            <div className="rv-q-note-by">
              {L(result.note.byPt, result.note.byEn)} · {fmtDay(result.note.iso, lang, true)}
            </div>
            <div className="rv-q-disclaim">
              {L("Esta é a nota escrita pela sua equipa clínica. A app não interpreta resultados.",
                 "This is the note written by your clinical team. The app does not interpret results.")}
            </div>
            <div className="rv-q-actions">
              <button className="rv-cta-ghost" onClick={() => go({ route: "marker", marker: result.marker })}>{L("Abrir marcador","Open marker")}</button>
              <button className="rv-cta-primary" onClick={() => go("messages")}>{L("Falar com a equipa","Message the team")}</button>
            </div>
          </div>
        ) : result.kind === "refer" ? (
          <div className="rv-q-card">
            <div className="rv-q-card-label">{L("Pergunta para a sua equipa clínica","A question for your clinical team")}</div>
            <div className="rv-q-note">
              {L("A app mostra os seus dados e as notas que a equipa clínica deixou, mas não interpreta resultados nem dá indicações de tratamento. Esta pergunta é para quem o acompanha.",
                 "The app shows your data and the notes your clinical team left, but it does not interpret results or give treatment guidance. This question is for the people caring for you.")}
            </div>
            <div className="rv-q-actions">
              {result.marker && (
                <button className="rv-cta-ghost" onClick={() => go({ route: "marker", marker: result.marker! })}>{L("Ver marcador","See marker")}</button>
              )}
              <button className="rv-cta-primary" onClick={() => go("messages")}>{L("Falar com a equipa","Message the team")}</button>
            </div>
          </div>
        ) : (
          <div className="rv-q-card">
            <div className="rv-q-card-label">{L("Sem resultados","No results")}</div>
            <div className="rv-q-note">
              {L("Não encontrei nada nos seus dados para essa pesquisa. Pode procurar por um marcador (ex: Ferritina), pela tendência de um marcador, ou pelos seus suplementos.",
                 "I couldn't find anything in your data for that search. Try a marker name (e.g. Ferritin), a marker's trend, or your supplements.")}
            </div>
            <div className="rv-q-actions">
              <button className="rv-cta-primary" onClick={() => go("messages")}>{L("Falar com a equipa","Message the team")}</button>
            </div>
          </div>
        )}

        <div className="rv-q-foot">
          {L("Esta pesquisa lê apenas os seus dados nesta app. Não substitui a sua equipa clínica.",
             "This search only reads your data in this app. It does not replace your clinical team.")}
        </div>
        <div style={{height: 80}}/>
      </div>
    </div>
  );
}

// ─── Sub-screen shell ────────────────────────────────
function SubScreen({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={onBack} aria-label="Voltar">{Icon.back}</button>
        <div className="rv-header-title">{title}</div>
        <div style={{width: 36}}/>
      </header>
      <div className="rv-body">{children}<div style={{height: 80}}/></div>
    </div>
  );
}

function ToggleRow({ label, sub, defaultOn = false }: { label: string; sub?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="rv-toggle-row" onClick={() => setOn(!on)}>
      <div className="rv-toggle-meta">
        <div className="rv-toggle-label">{label}</div>
        {sub && <div className="rv-toggle-sub">{sub}</div>}
      </div>
      <div className="rv-toggle-switch" data-on={on}><span/></div>
    </div>
  );
}

// ─── Notificações ────────────────────────────────────
function NotificacoesScreen() {
  const { go } = useNav();
  const { L } = useLang();
  return (
    <SubScreen title={L("Notificações","Notifications")} onBack={() => go("profile")}>
      <div className="rv-sub-section-head">{L("Clínicas","Clinical")}</div>
      <div className="rv-toggle-list">
        <ToggleRow label={L("Pedidos da médica","Doctor requests")} sub={L("Reanálises, ajustes ao plano","Re-tests, plan adjustments")} defaultOn />
        <ToggleRow label={L("Resumos de consulta","Appointment summaries")} defaultOn />
        <ToggleRow label={L("Resultados importados","Imported results")} defaultOn />
      </div>
      <div className="rv-sub-section-head">{L("Lembretes diários","Daily reminders")}</div>
      <div className="rv-toggle-list">
        <ToggleRow label={L("Suplementos · Berberina 19:00","Supplements · Berberine 19:00")} defaultOn />
        <ToggleRow label={L("Suplementos · Magnésio 22:30","Supplements · Magnesium 22:30")} defaultOn />
        <ToggleRow label={L("Diário noturno","Nightly diary")} sub="22:00" defaultOn />
      </div>
      <div className="rv-sub-section-head">Marketing</div>
      <div className="rv-toggle-list">
        <ToggleRow label={L("Novidades e investigação","News and research")} />
      </div>
    </SubScreen>
  );
}

// ─── Privacidade ─────────────────────────────────────
function PrivacidadeScreen() {
  const { go, showToast, logout } = useNav();
  const { L, lang } = useLang();
  const { mode, status, refresh } = useAccount();
  const record = useRecordConsent();
  const doClose = useServerFn(closeAccount);
  const [marketing, setMarketing] = useState(false);
  const [aiNutri, setAiNutri] = useState(false);
  const [confirm, setConfirm] = useState<null | "health" | "delete">(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (status) { setMarketing(status.marketing); setAiNutri(status.aiNutrition); } }, [status]);

  const toggleAiNutri = async () => {
    if (mode !== "real") { demoNote(); return; }
    const next = !aiNutri;
    setAiNutri(next);
    const ok = await record({ kind: "ai_nutricao", granted: next });
    if (!ok) { setAiNutri(!next); showToast(L("Não foi possível guardar", "Couldn't save")); return; }
    showToast(next ? L("Orientação nutricional com IA autorizada", "AI dietary guidance authorised") : L("Autorização da IA retirada", "AI authorisation withdrawn"));
  };

  const demoNote = () => showToast(L("Na conta de demonstração isto não é gravado", "Not saved on the demo account"));

  const toggleMarketing = async () => {
    const next = !marketing;
    setMarketing(next);
    if (mode !== "real") { demoNote(); return; }
    const ok = await record({ kind: "marketing", granted: next });
    if (!ok) { setMarketing(!next); showToast(L("Não foi possível guardar", "Couldn't save")); return; }
    showToast(next ? L("Vai receber novidades por email", "You'll receive news by email") : L("Deixa de receber novidades", "You'll no longer receive news"));
  };

  const closeIt = async (reason: "health_consent_withdrawn" | "user_request") => {
    if (mode !== "real") { setConfirm(null); demoNote(); return; }
    setBusy(true);
    try {
      await doClose({ data: { reason, lang } });
      setConfirm(null);
      await refresh();
    } catch {
      showToast(L("Não foi possível concluir. Tente de novo.", "Couldn't complete. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubScreen title={L("Privacidade e dados","Privacy & data")} onBack={() => go("profile")}>
      <div className="rv-sub-section-head">{L("Consentimentos","Consents")}</div>
      <div className="rv-list">
        <div className="rv-list-row">
          <div className="rv-list-icon">{Icon.shield}</div>
          <div className="rv-list-text">
            <span className="rv-list-name">{L("Dados de saúde","Health data")}</span>
            <span className="rv-list-sub">{L("Consentimento dado ao criar conta. Sem ele não podemos prestar o serviço.","Consent given when you created your account. Without it we can't provide the service.")}</span>
          </div>
        </div>
      </div>
      <div className="rv-toggle-list">
        <button type="button" className="rv-toggle-row" role="switch" aria-checked={marketing} onClick={toggleMarketing}>
          <div className="rv-toggle-meta">
            <div className="rv-toggle-label">{L("Novidades da Vivara por email","Vivara news by email")}</div>
            <div className="rv-toggle-sub">{L("Opcional. Pode mudar quando quiser.","Optional. You can change this at any time.")}</div>
          </div>
          <div className="rv-toggle-switch" data-on={marketing}><span/></div>
        </button>
        <button type="button" className="rv-toggle-row" role="switch" aria-checked={aiNutri} onClick={toggleAiNutri}>
          <div className="rv-toggle-meta">
            <div className="rv-toggle-label">{L("Orientação nutricional com IA","AI dietary guidance")}</div>
            <div className="rv-toggle-sub">{L("Enviar alguns valores das análises a um serviço de IA (Anthropic). Pode desligar quando quiser.","Send some lab values to an AI service (Anthropic). You can switch it off at any time.")}</div>
          </div>
          <div className="rv-toggle-switch" data-on={aiNutri}><span/></div>
        </button>
      </div>
      <div className="rv-src-note" style={{margin: "10px 20px 0"}}>
        {L("A partilha com médicos e os dispositivos ligados gerem-se em Equipa clínica e em Dispositivos.","Sharing with doctors and connected devices are managed in Clinical team and Devices.")}
      </div>

      <div className="rv-sub-section-head">{L("Os seus dados","Your data")}</div>
      <div className="rv-list">
        <button type="button" className="rv-list-row" onClick={() => go("exportar")}>
          <div className="rv-list-icon">{Icon.upload}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Exportar todos os dados","Export all data")}</span><span className="rv-list-sub">{L("Ficheiro JSON, formato aberto","JSON file, open format")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </button>
        <button type="button" className="rv-list-row" style={{color: "var(--alert)"}} onClick={() => setConfirm("health")}>
          <div className="rv-list-icon" style={{color: "var(--alert)"}}>{Icon.shield}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Retirar consentimento de dados de saúde","Withdraw health data consent")}</span><span className="rv-list-sub">{L("Encerra a conta","Closes your account")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </button>
        <button type="button" className="rv-list-row" style={{color: "var(--alert)"}} onClick={() => setConfirm("delete")}>
          <div className="rv-list-icon" style={{color: "var(--alert)"}}>{Icon.shield}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Apagar conta e dados","Delete account and data")}</span><span className="rv-list-sub">{L(`Exportação disponível durante ${EXPORT_WINDOW_DAYS} dias`,`Export available for ${EXPORT_WINDOW_DAYS} days`)}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </button>
      </div>

      {confirm === "health" && (
        <ConfirmDialog title={L("Retirar o consentimento de dados de saúde?","Withdraw health data consent?")} danger busy={busy}
          confirmLabel={L("Retirar e encerrar conta","Withdraw and close account")} onCancel={() => setConfirm(null)} onConfirm={() => closeIt("health_consent_withdrawn")}>
          {L(`Sem este consentimento não podemos tratar os seus dados de saúde, por isso a conta é encerrada. Pode exportar os seus dados durante ${EXPORT_WINDOW_DAYS} dias; depois disso são apagados. Esta ação não se desfaz.`,
             `Without this consent we can't process your health data, so your account will be closed. You can export your data for ${EXPORT_WINDOW_DAYS} days; after that it is deleted. This can't be undone.`)}
        </ConfirmDialog>
      )}
      {confirm === "delete" && (
        <ConfirmDialog title={L("Apagar a conta?","Delete your account?")} danger busy={busy}
          confirmLabel={L("Apagar conta","Delete account")} onCancel={() => setConfirm(null)} onConfirm={() => closeIt("user_request")}>
          {L(`A conta fica encerrada já. Pode exportar os seus dados durante ${EXPORT_WINDOW_DAYS} dias; depois disso a conta e os dados são apagados. Esta ação não se desfaz.`,
             `Your account is closed straight away. You can export your data for ${EXPORT_WINDOW_DAYS} days; after that the account and data are deleted. This can't be undone.`)}
        </ConfirmDialog>
      )}
      {mode === "demo" && <div className="rv-src-note" style={{margin: "14px 20px 0"}}>{L("Está na conta de demonstração: estas escolhas não são gravadas.","You're on the demo account: these choices aren't saved.")}<button type="button" className="rv-link-btn" style={{marginLeft: 6}} onClick={logout}>{L("Sair","Sign out")}</button></div>}
    </SubScreen>
  );
}

// ─── Equipa clínica ──────────────────────────────────
function EquipaScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const team = [
    { initials: "MR", name: L("Médica responsável","Responsible doctor"), role: L("Medicina Interna","Internal Medicine"), access: L("Total","Full") },
    { initials: "NU", name: L("Nutricionista","Nutritionist"), role: L("Equipa alargada","Extended team"), access: L("Dieta + biomarcadores metabólicos","Diet + metabolic biomarkers") },
    { initials: "RM", name: "Rui Marques", role: L("Fisiologista do exercício","Exercise physiologist"), access: L("Sono + actividade","Sleep + activity") },
  ];
  return (
    <SubScreen title={L("Equipa clínica","Clinical team")} onBack={() => go("profile")}>
      <div className="rv-team-list">
        {team.map((t, i) => (
          <div key={i} className="rv-team-row">
            <div className="rv-team-avatar">{t.initials}</div>
            <div className="rv-team-meta">
              <div className="rv-team-name">{t.name}</div>
              <div className="rv-team-role">{t.role}</div>
              <div className="rv-team-access">{L("Acesso","Access")}: {t.access}</div>
            </div>
            <button className="rv-device-btn" data-tone="ghost" onClick={() => showToast(L("Acesso revogado","Access revoked"))}>{L("Revogar","Revoke")}</button>
          </div>
        ))}
      </div>
      <div style={{padding: "16px 20px"}}>
        <button className="rv-cta-ghost" onClick={() => showToast(L("Convite enviado","Invitation sent"))} style={{width: "100%"}}>{L("Convidar profissional","Invite professional")}</button>
      </div>
    </SubScreen>
  );
}

// ─── Laboratórios ────────────────────────────────────
function LaboratoriosScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const labs = [
    { name: "Synlab", status: "Ligado", sub: L("12 análises · última a 22 abr 2026","12 labs · last on 22 Apr 2026"), connected: true },
    { name: "Joaquim Chaves Saúde", status: "Ligado", sub: L("3 análises · última a 06 dez 2025","3 labs · last on 06 Dec 2025"), connected: true },
    { name: "Germano de Sousa", status: "Não ligado", sub: L("Importação por PDF disponível","PDF import available"), connected: false },
    { name: "CUF Diagnóstico", status: "Não ligado", sub: L("Importação por PDF disponível","PDF import available"), connected: false },
  ];
  return (
    <SubScreen title={L("Laboratórios","Laboratories")} onBack={() => go("profile")}>
      <div className="rv-device-list">
        {labs.map((l, i) => (
          <div key={i} className="rv-device-row" data-connected={l.connected}>
            <div className="rv-device-icon">{Icon.flask}</div>
            <div className="rv-device-meta">
              <div className="rv-device-name">{l.name}</div>
              <div className="rv-device-sub">{l.sub}</div>
            </div>
            {l.connected ? (
              <button className="rv-device-btn" data-tone="ghost" onClick={() => showToast(`${l.name} · ${L("desligado","disconnected")}`)}>{L("Desligar","Disconnect")}</button>
            ) : (
              <button className="rv-device-btn" data-tone="primary" onClick={() => showToast(`${l.name} · ${L("ligado","connected")}`)}>{L("Ligar","Connect")}</button>
            )}
          </div>
        ))}
      </div>
    </SubScreen>
  );
}

// ─── Farmácia ────────────────────────────────────────
function FarmaciaScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const meds = [
    { name: "Metformina 500 mg", dose: L("1× pequeno-almoço","1× breakfast"), remaining: L("18 dias","18 days"), auto: true },
    { name: L("Berberina 500 mg","Berberine 500 mg"), dose: L("1× antes do jantar","1× before dinner"), remaining: L("11 dias","11 days"), auto: true },
    { name: L("Magnésio 400 mg","Magnesium 400 mg"), dose: L("1× ao deitar","1× at bedtime"), remaining: L("24 dias","24 days"), auto: false },
    { name: L("Vitamina D 4000 UI","Vitamin D 4000 IU"), dose: L("1× pequeno-almoço","1× breakfast"), remaining: L("48 dias","48 days"), auto: true },
  ];
  return (
    <SubScreen title={L("Farmácia","Pharmacy")} onBack={() => go("profile")}>
      <div className="rv-info-note" style={{margin: "0 20px 12px"}}>
        <strong>Farmácia das Avenidas</strong>
        <span>{L("Entrega ao domicílio · renovação automática quando restam 7 dias.","Home delivery · automatic renewal when 7 days remain.")}</span>
      </div>
      <div className="rv-toggle-list">
        {meds.map((m, i) => (
          <div key={i} className="rv-toggle-row">
            <div className="rv-toggle-meta">
              <div className="rv-toggle-label">{m.name}</div>
              <div className="rv-toggle-sub">{m.dose} · {L("restam","remaining")} {m.remaining}</div>
            </div>
            <button
              className="rv-device-btn"
              data-tone={m.auto ? "ghost" : "primary"}
              onClick={() => showToast(m.auto ? L("Renovação desativada","Renewal disabled") : L("Renovação ativada","Renewal enabled"))}
            >
              {m.auto ? "Auto ✓" : L("Activar","Enable")}
            </button>
          </div>
        ))}
      </div>
    </SubScreen>
  );
}

// ─── Exportar ────────────────────────────────────────
function ExportarScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const { mode } = useAccount();
  const getServer = useServerFn(exportServerData);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      downloadExport(mode === "real" ? await getServer() : null);
      showToast(L("Ficheiro transferido","File downloaded"));
    } catch {
      showToast(L("Não foi possível exportar agora","Couldn't export right now"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SubScreen title={L("Exportar dados","Export data")} onBack={() => go("privacidade")}>
      <div style={{padding: "0 20px", color: "var(--fg-60)", fontSize: 13, lineHeight: 1.5, marginBottom: 16}}>
        {L("Transfere um ficheiro JSON (formato aberto) com tudo o que a app guarda: valores das análises, lembretes, condições, diário, preferências e o registo dos seus consentimentos. Os documentos originais abrem-se um a um a partir de cada análise.",
           "Downloads a JSON file (open format) with everything the app stores: lab values, reminders, conditions, diary, preferences and your consent record. Original documents open one by one from each result.")}
      </div>
      <div className="rv-list">
        <button type="button" className="rv-list-row" onClick={run} disabled={busy}>
          <div className="rv-list-icon">{Icon.doc}</div>
          <div className="rv-list-text"><span className="rv-list-name">{busy ? L("A preparar…","Preparing…") : L("Transferir JSON","Download JSON")}</span><span className="rv-list-sub">{L("Fica guardado no seu dispositivo","Saved to your device")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </button>
      </div>
    </SubScreen>
  );
}

function renderScreen(route: NavRoute): ReactNode {
  const r = typeof route === "string" ? route : route.route;
  const marker = typeof route === "object" && route.route === "marker" ? route.marker : undefined;
  const docId = typeof route === "object" && route.route === "documento" ? route.docId : undefined;
  switch (r) {
    case "home":      return <HomeScreenV2 />;
    case "data":      return <DadosScreen />;
    case "upload":    return <ShareUploadScreen />;
    case "messages":  return <MensagensScreen />;
    case "alerts":    return <AvisosScreen />;
    case "diary":     return <DiarioScreen />;
    case "consultas": return <ConsultasScreen />;
    case "profile":   return <PerfilScreen />;
    case "devices":   return <DispositivosScreen />;
    case "assistente": return <AssistenteScreen />;
    case "marker":    return <MarkerDetail marker={marker} />;
    case "summary":   return <ConsultationSummary />;
    case "schedule":  return <ScheduleAnalysis />;
    case "pesquisa":     return <PesquisaScreen />;
    case "notificacoes": return <NotificacoesScreen />;
    case "privacidade":  return <PrivacidadeScreen />;
    case "equipa":       return <EquipaScreen />;
    case "laboratorios": return <LaboratoriosScreen />;
    case "farmacia":     return <FarmaciaScreen />;
    case "exportar":     return <ExportarScreen />;
    case "sintomas":     return <SintomasScreen />;
    case "nutricao":     return <NutricaoScreen />;
    case "registos":     return <RegistosScreen initialView={typeof route === "object" && route.route === "registos" ? route.view : "lista"} />;
    case "documento":    return <DocumentoScreen docId={docId} />;
    case "guardadas":    return <AnalisesGuardadasScreen />;
    case "calendario":   return <CalendarioScreen />;
    case "condicoes":    return <CondicoesScreen />;
    case "recomendar":   return <RecomendarMedicoScreen />;
    case "subscricao":   return <SubscricaoScreen />;
    case "orientacao":   return <OrientacaoNutricionalScreen />;
    default:          return <HomeScreenV2 />;
  }
}

// ─── App Wrapper ─────────────────────────────────────
function AssistantFAB() {
  const { current, go } = useNav();
  const { L } = useLang();
  const currentRoute = typeof current === "string" ? current : current.route;
  // Ecrãs com o seu próprio FAB local (mesma posição) escondem o FAB global,
  // caso contrário o assistente fica por cima e bloqueia o botão do ecrã.
  if (currentRoute === "assistente" || currentRoute === "messages" || currentRoute === "data" || currentRoute === "sintomas") return null;
  return (
    <button className="rv-fab-global" onClick={() => go("assistente")} aria-label={L("Assistente Vivara", "Vivara Assistant")}>
      {Icon.sparkle}
    </button>
  );
}

// ─── Conta e consentimentos ──────────────────────────
// Duas formas de entrar: a conta de demonstração (dados fictícios, nada vai
// para o servidor) e uma conta real no Supabase. Só a real grava consentimentos.

type AccountMode = "demo" | "real";
interface AccountCtxValue {
  mode: AccountMode;
  firstName: string;
  status: ConsentStatus | null;
  refresh: () => Promise<void>;
}
const AccountCtx = createContext<AccountCtxValue>({ mode: "demo", firstName: PATIENT_FIRST_NAME, status: null, refresh: async () => {} });
const useAccount = () => useContext(AccountCtx);

/** Grava uma decisão de consentimento, mas só numa conta real. */
function useRecordConsent() {
  const { mode, refresh } = useAccount();
  const { lang } = useLang();
  const record = useServerFn(recordConsent);
  return useCallback(async (input: { kind: "reconsent" } | { kind: "marketing"; granted: boolean } | { kind: "ai_nutricao"; granted: boolean } | { kind: "wearable"; id: string; name: string; granted: boolean }) => {
    if (mode !== "real") return true;
    try {
      await record({ data: { ...input, lang } });
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [mode, lang, record, refresh]);
}

function LegalLinks({ lang }: { lang: Lang }) {
  const p = LEGAL_LINK_PARTS[lang];
  return (
    <>
      {p.before}
      <a href={LEGAL_URLS.terms} target="_blank" rel="noopener noreferrer">{p.terms}</a>
      {p.middle}
      <a href={LEGAL_URLS.privacy} target="_blank" rel="noopener noreferrer">{p.privacy}</a>
      {p.after}
    </>
  );
}

function ConsentCheck({ id, checked, onChange, error, children }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; error?: string; children: ReactNode;
}) {
  const errId = `${id}-err`;
  return (
    <div className="rv-check-wrap">
      <div className="rv-check">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined} aria-describedby={error ? errId : undefined}/>
        <label htmlFor={id}>{children}</label>
      </div>
      {error && <div id={errId} className="rv-field-error">{error}</div>}
    </div>
  );
}

function SignupScreen({ onBack, onDone, initialInvite = "", initialConvite = "" }: { onBack: () => void; initialInvite?: string; initialConvite?: string; onDone: (session: { access_token: string; refresh_token: string } | null, email: string) => void }) {
  const { L, lang } = useLang();
  const signUp = useServerFn(signUpPatient);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [invite, setInvite] = useState(initialInvite);
  // Validação em tempo real com validar_codigo (funciona sem sessão).
  const [inviteCheck, setInviteCheck] = useState<"checking" | "valid" | "not_found" | "unavailable" | null>(null);
  useEffect(() => {
    const code = normalizeCode(invite);
    const typed = invite.replace(/[\s-]/g, "");
    if (!typed) { setInviteCheck(null); return; }
    if (!code) { setInviteCheck(typed.length >= 11 ? "not_found" : null); return; }
    setInviteCheck("checking");
    let alive = true;
    const t = setTimeout(() => {
      supabase.rpc("validar_codigo", { p_codigo: code }).then(({ data, error }) => {
        if (!alive) return;
        setInviteCheck(error ? "unavailable" : data ? "valid" : "not_found");
      }, () => { if (alive) setInviteCheck("unavailable"); });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [invite]);
  const [checks, setChecks] = useState<Record<SignupCheckboxId, boolean>>({
    "signup-age": false, "signup-legal": false, "signup-health": false, "signup-marketing": false,
  });
  const [errors, setErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const requiredOk = SIGNUP_CHECKBOXES.every((c) => !c.required || checks[c.id]);
  const setCheck = (id: SignupCheckboxId) => (v: boolean) => {
    setChecks((c) => ({ ...c, [id]: v }));
    if (v) setErrors((e) => ({ ...e, [id]: undefined }));
  };

  const msg = (field: SignupField, code: string | undefined): string | undefined => {
    if (!code) return undefined;
    if (field === "name") return code === "too_long" ? L("O nome é demasiado longo.", "The name is too long.") : L("Escreva o seu nome.", "Enter your name.");
    if (field === "email") return code === "required" ? L("Escreva o seu email.", "Enter your email.") : L("Este email não parece válido. Confirme se está bem escrito.", "This email doesn't look valid. Check it is spelt correctly.");
    if (field === "password") return code === "too_long" ? L("A palavra-passe tem de ter no máximo 72 caracteres.", "The password must be at most 72 characters.") : L("A palavra-passe tem de ter pelo menos 8 caracteres.", "The password must be at least 8 characters.");
    return L("Esta caixa é obrigatória para criar conta.", "This box is required to create an account.");
  };

  const focusFirstError = (errs: Partial<Record<SignupField, string>>) => {
    const order: SignupField[] = ["name", "email", "password", "signup-age", "signup-legal", "signup-health"];
    const first = order.find((f) => errs[f]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLInputElement>(`#${first === "name" || first === "email" || first === "password" ? `rv-su-${first}` : first}`);
    el?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const { errors: errs } = validateSignup({ name, email, password: pass, invite, convite: initialConvite, checks, lang });
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) { focusFirstError(errs); return; }
    setBusy(true);
    try {
      const r = await signUp({ data: { name, email, password: pass, invite, convite: initialConvite, checks, lang } });
      if (r.ok) { onDone(r.session, email.trim()); return; }
      if (r.fieldErrors) { setErrors(r.fieldErrors); focusFirstError(r.fieldErrors); }
      else if (r.error === "weak_password") { setErrors({ password: "too_short" }); setFormError(L("Escolha uma palavra-passe mais difícil de adivinhar.", "Choose a password that is harder to guess.")); }
      else if (r.error === "not_configured") setFormError(L("A criação de contas ainda não está ativa neste servidor.", "Account creation is not active on this server yet."));
      else setFormError(L("Não foi possível criar a conta agora. Tente de novo dentro de momentos.", "We couldn't create the account right now. Please try again shortly."));
    } catch {
      setFormError(L("Sem ligação ao servidor. Verifique a internet e tente de novo.", "No connection to the server. Check your internet and try again."));
    } finally {
      setBusy(false);
    }
  };

  const fieldProps = (field: "name" | "email" | "password") => ({
    id: `rv-su-${field}`,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `rv-su-${field}-err` : undefined,
  });

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" type="button" onClick={onBack} aria-label={L("Voltar", "Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Criar conta", "Create account")}</div>
        <LangToggle />
      </header>
      <div className="rv-body">
        <form ref={formRef} className="rv-signup" onSubmit={submit} noValidate>
          <div className="rv-field">
            <label className="rv-field-label" htmlFor="rv-su-name">{L("Nome", "Name")}</label>
            <input className="rv-field-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...fieldProps("name")}/>
            {errors.name && <div id="rv-su-name-err" className="rv-field-error">{msg("name", errors.name)}</div>}
          </div>
          <div className="rv-field">
            <label className="rv-field-label" htmlFor="rv-su-email">Email</label>
            <input className="rv-field-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} {...fieldProps("email")}/>
            {errors.email && <div id="rv-su-email-err" className="rv-field-error">{msg("email", errors.email)}</div>}
          </div>
          <div className="rv-field">
            <label className="rv-field-label" htmlFor="rv-su-password">{L("Palavra-passe", "Password")}</label>
            <div className="rv-login-passwrap" style={{marginBottom: 0}}>
              <input className="rv-field-input" style={{paddingRight: 44}} type={showPass ? "text" : "password"} autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} {...fieldProps("password")}/>
              <button type="button" className="rv-login-eye" onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? L("Ocultar palavra-passe", "Hide password") : L("Mostrar palavra-passe", "Show password")} aria-pressed={showPass}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9 s2.5-4.5 7-4.5 S16 9 16 9 s-2.5 4.5-7 4.5 S2 9 2 9z" stroke="currentColor" strokeWidth="1.4" fill="none"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/>{!showPass && <path d="M3 3 L15 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>}</svg>
              </button>
            </div>
            {errors.password
              ? <div id="rv-su-password-err" className="rv-field-error">{msg("password", errors.password)}</div>
              : <div className="rv-field-hint">{L("Pelo menos 8 caracteres.", "At least 8 characters.")}</div>}
          </div>
          <div className="rv-field">
            <label className="rv-field-label" htmlFor="rv-su-invite">{L("Código de convite (opcional)", "Invite code (optional)")}</label>
            <input className="rv-field-input" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={invite} onChange={(e) => setInvite(e.target.value)} id="rv-su-invite" aria-describedby="rv-su-invite-state"/>
            <div id="rv-su-invite-state" aria-live="polite">
              {inviteCheck === "checking" && <div className="rv-field-hint">{L("A verificar…", "Checking…")}</div>}
              {inviteCheck === "valid" && <div className="rv-field-ok">{L("Código válido.", "Valid code.")}</div>}
              {inviteCheck === "not_found" && <div className="rv-field-error">{L("Código não encontrado.", "Code not found.")}</div>}
              {inviteCheck === "unavailable" && <div className="rv-field-hint">{L("Não foi possível verificar agora. Pode continuar.", "Couldn't check right now. You can carry on.")}</div>}
            </div>
            {initialConvite
              ? <div className="rv-field-hint">{L("Vai criar a conta com o convite do seu médico.", "You're creating your account with your doctor's invitation.")}</div>
              : <div className="rv-field-hint">{INVITE_HINT_TEXT[lang]}</div>}
          </div>

          <fieldset className="rv-checks">
            <legend className="rv-sr-only">{L("Aceitações", "Acceptances")}</legend>
            <ConsentCheck id="signup-age" checked={checks["signup-age"]} onChange={setCheck("signup-age")} error={msg("signup-age", errors["signup-age"])}>
              {SIGNUP_CHECKBOXES[0].text[lang]}
            </ConsentCheck>
            <ConsentCheck id="signup-legal" checked={checks["signup-legal"]} onChange={setCheck("signup-legal")} error={msg("signup-legal", errors["signup-legal"])}>
              <LegalLinks lang={lang}/>
            </ConsentCheck>
          </fieldset>

          <fieldset className="rv-checks rv-checks--health">
            <legend className="rv-checks-legend">{L("Dados de saúde", "Health data")}</legend>
            <ConsentCheck id="signup-health" checked={checks["signup-health"]} onChange={setCheck("signup-health")} error={msg("signup-health", errors["signup-health"])}>
              {SIGNUP_CHECKBOXES[2].text[lang]}
            </ConsentCheck>
          </fieldset>

          <fieldset className="rv-checks">
            <legend className="rv-sr-only">{L("Opcional", "Optional")}</legend>
            <ConsentCheck id="signup-marketing" checked={checks["signup-marketing"]} onChange={setCheck("signup-marketing")}>
              {SIGNUP_CHECKBOXES[3].text[lang]}
            </ConsentCheck>
          </fieldset>

          {formError && <div className="rv-login-error rv-signup-error" role="alert">{formError}</div>}

          <div className="rv-signup-actions">
            <button className="rv-cta-primary rv-login-btn" type="submit" disabled={!requiredOk || busy} aria-describedby={!requiredOk ? "rv-su-req" : undefined}>
              {busy ? L("A criar conta…", "Creating account…") : L("Criar conta", "Create account")}
            </button>
            {!requiredOk && <div id="rv-su-req" className="rv-field-hint" style={{textAlign: "center"}}>{L("Marque as três caixas obrigatórias para continuar.", "Tick the three required boxes to continue.")}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}

function SignupDoneScreen({ email, onLogin }: { email: string; onLogin: () => void }) {
  const { L } = useLang();
  return (
    <div className="rv-screen">
      <StatusBar />
      <div className="rv-login">
        <div className="rv-login-mark">V</div>
        <div className="rv-login-title" role="status">{L("Confirme o seu email", "Confirm your email")}</div>
        <p className="rv-login-sub" style={{maxWidth: 300, lineHeight: 1.5}}>
          {L(`Se o endereço ${email} ainda não tiver conta, enviámos-lhe um email com um link para a ativar. Depois de confirmar, entre com o email e a palavra-passe.`,
             `If ${email} doesn't have an account yet, we've sent you an email with a link to activate it. Once confirmed, sign in with your email and password.`)}
        </p>
        <button className="rv-cta-primary rv-login-btn" style={{maxWidth: 320, marginTop: 24}} type="button" onClick={onLogin}>{L("Ir para entrar", "Go to sign in")}</button>
      </div>
    </div>
  );
}

function ReconsentScreen({ onAccepted, onLogout }: { onAccepted: () => void; onLogout: () => void }) {
  const { L, lang } = useLang();
  const record = useRecordConsent();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accept = async () => {
    setBusy(true); setError(null);
    const ok = await record({ kind: "reconsent" });
    setBusy(false);
    if (ok) onAccepted();
    else setError(L("Não foi possível guardar. Tente de novo.", "Couldn't save. Please try again."));
  };
  return (
    <div className="rv-screen">
      <StatusBar />
      <div className="rv-login-top"><LangToggle /></div>
      <div className="rv-body" style={{padding: "12px 0"}}>
        <h1 className="rv-reconsent-title">{L("Atualizámos os nossos documentos", "We've updated our documents")}</h1>
        <p className="rv-reconsent-text">
          {L("Os Termos de Serviço ou a Política de Privacidade mudaram desde a última vez que os aceitou. Leia as novas versões antes de continuar.",
             "The Terms of Service or the Privacy Policy have changed since you last accepted them. Please read the new versions before continuing.")}
        </p>
        <div style={{margin: "0 20px"}}>
          <ConsentCheck id={RECONSENT_CHECKBOX.id} checked={checked} onChange={setChecked}>
            <LegalLinks lang={lang}/>
          </ConsentCheck>
        </div>
        {error && <div className="rv-login-error" role="alert" style={{margin: "0 20px 10px"}}>{error}</div>}
        <div className="rv-stack">
          <button className="rv-cta-primary" type="button" disabled={!checked || busy} onClick={accept}>{busy ? L("A guardar…", "Saving…") : L("Continuar", "Continue")}</button>
          <button className="rv-cta-ghost" type="button" onClick={onLogout}>{L("Sair", "Sign out")}</button>
        </div>
      </div>
    </div>
  );
}

function ClosedAccountScreen({ exportUntil, onLogout }: { exportUntil: string; onLogout: () => void }) {
  const { L, lang } = useLang();
  const getServer = useServerFn(exportServerData);
  const [busy, setBusy] = useState(false);
  const until = fmtDay(exportUntil.slice(0, 10), lang, true);
  const doExport = async () => {
    setBusy(true);
    try { downloadExport(await getServer()); } finally { setBusy(false); }
  };
  return (
    <div className="rv-screen">
      <StatusBar />
      <div className="rv-body" style={{padding: "24px 0"}}>
        <h1 className="rv-reconsent-title">{L("A sua conta está encerrada", "Your account is closed")}</h1>
        <p className="rv-reconsent-text">
          {L(`Já não tratamos os seus dados de saúde. Pode exportar os seus dados até ${until}. Depois dessa data, a conta e os dados são apagados.`,
             `We no longer process your health data. You can export your data until ${until}. After that date, the account and data are deleted.`)}
        </p>
        <div className="rv-stack">
          <button className="rv-cta-primary" type="button" disabled={busy} onClick={doExport}>{busy ? L("A preparar…", "Preparing…") : L("Exportar os meus dados (JSON)", "Export my data (JSON)")}</button>
          <button className="rv-cta-ghost" type="button" onClick={onLogout}>{L("Sair", "Sign out")}</button>
        </div>
      </div>
    </div>
  );
}

/** Junta os dados guardados neste dispositivo (e os do servidor, se houver) num ficheiro JSON. */
function downloadExport(server: unknown) {
  const device: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("rv-")) continue;
      const v = localStorage.getItem(k);
      try { device[k] = v == null ? null : JSON.parse(v); } catch { device[k] = v; }
    }
  } catch { /* modo privado */ }
  const payload = {
    format: "vivara-export-v1",
    exportedAt: new Date().toISOString(),
    note: "Os documentos originais (PDF e fotografias) abrem-se um a um na app, a partir de cada análise.",
    device,
    server: server ?? null,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vivara-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ConfirmDialog({ title, children, confirmLabel, danger, busy, onCancel, onConfirm }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean;
  onCancel: () => void; onConfirm: () => void;
}) {
  const { L } = useLang();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="rv-overlay" role="dialog" aria-modal="true" aria-labelledby="rv-confirm-title">
      <div className="rv-modal">
        <div className="rv-modal-title" id="rv-confirm-title">{title}</div>
        <div className="rv-modal-text">{children}</div>
        <div className="rv-modal-actions">
          <button ref={cancelRef} className="rv-device-btn" data-tone="ghost" type="button" onClick={onCancel}>{L("Cancelar", "Cancel")}</button>
          <button className="rv-device-btn" data-tone={danger ? "danger" : "primary"} type="button" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/** Pergunta antes de ligar um wearable: «Autoriza a Vivara a receber os dados do […]?» */
function WearableConsentModal({ name, metrics, tint, initials, onCancel, onConfirm }: {
  name: string; metrics: string; tint: string; initials?: string; onCancel: () => void; onConfirm: () => void;
}) {
  const { L, lang } = useLang();
  return (
    <ConfirmDialog title={wearablePrompt(name, lang)} confirmLabel={L("Autorizar", "Authorise")} onCancel={onCancel} onConfirm={onConfirm}>
      <span className="rv-modal-logo" style={{background: tint, color: "#0b0d0f", margin: "6px auto 10px"}} aria-hidden="true">{initials || "•"}</span>
      {L("Dados que passam a chegar à Vivara:", "Data Vivara will receive:")}<br/>
      <span style={{color: "var(--fg-70)"}}>{metrics}</span><br/>
      <span style={{display: "block", marginTop: 8}}>{L("Pode desligar quando quiser, em Perfil › Dispositivos.", "You can disconnect at any time in Profile › Devices.")}</span>
    </ConfirmDialog>
  );
}

// ─── Recomendar o meu médico ─────────────────────────
// Regras (portal): médico → utente, o utente ganha 1 mês; utente → médico, só o
// médico ganha o 1.º mês; utente → utente não se aplica. Os códigos e as regras
// vivem na base de dados do portal; a app só chama as funções dele.

// [Revisão jurídica: confirmar com o advogado/Ordem dos Médicos antes de publicar.]
const RECOMMEND_DOCTOR_TEXT = {
  pt: "Partilhe com o seu médico. Se ele aderir à Vivara, ganha o primeiro mês grátis. Você não recebe nenhum benefício.",
  en: "Share it with your doctor. If they join Vivara, they get the first month free. You don't receive any benefit.",
};

// [Revisão jurídica: confirmar com o advogado/Ordem dos Médicos antes de publicar.]
const INVITE_HINT_TEXT = {
  pt: "Se o seu médico lhe deu um código, ganha um mês grátis depois do seu primeiro pagamento.",
  en: "If your doctor gave you a code, you get a free month after your first payment.",
};

// [Revisão jurídica: confirmar com o advogado/Ordem dos Médicos antes de publicar.]
const FREE_MONTH_RULE_TEXT = {
  pt: "O mês grátis entra depois do seu primeiro pagamento e adia a cobrança seguinte um mês; no plano anual, prolonga a subscrição um mês. Máximo de 12 meses grátis por ano.",
  en: "The free month starts after your first payment and pushes your next charge back one month; on the annual plan, it extends your subscription by one month. Up to 12 free months per year.",
};

// Resultado de usar_codigo / aceitar_convite_app, mostrado uma vez depois do registo.
// [Revisão jurídica: confirmar com o advogado/Ordem dos Médicos antes de publicar.] (a de «ok» descreve a regra)
const REFERRAL_RESULT_TEXT: Record<ReferralResult, { pt: string; en: string }> = {
  ok:               { pt: "Código aplicado. O mês grátis entra depois do seu primeiro pagamento.", en: "Code applied. The free month starts after your first payment." },
  codigo_invalido:  { pt: "O código de convite não foi encontrado. A sua conta foi criada na mesma.", en: "The invite code wasn't found. Your account was created anyway." },
  convite_invalido: { pt: "Este convite já não é válido. A sua conta foi criada na mesma.", en: "This invitation is no longer valid. Your account was created anyway." },
  proprio_codigo:   { pt: "Não pode usar o seu próprio código.", en: "You can't use your own code." },
  nao_aplicavel:    { pt: "Este código não dá benefício a contas de utente.", en: "This code doesn't give a benefit to patient accounts." },
  ja_usado:         { pt: "Esta conta já usou um código de convite.", en: "This account has already used an invite code." },
  fora_do_registo:  { pt: "Os códigos só podem ser usados até 7 dias depois de criar a conta.", en: "Codes can only be used up to 7 days after creating the account." },
};

function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false);
  } catch { /* sem permissão */ }
  return Promise.resolve(false);
}

function ReferralQR({ link }: { link: string }) {
  const { L } = useLang();
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    // Gerado neste telemóvel: o código nunca vai para um serviço externo de QR.
    import("qrcode")
      .then((m) => m.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b0d0f", light: "#ffffff" } }))
      .then((s) => { if (alive) setSvg(s); })
      .catch(() => { if (alive) setSvg(null); });
    return () => { alive = false; };
  }, [link]);
  return (
    <div className="rv-ref-qr" role="img" aria-label={L("Código QR da ligação para o seu médico", "QR code for the link for your doctor")}>
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }}/> : <div className="rv-modal-spinner" aria-hidden="true"/>}
    </div>
  );
}

const DEMO_CODE = "VIV-K7M2-9QXA";

function RecomendarMedicoScreen() {
  const { go, showToast } = useNav();
  const { L, lang } = useLang();
  const { mode } = useAccount();
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    if (mode !== "real") { setCode(DEMO_CODE); setStatus("ready"); return; }   // demonstração: nada é criado
    setStatus("loading");
    supabase.rpc("meu_codigo_utente").then(({ data, error }) => {
      if (!alive) return;
      if (error || !data) { setStatus("error"); return; }
      setCode(data); setStatus("ready");
    }, () => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [mode, attempt]);

  const link = code ? doctorSignupLink(code) : "";
  const copyCode = async () => {
    if (!code) return;
    showToast((await copyText(code)) ? L("Código copiado", "Code copied") : L("Não foi possível copiar", "Couldn't copy"));
  };
  const share = async () => {
    if (!code) return;
    const text = L(`Junte-se à Vivara com o meu código: ${code}`, `Join Vivara with my code: ${code}`);
    try {
      if (typeof navigator.share === "function") { await navigator.share({ title: "Vivara", text, url: link }); return; }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;   // a pessoa fechou a folha de partilha
    }
    showToast((await copyText(`${text}\n${link}`)) ? L("Ligação copiada", "Link copied") : L("Não foi possível copiar", "Couldn't copy"));
  };

  return (
    <SubScreen title={L("Recomendar o meu médico", "Recommend my doctor")} onBack={() => go("profile")}>
      {status === "loading" && <div className="rv-ref-state" role="status"><div className="rv-modal-spinner" aria-hidden="true"/><span>{L("A carregar…", "Loading…")}</span></div>}
      {status === "error" && (
        <div className="rv-ref-state" role="alert">
          <span>{L("Não foi possível carregar o seu código agora.", "We couldn't load your code right now.")}</span>
          <button type="button" className="rv-device-btn" data-tone="primary" onClick={() => setAttempt((n) => n + 1)}>{L("Tentar de novo", "Try again")}</button>
        </div>
      )}
      {status === "ready" && code && (
        <>
          <p className="rv-ref-rule" style={{marginTop: 4, marginBottom: 14}}>{RECOMMEND_DOCTOR_TEXT[lang]}</p>
          <section className="rv-ref-card" aria-labelledby="rv-ref-code-label">
            <div id="rv-ref-code-label" className="rv-ref-label">{L("O seu código", "Your code")}</div>
            <div className="rv-ref-code">{code}</div>
            {mode !== "real" && <div className="rv-field-hint" style={{textAlign: "center"}}>{L("Código de demonstração.", "Demo code.")}</div>}
            <div className="rv-ref-actions">
              <button type="button" className="rv-cta-primary" onClick={copyCode}>{L("Copiar", "Copy")}</button>
              <button type="button" className="rv-cta-ghost" onClick={share}>{L("Partilhar", "Share")}</button>
            </div>
          </section>
          <ReferralQR link={link}/>
          <p className="rv-field-hint" style={{margin: "0 20px", textAlign: "center"}}>{L("O seu médico pode ler o QR na consulta.", "Your doctor can scan the QR at your appointment.")}</p>
        </>
      )}
    </SubScreen>
  );
}

// ─── Subscrição ──────────────────────────────────────
// Por agora só mostra os meses grátis (meses_gratis, lido no servidor). O plano
// e as cobranças entram com o prestador de pagamentos.
function SubscricaoScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const { mode } = useAccount();
  const getMonths = useServerFn(getMyFreeMonths);
  const [months, setMonths] = useState<FreeMonth[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    if (mode !== "real") {
      setMonths([{ estado: "por_aplicar", ano: 2026, criadoEm: "2026-04-20T10:00:00Z", aplicadoEm: null }]);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    getMonths().then((m) => { if (alive) { setMonths(m); setStatus("ready"); } }).catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, attempt]);

  const pending = (months ?? []).filter((m) => m.estado === "por_aplicar").length;
  const applied = (months ?? []).filter((m) => m.estado === "aplicado");
  const capped = (months ?? []).filter((m) => m.estado === "limite_atingido").length;
  const day = (iso: string) => fmtDay(iso.slice(0, 10), lang, true);

  return (
    <SubScreen title={L("Subscrição", "Subscription")} onBack={() => go("profile")}>
      <div className="rv-sub-section-head" style={{marginTop: 4}}>{L("Meses grátis", "Free months")}</div>
      {status === "loading" && <div className="rv-ref-state" role="status"><div className="rv-modal-spinner" aria-hidden="true"/><span>{L("A carregar…", "Loading…")}</span></div>}
      {status === "error" && (
        <div className="rv-ref-state" role="alert">
          <span>{L("Não foi possível carregar os seus meses grátis.", "We couldn't load your free months.")}</span>
          <button type="button" className="rv-device-btn" data-tone="primary" onClick={() => setAttempt((n) => n + 1)}>{L("Tentar de novo", "Try again")}</button>
        </div>
      )}
      {status === "ready" && (
        <>
          {pending > 0 && (
            <div className="rv-ref-card rv-sub-free" role="status">
              {pending === 1
                ? L("Tem 1 mês grátis por aplicar", "You have 1 free month to be applied")
                : L(`Tem ${pending} meses grátis por aplicar`, `You have ${pending} free months to be applied`)}
            </div>
          )}
          {applied.length > 0 && (
            <ul className="rv-ref-list">
              {applied.map((m, i) => (
                <li key={i} className="rv-ref-row">
                  <span>{L("Mês grátis", "Free month")}</span>
                  <span className="rv-ref-when">{L(`Aplicado a ${day(m.aplicadoEm ?? m.criadoEm)}`, `Applied on ${day(m.aplicadoEm ?? m.criadoEm)}`)}</span>
                </li>
              ))}
            </ul>
          )}
          {capped > 0 && (
            // [Revisão jurídica: confirmar com o advogado/Ordem dos Médicos antes de publicar.]
            <div className="rv-src-note" style={{margin: "0 20px 10px"}}>
              {L("Atingiu o limite de 12 meses grátis deste ano.", "You've reached the limit of 12 free months this year.")}
            </div>
          )}
          {pending === 0 && applied.length === 0 && capped === 0 && (
            <div className="rv-src-note" style={{margin: "0 20px 10px"}}>{L("Não tem meses grátis.", "You don't have any free months.")}</div>
          )}
          <p className="rv-ref-rule">{FREE_MONTH_RULE_TEXT[lang]}</p>
          {mode !== "real" && <p className="rv-field-hint" style={{margin: "6px 20px 0"}}>{L("Valores de demonstração.", "Demo values.")}</p>}
        </>
      )}
    </SubScreen>
  );
}

/** Aviso simples com um só botão (resultado do código depois do registo). */
function NoticeDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const { L } = useLang();
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="rv-overlay" role="dialog" aria-modal="true" aria-labelledby="rv-notice-title">
      <div className="rv-modal">
        <div className="rv-modal-title" id="rv-notice-title">{title}</div>
        <div className="rv-modal-text">{children}</div>
        <div className="rv-modal-actions">
          <button ref={okRef} className="rv-device-btn" data-tone="primary" type="button" onClick={onClose}>{L("Entendido", "OK")}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Depois do registo, já com sessão: aplica o convite ou o código que ficaram
 * guardados na conta. Convite tem prioridade. Nunca bloqueia nada: se falhar
 * (rede), tenta outra vez no próximo acesso.
 */
async function applyPendingReferral(): Promise<ReferralResult | null> {
  const { data } = await supabase.auth.getUser();
  const md = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  const convite = normalizeInvite(typeof md.convite_pendente === "string" ? md.convite_pendente : "");
  const codigo = normalizeCode(typeof md.codigo_pendente === "string" ? md.codigo_pendente : "");
  if (!convite && !codigo) return null;
  const { data: res, error } = convite
    ? await supabase.rpc("aceitar_convite_app", { p_token: convite })
    : await supabase.rpc("usar_codigo", { p_codigo: codigo });
  if (error) return null;
  await supabase.auth.updateUser({ data: { codigo_pendente: null, convite_pendente: null } }).catch(() => {});
  return asReferralResult(res);
}

// ─── Orientação nutricional com IA ───────────────────
// Orientação alimentar geral gerada por IA a partir dos marcadores, com
// validação opcional por um profissional ligado ao utente. A IA não faz
// diagnósticos, não fala de suplementos, doses nem medicação; marcadores em
// zona crítica ou condições sensíveis não geram orientação (nutrition.rules.ts).

// Etiquetas exigidas pela Vivara: não alterar sem aprovação.
const NUTRI_LABEL_AI = { pt: "Gerado por AI · não validado por um profissional", en: "AI-generated · not validated by a professional" };
const nutriLabelValidated = (name: string, date: string, lang: Lang) =>
  lang === "en" ? `Validated by ${name}, ${date}` : `Validado por ${name}, ${date}`;

// [Revisão jurídica: confirmar com o advogado antes de publicar.]
const NUTRI_DISCLAIMER = {
  pt: "Isto não é um diagnóstico nem uma prescrição. Não altere medicação nem suplementos sem falar com o seu médico.",
  en: "This is not a diagnosis or a prescription. Do not change medication or supplements without talking to your doctor.",
};

const NUTRI_DEMO_KEY = "rv-nutri-demo-v1";

/** Os marcadores e o perfil que a app tem neste momento (dados de demonstração + análises carregadas). */
function useNutritionInputs() {
  const uploads = useUploads();
  const conds = useConditions();
  const [age] = useChronoAge();
  const markers = mergeUploads(BIOMARKERS, uploads);
  const readings: MarkerReading[] = [];
  for (const m of markers) {
    if (m.points && m.points.length) {
      for (const p of m.points) readings.push({ name: m.name, value: p.value, unit: p.unit, date: p.iso.slice(0, 10) });
    } else if (m.state !== "nodata") {
      const v = Number(m.value);
      if (Number.isFinite(v)) readings.push({ name: m.name, value: v, unit: m.unit, ref: m.target, date: "2026-04-22" });
    }
  }
  const conditions = conds.list.filter((c) => c.status === "active").map((c) => c.name);
  // Persona de demonstração: mulher, IMC 25,2, cintura 82 cm.
  const profile: NutritionProfile = { age, sex: "F", bmi: 25.2, waistCm: 82 };
  return { readings, conditions, profile };
}

function NutriLabel({ v }: { v: OrientacaoView }) {
  const { lang } = useLang();
  if (v.estado === "validado" && v.validadoPorNome) {
    return <span className="rv-nutri-label" data-state="validado">✓ {nutriLabelValidated(v.validadoPorNome, fmtDay((v.validadoEm ?? v.geradoEm).slice(0, 10), lang, true), lang)}</span>;
  }
  return <span className="rv-nutri-label" data-state="ia">{NUTRI_LABEL_AI[lang]}</span>;
}

function reasonText(r: GateReason, L: (pt: string, en: string) => string, lang: Lang): string {
  switch (r.kind) {
    case "critical": return L(`O valor de ${r.marker} (${fmtNum(r.value, lang)} ${r.unit}) deve ser visto por um profissional.`, `Your ${r.marker} value (${r.value} ${r.unit}) should be looked at by a professional.`);
    case "condition": return L(`Registou «${r.condition}», que precisa de acompanhamento profissional na alimentação.`, `You recorded “${r.condition}”, which needs professional follow-up for diet.`);
    case "pregnancy": return L("Gravidez ou amamentação pedem orientação de um profissional.", "Pregnancy or breastfeeding call for guidance from a professional.");
    case "minor": return L("A orientação automática é só para adultos.", "Automatic guidance is for adults only.");
    case "no-markers": return L("Ainda não há análises com marcadores ligados à alimentação.", "There are no lab results with diet-related markers yet.");
  }
}

function NutriGuidance({ v, onShowOriginal }: { v: OrientacaoView; onShowOriginal?: () => void }) {
  const { L, lang } = useLang();
  const markerOf = (name: string) => v.marcadores.find((m) => m.name === name);
  if (!v.conteudo) return null;
  const groups: { tipo: "privilegiar" | "reduzir"; title: string }[] = [
    { tipo: "privilegiar", title: L("A privilegiar", "Eat more of") },
    { tipo: "reduzir", title: L("A reduzir", "Cut down on") },
  ];
  return (
    <>
      {groups.map((g) => {
        const items = v.conteudo!.itens.filter((i) => i.tipo === g.tipo);
        if (!items.length) return null;
        return (
          <section key={g.tipo} className="rv-nutri-group" aria-labelledby={`nutri-${g.tipo}`}>
            <h3 id={`nutri-${g.tipo}`} className="rv-nutri-group-title" data-tipo={g.tipo}>{g.title}</h3>
            <ul className="rv-nutri-list">
              {items.map((it, i) => {
                const m = markerOf(it.marcador);
                return (
                  <li key={i} className="rv-nutri-item">
                    <div className="rv-nutri-food">{it.alimento}</div>
                    <div className="rv-nutri-why">{it.porque}</div>
                    <div className="rv-nutri-marker">
                      {L("Ligado a", "Linked to")} <strong>{it.marcador}</strong>
                      {m && <> · {fmtNum(m.value, lang)} {m.unit} · {fmtDay(m.date, lang, true)}</>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {v.conteudo.nota && <p className="rv-nutri-note">{v.conteudo.nota}</p>}
      {v.observacao && (
        <div className="rv-info-note" style={{margin: "0 20px 12px"}}>
          <strong>{L("Nota do profissional", "Note from the professional")}</strong>
          <span>{v.observacao}</span>
        </div>
      )}
      {v.estado === "validado" && v.editado && onShowOriginal && (
        <button type="button" className="rv-link-btn rv-nutri-orig" onClick={onShowOriginal}>{L("Ver o texto original da IA", "See the original AI text")}</button>
      )}
    </>
  );
}

function OrientacaoNutricionalScreen() {
  const { go, showToast } = useNav();
  const { L, lang } = useLang();
  const { mode, status: account, refresh } = useAccount();
  const record = useRecordConsent();
  const inputs = useNutritionInputs();
  const fetchState = useServerFn(getOrientacoesNutricionais);
  const generate = useServerFn(gerarOrientacaoNutricional);
  const askValidation = useServerFn(pedirValidacaoNutricional);

  const [state, setState] = useState<OrientacoesState | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pregnant, setPregnant] = useState<"sim" | "nao" | null>(null);
  const [busy, setBusy] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [noProfessional, setNoProfessional] = useState(false);

  // Hash da entrada atual: se for diferente da última versão, há análises novas.
  const aiInput = selectAiInput(inputs.readings, inputs.profile, lang);
  const aiInputKey = stableStringify(aiInput);
  useEffect(() => { inputHash(aiInput).then(setCurrentHash).catch(() => {}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [aiInputKey]);

  // ── carregar ──
  useEffect(() => {
    let alive = true;
    if (mode !== "real") {
      let saved: OrientacoesState | null = null;
      try { saved = JSON.parse(localStorage.getItem(NUTRI_DEMO_KEY) ?? "null"); } catch { /* privado */ }
      setState(saved ?? { consentimento: false, temProfissional: true, versoes: [] });
      return;
    }
    fetchState().then((s) => { if (alive) setState(s); }).catch(() => { if (alive) setLoadErr(true); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const saveDemo = (s: OrientacoesState) => {
    setState(s);
    try { localStorage.setItem(NUTRI_DEMO_KEY, JSON.stringify(s)); } catch { /* privado */ }
  };

  const consented = mode === "real" ? !!(state?.consentimento || account?.aiNutrition) : !!state?.consentimento;

  const accept = async () => {
    if (!consentChecked) return;
    setBusy(true);
    const ok = await record({ kind: "ai_nutricao", granted: true });
    setBusy(false);
    if (!ok) { showToast(L("Não foi possível guardar", "Couldn't save")); return; }
    if (mode !== "real") saveDemo({ ...(state ?? { temProfissional: true, versoes: [] }), consentimento: true });
    else { setState((s) => (s ? { ...s, consentimento: true } : s)); void refresh(); }
  };

  const run = async () => {
    if (pregnant == null) return;
    setBusy(true); setGenErr(null);
    try {
      if (mode !== "real") {
        // Demonstração: mesma barreira de segurança, texto fixo em vez da IA.
        const reasons = gate({ markers: inputs.readings, conditions: inputs.conditions, pregnantOrBreastfeeding: pregnant === "sim", age: inputs.profile.age });
        const prev = state?.versoes ?? [];
        const v: OrientacaoView = {
          id: `demo-${prev.length + 1}`, versao: prev.length + 1,
          estado: reasons.length ? "bloqueado" : "gerado",
          conteudo: reasons.length ? null : DEMO_GUIDANCE[lang], conteudoIa: null, motivos: reasons,
          marcadores: aiInput.markers, entradaHash: currentHash ?? "", geradoEm: new Date().toISOString(),
          validadoPorNome: null, validadoEm: null, editado: false, observacao: null, pedidoPendenteEm: null,
        };
        saveDemo({ ...(state as OrientacoesState), versoes: [v, ...prev] });
        setSelected(null);
        return;
      }
      const r = await generate({ data: { markers: inputs.readings, conditions: inputs.conditions, pregnantOrBreastfeeding: pregnant === "sim", profile: inputs.profile, lang } });
      if (!r.ok) {
        setGenErr(r.error === "not_configured"
          ? L("A orientação com IA ainda não está ativa neste servidor.", "AI guidance isn't active on this server yet.")
          : r.error === "sem_consentimento"
            ? L("Falta a sua autorização para usar a IA.", "Your authorisation to use AI is missing.")
            : r.error === "servidor"
              ? L("Não foi possível gerar agora. Tente de novo dentro de momentos.", "Couldn't generate right now. Please try again shortly.")
              : L("Não foi possível gerar uma orientação segura com estes dados. Pode pedir a um profissional.", "We couldn't generate safe guidance from this data. You can ask a professional."));
        return;
      }
      setState((s) => s ? { ...s, versoes: r.reused ? s.versoes : [r.orientacao, ...s.versoes] } : s);
      setSelected(null);
      if (r.reused) showToast(L("Sem análises novas: mantém-se a orientação atual", "No new results: current guidance kept"));
    } catch {
      setGenErr(L("Sem ligação ao servidor. Tente de novo.", "No connection to the server. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const requestValidation = async (v: OrientacaoView) => {
    if (mode !== "real") {
      const now = new Date().toISOString();
      saveDemo({ ...(state as OrientacoesState), versoes: (state?.versoes ?? []).map((x) => x.id === v.id ? { ...x, estado: x.estado === "gerado" ? "em_validacao" : x.estado, pedidoPendenteEm: now } : x) });
      showToast(L("Validação pedida (demonstração)", "Validation requested (demo)"));
      return;
    }
    setBusy(true);
    try {
      const { result } = await askValidation({ data: { id: v.id } });
      if (result === "sem_profissional") { setNoProfessional(true); return; }
      if (result === "ok" || result === "ja_pedido") {
        const now = new Date().toISOString();
        setState((s) => s ? { ...s, versoes: s.versoes.map((x) => x.id === v.id ? { ...x, estado: x.estado === "gerado" ? "em_validacao" : x.estado, pedidoPendenteEm: x.pedidoPendenteEm ?? now } : x) } : s);
        showToast(L("Validação pedida", "Validation requested"));
      } else {
        showToast(L("Não foi possível pedir a validação", "Couldn't request validation"));
      }
    } catch {
      showToast(L("Sem ligação ao servidor", "No connection to the server"));
    } finally {
      setBusy(false);
    }
  };

  const versions = state?.versoes ?? [];
  const latest = versions[0] ?? null;
  const shown = (selected ? versions.find((v) => v.id === selected) : latest) ?? null;
  const latestHash = latest?.entradaHash.replace(/^bloq:/, "") ?? null;
  const hasNewData = !!latest && !!currentHash && latestHash !== currentHash;
  const hasMarkers = aiInput.markers.length > 0;

  const pregnancyQuestion = (
    <fieldset className="rv-field rv-field-set">
      <legend className="rv-field-label">{L("Está grávida ou a amamentar?", "Are you pregnant or breastfeeding?")}</legend>
      <label className="rv-radio"><input type="radio" name="nutri-preg" checked={pregnant === "nao"} onChange={() => setPregnant("nao")}/> {L("Não", "No")}</label>
      <label className="rv-radio"><input type="radio" name="nutri-preg" checked={pregnant === "sim"} onChange={() => setPregnant("sim")}/> {L("Sim", "Yes")}</label>
    </fieldset>
  );

  return (
    <SubScreen title={L("Orientação nutricional", "Dietary guidance")} onBack={() => go("nutricao")}>
      {!state && !loadErr && <div className="rv-ref-state" role="status"><div className="rv-modal-spinner" aria-hidden="true"/><span>{L("A carregar…", "Loading…")}</span></div>}
      {loadErr && <div className="rv-ref-state" role="alert">{L("Não foi possível carregar a sua orientação.", "We couldn't load your guidance.")}</div>}

      {state && !consented && (
        <div className="rv-nutri-consent">
          <h2 className="rv-reconsent-title" style={{marginTop: 4}}>{L("Orientação nutricional com IA", "AI dietary guidance")}</h2>
          <ul className="rv-nutri-bullets">
            <li>{L("Uma inteligência artificial sugere alimentos a privilegiar e a reduzir, ligados aos seus marcadores, em linguagem simples.", "An artificial intelligence suggests foods to eat more of and to cut down on, linked to your markers, in plain language.")}</li>
            <li>{L("Não faz diagnósticos, não fala de suplementos nem doses, e não sugere mudar medicação.", "It doesn't diagnose, doesn't talk about supplements or doses, and doesn't suggest changing medication.")}</li>
            <li>{L("Se algum valor estiver numa zona que precisa de atenção, ou se tiver uma condição sensível, não há orientação automática: indicamos-lhe falar com um profissional.", "If a value is in a range that needs attention, or you have a sensitive condition, there's no automatic guidance: we'll point you to a professional.")}</li>
            <li>{L("O texto aparece sempre marcado como gerado por IA. Pode pedir a um profissional ligado a si que o reveja e valide.", "The text is always marked as AI-generated. You can ask a professional linked to you to review and validate it.")}</li>
          </ul>
          <div style={{margin: "0 20px"}}>
            <ConsentCheck id={NUTRITION_AI_CONSENT.id} checked={consentChecked} onChange={setConsentChecked}>
              {NUTRITION_AI_CONSENT.text[lang]}
            </ConsentCheck>
          </div>
          <div className="rv-stack">
            <button type="button" className="rv-cta-primary" disabled={!consentChecked || busy} onClick={accept}>{L("Continuar", "Continue")}</button>
          </div>
        </div>
      )}

      {state && consented && (
        <>
          {!latest && (
            <div className="rv-nutri-start">
              <p className="rv-ref-rule" style={{margin: "4px 20px 14px"}}>
                {hasMarkers
                  ? L("Vamos usar os marcadores das suas análises ligados à alimentação.", "We'll use the diet-related markers from your lab results.")
                  : L("Ainda não há análises com marcadores ligados à alimentação. Carregue uma análise primeiro.", "There are no lab results with diet-related markers yet. Upload a lab result first.")}
              </p>
              {hasMarkers && pregnancyQuestion}
              {hasMarkers && (
                <div className="rv-stack">
                  <button type="button" className="rv-cta-primary" disabled={pregnant == null || busy} onClick={run}>
                    {busy ? L("A preparar…", "Preparing…") : L("Ver orientação nutricional", "See dietary guidance")}
                  </button>
                </div>
              )}
            </div>
          )}

          {genErr && <div className="rv-login-error" role="alert" style={{margin: "0 20px 12px"}}>{genErr}</div>}

          {shown && (
            <article className="rv-nutri-card" aria-live="polite">
              <div className="rv-nutri-head">
                <NutriLabel v={shown}/>
                <span className="rv-nutri-meta">{L("Versão", "Version")} {shown.versao} · {fmtDay(shown.geradoEm.slice(0, 10), lang, true)}</span>
              </div>
              {shown.pedidoPendenteEm && shown.estado !== "validado" && (
                <div className="rv-nutri-pending">{L(`Validação pedida a ${fmtDay(shown.pedidoPendenteEm.slice(0, 10), "pt", true)}`, `Validation requested on ${fmtDay(shown.pedidoPendenteEm.slice(0, 10), "en", true)}`)}</div>
              )}

              {shown.estado === "bloqueado" && !shown.conteudo ? (
                <div className="rv-nutri-blocked">
                  <strong>{L("Não geramos orientação automática para si", "We didn't generate automatic guidance for you")}</strong>
                  <ul>{shown.motivos.map((r, i) => <li key={i}>{reasonText(r, L, lang)}</li>)}</ul>
                  <span>{L("Fale com o seu médico ou nutricionista. Pode pedir-lhe que escreva e valide uma orientação aqui.", "Talk to your doctor or dietitian. You can ask them to write and validate guidance here.")}</span>
                </div>
              ) : showOriginal && shown.conteudoIa ? (
                <>
                  <div className="rv-nutri-pending">{L("Texto original gerado pela IA, antes da revisão:", "Original AI text, before review:")}</div>
                  <NutriGuidance v={{ ...shown, conteudo: shown.conteudoIa, observacao: null }}/>
                  <button type="button" className="rv-link-btn rv-nutri-orig" onClick={() => setShowOriginal(false)}>{L("Ver a versão validada", "See the validated version")}</button>
                </>
              ) : (
                <NutriGuidance v={shown} onShowOriginal={shown.conteudoIa ? () => setShowOriginal(true) : undefined}/>
              )}

              <p className="rv-nutri-disclaimer">{NUTRI_DISCLAIMER[lang]}</p>

              {shown.estado !== "validado" && !shown.pedidoPendenteEm && (
                <div className="rv-stack">
                  <button type="button" className="rv-cta-ghost" disabled={busy} onClick={() => requestValidation(shown)}>{L("Pedir validação", "Request validation")}</button>
                </div>
              )}
            </article>
          )}

          {latest && !selected && (
            <div className="rv-nutri-update">
              {hasNewData && <p className="rv-ref-rule" style={{margin: "0 0 10px"}}>{L("Há análises novas desde esta versão.", "There are new results since this version.")}</p>}
              {hasNewData && pregnancyQuestion}
              {hasNewData && (
                <div className="rv-stack" style={{margin: "0"}}>
                  <button type="button" className="rv-cta-primary" disabled={pregnant == null || busy} onClick={run}>
                    {busy ? L("A preparar…", "Preparing…") : L("Atualizar com as análises novas", "Update with the new results")}
                  </button>
                </div>
              )}
            </div>
          )}

          {versions.length > 1 && (
            <>
              <div className="rv-sub-section-head">{L("Versões anteriores", "Previous versions")}</div>
              <ul className="rv-ref-list">
                {versions.map((v) => (
                  <li key={v.id}>
                    <button type="button" className="rv-ref-row rv-nutri-ver" aria-current={(shown?.id === v.id) || undefined}
                      onClick={() => { setSelected(v.id === latest?.id ? null : v.id); setShowOriginal(false); }}>
                      <span>{L("Versão", "Version")} {v.versao} · {fmtDay(v.geradoEm.slice(0, 10), lang, true)}</span>
                      <span className="rv-ref-when">
                        {v.estado === "validado" ? L("Validada", "Validated") : v.estado === "bloqueado" ? L("Sem orientação automática", "No automatic guidance") : v.estado === "em_validacao" ? L("Validação pedida", "Validation requested") : L("Gerada por AI", "AI-generated")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {mode !== "real" && <p className="rv-field-hint" style={{margin: "12px 20px 0"}}>{L("Conta de demonstração: o texto é fixo e não é enviado nada a nenhum serviço.", "Demo account: the text is fixed and nothing is sent to any service.")}</p>}
        </>
      )}

      {noProfessional && (
        <ConfirmDialog title={L("Ainda não tem um profissional ligado", "You don't have a linked professional yet")}
          confirmLabel={L("Recomendar o meu médico", "Recommend my doctor")}
          onCancel={() => setNoProfessional(false)} onConfirm={() => { setNoProfessional(false); go("recomendar"); }}>
          {L("Para validar, o seu médico ou nutricionista tem de estar na Vivara e ligado a si (por convite ou código). Pode partilhar o seu código com ele.",
             "To validate, your doctor or dietitian needs to be on Vivara and linked to you (by invitation or code). You can share your code with them.")}
        </ConfirmDialog>
      )}
    </SubScreen>
  );
}

// ─── Login ───────────────────────────────────────────
const LOGIN_EMAIL = "maria@vivara.health";
const LOGIN_PASS = "+Vivara2024";
const LOGIN_STORAGE_KEY = "rv-app-session";

function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`rv-lang-toggle ${className}`.trim()} role="group" aria-label={t("profile.language")}>
      <button type="button" className="rv-lang-opt" data-active={lang === "pt"} onClick={() => setLang("pt")}>PT</button>
      <button type="button" className="rv-lang-opt" data-active={lang === "en"} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

function LoginScreen({ onDemo, onReal, onSignup }: { onDemo: () => void; onReal: () => void; onSignup: () => void }) {
  const { t, L } = useLang();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Conta de demonstração: dados fictícios, nada vai para o servidor.
    if (email.trim().toLowerCase() === LOGIN_EMAIL && pass === LOGIN_PASS) {
      try { sessionStorage.setItem(LOGIN_STORAGE_KEY, "1"); } catch { /* privado */ }
      onDemo();
      return;
    }
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (err) {
        setError(/confirm/i.test(err.message)
          ? L("Ainda não confirmou o email. Abra o link que lhe enviámos.", "You haven't confirmed your email yet. Open the link we sent you.")
          : t("login.error"));
        setBusy(false);
        return;
      }
      onReal();
    } catch {
      setError(L("Sem ligação ao servidor. Tente de novo.", "No connection to the server. Please try again."));
      setBusy(false);
    }
  };

  return (
    <div className="rv-screen">
      <StatusBar />
      <div className="rv-login-top"><LangToggle /></div>
      <div className="rv-login">
        <div className="rv-login-mark">V</div>
        <div className="rv-login-title">Vivara Health</div>
        <div className="rv-login-sub">{t("login.tagline")}</div>

        <form className="rv-login-form" onSubmit={submit}>
          <label className="rv-login-label" htmlFor="rv-login-email">{t("login.email")}</label>
          <input id="rv-login-email" className="rv-login-input" type="email" autoComplete="username"
            placeholder={t("login.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required/>
          <label className="rv-login-label" htmlFor="rv-login-pass">{t("login.password")}</label>
          <div className="rv-login-passwrap">
            <input id="rv-login-pass" className="rv-login-input" type={showPass ? "text" : "password"} autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")} value={pass} onChange={(e) => setPass(e.target.value)} required/>
            <button type="button" className="rv-login-eye" onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? t("login.hidePassword") : t("login.showPassword")}>
              {showPass
                ? <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 9 s2.5-4.5 7-4.5 S16 9 16 9 s-2.5 4.5-7 4.5 S2 9 2 9z" stroke="currentColor" strokeWidth="1.4" fill="none"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>
                : <svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 9 s2.5-4.5 7-4.5 S16 9 16 9 s-2.5 4.5-7 4.5 S2 9 2 9z" stroke="currentColor" strokeWidth="1.4" fill="none"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M3 3 L15 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            </button>
          </div>
          {error && <div className="rv-login-error" role="alert">{error}</div>}
          <button className="rv-cta-primary rv-login-btn" type="submit" disabled={busy}>
            {busy ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="rv-login-signup">
          {L("Ainda não tem conta?", "Don't have an account?")}{" "}
          <button type="button" className="rv-link-btn" onClick={onSignup}>{L("Criar conta", "Create account")}</button>
        </div>
        <div className="rv-login-foot">{t("login.foot")}</div>
      </div>
    </div>
  );
}

function AppV2Page() {
  const [route, setRoute] = useState<NavRoute>("home");
  // "none": ainda não entrou; "demo": conta de demonstração; "real": Supabase.
  const [mode, setMode] = useState<"none" | AccountMode>("none");
  const [authView, setAuthView] = useState<"login" | "signup" | "signup-done">("login");
  const [signupEmail, setSignupEmail] = useState("");
  // ?codigo=VIV-… e ?convite=<uuid> (ligação do médico ou /registo): abrem o
  // registo já preenchido; o convite fica guardado até a conta estar criada.
  const [prefill, setPrefill] = useState<{ codigo: string; convite: string }>({ codigo: "", convite: "" });
  const [referralNotice, setReferralNotice] = useState<ReferralResult | null>(null);
  const referralTried = useRef(false);
  const [account, setAccount] = useState<ConsentStatus | null>(null);
  const [accountState, setAccountState] = useState<"idle" | "loading" | "error">("idle");
  const fetchStatus = useServerFn(getConsentStatus);
  const [lang, setLangState] = useState<Lang>("pt");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doExchange = useServerFn(whoopExchange);

  useEffect(() => {
    try {
      const params = referralParams(window.location.search);
      const wantsSignup = new URLSearchParams(window.location.search).has("registo");
      if (params.codigo || params.convite) setPrefill(params);
      if (params.codigo || params.convite || wantsSignup) setAuthView("signup");
      if (sessionStorage.getItem(LOGIN_STORAGE_KEY) === "1") setMode("demo");
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === "pt" || savedLang === "en") setLangState(savedLang);
    } catch { /* modo privado */ }
  }, []);

  // Trata o retorno do OAuth do Whoop (?code=…) em qualquer arranque da app,
  // troca o código por token e leva o utilizador ao ecrã de Dispositivos.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthErr = params.get("error");
    if (!code && !oauthErr) return;

    const clean = () => {
      const url = new URL(window.location.href);
      ["code", "state", "error", "error_description"].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.toString());
    };

    if (oauthErr) {
      const desc = params.get("error_description");
      setToastMsg(`Whoop: ${desc || oauthErr}`);
      clean();
      setRoute("devices");
      return;
    }

    doExchange({ data: { code: code as string, state: params.get("state") ?? "" } })
      .then((r) => {
        if (r.ok) {
          // A Whoop entrou: os outros wearables saem (um de cada vez).
          const cur = loadDevices();
          const next = { ...cur };
          for (const id of WEARABLE_IDS) if (id !== "whoop") next[id as DeviceId] = { connected: false, lastSync: null };
          saveDevices(next);
          setDevicesState(next);
        } else if (r.error && r.error !== "not_configured") {
          setToastMsg(lang === "en" ? "Failed to connect Whoop" : "Falha ao ligar o Whoop");
        }
      })
      .catch(() => {})
      .finally(() => { clean(); setRoute("devices"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doExchange]);

  const t = useCallback((key: string) => translate(lang, key), [lang]);
  const L = useCallback((pt: string, en: string) => (lang === "en" ? en : pt), [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* modo privado */ }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      setAccount(await fetchStatus());
      setAccountState("idle");
    } catch {
      setAccountState("error");
    }
  }, [fetchStatus]);

  const enterReal = useCallback(async () => {
    setMode("real");
    setAccountState("loading");
    try {
      setAccount(await fetchStatus());
      setAccountState("idle");
    } catch {
      setAccountState("error");
    }
  }, [fetchStatus]);

  // Sessão real guardada pelo Supabase (inclui o regresso do link de confirmação do email).
  useEffect(() => {
    let alive = true;
    try { if (sessionStorage.getItem(LOGIN_STORAGE_KEY) === "1") return; } catch { /* privado */ }
    supabase.auth.getSession().then(({ data }) => { if (alive && data.session) void enterReal(); }).catch(() => {});
    return () => { alive = false; };
  }, [enterReal]);

  // Depois do registo, já com sessão e com a conta em ordem: aplica o convite ou
  // o código guardados. Uma vez por sessão; nunca bloqueia a app.
  useEffect(() => {
    if (mode !== "real" || !account || account.closure || !account.health || account.needsReconsent) return;
    if (referralTried.current) return;
    referralTried.current = true;
    applyPendingReferral().then((r) => { if (r) setReferralNotice(r); }).catch(() => {});
  }, [mode, account]);

  const logout = useCallback(() => {
    referralTried.current = false;
    setReferralNotice(null);
    try { sessionStorage.removeItem(LOGIN_STORAGE_KEY); } catch { /* modo privado */ }
    if (mode === "real") void supabase.auth.signOut().catch(() => {});
    setMode("none");
    setAccount(null);
    setAuthView("login");
    setRoute("home");
  }, [mode]);

  const firstName = mode === "real" ? (account?.name?.trim().split(/\s+/)[0] || "") : PATIENT_FIRST_NAME;
  const accountValue: AccountCtxValue = {
    mode: mode === "real" ? "real" : "demo",
    firstName,
    status: account,
    refresh: refreshAccount,
  };

  const gate = (): ReactNode => {
    if (mode === "none") {
      if (authView === "signup") return (
        <SignupScreen initialInvite={prefill.codigo} initialConvite={prefill.convite} onBack={() => setAuthView("login")} onDone={async (session, email) => {
          if (session) {
            await supabase.auth.setSession(session).catch(() => {});
            void enterReal();
            return;
          }
          setSignupEmail(email);
          setAuthView("signup-done");
        }}/>
      );
      if (authView === "signup-done") return <SignupDoneScreen email={signupEmail} onLogin={() => setAuthView("login")}/>;
      return <LoginScreen onDemo={() => setMode("demo")} onReal={() => void enterReal()} onSignup={() => setAuthView("signup")}/>;
    }
    if (mode === "real") {
      if (accountState === "error") return (
        <div className="rv-screen"><StatusBar/>
          <div className="rv-login">
            <div className="rv-login-title" role="alert">{L("Não foi possível carregar a sua conta", "Couldn't load your account")}</div>
            <div className="rv-login-sub" style={{maxWidth: 300}}>{L("Verifique a ligação e tente de novo.", "Check your connection and try again.")}</div>
            <button className="rv-cta-primary rv-login-btn" style={{maxWidth: 320, marginTop: 20}} type="button" onClick={() => void enterReal()}>{L("Tentar de novo", "Try again")}</button>
            <button className="rv-cta-ghost" style={{maxWidth: 320, width: "100%", marginTop: 10}} type="button" onClick={logout}>{L("Sair", "Sign out")}</button>
          </div>
        </div>
      );
      if (!account) return <div className="rv-screen"><StatusBar/><div className="rv-login"><div className="rv-modal-spinner" role="status" aria-label={L("A carregar", "Loading")}/></div></div>;
      if (account.closure || !account.health) return <ClosedAccountScreen exportUntil={account.closure?.exportUntil ?? new Date().toISOString()} onLogout={logout}/>;
      if (account.needsReconsent) return <ReconsentScreen onAccepted={() => void refreshAccount()} onLogout={logout}/>;
    }
    return null;
  };

  // Dispositivos e fontes vivem aqui em cima porque são lidos em vários ecrãs
  // (Dispositivos escreve, home e Dados leem). Arrancam do valor por omissão
  // e só sincronizam com o localStorage depois de montar, para o HTML do
  // servidor e o do cliente coincidirem.
  const [devices, setDevicesState] = useState<DevicesMap>(DEFAULT_DEVICES);
  useEffect(() => {
    setDevicesState(loadDevices());
  }, []);

  const setDevices = useCallback((d: DevicesMap) => {
    setDevicesState(d);
    saveDevices(d);
  }, []);

  return (
    <div className="rv-root" data-theme="dark">
      <LangCtx.Provider value={{ lang, setLang, t, L }}>
        <NavCtx.Provider value={{ go: setRoute, current: route, showToast, logout }}>
        <DevicesCtx.Provider value={{ devices, setDevices }}>
        <AccountCtx.Provider value={accountValue}>
          <div className="rv-phone-shell">
            {gate() ?? (
              <>
                {renderScreen(route)}
                {toastMsg && <div className="rv-toast" role="status" aria-live="polite">{toastMsg}</div>}
                <AssistantFAB />
                {referralNotice && (
                  <NoticeDialog title={L("Código de convite", "Invite code")} onClose={() => setReferralNotice(null)}>
                    {REFERRAL_RESULT_TEXT[referralNotice][lang]}
                  </NoticeDialog>
                )}
              </>
            )}
          </div>
        </AccountCtx.Provider>
        </DevicesCtx.Provider>
        </NavCtx.Provider>
      </LangCtx.Provider>
    </div>
  );
}
