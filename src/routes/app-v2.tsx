import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useContext, createContext, useRef, useCallback, useEffect, type ReactNode } from "react";
import { askAssistente } from "@/lib/assistente.functions";
import { whoopAuthUrl, whoopExchange, whoopStatus, whoopDisconnect, type WhoopStatus } from "@/lib/whoop.server";
import { translate, LANG_STORAGE_KEY, type Lang } from "@/lib/app-v2-i18n";
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
  | "pesquisa" | "notificacoes" | "privacidade" | "equipa" | "laboratorios" | "farmacia" | "exportar"
  | "sintomas" | "nutricao" | "registos" | "documento";

type NavRoute =
  | RouteId
  | { route: "marker"; marker: BioMarker }
  | { route: "documento"; docId: string };

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
const IDADE_BIOLOGICA = 43;
const IDADE_REAL = 47;

const InfoGlyph = <span className="rv-info"><svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="1.8" r="1.1" fill="currentColor"/><path d="M5 4.4 V8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>;

function BioAgeCard() {
  const { t } = useLang();
  const shown = useCountUp(IDADE_BIOLOGICA);
  const [info, setInfo] = useState(false);
  const diff = IDADE_REAL - IDADE_BIOLOGICA;
  const younger = diff > 0;
  const unitWord = Math.abs(diff) === 1 ? t("bioage.year") : t("bioage.years");
  return (
    <>
      <div className="rv-bioage-card">
        <button type="button" className="rv-bioage-eyebrow rv-score-eyebrow-btn" onClick={() => setInfo(true)}>
          {t("bioage.eyebrow")} {InfoGlyph}
        </button>
        <div className="rv-bioage-main">
          <div className="rv-bioage-num">{shown}<span className="rv-bioage-unit">{t("bioage.unit")}</span></div>
          <span className="rv-bioage-badge" data-good={younger}>
            {younger ? "−" : "+"}{Math.abs(diff)} {unitWord}
          </span>
        </div>
        <div className="rv-bioage-sub">{t("bioage.sub")}</div>
        <div className="rv-bioage-compare">
          <div className="rv-bioage-row">
            <span className="rv-bioage-row-label">{t("bioage.biological")}</span>
            <div className="rv-bioage-bar"><div className="rv-bioage-fill" data-good="true" style={{width: `${(IDADE_BIOLOGICA / IDADE_REAL) * 100}%`}}/></div>
            <span className="rv-bioage-row-val">{IDADE_BIOLOGICA}</span>
          </div>
          <div className="rv-bioage-row">
            <span className="rv-bioage-row-label">{t("bioage.real")}</span>
            <div className="rv-bioage-bar"><div className="rv-bioage-fill" style={{width: "100%"}}/></div>
            <span className="rv-bioage-row-val">{IDADE_REAL}</span>
          </div>
        </div>
      </div>
      {info && (
        <InfoDrawer title={t("bioage.drawerTitle")} onClose={() => setInfo(false)}>
          <p>{t("bioage.drawerP1a")}<strong>{t("bioage.drawerP1strong")}</strong>{t("bioage.drawerP1b")}</p>
          <p>{t("bioage.drawerP2a")}<strong>{t("bioage.drawerP2strong")}</strong>{t("bioage.drawerP2b")}</p>
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

  return (
    <div className="rv-screen">
      <StatusBar />

      <div className="rv-home-greet">
        <div className="rv-home-greet-text">
          <div className="rv-home-greet-hi">{t("home.hi")}</div>
          <div className="rv-home-greet-name">{t("home.title")}</div>
        </div>
        <div className="rv-home-greet-actions">
        <button className="rv-home-bell" onClick={() => go("alerts")} aria-label={t("home.bell")}>
          {Icon.bell}
          <span className="rv-home-bell-dot"/>
        </button>
        <button className="rv-home-avatar" onClick={() => go("profile")} aria-label={t("home.profile")}>
          <svg width="18" height="18" viewBox="0 0 22 22"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 19 a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>
        </button>
        </div>
      </div>

      <div className="rv-body">
        <BioAgeCard />
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
                <span className="rv-signal-sub">{withSrc(t("signal.stepsSub"), stepsSrc)}</span>
              </div>
              <span className="rv-signal-val">7,2k</span>
              <Spark pts={[6800,8200,5400,9100,7600,6900,7200]} color="var(--accent)"/>
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

// Resumo visual do painel: um ponto por marcador, ordenado por estado para
// que a contagem de cada cor se leia sem contar os pontos um a um.
const BIO_STATE_ORDER: BioState[] = ["optimal", "good", "attention", "nodata"];

function BioStateGrid({ markers }: { markers: BioMarker[] }) {
  const { go } = useNav();
  const { L } = useLang();
  const colorOf = (s: BioState) => BIO_STATE_META.find((m) => m.state === s)!.color;
  const sorted = [...markers].sort(
    (a, b) => BIO_STATE_ORDER.indexOf(a.state) - BIO_STATE_ORDER.indexOf(b.state),
  );
  const counts = BIO_STATE_META.map((meta) => ({
    ...meta,
    n: markers.filter((m) => m.state === meta.state).length,
  })).filter((c) => c.n > 0);

  return (
    <div className="rv-dotgrid-card">
      <div className="rv-dotgrid-head">
        <span className="rv-dotgrid-title">{L("Biomarcadores","Biomarkers")}</span>
        <span className="rv-dotgrid-total">{markers.length}</span>
      </div>
      <div className="rv-dotgrid">
        {sorted.map((m) => (
          <button
            key={m.name}
            type="button"
            className="rv-dot-cell"
            style={{ background: colorOf(m.state) }}
            onClick={() => go({ route: "marker", marker: m })}
            aria-label={`${m.name} · ${m.state === "nodata" ? L("sem dados","no data") : `${m.value} ${m.unit}`}`}
          />
        ))}
      </div>
      <div className="rv-dotgrid-legend">
        {counts.map((c) => (
          <span key={c.state} className="rv-dotgrid-legend-item">
            <span className="rv-dotgrid-legend-dot" style={{ background: c.color }}/>
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
        <div className="rv-bio-row-name">{b.name}</div>
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
  const inPanel = (b: BioMarker) => panelId === null || b.panel === panelId;
  const gridList = BIOMARKERS.filter(inPanel);
  const alertList = BIOS_ALERT.filter(inPanel);
  const okList = BIOS_OK.filter(inPanel);
  const noDataList = BIOS_NODATA.filter(inPanel);

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
          {BIO_PANELS.map((p) => (
            <button key={p.id} className="rv-period-chip" data-active={panelId === p.id || undefined} onClick={() => setPanelId(p.id)}>
              <span style={{display: "inline-flex", verticalAlign: "-3px", marginRight: 4}}>{p.icon}</span>{L(p.namePt, p.nameEn)}
            </button>
          ))}
        </div>

        <BioStateGrid markers={gridList} />

        <div className="rv-list">
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("registos")}>
            <div className="rv-list-icon">{Icon.doc}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">{L("Registos","Records")}</span>
              <span className="rv-list-sub">{L("Sintomas, consultas, medicação e análises","Symptoms, appointments, medication and labs")}</span>
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
  const { t, L } = useLang();
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
            {hasSeries ? ` · ${t("marker.lastCollection")}` : ` · ${L("sem colheita","no sample yet")}`}
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
              {pts.map((_, i) => (
                <circle key={i} cx={xs[i]} cy={ys[i]} r={i === pts.length - 1 ? 4.5 : 2.5}
                  fill={i === pts.length - 1 ? col : "var(--bg-elev)"} stroke={col} strokeWidth="1.5"/>
              ))}
            </svg>
            <div className="rv-marker-chart-axis">
              <span>out 25</span><span>dez 25</span><span>fev 26</span><span>abr 26</span>
            </div>
          </div>
        ) : (
          <div className="rv-info-note" style={{margin: "0 20px 14px"}}>
            <strong>{L("Ainda sem colheita","No sample yet")}</strong>
            <span>{L("Este marcador faz parte do seu painel mas ainda não foi medido. Aparece na próxima requisição da equipa clínica.","This marker is part of your panel but hasn't been measured yet. It will be included in your clinical team's next request.")}</span>
          </div>
        )}

        {hasSeries && <div className="rv-marker-context">
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
            <div className="rv-marker-rows">
              <div className="rv-marker-row"><span className="rv-marker-row-date">22 abr 2026</span><span className="rv-marker-row-lab">Synlab</span><span className="rv-marker-row-val" style={{color: col}}>{m.value}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">18 fev 2026</span><span className="rv-marker-row-lab">Synlab</span><span className="rv-marker-row-val">{pts[pts.length - 2]}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">06 dez 2025</span><span className="rv-marker-row-lab">CUF</span><span className="rv-marker-row-val">{pts[pts.length - 3]}</span></div>
              <div className="rv-marker-row"><span className="rv-marker-row-date">14 set 2025</span><span className="rv-marker-row-lab">CUF</span><span className="rv-marker-row-val">{pts[0]}</span></div>
            </div>
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
    subPt: "Agendada · 14:30",                     subEn: "Scheduled · 14:30" },
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

// A timeline é montada a partir das mesmas fontes que alimentam os outros
// ecrãs — não há aqui uma segunda cópia dos dados a divergir com o tempo.
function buildTimeline(): RecordEntry[] {
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

function RegistosScreen() {
  const { go } = useNav();
  const { L, lang } = useLang();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RecordType | "all">("all");
  const [range, setRange] = useState("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const all = buildTimeline();
  const term = q.trim().toLowerCase();

  // O intervalo conta para trás a partir da data de referência da app, não do
  // relógio real — os dados de demonstração são de 2026 e um "últimos 30 dias"
  // ancorado no relógio devolveria uma lista vazia.
  const months = RANGE_OPTIONS.find((r) => r.id === range)?.months ?? null;
  const cutoff = months == null ? null : new Date(new Date(APP_TODAY).setMonth(APP_TODAY.getMonth() - months));

  const entries = all.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    // Entradas futuras (consultas agendadas) escapam ao corte: não faz sentido
    // "últimos 30 dias" esconder a consulta da semana que vem.
    if (cutoff && new Date(e.iso) < cutoff && new Date(e.iso) <= APP_TODAY) return false;
    if (!term) return true;
    const hay = norm(`${e.titlePt} ${e.titleEn} ${e.subPt} ${e.subEn} ${e.sourcePt ?? ""} ${e.sourceEn ?? ""} ${RECORD_META[e.type].pt} ${RECORD_META[e.type].en}`);
    return hay.includes(norm(term));
  });

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

        <div className="rv-panel-chips">
          {filters.map((f) => (
            <button key={f.id} className="rv-period-chip" data-active={filter === f.id || undefined} onClick={() => setFilter(f.id)}>
              {f.id !== "all" && <span className="rv-rec-chip-dot" style={{background: RECORD_META[f.id as RecordType].color}}/>}
              {f.label}
            </button>
          ))}
        </div>

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
                    {g.items.map((e) => {
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
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

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
function DocumentoScreen({ docId }: { docId?: string }) {
  const { go } = useNav();
  const { L, lang } = useLang();
  const doc = LAB_DOCS.find((d) => d.id === docId) ?? LAB_DOCS[0];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("registos")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L(doc.titlePt, doc.titleEn)}</div>
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
        </div>

        <div className="rv-sub-section-head">{L("Documento original","Original document")}</div>
        <div className="rv-doc-page">
          <div className="rv-doc-page-head">
            <span className="rv-doc-lab">{doc.lab}</span>
            <span className="rv-doc-page-n">1 / {doc.pages}</span>
          </div>
          <div className="rv-doc-page-meta">
            <div>Maria Antunes · 42A</div>
            <div>{L("Colheita","Sample")}: {fmtDay(doc.iso, lang, true)}</div>
          </div>
          <div className="rv-doc-lines">
            {doc.rows.map((r, i) => (
              <div key={i} className="rv-doc-line" data-hit={selected === i || undefined}>{r.raw}</div>
            ))}
            <div className="rv-doc-line rv-doc-line-more">
              {doc.totalExtracted > doc.rows.length
                ? L(`… mais ${doc.totalExtracted - doc.rows.length} parâmetros nas páginas seguintes`,
                    `… ${doc.totalExtracted - doc.rows.length} more parameters on the following pages`)
                : ""}
            </div>
          </div>
        </div>

        <div className="rv-sub-section-head">
          {L("Valores extraídos","Extracted values")} · {doc.rows.length} {L("de","of")} {doc.totalExtracted}
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
                  <span className="rv-doc-row-ref">{L("ref","ref")} {r.ref}</span>
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
          {L("Os valores foram conferidos pela sua equipa clínica antes de entrarem no seu historial.",
             "These values were checked by your clinical team before entering your record.")}
        </div>
        <div style={{height: 90}}/>
      </div>
    </div>
  );
}

// ─── Upload / Share Sheet ────────────────────────────
function ShareUploadScreen() {
  const { go } = useNav();
  const [imported, setImported] = useState(false);
  return (
    <div className="rv-screen" style={{position: "relative"}}>
      <div className="rv-share-bg-mock">
        <div className="rv-mail-header">
          <button className="rv-header-btn" style={{background: "transparent"}} onClick={() => go("home")}>{Icon.back}</button>
          <div className="rv-mail-avatar">SL</div>
          <div className="rv-mail-meta">
            <div className="rv-mail-from">Synlab Portugal</div>
            <div className="rv-mail-subj">Resultados disponíveis · 22 abr 2026</div>
          </div>
        </div>
        <div className="rv-mail-body">
          Estimada Maria Antunes,<br/><br/>
          Os resultados da sua análise de sangue de 22 de abril de 2026 já se encontram disponíveis em anexo no presente email.<br/><br/>
          Em caso de dúvida, contacte o serviço de apoio…
        </div>
        <div className="rv-mail-pdf">
          <div className="rv-mail-pdf-icon">PDF</div>
          <div className="rv-mail-pdf-meta">
            <div className="rv-mail-pdf-name">Synlab_Maria_Antunes_22Abr.pdf</div>
            <div className="rv-mail-pdf-size">432 KB · 14 marcadores</div>
          </div>
          {Icon.share}
        </div>
      </div>
      <div className="rv-share-bg"/>

      <div className="rv-share-toast">
        <span className="rv-share-toast-mark">V</span>
        Vivara sugerida · análise reconhecida
      </div>

      <div className="rv-share-sheet">
        <div className="rv-share-handle"/>
        <div className="rv-share-doc">
          <div className="rv-share-doc-icon">PDF</div>
          <div className="rv-share-doc-meta">
            <div className="rv-share-doc-name">Synlab_Maria_Antunes_22Abr.pdf</div>
            <div className="rv-share-doc-info">432 KB · do Mail</div>
          </div>
          <div style={{color: "rgba(255,255,255,0.5)"}}>{Icon.copy}</div>
        </div>

        <div className="rv-share-apps">
          <div className="rv-share-app" data-suggested="true" onClick={() => setImported(true)} style={{cursor: "pointer"}}>
            <div className="rv-share-app-tile" data-app="vivara">V</div>
            <div className="rv-share-app-name">Vivara</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="files">📁</div>
            <div className="rv-share-app-name">Ficheiros</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="drive">D</div>
            <div className="rv-share-app-name">Drive</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="notes">📝</div>
            <div className="rv-share-app-name">Notas</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="airdrop">
              <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" stroke="#fff" strokeWidth="1.4" fill="none"/><path d="M14 8 L14 18 M9 13 L14 8 L19 13" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-share-app-name">AirDrop</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="msg">💬</div>
            <div className="rv-share-app-name">Mensagens</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="mail">✉</div>
            <div className="rv-share-app-name">Mail</div>
          </div>
          <div className="rv-share-app">
            <div className="rv-share-app-tile" data-app="more">···</div>
            <div className="rv-share-app-name">Mais</div>
          </div>
        </div>

        <div className="rv-share-actions">
          <div className="rv-share-action"><span>Copiar</span><span className="rv-share-action-icon">{Icon.copy}</span></div>
          <div className="rv-share-action"><span>Guardar em Ficheiros</span><span className="rv-share-action-icon">📁</span></div>
          <div className="rv-share-action" style={{color: "var(--lime)", cursor: "pointer"}} onClick={() => setImported(true)}>
            <span style={{fontWeight: 600}}>Guardar em Vivara</span>
            <span style={{color: "var(--lime)"}}>V</span>
          </div>
          <div className="rv-share-action" style={{color: "var(--fg-70)", cursor: "pointer"}} onClick={() => go("home")}>
            <span>Cancelar</span>
            <span/>
          </div>
        </div>
      </div>

      {imported && (
        <div className="rv-import-overlay">
          <div className="rv-import-card">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-import-title">Análise importada</div>
            <div className="rv-import-sub">14 marcadores extraídos do PDF Synlab.<br/>A tua equipa clínica foi notificada.</div>
            <div className="rv-import-meta">
              <span>Synlab·22abr</span>
              <span>432 KB</span>
              <span>14 valores</span>
            </div>
            <button className="rv-import-btn" onClick={() => go("data")}>Ver dados</button>
            <button className="rv-import-btn rv-import-btn--ghost" onClick={() => go("home")}>Voltar ao início</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Avisos ──────────────────────────────────────────
function AvisosScreen() {
  const { go } = useNav();
  const { L } = useLang();
  const [tab, setTab] = useState<"medicos" | "lembretes">("medicos");
  const [calAdded, setCalAdded] = useState(false);
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">{L("Avisos", "Alerts")}</div>
        <button className="rv-header-btn" onClick={() => go("profile")} aria-label={L("Perfil", "Profile")}>{Icon.settings}</button>
      </header>

      <div className="rv-body">
        <div className="rv-avisos-tabs">
          <button className="rv-avisos-tab" data-active={tab === "medicos"} onClick={() => setTab("medicos")}>
            {L("Clínicos", "Clinical")} <span className="rv-pill-count">2</span>
          </button>
          <button className="rv-avisos-tab" data-active={tab === "lembretes"} onClick={() => setTab("lembretes")}>
            {L("Lembretes", "Reminders")} <span className="rv-pill-count" data-muted={tab !== "lembretes"}>3</span>
          </button>
        </div>

        {tab === "medicos" ? (
          <>
            <article className="rv-aviso" data-tone="alert">
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 V11 M9 14 V14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("Há 12 min · Equipa clínica", "12 min ago · Clinical team")}</div>
                <div className="rv-aviso-title">{L("Pedido de reanálise · Estradiol", "Re-test request · Estradiol")}</div>
                <div className="rv-aviso-body">{L("Repetir colheita até", "Repeat the sample by")} <strong>{L("10 mai 2026", "10 May 2026")}</strong>. {L("A sua equipa clínica pediu nova medição para confirmar a tendência descendente.", "Your clinical team requested a new measurement to confirm the downward trend.")}</div>
                <div className="rv-aviso-cta" style={{color: "var(--fg-50)"}}>{L("Faça a colheita no seu laboratório habitual", "Take the sample at your usual lab")}</div>
              </div>
              <div className="rv-aviso-unread"/>
            </article>

            <article className="rv-aviso" data-tone="info" onClick={() => go("summary")} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M9 8 V13 M9 5 V5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("Hoje · 09:30 · Plano", "Today · 09:30 · Plan")}</div>
                <div className="rv-aviso-title">{L("Resumo da consulta de 22 abr", "Summary of 22 Apr appointment")}</div>
                <div className="rv-aviso-body">{L("Plano metabólico atualizado pela equipa clínica: manter Metformina, aumentar Magnésio para 400 mg ao deitar.", "Metabolic plan updated by the clinical team: keep Metformin, increase Magnesium to 400 mg at bedtime.")}</div>
                <div className="rv-aviso-cta">{L("Abrir resumo", "Open summary")} →</div>
              </div>
            </article>

            <article className="rv-aviso" data-tone="success" onClick={() => go("data")} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5.5 9 L8 11.5 L12.5 6.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("Ontem · 16:42", "Yesterday · 16:42")}</div>
                <div className="rv-aviso-title">{L("Análise importada com sucesso", "Lab result imported successfully")}</div>
                <div className="rv-aviso-body">{L("14 marcadores extraídos do PDF Synlab. A sua equipa clínica foi notificada.", "14 markers extracted from the Synlab PDF. Your clinical team was notified.")}</div>
                <div className="rv-aviso-cta" style={{color: "var(--ok)"}}>{L("Ver dados", "See data")} →</div>
              </div>
            </article>
          </>
        ) : (
          <>
            <article className="rv-aviso">
              <div className="rv-aviso-icon">{Icon.pill}</div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("Hoje · 19:00 (em 4h)", "Today · 19:00 (in 4h)")}</div>
                <div className="rv-aviso-title">{L("Berberina 500 mg", "Berberine 500 mg")}</div>
                <div className="rv-aviso-body">{L("Antes do jantar. Faltam 18 dias na embalagem atual.", "Before dinner. 18 days left in the current pack.")}</div>
                <div className="rv-aviso-cta">{L("Marcar como tomado", "Mark as taken")} →</div>
              </div>
            </article>
            <article className="rv-aviso">
              <div className="rv-aviso-icon">{Icon.pill}</div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("Hoje · 22:30 (em 7h)", "Today · 22:30 (in 7h)")}</div>
                <div className="rv-aviso-title">{L("Magnésio 400 mg", "Magnesium 400 mg")}</div>
                <div className="rv-aviso-body">{L("Ao deitar. Nova dose conforme plano de 22 abr.", "At bedtime. New dose per the 22 Apr plan.")}</div>
              </div>
            </article>
            <article className="rv-aviso" onClick={() => setCalAdded(true)} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="4" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 8 H15 M6 2 V5 M12 2 V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">{L("12 mai · 14:30", "12 May · 14:30")}</div>
                <div className="rv-aviso-title">{L("Próxima consulta", "Next appointment")}</div>
                <div className="rv-aviso-body">{L("Clínica Lumiar · TRH personalizada.", "Lumiar Clinic · personalised HRT.")}</div>
                <div className="rv-aviso-cta" style={{color: calAdded ? "var(--lime)" : undefined}}>
                  {calAdded ? L("✓ Adicionado ao calendário", "✓ Added to calendar") : `${L("Adicionar ao calendário", "Add to calendar")} →`}
                </div>
              </div>
            </article>
          </>
        )}
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
            Bom dia Maria. Vi os resultados do Synlab que carregaste ontem — quero pedir-te para repetir o Estradiol antes da nossa consulta de 12 de maio.
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
            Sim, perfeito. Aproveita para fazer também FSH e LH — já te enviei o pedido. Como te tens sentido com os afrontamentos?
          </div>
          <div className="rv-msg-time">09:48</div>
        </div>

        <div className="rv-msg rv-msg--user">
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

// ─── Assistente Vivara (chatbot) ─────────────────────
function buildAssistantContext(): string {
  const fmtBio = (b: BioMarker) =>
    `- ${b.name}: ${b.value} ${b.unit} (${b.target}) · variação ${b.delta} · histórico [${b.spark.join(", ")}]${b.tone ? ` · estado: ${b.tone}` : ""}`;

  const plano = [
    "Metformina 500 mg — pequeno-almoço, 08:00",
    "Vitamina D 4000 UI — almoço, 13:00",
    "Ómega-3 1 g — jantar, 19:00",
    "Magnésio 400 mg — ao deitar, 22:30",
    "Treino de força · 35 min — recomendado pela Dra. Sofia, horário livre",
  ];

  return [
    `PRÓXIMA CONSULTA: 12 mai 2026, 14:30 · Dra. Sofia Cardoso · Discussão sobre TRH personalizada.`,
    `MÉDICA RESPONSÁVEL: Dra. Sofia Cardoso · Clínica Lumiar.`,
    ``,
    `BIOMARCADORES FORA DE ALVO / EM ATENÇÃO:`,
    ...BIOS_ALERT.map(fmtBio),
    ``,
    `BIOMARCADORES EM ALVO / ACOMPANHAMENTO:`,
    ...BIOS_OK.map(fmtBio),
    ``,
    `PLANO DE HOJE (suplementos / medicação / atividade):`,
    ...plano.map((p) => `- ${p}`),
  ].join("\n");
}

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

const ASSISTANT_INTRO =
  "Posso ajudar-te a consultar os teus dados — exames, valores, consultas e plano. Para perguntas sobre o que estes resultados significam para ti, fala com a Dra. Sofia.";
const ASSISTANT_INTRO_EN =
  "I can help you look up your data — labs, values, appointments and plan. For questions about what these results mean for you, talk to Dr. Sofia.";

function AssistenteScreen() {
  const { go } = useNav();
  const { L } = useLang();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: L(ASSISTANT_INTRO, ASSISTANT_INTRO_EN) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askAssistente);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      // exclude the fixed intro from history sent to the model
      const history = nextMessages
        .filter((m, i) => !(i === 0 && m.role === "assistant" && m.content === ASSISTANT_INTRO))
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const safeHistory = history.length === 0 ? [{ role: "user" as const, content: text }] : history;
      const res = await ask({ data: { messages: safeHistory, context: buildAssistantContext() } });
      setMessages((prev) => [...prev, { role: "assistant", content: res.text || "Sem resposta." }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não consegui responder agora.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header rv-msg-header">
        <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
        <div className="rv-msg-header-meta">
          <div className="rv-msg-header-avatar" style={{background: "var(--surface-2)"}}>AV</div>
          <div>
            <div className="rv-msg-header-name">{L("Assistente Vivara", "Vivara Assistant")}</div>
            <div className="rv-msg-header-status">{L("Os seus dados, ao alcance", "Your data, within reach")}</div>
          </div>
        </div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body rv-asst-body" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`rv-asst-msg rv-asst-msg--${m.role}`}>
            <div className="rv-asst-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="rv-asst-msg rv-asst-msg--assistant">
            <div className="rv-asst-bubble rv-asst-typing">
              <span/><span/><span/>
            </div>
          </div>
        )}
        {error && (
          <div className="rv-asst-msg rv-asst-msg--system">
            <div className="rv-asst-bubble rv-asst-error">{error}</div>
          </div>
        )}
        <div style={{height: 8}}/>
      </div>

      <div className="rv-msg-compose rv-asst-compose">
        <textarea
          className="rv-msg-compose-input rv-asst-input"
          placeholder={L("Pergunte sobre os seus dados…", "Ask about your data…")}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={loading}
        />
        <button
          className="rv-msg-compose-send"
          data-active={input.trim().length > 0 && !loading}
          onClick={send}
          disabled={loading || input.trim().length === 0}
          aria-label="Enviar"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9 L15 3 L11 15 L9 10 Z" fill="currentColor"/></svg>
        </button>
      </div>

      <TabBar active="messages" />
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
        <div style={{width: 36}} />
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
              <div className="rv-upcoming-who">{L("Equipa clínica · Clínica Lumiar", "Clinical team · Lumiar Clinic")}</div>
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

function WhoopCard() {
  const { showToast } = useNav();
  const { L } = useLang();
  const getAuthUrl = useServerFn(whoopAuthUrl);
  const doDisconnect = useServerFn(whoopDisconnect);
  const { status, refresh } = useWhoopStatus();
  const [busy, setBusy] = useState(false);

  const connect = async () => {
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
    </div>
  );
}

interface DeviceState { connected: boolean; lastSync: number | null }
type DevicesMap = Record<DeviceId, DeviceState>;

// v2: passa a haver dois wearables ligados por omissão (Apple Watch + Oura),
// para que a escolha de fonte principal tenha um conflito real para resolver.
const STORAGE_KEY = "rv-devices-v2";
const DEFAULT_DEVICES: DevicesMap = {
  "apple-health": { connected: true,  lastSync: Date.now() - 4 * 60 * 1000 },
  "oura":         { connected: true,  lastSync: Date.now() - 26 * 60 * 1000 },
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
    return { ...DEFAULT_DEVICES, ...JSON.parse(raw) } as DevicesMap;
  } catch {
    return DEFAULT_DEVICES;
  }
}

function saveDevices(d: DevicesMap) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ─── Fonte principal por métrica ─────────────────────
// Dois wearables ligados dizem os dois que medem "HRV", mas não medem o
// mesmo: a Whoop mede RMSSD durante o sono, o Apple Watch mede SDNN em
// momentos avulsos. Misturá-los produziria uma série sem significado
// clínico, por isso cada métrica tem UMA fonte de cada vez — nunca média.
type SourceId = DeviceId | "whoop";
type MetricKey = "sleep" | "hrv" | "steps" | "restingHr" | "body";

interface MetricDef { key: MetricKey; pt: string; en: string; providers: SourceId[] }

// A ordem de `providers` é a prioridade por omissão quando o utente ainda
// não escolheu nada. A Whoop não conta passos, por isso não aparece lá.
const METRICS: MetricDef[] = [
  { key: "sleep",     pt: "Sono",       en: "Sleep",      providers: ["whoop", "oura", "apple-health", "garmin", "fitbit"] },
  { key: "hrv",       pt: "HRV",        en: "HRV",        providers: ["whoop", "oura", "apple-health", "garmin"] },
  { key: "steps",     pt: "Passos",     en: "Steps",      providers: ["apple-health", "garmin", "fitbit", "google-fit", "oura"] },
  { key: "restingHr", pt: "FC repouso", en: "Resting HR", providers: ["whoop", "oura", "apple-health", "garmin", "fitbit"] },
  { key: "body",      pt: "Peso e composição", en: "Weight & composition", providers: ["whoop", "apple-health", "fitbit", "garmin"] },
];

type SourcesMap = Partial<Record<MetricKey, SourceId>>;
const SOURCES_KEY = "rv-metric-sources-v1";

function sourceName(id: SourceId): string {
  return id === "whoop" ? "Whoop" : DEVICES.find((d) => d.id === id)?.name ?? id;
}

function loadSources(): SourcesMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(SOURCES_KEY) || "{}") as SourcesMap;
  } catch {
    return {};
  }
}

function availableSources(metric: MetricDef, devices: DevicesMap, whoopConnected: boolean): SourceId[] {
  return metric.providers.filter((p) => (p === "whoop" ? whoopConnected : devices[p]?.connected));
}

// A escolha guardada só vale enquanto esse dispositivo continuar ligado —
// se for desligado, cai para o seguinte da lista de prioridade em vez de
// deixar a métrica sem fonte.
function resolveSource(metric: MetricDef, devices: DevicesMap, whoopConnected: boolean, choices: SourcesMap): SourceId | null {
  const avail = availableSources(metric, devices, whoopConnected);
  const chosen = choices[metric.key];
  if (chosen && avail.includes(chosen)) return chosen;
  return avail[0] ?? null;
}

interface DevicesCtxValue {
  devices: DevicesMap;
  setDevices: (d: DevicesMap) => void;
  sources: SourcesMap;
  setSource: (k: MetricKey, s: SourceId) => void;
}
const DevicesCtx = createContext<DevicesCtxValue>({
  devices: DEFAULT_DEVICES, setDevices: () => {}, sources: {}, setSource: () => {},
});
const useDevices = () => useContext(DevicesCtx);

// Nome da fonte resolvida para uma métrica, pronto a mostrar em "Fonte: X".
function useSourceName(key: MetricKey): string | null {
  const { devices, sources } = useDevices();
  const { status } = useWhoopStatus();
  const metric = METRICS.find((m) => m.key === key)!;
  const id = resolveSource(metric, devices, !!status?.connected, sources);
  return id ? sourceName(id) : null;
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

// Selector de fonte principal — só aparece quando há mais do que um
// dispositivo ligado a medir a mesma coisa. Com um só, não há escolha a
// fazer e mostrar um selector de uma opção seria ruído.
function FonteSection() {
  const { L } = useLang();
  const { devices, sources, setSource } = useDevices();
  const { status } = useWhoopStatus();
  const whoopConnected = !!status?.connected;

  const rows = METRICS.map((metric) => ({
    metric,
    avail: availableSources(metric, devices, whoopConnected),
    active: resolveSource(metric, devices, whoopConnected, sources),
  }));

  if (rows.every((r) => r.avail.length === 0)) return null;

  return (
    <>
      <div className="rv-section-head" style={{margin: "0 20px 8px"}}>
        <h3>{L("Fonte principal","Primary source")}</h3>
      </div>
      <div className="rv-src-note">
        {L("Cada métrica usa um dispositivo de cada vez. Os valores nunca são misturados entre dispositivos — medem de formas diferentes e a média não teria significado clínico.",
           "Each metric uses one device at a time. Values are never blended across devices — they measure differently and an average would have no clinical meaning.")}
      </div>
      <div className="rv-src-list">
        {rows.map(({ metric, avail, active }) => (
          <div key={metric.key} className="rv-src-row">
            <div className="rv-src-label">{L(metric.pt, metric.en)}</div>
            {avail.length === 0 ? (
              <div className="rv-src-empty">{L("Sem fonte ligada","No source connected")}</div>
            ) : avail.length === 1 ? (
              <div className="rv-src-single">{sourceName(avail[0])} <span>{L("· fonte única","· only source")}</span></div>
            ) : (
              <div className="rv-src-opts">
                {avail.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="rv-src-opt"
                    data-active={active === id || undefined}
                    onClick={() => setSource(metric.key, id)}
                  >
                    {sourceName(id)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function DispositivosScreen() {
  const { go, showToast } = useNav();
  const { L } = useLang();
  const { devices, setDevices } = useDevices();
  const [authorizing, setAuthorizing] = useState<DeviceId | null>(null);
  const [authStep, setAuthStep] = useState<"redirect" | "authorize">("redirect");

  function persist(next: DevicesMap) {
    setDevices(next);
  }

  function startConnect(id: DeviceId) {
    setAuthStep("redirect");
    setAuthorizing(id);
    setTimeout(() => setAuthStep("authorize"), 900);
  }

  function confirmAuthorize() {
    if (!authorizing) return;
    const id = authorizing;
    persist({ ...devices, [id]: { connected: true, lastSync: Date.now() } });
    setAuthorizing(null);
    showToast("Dispositivo ligado");
  }

  function disconnect(id: DeviceId) {
    persist({ ...devices, [id]: { connected: false, lastSync: null } });
    showToast("Dispositivo desligado");
  }

  function syncNow(id: DeviceId) {
    persist({ ...devices, [id]: { ...devices[id], lastSync: Date.now() } });
    showToast("Sincronizado");
  }

  const connectedCount = Object.values(devices).filter((d) => d.connected).length;
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

        <WhoopCard />

        <FonteSection />

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}>
          <h3>{L("Ligados","Connected")}</h3>
          <span style={{fontSize: 11, color: "var(--fg-50)"}}>{connectedCount} de {DEVICES.length}</span>
        </div>
        <div className="rv-devices">
          {DEVICES.filter((d) => devices[d.id].connected).map((d) => (
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
          {DEVICES.filter((d) => !devices[d.id].connected).map((d) => (
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

      {authorizing && authorizingDef && (
        <div className="rv-overlay" role="dialog" aria-modal="true">
          <div className="rv-modal">
            {authStep === "redirect" ? (
              <>
                <div className="rv-modal-spinner"/>
                <div className="rv-modal-title">{L("A abrir","Opening")} {authorizingDef.vendor}…</div>
                <div className="rv-modal-text">{L("A redirecionar para autorizar o acesso.","Redirecting to authorise access.")}</div>
              </>
            ) : (
              <>
                <div className="rv-modal-logo" style={{background: authorizingDef.tint, color: "#0b0d0f"}}>
                  {authorizingDef.initials || "•"}
                </div>
                <div className="rv-modal-title">{L("Autorizar Vivara Health","Authorise Vivara Health")}</div>
                <div className="rv-modal-text">
                  {L("A Vivara Health vai ter acesso a:","Vivara Health will have access to:")}<br/>
                  <span style={{color: "var(--fg-70)"}}>{authorizingDef.metrics}</span>
                </div>
                <div className="rv-modal-actions">
                  <button className="rv-device-btn" data-tone="ghost" onClick={() => setAuthorizing(null)}>{L("Cancelar","Cancel")}</button>
                  <button className="rv-device-btn" data-tone="primary" onClick={confirmAuthorize}>{L("Autorizar","Authorise")}</button>
                </div>
                <div className="rv-modal-fineprint">
                  {L("Está a entrar com a sua conta","You are signing in with your")} {authorizingDef.vendor}{L(". Os dados são partilhados de forma segura.", " account. Data is shared securely.")}
                </div>
              </>
            )}
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
  const { go, showToast } = useNav();
  const { L } = useLang();
  return (
    <SubScreen title={L("Privacidade e dados","Privacy & data")} onBack={() => go("profile")}>
      <div className="rv-sub-section-head">{L("Consentimentos ativos","Active consents")}</div>
      <div className="rv-toggle-list">
        <ToggleRow label={L("Partilha com o médico responsável","Share with responsible doctor")} sub={L("Equipa clínica","Clinical team")} defaultOn />
        <ToggleRow label={L("Partilha com nutricionista","Share with nutritionist")} sub={L("Equipa alargada","Extended team")} defaultOn />
        <ToggleRow label={L("Investigação anonimizada","Anonymised research")} sub={L("Dados sem identificação","De-identified data")} defaultOn />
        <ToggleRow label={L("Marketing personalizado","Personalised marketing")} />
      </div>
      <div className="rv-sub-section-head">{L("Os seus dados","Your data")}</div>
      <div className="rv-list">
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("exportar")}>
          <div className="rv-list-icon">{Icon.upload}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Exportar todos os dados","Export all data")}</span><span className="rv-list-sub">JSON · PDF</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
        <a className="rv-list-row" style={{cursor: "pointer", color: "var(--alert)"}} onClick={() => showToast(L("Pedido enviado. Receberá confirmação por email.","Request sent. You will receive email confirmation."))}>
          <div className="rv-list-icon" style={{color: "var(--alert)"}}>{Icon.shield}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Apagar conta e dados","Delete account and data")}</span><span className="rv-list-sub">{L("Irreversível · até 30 dias","Irreversible · up to 30 days")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
      </div>
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
  return (
    <SubScreen title={L("Exportar histórico","Export history")} onBack={() => go("profile")}>
      <div style={{padding: "0 20px", color: "var(--fg-60)", fontSize: 13, lineHeight: 1.5, marginBottom: 16}}>
        {L("Recebe um ficheiro com biomarcadores, planos, consultas e sintomas registados. Útil para segunda opinião ou portabilidade.","You receive a file with biomarkers, plans, appointments and logged symptoms. Useful for a second opinion or portability.")}
      </div>
      <div className="rv-list">
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => showToast(L("Exportação JSON enviada por email","JSON export sent by email"))}>
          <div className="rv-list-icon">{Icon.doc}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("JSON completo","Full JSON")}</span><span className="rv-list-sub">{L("Dados estruturados · ~ 84 KB","Structured data · ~ 84 KB")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => showToast(L("Relatório PDF enviado por email","PDF report sent by email"))}>
          <div className="rv-list-icon">{Icon.doc}</div>
          <div className="rv-list-text"><span className="rv-list-name">{L("Relatório PDF","PDF report")}</span><span className="rv-list-sub">{L("Resumo clínico · 12 páginas","Clinical summary · 12 pages")}</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
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
    case "registos":     return <RegistosScreen />;
    case "documento":    return <DocumentoScreen docId={docId} />;
    default:          return <HomeScreenV2 />;
  }
}

// ─── App Wrapper ─────────────────────────────────────
function AssistantFAB() {
  const { current, go } = useNav();
  const currentRoute = typeof current === "string" ? current : current.route;
  // Ecrãs com o seu próprio FAB local (mesma posição) escondem o FAB global,
  // caso contrário o assistente fica por cima e bloqueia o botão do ecrã.
  if (currentRoute === "assistente" || currentRoute === "data" || currentRoute === "sintomas") return null;
  return (
    <button className="rv-fab-global" onClick={() => go("assistente")} aria-label="Assistente Vivara">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
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

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setTimeout(() => {
      if (email.trim().toLowerCase() === LOGIN_EMAIL && pass === LOGIN_PASS) {
        try { sessionStorage.setItem(LOGIN_STORAGE_KEY, "1"); } catch { /* privado */ }
        onLogin();
      } else {
        setError(t("login.error"));
        setBusy(false);
      }
    }, 350);
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

        <div className="rv-login-foot">{t("login.foot")}</div>
      </div>
    </div>
  );
}

function AppV2Page() {
  const [route, setRoute] = useState<NavRoute>("home");
  const [authed, setAuthed] = useState(false);
  const [lang, setLangState] = useState<Lang>("pt");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doExchange = useServerFn(whoopExchange);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(LOGIN_STORAGE_KEY) === "1") setAuthed(true);
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
      .then((r) => { if (!r.ok && r.error && r.error !== "not_configured") setToastMsg(lang === "en" ? "Failed to connect Whoop" : "Falha ao ligar o Whoop"); })
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

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(LOGIN_STORAGE_KEY); } catch { /* modo privado */ }
    setAuthed(false);
    setRoute("home");
  }, []);

  // Dispositivos e fontes vivem aqui em cima porque são lidos em vários ecrãs
  // (Dispositivos escreve, home e Dados leem). Arrancam do valor por omissão
  // e só sincronizam com o localStorage depois de montar, para o HTML do
  // servidor e o do cliente coincidirem.
  const [devices, setDevicesState] = useState<DevicesMap>(DEFAULT_DEVICES);
  const [sources, setSourcesState] = useState<SourcesMap>({});
  useEffect(() => {
    setDevicesState(loadDevices());
    setSourcesState(loadSources());
  }, []);

  const setDevices = useCallback((d: DevicesMap) => {
    setDevicesState(d);
    saveDevices(d);
  }, []);

  const setSource = useCallback((k: MetricKey, s: SourceId) => {
    setSourcesState((prev) => {
      const next = { ...prev, [k]: s };
      try { localStorage.setItem(SOURCES_KEY, JSON.stringify(next)); } catch { /* modo privado */ }
      return next;
    });
  }, []);

  return (
    <div className="rv-root" data-theme="dark">
      <LangCtx.Provider value={{ lang, setLang, t, L }}>
        <NavCtx.Provider value={{ go: setRoute, current: route, showToast, logout }}>
        <DevicesCtx.Provider value={{ devices, setDevices, sources, setSource }}>
          <div className="rv-phone-shell">
            {authed ? (
              <>
                {renderScreen(route)}
                {toastMsg && <div className="rv-toast" role="status" aria-live="polite">{toastMsg}</div>}
                <AssistantFAB />
              </>
            ) : (
              <LoginScreen onLogin={() => setAuthed(true)} />
            )}
          </div>
        </DevicesCtx.Provider>
        </NavCtx.Provider>
      </LangCtx.Provider>
    </div>
  );
}
