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
  | "pesquisa" | "notificacoes" | "privacidade" | "equipa" | "laboratorios" | "farmacia" | "exportar";

type NavRoute = RouteId | { route: "marker"; marker: BioMarker };

interface NavCtxValue {
  go: (r: NavRoute) => void;
  current: NavRoute;
  showToast: (msg: string) => void;
  logout: () => void;
}

interface BioMarker {
  name: string;
  value: string;
  unit: string;
  target: string;
  targetRange: { min: number | null; max: number | null };
  delta: string;
  spark: number[];
  tone?: "alert" | "watch";
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
} as const;

// ─── Spark ───────────────────────────────────────────
function Spark({ pts, color = "currentColor", w = 80, h = 22 }: { pts: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((p) => h - 2 - ((p - min) / range) * (h - 4));
  const d = pts.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
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
const SCORE_LONGEVIDADE = 77;
const SCORE_PILARES: { key: string; valor: number; tone?: "watch" }[] = [
  { key: "score.cardio",      valor: 71 },
  { key: "score.composition", valor: 68, tone: "watch" },
  { key: "score.recovery",    valor: 82 },
];

function ScoreLongevidadeCard() {
  const { t } = useLang();
  const circumference = 2 * Math.PI * 27;
  const targetOffset = circumference * (1 - SCORE_LONGEVIDADE / 100);
  const [offset, setOffset] = useState(circumference);
  const [info, setInfo] = useState(false);
  const shown = useCountUp(SCORE_LONGEVIDADE);
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
          {SCORE_PILARES.map((p) => (
            <div key={p.key} className="rv-score-dim" data-tone={p.tone}>
              <div className="rv-score-dim-label">{t(p.key)}</div>
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
function WhoopHomeCard() {
  const { go } = useNav();
  const { L } = useLang();
  const getStatus = useServerFn(whoopStatus);
  const [status, setStatus] = useState<WhoopStatus | null>(null);

  useEffect(() => {
    getStatus()
      .then(setStatus)
      .catch(() => setStatus({ configured: false, connected: false, metrics: null }));
  }, [getStatus]);

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
const PLANO_HOJE = [
  { key: "plan.item1", subKey: "plan.item1sub", time: "08:00", free: false, done: true },
  { key: "plan.item2", subKey: "plan.item2sub", time: "08:00", free: false, done: true },
  { key: "plan.item3", subKey: "plan.item3sub", time: "19:00", free: false, done: false },
  { key: "plan.item4", subKey: "plan.item4sub", time: "22:30", free: false, done: false },
  { key: "plan.item5", subKey: "plan.item5sub", time: "",      free: true,  done: false },
];

function PlanoHoje() {
  const { showToast } = useNav();
  const { t } = useLang();
  const [done, setDone] = useState<boolean[]>(PLANO_HOJE.map((p) => p.done));
  const toggle = (i: number) => {
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      if (next[i]) showToast(`${t(PLANO_HOJE[i].key).split(" · ")[0]} · ${t("plan.done")}`);
      return next;
    });
  };
  return (
    <section className="rv-section">
      <div className="rv-section-head">
        <h3>{t("plan.title")}</h3>
        <span className="rv-plan-streak"><span className="rv-emoji">🔥</span> {t("plan.streak")}</span>
      </div>
      <div className="rv-plan">
        {PLANO_HOJE.map((p, i) => (
          <button key={p.key} type="button" className="rv-plan-row" data-done={done[i] || undefined}
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
    </section>
  );
}

// ─── 00 Home ─────────────────────────────────────────
function HomeScreenV2() {
  const { go } = useNav();
  const { t } = useLang();
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
        <WhoopHomeCard />

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
              {t("home.insightSource")}
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
                <span className="rv-signal-sub">{t("signal.deepSleepSub")}</span>
              </div>
              <span className="rv-signal-val">68 <span style={{color: "var(--fg-50)", fontSize: 11}}>min</span></span>
              <Spark pts={[60,72,54,68,80,52,68]} color="var(--lime)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.heart}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.hrv")}</span>
                <span className="rv-signal-sub">{t("signal.hrvSub")}</span>
              </div>
              <span className="rv-signal-val">42 <span style={{color: "var(--fg-50)", fontSize: 11}}>ms</span></span>
              <Spark pts={[48,52,46,40,38,44,42]} color="var(--watch)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.steps}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.steps")}</span>
                <span className="rv-signal-sub">{t("signal.stepsSub")}</span>
              </div>
              <span className="rv-signal-val">7,2k</span>
              <Spark pts={[6800,8200,5400,9100,7600,6900,7200]} color="var(--accent)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.zap}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">{t("signal.restHr")}</span>
                <span className="rv-signal-sub">{t("signal.restHrSub")}</span>
              </div>
              <span className="rv-signal-val">58 <span style={{color: "var(--fg-50)", fontSize: 11}}>bpm</span></span>
              <Spark pts={[62,60,58,57,59,56,58]} color="var(--lime)"/>
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
const BIOS_ALERT: BioMarker[] = [
  { name: "Estradiol",  value: "38",  unit: "pg/mL", target: "60–150", targetRange: { min: 60,   max: 150 }, delta: "↓ 36.7%", spark: [78,72,65,58,52,45,38],           tone: "alert" },
  { name: "ApoB",       value: "102", unit: "mg/dL", target: "≤ 80",   targetRange: { min: null, max: 80  }, delta: "↓ 7.3%",  spark: [125,120,115,110,108,105,102],     tone: "watch" },
  { name: "HbA1c",      value: "5.7", unit: "%",     target: "≤ 5.4",  targetRange: { min: null, max: 5.4 }, delta: "↓ 3.4%",  spark: [6.1,5.9,5.9,5.8,5.8,5.7,5.7],   tone: "watch" },
  { name: "LDL-C",      value: "118", unit: "mg/dL", target: "≤ 100",  targetRange: { min: null, max: 100 }, delta: "↓ 4.0%",  spark: [142,135,130,125,122,120,118],     tone: "watch" },
];

const BIOS_OK: BioMarker[] = [
  { name: "Vitamina D",      value: "48",   unit: "ng/mL",  target: "40–60",   targetRange: { min: 40,   max: 60   }, delta: "↑ 14%",  spark: [28,32,35,38,42,45,48] },
  { name: "HDL-C",           value: "62",   unit: "mg/dL",  target: "≥ 60",    targetRange: { min: 60,   max: null }, delta: "↑ 1.6%", spark: [60,61,60,62,61,62,62] },
  { name: "TSH",             value: "2.1",  unit: "mUI/L",  target: "0.5–2.5", targetRange: { min: 0.5,  max: 2.5  }, delta: "→",       spark: [2.2,2.1,2.0,2.1,2.1,2.1,2.1] },
  { name: "PCR-us",          value: "1.2",  unit: "mg/L",   target: "< 1.0",   targetRange: { min: null, max: 1.0  }, delta: "↓ 8%",   spark: [2.1,1.8,1.6,1.5,1.4,1.3,1.2], tone: "watch" },
  { name: "Glicose",         value: "98",   unit: "mg/dL",  target: "70–99",   targetRange: { min: 70,   max: 99   }, delta: "↓ 2%",   spark: [105,102,100,99,99,98,98] },
  { name: "Insulina",        value: "12.4", unit: "µU/mL",  target: "< 10",    targetRange: { min: null, max: 10   }, delta: "↓ 5%",   spark: [14.0,13.6,13.2,13.0,12.8,12.6,12.4], tone: "watch" },
  { name: "Triglicéridos",   value: "92",   unit: "mg/dL",  target: "< 100",   targetRange: { min: null, max: 100  }, delta: "↓ 6%",   spark: [110,105,100,98,95,93,92] },
  { name: "Colesterol total", value: "218", unit: "mg/dL",  target: "< 200",   targetRange: { min: null, max: 200  }, delta: "↓ 3%",   spark: [232,228,225,222,220,219,218], tone: "watch" },
  { name: "Homocisteína",    value: "6.4",  unit: "µmol/L", target: "< 8",     targetRange: { min: null, max: 8    }, delta: "→",       spark: [7.0,6.8,6.5,6.5,6.4,6.4,6.4] },
];

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
      <Spark pts={b.spark} color={sparkCol} w={90} h={26}/>
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
  const { t } = useLang();
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


        <div className="rv-bio-section-head" data-tone="alert">
          <span className="rv-dot"/>{t("data.offTarget")}
        </div>
        <div className="rv-bio-list">
          {BIOS_ALERT.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>

        <div className="rv-bio-section-head">
          <span className="rv-dot"/>{t("data.onTarget")}
        </div>
        <div className="rv-bio-list">
          {BIOS_OK.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>

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
  const m: BioMarker = marker ?? { name: "Estradiol", value: "38", unit: "pg/mL", target: "60–150", targetRange: { min: 60, max: 150 }, delta: "↓ 36.7%", spark: [78,72,65,58,52,45,38], tone: "alert" };
  const tone = m.tone || "ok";
  const col = tone === "alert" ? "var(--alert)" : tone === "watch" ? "var(--watch)" : "var(--lime)";
  const pts = m.spark;
  const min = Math.min(...pts) * 0.75;
  const max = Math.max(...pts) * 1.25;
  const W = 360, H = 180;
  const xs = pts.map((_, i) => 10 + (i / (pts.length - 1)) * (W - 20));
  const ys = pts.map((p) => H - 10 - ((p - min) / (max - min)) * (H - 20));
  const path = pts.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L ${xs[xs.length-1].toFixed(1)} ${H-10} L ${xs[0].toFixed(1)} ${H-10} Z`;
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
          <div className="rv-marker-hero-target">{L("alvo","target")} {m.target} · {t("marker.lastCollection")}</div>
        </div>

        <PeriodChips className="rv-marker-period" />


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

        <div className="rv-marker-context">
          <div className="rv-marker-context-head">
            <span className="rv-dot" data-tone={tone}/>{t("marker.contextHead")}
          </div>
          <div className="rv-marker-context-body">
            {m.name === "Estradiol"
              ? L("Tendência descendente consistente nos últimos 6 meses, compatível com transição peri-menopáusica. Pedido nova colheita até 10 mai para confirmar valor antes de iniciar plano de reposição.",
                  "Consistent downward trend over the last 6 months, compatible with peri-menopausal transition. New sample requested by 10 May to confirm the value before starting a replacement plan.")
              : m.name === "ApoB"
              ? L("Em descida progressiva desde o início da Berberina (jan 26). Manter plano actual e reavaliar em 8 semanas.",
                  "Progressively decreasing since Berberine started (Jan 26). Keep the current plan and reassess in 8 weeks.")
              : L("Valor em monitorização. Sem alteração ao plano nesta consulta.",
                  "Value under monitoring. No change to the plan at this appointment.")}
          </div>
        </div>

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
          <div className="rv-diary-label">{L("Sintomas", "Symptoms")} <span className="rv-diary-label-sub">{L("o que sentiu hoje", "what you felt today")}</span></div>
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
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.height")}</div><div className="rv-stat-value">168<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.weight")}</div><div className="rv-stat-value">71.2<span style={{fontSize: 10, color: "var(--fg-50)"}}>kg</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.imc")}</div><div className="rv-stat-value">25.2</div></div>
          <div className="rv-stat"><div className="rv-stat-label">{t("profile.waist")}</div><div className="rv-stat-value">82<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
        </div>

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
  { id: "apple-health", name: "Apple Health",        vendor: "Apple",      metrics: "Sono · HRV · passos · FC repouso · VO₂máx", initials: "",  tint: "#ffffff" },
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
  const getStatus = useServerFn(whoopStatus);
  const getAuthUrl = useServerFn(whoopAuthUrl);
  const doDisconnect = useServerFn(whoopDisconnect);
  const [status, setStatus] = useState<WhoopStatus | null>(null);
  const [busy, setBusy] = useState(false);

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

const STORAGE_KEY = "rv-devices-v1";
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
    return { ...DEFAULT_DEVICES, ...JSON.parse(raw) } as DevicesMap;
  } catch {
    return DEFAULT_DEVICES;
  }
}

function saveDevices(d: DevicesMap) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
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
  const [devices, setDevices] = useState<DevicesMap>(() => loadDevices());
  const [authorizing, setAuthorizing] = useState<DeviceId | null>(null);
  const [authStep, setAuthStep] = useState<"redirect" | "authorize">("redirect");

  function persist(next: DevicesMap) {
    setDevices(next);
    saveDevices(next);
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
function PesquisaScreen() {
  const { go } = useNav();
  const { L } = useLang();
  const [q, setQ] = useState("");
  const all = [...BIOS_ALERT, ...BIOS_OK];
  const term = q.trim().toLowerCase();
  const bios = term ? all.filter((b) => b.name.toLowerCase().includes(term)) : all;
  const consultas = [
    { label: "Revisão trimestral", date: "22 abr 2026" },
    { label: "Discussão sobre TRH", date: "12 mai 2026" },
    { label: "Revisão de resultados", date: "03 fev 2026" },
  ].filter((c) => !term || c.label.toLowerCase().includes(term));

  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("home")} aria-label={L("Voltar","Back")}>{Icon.back}</button>
        <div className="rv-header-title">{L("Pesquisar","Search")}</div>
        <div style={{width: 36}}/>
      </header>
      <div className="rv-body">
        <div style={{padding: "8px 20px 12px"}}>
          <input
            autoFocus
            className="rv-msg-compose-input"
            style={{width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", color: "var(--fg)", fontSize: 14, border: "1px solid rgba(255,255,255,0.08)"}}
            placeholder={L("Marcador, consulta, sintoma…","Marker, appointment, symptom…")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="rv-bio-section-head"><span className="rv-dot"/>{L("Marcadores","Markers")} · {bios.length}</div>
        <div className="rv-bio-list">
          {bios.length === 0 && <div style={{padding: "12px 20px", color: "var(--fg-50)", fontSize: 13}}>{L("Sem resultados.","No results.")}</div>}
          {bios.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>
        <div className="rv-bio-section-head" style={{marginTop: 12}}><span className="rv-dot"/>{L("Consultas","Appointments")} · {consultas.length}</div>
        {consultas.map((c, i) => (
          <div key={i} className="rv-past-row" onClick={() => go("consultas")} style={{cursor: "pointer"}}>
            <div className="rv-past-date"><div className="rv-past-day rv-mono">{c.date.split(" ")[0]}</div><div className="rv-past-month">{c.date.split(" ")[1]}</div></div>
            <div className="rv-past-meta"><div className="rv-past-label">{c.label}</div><div className="rv-past-sub">{L("Equipa clínica","Clinical team")}</div></div>
            <div className="rv-chev">{Icon.chev}</div>
          </div>
        ))}
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
    default:          return <HomeScreenV2 />;
  }
}

// ─── App Wrapper ─────────────────────────────────────
function AssistantFAB() {
  const { current, go } = useNav();
  const currentRoute = typeof current === "string" ? current : current.route;
  if (currentRoute === "assistente") return null;
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

  return (
    <div className="rv-root" data-theme="dark">
      <LangCtx.Provider value={{ lang, setLang, t, L }}>
        <NavCtx.Provider value={{ go: setRoute, current: route, showToast, logout }}>
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
        </NavCtx.Provider>
      </LangCtx.Provider>
    </div>
  );
}
