import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useContext, createContext, useRef, useCallback, useEffect, type ReactNode } from "react";
import { askAssistente } from "@/lib/assistente.functions";
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
const NavCtx = createContext<NavCtxValue>({ go: () => {}, current: "home", showToast: () => {} });
const useNav = () => useContext(NavCtx);

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

function BioAgeCard() {
  const shown = useCountUp(IDADE_BIOLOGICA);
  const [info, setInfo] = useState(false);
  const diff = IDADE_REAL - IDADE_BIOLOGICA;
  const younger = diff > 0;
  return (
    <>
      <div className="rv-bioage-card">
        <button type="button" className="rv-bioage-eyebrow rv-score-eyebrow-btn" onClick={() => setInfo(true)}>
          Idade biológica <span className="rv-info"><svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="1.8" r="1.1" fill="currentColor"/><path d="M5 4.4 V8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
        </button>
        <div className="rv-bioage-main">
          <div className="rv-bioage-num">{shown}<span className="rv-bioage-unit">anos</span></div>
          <span className="rv-bioage-badge" data-good={younger}>
            {younger ? "−" : "+"}{Math.abs(diff)} {Math.abs(diff) === 1 ? "ano" : "anos"}
          </span>
        </div>
        <div className="rv-bioage-sub">Idade biológica estimada a partir dos seus dados</div>
        <div className="rv-bioage-compare">
          <div className="rv-bioage-row">
            <span className="rv-bioage-row-label">Biológica</span>
            <div className="rv-bioage-bar"><div className="rv-bioage-fill" data-good="true" style={{width: `${(IDADE_BIOLOGICA / IDADE_REAL) * 100}%`}}/></div>
            <span className="rv-bioage-row-val">{IDADE_BIOLOGICA}</span>
          </div>
          <div className="rv-bioage-row">
            <span className="rv-bioage-row-label">Real</span>
            <div className="rv-bioage-bar"><div className="rv-bioage-fill" style={{width: "100%"}}/></div>
            <span className="rv-bioage-row-val">{IDADE_REAL}</span>
          </div>
        </div>
      </div>
      {info && (
        <InfoDrawer title="O que é a idade biológica?" onClose={() => setInfo(false)}>
          <p>Estima a "idade" do seu corpo a partir dos <strong>seus dados</strong> (análises, composição corporal e recuperação), em vez da idade do bilhete de identidade.</p>
          <p>Quando é <strong>mais baixa</strong> que a sua idade real, é um bom sinal — o seu corpo está a envelhecer mais devagar do que o esperado.</p>
          <div className="rv-drawer-note">É uma estimativa de acompanhamento. <strong>Não é um diagnóstico</strong> nem substitui a avaliação do seu médico.</div>
        </InfoDrawer>
      )}
    </>
  );
}

// ─── Score de longevidade ────────────────────────────
const SCORE_LONGEVIDADE = 77;
const SCORE_PILARES: { label: string; valor: number; tone?: "watch" }[] = [
  { label: "Cardio-metab.", valor: 71 },
  { label: "Composição",    valor: 68, tone: "watch" },
  { label: "Recuperação",   valor: 82 },
];

function ScoreLongevidadeCard() {
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
          Score de longevidade <span className="rv-info"><svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="1.8" r="1.1" fill="currentColor"/><path d="M5 4.4 V8.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
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
            <span className="rv-score-card-delta">↑ 2 esta semana</span>
          </div>
        </div>
        <div className="rv-score-card-disclaim">
          Indicador de acompanhamento pessoal — não é diagnóstico nem substitui o seu médico.
        </div>
        <div className="rv-score-breakdown">
          {SCORE_PILARES.map((p) => (
            <div key={p.label} className="rv-score-dim" data-tone={p.tone}>
              <div className="rv-score-dim-label">{p.label}</div>
              <div className="rv-score-dim-val">{p.valor}</div>
              <div className="rv-score-dim-bar"><div className="rv-score-dim-fill" style={{width: `${p.valor}%`}}/></div>
            </div>
          ))}
        </div>
      </div>
      {info && (
        <InfoDrawer title="O que é o Score de longevidade?" onClose={() => setInfo(false)}>
          <p>É um indicador pessoal de <strong>0 a 100</strong> que resume a sua evolução das últimas semanas. Junta três áreas, com peso semelhante:</p>
          <ul>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--lime)"}}/><span><strong>Cardio-metabólica</strong> — análises de sangue (glicose, lípidos, inflamação).</span></li>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--watch)"}}/><span><strong>Composição</strong> — peso, massa muscular e massa gorda.</span></li>
            <li><span className="rv-drawer-pillar-dot" style={{background: "var(--accent)"}}/><span><strong>Recuperação</strong> — sono, HRV e atividade do seu wearable.</span></li>
          </ul>
          <p>Sobe quando os seus hábitos e resultados melhoram. É calculado a partir dos dados que vai carregando e sincronizando.</p>
          <div className="rv-drawer-note">Serve para acompanhamento e motivação. <strong>Não é um diagnóstico</strong> nem substitui o seu médico — em caso de dúvida, fale com a sua equipa clínica.</div>
        </InfoDrawer>
      )}
    </>
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
  const tabs = [
    { id: "home",     label: "Início",    icon: Icon.home },
    { id: "data",     label: "Dados",     icon: Icon.data },
    { id: "messages", label: "Mensagens", icon: Icon.chat, badge: 2, badgeTone: "alert" as const },
    { id: "profile",  label: "Perfil",    icon: Icon.profile },
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
  { name: "Vitamina D3 4000 UI · Ómega-3", sub: "com pequeno-almoço",           time: "08:00", done: true },
  { name: "Metformina 500 mg",             sub: "com pequeno-almoço",           time: "08:00", done: true },
  { name: "Berberina 500 mg",              sub: "antes do jantar",              time: "19:00", done: false },
  { name: "Magnésio 400 mg",               sub: "ao deitar",                    time: "22:30", done: false },
  { name: "Treino de força · 35 min",      sub: "recomendado pela equipa clínica",  time: "livre", done: false },
];

function PlanoHoje() {
  const { showToast } = useNav();
  const [done, setDone] = useState<boolean[]>(PLANO_HOJE.map((p) => p.done));
  const toggle = (i: number) => {
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      if (next[i]) showToast(`${PLANO_HOJE[i].name.split(" · ")[0]} · marcado como feito`);
      return next;
    });
  };
  return (
    <section className="rv-section">
      <div className="rv-section-head">
        <h3>Plano de hoje</h3>
        <span className="rv-plan-streak"><span className="rv-emoji">🔥</span> 12 dias</span>
      </div>
      <div className="rv-plan">
        {PLANO_HOJE.map((p, i) => (
          <button key={p.name} type="button" className="rv-plan-row" data-done={done[i] || undefined}
            onClick={() => toggle(i)} aria-pressed={done[i]}>
            <div className="rv-plan-check">{done[i] ? "✓" : ""}</div>
            <div>
              <div className="rv-plan-name">{p.name}</div>
              <div className="rv-plan-sub">{p.sub}</div>
            </div>
            <div className="rv-plan-time">{p.time}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── 00 Home ─────────────────────────────────────────
function HomeScreenV2() {
  const { go } = useNav();
  return (
    <div className="rv-screen">
      <StatusBar />

      <div className="rv-home-greet">
        <div className="rv-home-greet-text">
          <div className="rv-home-greet-hi">Olá</div>
          <div className="rv-home-greet-name">A sua saúde</div>
        </div>
        <button className="rv-home-avatar" onClick={() => go("profile")} aria-label="Perfil">
          <svg width="18" height="18" viewBox="0 0 22 22"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/><path d="M3 19 a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>
        </button>
      </div>

      <div className="rv-body">
        <BioAgeCard />
        <ScoreLongevidadeCard />

        <div className="rv-actions">
          <button className="rv-action" data-accent="lime" onClick={() => go("upload")}>
            <span className="rv-action-icon">{Icon.upload}</span>
            <span>Carregar</span>
          </button>
          <button className="rv-action" data-accent="blue" onClick={() => go("data")}>
            <span className="rv-action-icon">{Icon.bars}</span>
            <span>Análises</span>
          </button>
          <button className="rv-action" data-accent="violet" onClick={() => go("alerts")}>
            <span className="rv-action-icon">{Icon.doc}</span>
            <span>Resumo</span>
          </button>
        </div>

        <section className="rv-section">
          <div className="rv-section-head">
            <h3>Sinal de hoje</h3>
            <a style={{cursor: "pointer"}} onClick={() => go("diary")}>Histórico</a>
          </div>
          <div className="rv-insight">
            <div className="rv-insight-head">
              <span className="rv-insight-head-dot"/>Observação · 27 abr
            </div>
            <div className="rv-insight-text">
              O teu HRV ficou <strong>18% abaixo</strong> da média de 12 meses. Ontem dormiste <strong>5h42</strong>, menos 1h12 que a tua mediana.
            </div>
            <div className="rv-insight-foot">
              Fonte: Apple Watch · sincronizado há 4 min
            </div>
          </div>
        </section>

        <section className="rv-section">
          <div className="rv-section-head">
            <h3>Últimos 7 dias</h3>
            <a style={{cursor: "pointer"}} onClick={() => go("data")}>Ver dados</a>
          </div>
          <div className="rv-signals">
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.moon}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">Sono profundo</span>
                <span className="rv-signal-sub">Mediana 7 dias</span>
              </div>
              <span className="rv-signal-val">68 <span style={{color: "var(--fg-50)", fontSize: 11}}>min</span></span>
              <Spark pts={[60,72,54,68,80,52,68]} color="var(--lime)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.heart}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">HRV</span>
                <span className="rv-signal-sub">Variabilidade FC noturna</span>
              </div>
              <span className="rv-signal-val">42 <span style={{color: "var(--fg-50)", fontSize: 11}}>ms</span></span>
              <Spark pts={[48,52,46,40,38,44,42]} color="var(--watch)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.steps}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">Passos</span>
                <span className="rv-signal-sub">Total diário · média</span>
              </div>
              <span className="rv-signal-val">7,2k</span>
              <Spark pts={[6800,8200,5400,9100,7600,6900,7200]} color="var(--accent)"/>
            </div>
            <div className="rv-signal">
              <div className="rv-signal-icon">{Icon.zap}</div>
              <div className="rv-signal-meta">
                <span className="rv-signal-name">FC repouso</span>
                <span className="rv-signal-sub">Mediana matinal</span>
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
              <div className="rv-next-eyebrow">Próxima consulta</div>
              <div className="rv-next-name">Consulta de acompanhamento</div>
              <div className="rv-next-sub">14:30 · Discussão sobre TRH personalizada</div>
            </div>
          </div>
        </section>

        <section className="rv-section">
          <div className="rv-diary-prompt" onClick={() => go("diary")}>
            <div className="rv-diary-prompt-text">
              <div className="rv-diary-prompt-title">Como te sentes hoje?</div>
              <div className="rv-diary-prompt-sub">Regista humor, energia e sintomas. Visto pela tua equipa clínica.</div>
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
  { name: "Estradiol",  value: "38",  unit: "pg/mL", target: "alvo 60–150", targetRange: { min: 60,   max: 150 }, delta: "↓ 36.7%", spark: [78,72,65,58,52,45,38],           tone: "alert" },
  { name: "ApoB",       value: "102", unit: "mg/dL", target: "alvo ≤ 80",   targetRange: { min: null, max: 80  }, delta: "↓ 7.3%",  spark: [125,120,115,110,108,105,102],     tone: "watch" },
  { name: "HbA1c",      value: "5.7", unit: "%",     target: "alvo ≤ 5.4",  targetRange: { min: null, max: 5.4 }, delta: "↓ 3.4%",  spark: [6.1,5.9,5.9,5.8,5.8,5.7,5.7],   tone: "watch" },
  { name: "LDL-C",      value: "118", unit: "mg/dL", target: "alvo ≤ 100",  targetRange: { min: null, max: 100 }, delta: "↓ 4.0%",  spark: [142,135,130,125,122,120,118],     tone: "watch" },
];

const BIOS_OK: BioMarker[] = [
  { name: "Vitamina D",      value: "48",   unit: "ng/mL",  target: "alvo 40–60",   targetRange: { min: 40,   max: 60   }, delta: "↑ 14%",  spark: [28,32,35,38,42,45,48] },
  { name: "HDL-C",           value: "62",   unit: "mg/dL",  target: "alvo ≥ 60",    targetRange: { min: 60,   max: null }, delta: "↑ 1.6%", spark: [60,61,60,62,61,62,62] },
  { name: "TSH",             value: "2.1",  unit: "mUI/L",  target: "alvo 0.5–2.5", targetRange: { min: 0.5,  max: 2.5  }, delta: "→",       spark: [2.2,2.1,2.0,2.1,2.1,2.1,2.1] },
  { name: "PCR-us",          value: "1.2",  unit: "mg/L",   target: "alvo < 1.0",   targetRange: { min: null, max: 1.0  }, delta: "↓ 8%",   spark: [2.1,1.8,1.6,1.5,1.4,1.3,1.2], tone: "watch" },
  { name: "Glicose",         value: "98",   unit: "mg/dL",  target: "alvo 70–99",   targetRange: { min: 70,   max: 99   }, delta: "↓ 2%",   spark: [105,102,100,99,99,98,98] },
  { name: "Insulina",        value: "12.4", unit: "µU/mL",  target: "alvo < 10",    targetRange: { min: null, max: 10   }, delta: "↓ 5%",   spark: [14.0,13.6,13.2,13.0,12.8,12.6,12.4], tone: "watch" },
  { name: "Triglicéridos",   value: "92",   unit: "mg/dL",  target: "alvo < 100",   targetRange: { min: null, max: 100  }, delta: "↓ 6%",   spark: [110,105,100,98,95,93,92] },
  { name: "Colesterol total", value: "218", unit: "mg/dL",  target: "alvo < 200",   targetRange: { min: null, max: 200  }, delta: "↓ 3%",   spark: [232,228,225,222,220,219,218], tone: "watch" },
  { name: "Homocisteína",    value: "6.4",  unit: "µmol/L", target: "alvo < 8",     targetRange: { min: null, max: 8    }, delta: "→",       spark: [7.0,6.8,6.5,6.5,6.4,6.4,6.4] },
];

function BioRow({ b }: { b: BioMarker }) {
  const { go } = useNav();
  const valTone = b.tone || "ok";
  const sparkCol = b.tone === "alert" ? "var(--alert)" : b.tone === "watch" ? "var(--watch)" : "var(--lime)";
  return (
    <div className="rv-bio-row" data-status={valTone} onClick={() => go({ route: "marker", marker: b })} style={{cursor: "pointer"}}>
      <div className="rv-bio-row-meta">
        <div className="rv-bio-row-name">{b.name}</div>
        <div className="rv-bio-row-target">{b.target}</div>
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
  const [p, setP] = useState("1A");
  const opts = ["3M", "6M", "1A", "2A", "Tudo"];
  return (
    <div className={className}>
      {opts.map((o) => (
        <button key={o} className="rv-period-chip" data-active={p === o ? "true" : undefined} onClick={() => setP(o)}>{o}</button>
      ))}
    </div>
  );
}

// ─── 01 Dados ────────────────────────────────────────
function DadosScreen() {
  const { go, showToast } = useNav();
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">Dados</div>
        <button className="rv-header-btn" onClick={() => go("pesquisa")} aria-label="Pesquisar">{Icon.search}</button>
      </header>

      <div className="rv-body">
        <PeriodChips />


        <div className="rv-bio-section-head" data-tone="alert">
          <span className="rv-dot"/>Fora do alvo · 4
        </div>
        <div className="rv-bio-list">
          {BIOS_ALERT.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>

        <div className="rv-bio-section-head">
          <span className="rv-dot"/>Dentro do alvo · 9
        </div>
        <div className="rv-bio-list">
          {BIOS_OK.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>

        <div style={{height: 100}}/>
      </div>

      <button className="rv-fab" aria-label="Carregar análise" onClick={() => go("upload")}>{Icon.plus}</button>
      <TabBar active="data" />
    </div>
  );
}

// ─── Marker Detail ───────────────────────────────────
function MarkerDetail({ marker }: { marker?: BioMarker }) {
  const { go, showToast } = useNav();
  const m: BioMarker = marker ?? { name: "Estradiol", value: "38", unit: "pg/mL", target: "alvo 60–150", targetRange: { min: 60, max: 150 }, delta: "↓ 36.7%", spark: [78,72,65,58,52,45,38], tone: "alert" };
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
          <div className="rv-marker-hero-target">{m.target} · última colheita 22 abr 2026</div>
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
            <span className="rv-dot" data-tone={tone}/>Contexto clínico
          </div>
          <div className="rv-marker-context-body">
            {m.name === "Estradiol"
              ? <>Tendência descendente consistente nos últimos 6 meses, compatível com transição peri-menopáusica. Pedido nova colheita até 10 mai para confirmar valor antes de iniciar plano de reposição.</>
              : m.name === "ApoB"
              ? <>Em descida progressiva desde o início da Berberina (jan 26). Manter plano actual e reavaliar em 8 semanas.</>
              : <>Valor em monitorização. Sem alteração ao plano nesta consulta.</>}
          </div>
        </div>

        <div className="rv-marker-history">
          <div className="rv-section-head" style={{margin: "0 0 8px"}}>
            <h3>Histórico de colheitas</h3>
            <a>Ver tudo</a>
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
            <strong>Reanálise pedida pela equipa clínica</strong>
            <span>Repetir colheita até 10 mai 2026. A marcação é feita diretamente no laboratório.</span>
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
  const { go, showToast } = useNav();
  const [tab, setTab] = useState<"medicos" | "lembretes">("medicos");
  const [calAdded, setCalAdded] = useState(false);
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">Avisos</div>
        <button className="rv-header-btn" onClick={() => go("profile")} aria-label="Perfil">{Icon.settings}</button>
      </header>

      <div className="rv-body">
        <div className="rv-avisos-tabs">
          <button className="rv-avisos-tab" data-active={tab === "medicos"} onClick={() => setTab("medicos")}>
            Médicos <span className="rv-pill-count">2</span>
          </button>
          <button className="rv-avisos-tab" data-active={tab === "lembretes"} onClick={() => setTab("lembretes")}>
            Lembretes <span className="rv-pill-count" data-muted={tab !== "lembretes"}>3</span>
          </button>
        </div>

        {tab === "medicos" ? (
          <>
            <article className="rv-aviso" data-tone="alert">
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 V11 M9 14 V14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">Há 12 min · Equipa clínica</div>
                <div className="rv-aviso-title">Pedido de reanálise · Estradiol</div>
                <div className="rv-aviso-body">Repetir colheita até <strong>10 mai 2026</strong>. A tua equipa clínica pediu nova medição para confirmar a tendência descendente.</div>
                <div className="rv-aviso-cta" style={{color: "var(--fg-50)"}}>Faz a colheita no teu laboratório habitual</div>
              </div>
              <div className="rv-aviso-unread"/>
            </article>

            <article className="rv-aviso" data-tone="info" onClick={() => go("summary")} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M9 8 V13 M9 5 V5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">Hoje · 09:30 · Plano</div>
                <div className="rv-aviso-title">Resumo da consulta de 22 abr</div>
                <div className="rv-aviso-body">Plano metabólico atualizado pela equipa clínica: manter Metformina, aumentar Magnésio para 400 mg ao deitar.</div>
                <div className="rv-aviso-cta">Abrir resumo →</div>
              </div>
            </article>

            <article className="rv-aviso" data-tone="success" onClick={() => go("data")} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5.5 9 L8 11.5 L12.5 6.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">Ontem · 16:42</div>
                <div className="rv-aviso-title">Análise importada com sucesso</div>
                <div className="rv-aviso-body">14 marcadores extraídos do PDF Synlab. A tua equipa clínica foi notificada.</div>
                <div className="rv-aviso-cta" style={{color: "var(--ok)"}}>Ver dados →</div>
              </div>
            </article>
          </>
        ) : (
          <>
            <article className="rv-aviso">
              <div className="rv-aviso-icon">{Icon.pill}</div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">Hoje · 19:00 (em 4h)</div>
                <div className="rv-aviso-title">Berberina 500 mg</div>
                <div className="rv-aviso-body">Antes do jantar. Faltam 18 dias na embalagem atual.</div>
                <div className="rv-aviso-cta">Marcar como tomado →</div>
              </div>
            </article>
            <article className="rv-aviso">
              <div className="rv-aviso-icon">{Icon.pill}</div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">Hoje · 22:30 (em 7h)</div>
                <div className="rv-aviso-title">Magnésio 400 mg</div>
                <div className="rv-aviso-body">Ao deitar. Nova dose conforme plano de 22 abr.</div>
              </div>
            </article>
            <article className="rv-aviso" onClick={() => setCalAdded(true)} style={{cursor: "pointer"}}>
              <div className="rv-aviso-icon">
                <svg width="18" height="18" viewBox="0 0 18 18"><rect x="3" y="4" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 8 H15 M6 2 V5 M12 2 V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="rv-aviso-text">
                <div className="rv-aviso-time">12 mai · 14:30</div>
                <div className="rv-aviso-title">Próxima consulta</div>
                <div className="rv-aviso-body">Clínica Lumiar · TRH personalizada.</div>
                <div className="rv-aviso-cta" style={{color: calAdded ? "var(--lime)" : undefined}}>
                  {calAdded ? "✓ Adicionado ao calendário" : "Adicionar ao calendário →"}
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
  const [input, setInput] = useState("");
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
        <button className="rv-header-btn" onClick={() => go("consultas")} aria-label="Consultas">{Icon.cal}</button>
      </header>

      <div className="rv-body rv-msg-body">
        <div className="rv-msg-day">Hoje</div>

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

        <div style={{height: 16}}/>
      </div>

      <div className="rv-msg-compose">
        <button className="rv-msg-compose-attach" onClick={() => showToast("Anexo · imagem.jpg")} aria-label="Anexar">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 4 V14 M4 9 H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <input className="rv-msg-compose-input" placeholder="Mensagem para a Dra. Sofia…"
          value={input} onChange={(e) => setInput(e.target.value)}/>
        <button
          className="rv-msg-compose-send"
          data-active={input.length > 0}
          aria-label="Enviar"
          onClick={() => {
            if (!input.trim()) return;
            setInput("");
            showToast("Mensagem enviada");
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

function AssistenteScreen() {
  const { go } = useNav();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: ASSISTANT_INTRO },
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
            <div className="rv-msg-header-name">Assistente Vivara</div>
            <div className="rv-msg-header-status">Os teus dados, ao alcance</div>
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
          placeholder="Pergunta sobre os teus dados…"
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
  const { go, showToast } = useNav();
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
  const symptomList = ["Afrontamentos","Insónia","Cefaleia","Ansiedade","Dor articular","Dor abdominal","Cansaço","Névoa mental","Palpitações","Suores noturnos"];

  if (saved) {
    return (
      <div className="rv-screen">
        <StatusBar />
        <header className="rv-header">
          <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
          <div className="rv-header-title">Diário</div>
          <div style={{width: 36}}/>
        </header>
        <div className="rv-body">
          <div className="rv-schedule-done">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-import-title">Registo guardado</div>
            <div className="rv-import-sub">A tua equipa clínica verá esta entrada antes da próxima consulta.</div>
            <div className="rv-schedule-tickets">
              <div className="rv-schedule-ticket"><span>Humor · {moodFaces[mood]}</span><span className="rv-mono" style={{color: "var(--fg-50)"}}>27 abr</span></div>
              <div className="rv-schedule-ticket"><span>Energia</span><span className="rv-mono">{energy + 1}/5</span></div>
              <div className="rv-schedule-ticket"><span>Sintomas</span><span className="rv-mono">{symptoms.size}</span></div>
            </div>
            <button className="rv-cta-primary" onClick={() => go("home")}>Voltar ao início</button>
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
        <div className="rv-header-title">Diário</div>
        <button className="rv-header-btn" onClick={() => go("consultas")} aria-label="Consultas">{Icon.cal}</button>
      </header>

      <div className="rv-body">
        <div className="rv-diary-eyebrow">Hoje · 27 abril</div>
        <div className="rv-diary-title">Como te sentes?</div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">Humor</div>
          <div className="rv-mood-row">
            {moodFaces.map((f, i) => (
              <button key={i} className="rv-mood-face" data-active={mood === i} onClick={() => setMood(i)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">Energia</div>
          <div className="rv-energy-row">
            {Array.from({length: 5}).map((_, i) => (
              <button key={i} className="rv-energy-dot" data-active={i <= energy} onClick={() => setEnergy(i)}/>
            ))}
            <span className="rv-energy-label">{["muito baixa","baixa","média","boa","alta"][energy]}</span>
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">Sono</div>
          <div className="rv-diary-pills">
            {([["bad","Mau"],["so-so","Médio"],["good","Bom"],["great","Ótimo"]] as [string,string][]).map(([v, l]) => (
              <button key={v} className="rv-diary-pill" data-active={sleep === v} onClick={() => setSleep(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">Sintomas <span className="rv-diary-label-sub">o que sentiste hoje</span></div>
          <div className="rv-diary-chips">
            {symptomList.map((s) => (
              <button key={s} className="rv-diary-chip" data-active={symptoms.has(s.toLowerCase())} onClick={() => toggle(s.toLowerCase())}>
                {symptoms.has(s.toLowerCase()) ? "✓ " : "+ "}{s}
              </button>
            ))}
          </div>
        </div>

        <div className="rv-diary-section">
          <div className="rv-diary-label">Nota · opcional</div>
          <textarea className="rv-diary-textarea" placeholder="Algo que queres que a equipa clínica saiba?"
            value={note} onChange={(e) => setNote(e.target.value)} rows={3}/>
        </div>

        <button className="rv-cta-primary" onClick={() => setSaved(true)}>Guardar registo</button>
        <div style={{height: 24}}/>
      </div>
    </div>
  );
}

// ─── Consultas ───────────────────────────────────────
function ConsultasScreen() {
  const { go, showToast } = useNav();
  const past = [
    { date: "22 abr 2026", label: "Revisão trimestral",  duration: "45 min", who: "Equipa clínica", changes: 3 },
    { date: "03 fev 2026", label: "Revisão de resultados", duration: "30 min", who: "Equipa clínica", changes: 1 },
    { date: "10 dez 2025", label: "Primeira consulta",    duration: "75 min", who: "Equipa clínica", changes: 4 },
  ];
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("home")}>{Icon.back}</button>
        <div className="rv-header-title">Consultas</div>
        <div style={{width: 36}} />
      </header>

      <div className="rv-body">
        <div className="rv-section-head" style={{margin: "0 20px 8px"}}><h3>Próxima</h3></div>
        <div className="rv-upcoming-card">
          <div className="rv-upcoming-head">
            <div className="rv-upcoming-date">
              <div className="rv-upcoming-day">12</div>
              <div className="rv-upcoming-month">Mai</div>
            </div>
            <div className="rv-upcoming-meta">
              <div className="rv-upcoming-title">Discussão sobre TRH personalizada</div>
              <div className="rv-upcoming-when">14:30 · Clínica Lumiar · 45 min</div>
              <div className="rv-upcoming-who">Equipa clínica · Clínica Lumiar</div>
            </div>
          </div>
          <div className="rv-upcoming-prep">
            <div className="rv-upcoming-prep-head">Antes da consulta</div>
            <div className="rv-upcoming-prep-row" data-done="true">
              <span className="rv-upcoming-check">✓</span>
              <span>Plano de hoje (12 dias seguidos)</span>
            </div>
            <div className="rv-upcoming-prep-row" data-done="false">
              <span className="rv-upcoming-check"/>
              <span>Reanalisar Estradiol</span>
              <span className="rv-upcoming-prep-cta" style={{color: "var(--fg-50)", cursor: "default"}}>até 10 mai</span>
            </div>
            <div className="rv-upcoming-prep-row" data-done="false">
              <span className="rv-upcoming-check"/>
              <span>Registar diário (3 das últimas 7 noites)</span>
              <span className="rv-upcoming-prep-cta" onClick={() => go("diary")}>Abrir</span>
            </div>
          </div>
        </div>

        <div className="rv-section-head" style={{margin: "16px 20px 8px"}}>
          <h3>Anteriores</h3>
          
        </div>
        {past.map((c, i) => (
          <div key={i} className="rv-past-row" onClick={() => i === 0 ? go("summary") : undefined} style={{cursor: "pointer"}}>
            <div className="rv-past-date">
              <div className="rv-past-day rv-mono">{c.date.split(" ")[0]}</div>
              <div className="rv-past-month">{c.date.split(" ")[1]} {c.date.split(" ")[2]}</div>
            </div>
            <div className="rv-past-meta">
              <div className="rv-past-label">{c.label}</div>
              <div className="rv-past-sub">{c.who} · {c.duration} · {c.changes} alterações no plano</div>
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
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("alerts")}>{Icon.back}</button>
        <div className="rv-header-title">Consulta · 22 abr</div>
        <button className="rv-header-btn" onClick={() => shareNative({ title: "Consulta · 22 abr", text: "Resumo da consulta de 22 abr (Vivara)", toast: showToast })} aria-label="Partilhar">{Icon.share}</button>
      </header>

      <div className="rv-body">
        <div className="rv-summary-hero">
          <div className="rv-summary-doctor">
            <div className="rv-summary-avatar">SC</div>
            <div>
              <div className="rv-summary-name">Equipa clínica</div>
              <div className="rv-summary-sub">Medicina Interna · Lumiar · 45 min</div>
            </div>
          </div>
          <div className="rv-summary-quote">
            "Maria, vamos manter o plano metabólico actual mas ajustar magnésio. Quero repetir Estradiol antes de discutir TRH."
          </div>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">Plano actualizado</div>
          <div className="rv-summary-plan">
            <div className="rv-summary-plan-row" data-tag="keep"><span className="rv-summary-plan-tag">manter</span><span>Metformina 500 mg · pequeno-almoço</span></div>
            <div className="rv-summary-plan-row" data-tag="change"><span className="rv-summary-plan-tag">alterar</span><span>Magnésio 200 → <strong>400 mg</strong> ao deitar</span></div>
            <div className="rv-summary-plan-row" data-tag="keep"><span className="rv-summary-plan-tag">manter</span><span>Berberina 500 mg · antes do jantar</span></div>
            <div className="rv-summary-plan-row" data-tag="new"><span className="rv-summary-plan-tag">novo</span><span>Reanálise de Estradiol · até 10 mai</span></div>
          </div>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">Notas clínicas</div>
          <ul className="rv-summary-notes">
            <li>Sintomatologia de afrontamentos noturnos referida pela utente nas últimas 3 semanas.</li>
            <li>Tendência descendente de Estradiol nos últimos 6 meses (78→38 pg/mL).</li>
            <li>HbA1c estável em 5.7%, ApoB em descida progressiva.</li>
            <li>Adesão referida ao plano de suplementação: boa.</li>
          </ul>
        </div>

        <div className="rv-summary-section">
          <div className="rv-summary-section-head">Próximos passos</div>
          <div className="rv-summary-steps">
            <div className="rv-summary-step"><span className="rv-summary-step-when">10 mai</span><span>Colheita Estradiol</span></div>
            <div className="rv-summary-step"><span className="rv-summary-step-when">12 mai · 14:30</span><span>Consulta de follow-up — discussão TRH</span></div>
          </div>
        </div>

        <div className="rv-info-note">
          <strong>Reanálise pedida</strong>
          <span>Faz a colheita de Estradiol até 10 mai no teu laboratório habitual. Não precisas de marcar nada na app.</span>
        </div>
        <button className="rv-cta-ghost" onClick={() => go("alerts")}>Voltar a avisos</button>
        <div style={{height: 24}}/>
      </div>
    </div>
  );
}

// ─── Schedule Analysis ───────────────────────────────
function ScheduleAnalysis() {
  const { go } = useNav();
  const [step, setStep] = useState<"pick" | "done">("pick");
  const [lab, setLab] = useState("synlab");
  const [date, setDate] = useState("06 mai · 08:15");
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <button className="rv-header-btn" onClick={() => go("alerts")}>{Icon.back}</button>
        <div className="rv-header-title">Marcar reanálise</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        {step === "pick" ? (
          <>
            <div className="rv-schedule-eyebrow">A pedido da equipa clínica</div>
            <div className="rv-schedule-title">Reanálise · Estradiol</div>
            <div className="rv-schedule-sub">Repetir até <strong>10 mai 2026</strong>. Confirma laboratório e hora.</div>

            <div className="rv-schedule-section-head">Laboratório</div>
            <div className="rv-schedule-options">
              {[
                { id: "synlab", name: "Synlab · Lumiar",             meta: "1.2 km · 08:00–12:00", price: "comparticipado" },
                { id: "cuf",    name: "CUF Descobertas",             meta: "3.4 km · 07:30–11:00", price: "32 €" },
                { id: "ipo",    name: "Joaquim Chaves · Saldanha",   meta: "5.1 km · 08:00–13:00", price: "comparticipado" },
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

            <div className="rv-schedule-section-head">Horário disponível</div>
            <div className="rv-schedule-slots">
              {["04 mai · 07:45","05 mai · 08:00","06 mai · 08:15","07 mai · 09:30","09 mai · 08:00"].map(s => (
                <button key={s} className="rv-schedule-slot" data-active={date === s} onClick={() => setDate(s)}>{s}</button>
              ))}
            </div>

            <div className="rv-schedule-note">
              <span className="rv-dot"/>Em jejum 8h · sem actividade física vigorosa nas 24h anteriores
            </div>

            <button className="rv-cta-primary" onClick={() => setStep("done")}>Confirmar marcação</button>
          </>
        ) : (
          <div className="rv-schedule-done">
            <div className="rv-import-mark">
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--lime)"/><path d="M9 16 L14 21 L23 11" stroke="#0b0d0f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-import-title">Marcação confirmada</div>
            <div className="rv-import-sub">Reanálise de Estradiol<br/>{date} · Synlab Lumiar</div>
            <div className="rv-schedule-tickets">
              <div className="rv-schedule-ticket"><span>Adicionado ao calendário</span><span style={{color: "var(--lime)"}}>✓</span></div>
              <div className="rv-schedule-ticket"><span>Lembrete 24h antes</span><span style={{color: "var(--lime)"}}>✓</span></div>
              <div className="rv-schedule-ticket"><span>Equipa clínica notificada</span><span style={{color: "var(--lime)"}}>✓</span></div>
            </div>
            <button className="rv-cta-primary" onClick={() => go("home")}>Voltar ao início</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Perfil ──────────────────────────────────────────
function PerfilScreen() {
  const { go, showToast } = useNav();
  return (
    <div className="rv-screen">
      <StatusBar />
      <header className="rv-header">
        <div style={{width: 36}}/>
        <div className="rv-header-title">Perfil</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-profile-hero">
          <div className="rv-profile-avatar">MA</div>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="rv-profile-name">Maria Antunes</div>
            <div className="rv-profile-sub">42 anos · Pré-menopausa</div>
            <div className="rv-profile-care">Programa metabólico · Clínica Lumiar</div>
          </div>
        </div>

        <div className="rv-stats">
          <div className="rv-stat"><div className="rv-stat-label">Altura</div><div className="rv-stat-value">168<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">Peso</div><div className="rv-stat-value">71.2<span style={{fontSize: 10, color: "var(--fg-50)"}}>kg</span></div></div>
          <div className="rv-stat"><div className="rv-stat-label">IMC</div><div className="rv-stat-value">25.2</div></div>
          <div className="rv-stat"><div className="rv-stat-label">Cintura</div><div className="rv-stat-value">82<span style={{fontSize: 10, color: "var(--fg-50)"}}>cm</span></div></div>
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>Objectivos clínicos</h3><span style={{fontSize: 11, color: "var(--fg-50)"}}>Definidos pela equipa clínica</span></div>
        <div className="rv-goals">
          <div className="rv-goal" data-tone="watch"><span className="rv-goal-name">HbA1c &lt; 5.4 %</span><span className="rv-goal-state">5.7 → alvo</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "55%"}}/></div></div>
          <div className="rv-goal" data-tone="watch"><span className="rv-goal-name">ApoB &lt; 80 mg/dL</span><span className="rv-goal-state">102 → alvo</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "30%"}}/></div></div>
          <div className="rv-goal"><span className="rv-goal-name">Vit. D &gt; 50 ng/mL</span><span className="rv-goal-state">52 ✓</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "100%"}}/></div></div>
          <div className="rv-goal"><span className="rv-goal-name">Sono profundo ≥ 70 min</span><span className="rv-goal-state">68 ≈ alvo</span><div className="rv-goal-bar"><div className="rv-goal-fill" style={{width: "92%"}}/></div></div>
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>Integrações</h3></div>
        <div className="rv-list">
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("devices"); }}>
            <div className="rv-list-icon">{Icon.watch}</div>
            <div className="rv-list-text">
              <span className="rv-list-name">Dispositivos e wearables</span>
              <span className="rv-list-sub">Apple Health, Oura, Garmin, Whoop…</span>
            </div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
        </div>


        <div className="rv-section-head" style={{margin: "0 20px 10px"}}><h3>Definições</h3></div>
        <div className="rv-list">
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("notificacoes"); }}>
            <div className="rv-list-icon">{Icon.bell}</div>
            <div className="rv-list-text"><span className="rv-list-name">Notificações</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("privacidade"); }}>
            <div className="rv-list-icon">{Icon.shield}</div>
            <div className="rv-list-text"><span className="rv-list-name">Privacidade e dados</span><span className="rv-list-sub">Consentimento ativo · 4 categorias</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("equipa"); }}>
            <div className="rv-list-icon"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M2 13 a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg></div>
            <div className="rv-list-text"><span className="rv-list-name">Acesso da equipa clínica</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{cursor: "pointer"}} onClick={(e) => { e.preventDefault(); go("exportar"); }}>
            <div className="rv-list-icon">{Icon.upload}</div>
            <div className="rv-list-text"><span className="rv-list-name">Exportar histórico</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
          <a className="rv-list-row" style={{color: "var(--alert)", cursor: "pointer"}} onClick={(e) => { e.preventDefault(); showToast("Sessão terminada"); }}>
            <div className="rv-list-icon" style={{color: "var(--alert)"}}>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 4 V2 H2 V12 H9 V10 M5 7 H13 M11 5 L13 7 L11 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="rv-list-text"><span className="rv-list-name">Terminar sessão</span></div>
            <span className="rv-chev">{Icon.chev}</span>
          </a>
        </div>

        <div style={{textAlign: "center", fontSize: 10.5, color: "var(--fg-30)", padding: "16px 0 24px"}}>
          Vivara Health · v0.5 · MVP interno
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}

// ─── Dispositivos / Wearables ────────────────────────
type DeviceId = "apple-health" | "oura" | "garmin" | "whoop" | "fitbit" | "google-fit" | "libre-cgm";

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
  { id: "whoop",        name: "Whoop",               vendor: "Whoop",      metrics: "Strain · recovery · sono · HRV",            initials: "W", tint: "#6a4cff" },
  { id: "fitbit",       name: "Fitbit",              vendor: "Fitbit",     metrics: "Passos · sono · FC · SpO₂",                 initials: "F", tint: "#25d96b" },
  { id: "google-fit",   name: "Google Health Connect", vendor: "Google",   metrics: "Agregador Android · vários dispositivos",   initials: "G", tint: "#ffbb33" },
  { id: "libre-cgm",    name: "Abbott FreeStyle Libre", vendor: "Abbott",  metrics: "Glicémia contínua",                         initials: "L", tint: "#ff4d4d" },
];

interface DeviceState { connected: boolean; lastSync: number | null }
type DevicesMap = Record<DeviceId, DeviceState>;

const STORAGE_KEY = "rv-devices-v1";
const DEFAULT_DEVICES: DevicesMap = {
  "apple-health": { connected: true,  lastSync: Date.now() - 4 * 60 * 1000 },
  "oura":         { connected: false, lastSync: null },
  "garmin":       { connected: false, lastSync: null },
  "whoop":        { connected: false, lastSync: null },
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
        <button className="rv-header-btn" onClick={() => go("profile")} aria-label="Voltar">{Icon.back}</button>
        <div className="rv-header-title">Dispositivos</div>
        <div style={{width: 36}}/>
      </header>

      <div className="rv-body">
        <div className="rv-consent">
          <div className="rv-consent-title">Os teus dados são teus</div>
          <p className="rv-consent-text">
            Os dispositivos que ligas partilham métricas só com a tua equipa clínica Vivara.
            Podes desligar qualquer um a qualquer momento. <a onClick={() => shareNative({ title: "Privacidade Vivara", text: "Como tratamos dados de dispositivos", toast: showToast })} style={{cursor:"pointer", color:"var(--accent)"}}>Saber mais</a>
          </p>
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}>
          <h3>Ligados</h3>
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
                <span className="rv-list-state" data-state="on"><span className="rv-dot"/>Ligado</span>
              </div>
              <div className="rv-device-foot">
                <span className="rv-device-sync">Última sinc. {formatRelative(devices[d.id].lastSync)}</span>
                <div className="rv-device-actions">
                  <button className="rv-device-btn" onClick={() => syncNow(d.id)}>Sincronizar</button>
                  <button className="rv-device-btn" data-tone="ghost" onClick={() => disconnect(d.id)}>Desligar</button>
                </div>
              </div>
            </div>
          ))}
          {connectedCount === 0 && (
            <div className="rv-device-empty">Nenhum dispositivo ligado ainda.</div>
          )}
        </div>

        <div className="rv-section-head" style={{margin: "0 20px 10px"}}>
          <h3>Disponíveis</h3>
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
                <button className="rv-device-btn" data-tone="primary" onClick={() => startConnect(d.id)}>Ligar</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{textAlign: "center", fontSize: 10.5, color: "var(--fg-30)", padding: "16px 0 24px"}}>
          Não encontras o teu dispositivo? <a onClick={() => showToast("Pedido enviado · suporte@vivara.health")} style={{cursor:"pointer", color:"var(--accent)"}}>Pedir suporte</a>
        </div>
      </div>

      {authorizing && authorizingDef && (
        <div className="rv-overlay" role="dialog" aria-modal="true">
          <div className="rv-modal">
            {authStep === "redirect" ? (
              <>
                <div className="rv-modal-spinner"/>
                <div className="rv-modal-title">A abrir {authorizingDef.vendor}…</div>
                <div className="rv-modal-text">A redirecionar para autorizar o acesso.</div>
              </>
            ) : (
              <>
                <div className="rv-modal-logo" style={{background: authorizingDef.tint, color: "#0b0d0f"}}>
                  {authorizingDef.initials || "•"}
                </div>
                <div className="rv-modal-title">Autorizar Vivara Health</div>
                <div className="rv-modal-text">
                  Vivara Health vai ter acesso a:<br/>
                  <span style={{color: "var(--fg-70)"}}>{authorizingDef.metrics}</span>
                </div>
                <div className="rv-modal-actions">
                  <button className="rv-device-btn" data-tone="ghost" onClick={() => setAuthorizing(null)}>Cancelar</button>
                  <button className="rv-device-btn" data-tone="primary" onClick={confirmAuthorize}>Autorizar</button>
                </div>
                <div className="rv-modal-fineprint">
                  Estás a entrar com a tua conta {authorizingDef.vendor}. Os dados são partilhados de forma segura.
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
        <button className="rv-header-btn" onClick={() => go("home")} aria-label="Voltar">{Icon.back}</button>
        <div className="rv-header-title">Pesquisar</div>
        <div style={{width: 36}}/>
      </header>
      <div className="rv-body">
        <div style={{padding: "8px 20px 12px"}}>
          <input
            autoFocus
            className="rv-msg-compose-input"
            style={{width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", color: "var(--fg)", fontSize: 14, border: "1px solid rgba(255,255,255,0.08)"}}
            placeholder="Marcador, consulta, sintoma…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="rv-bio-section-head"><span className="rv-dot"/>Marcadores · {bios.length}</div>
        <div className="rv-bio-list">
          {bios.length === 0 && <div style={{padding: "12px 20px", color: "var(--fg-50)", fontSize: 13}}>Sem resultados.</div>}
          {bios.map((b, i) => <BioRow key={i} b={b}/>)}
        </div>
        <div className="rv-bio-section-head" style={{marginTop: 12}}><span className="rv-dot"/>Consultas · {consultas.length}</div>
        {consultas.map((c, i) => (
          <div key={i} className="rv-past-row" onClick={() => go("consultas")} style={{cursor: "pointer"}}>
            <div className="rv-past-date"><div className="rv-past-day rv-mono">{c.date.split(" ")[0]}</div><div className="rv-past-month">{c.date.split(" ")[1]}</div></div>
            <div className="rv-past-meta"><div className="rv-past-label">{c.label}</div><div className="rv-past-sub">Equipa clínica</div></div>
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
  return (
    <SubScreen title="Notificações" onBack={() => go("profile")}>
      <div className="rv-sub-section-head">Clínicas</div>
      <div className="rv-toggle-list">
        <ToggleRow label="Pedidos da médica" sub="Reanálises, ajustes ao plano" defaultOn />
        <ToggleRow label="Resumos de consulta" defaultOn />
        <ToggleRow label="Resultados importados" defaultOn />
      </div>
      <div className="rv-sub-section-head">Lembretes diários</div>
      <div className="rv-toggle-list">
        <ToggleRow label="Suplementos · Berberina 19:00" defaultOn />
        <ToggleRow label="Suplementos · Magnésio 22:30" defaultOn />
        <ToggleRow label="Diário noturno" sub="22:00" defaultOn />
      </div>
      <div className="rv-sub-section-head">Marketing</div>
      <div className="rv-toggle-list">
        <ToggleRow label="Novidades e investigação" />
      </div>
    </SubScreen>
  );
}

// ─── Privacidade ─────────────────────────────────────
function PrivacidadeScreen() {
  const { go, showToast } = useNav();
  return (
    <SubScreen title="Privacidade e dados" onBack={() => go("profile")}>
      <div className="rv-sub-section-head">Consentimentos ativos</div>
      <div className="rv-toggle-list">
        <ToggleRow label="Partilha com o médico responsável" sub="Equipa clínica" defaultOn />
        <ToggleRow label="Partilha com nutricionista" sub="Equipa alargada" defaultOn />
        <ToggleRow label="Investigação anonimizada" sub="Dados sem identificação" defaultOn />
        <ToggleRow label="Marketing personalizado" />
      </div>
      <div className="rv-sub-section-head">Os teus dados</div>
      <div className="rv-list">
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => go("exportar")}>
          <div className="rv-list-icon">{Icon.upload}</div>
          <div className="rv-list-text"><span className="rv-list-name">Exportar todos os dados</span><span className="rv-list-sub">JSON · PDF</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
        <a className="rv-list-row" style={{cursor: "pointer", color: "var(--alert)"}} onClick={() => showToast("Pedido enviado. Receberás confirmação por email.")}>
          <div className="rv-list-icon" style={{color: "var(--alert)"}}>{Icon.shield}</div>
          <div className="rv-list-text"><span className="rv-list-name">Apagar conta e dados</span><span className="rv-list-sub">Irreversível · até 30 dias</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
      </div>
    </SubScreen>
  );
}

// ─── Equipa clínica ──────────────────────────────────
function EquipaScreen() {
  const { go, showToast } = useNav();
  const team = [
    { initials: "MR", name: "Médica responsável", role: "Medicina Interna", access: "Total" },
    { initials: "NU", name: "Nutricionista", role: "Equipa alargada", access: "Dieta + biomarcadores metabólicos" },
    { initials: "RM", name: "Rui Marques", role: "Fisiologista do exercício", access: "Sono + actividade" },
  ];
  return (
    <SubScreen title="Equipa clínica" onBack={() => go("profile")}>
      <div className="rv-team-list">
        {team.map((t, i) => (
          <div key={i} className="rv-team-row">
            <div className="rv-team-avatar">{t.initials}</div>
            <div className="rv-team-meta">
              <div className="rv-team-name">{t.name}</div>
              <div className="rv-team-role">{t.role}</div>
              <div className="rv-team-access">Acesso: {t.access}</div>
            </div>
            <button className="rv-device-btn" data-tone="ghost" onClick={() => showToast("Acesso revogado")}>Revogar</button>
          </div>
        ))}
      </div>
      <div style={{padding: "16px 20px"}}>
        <button className="rv-cta-ghost" onClick={() => showToast("Convite enviado")} style={{width: "100%"}}>Convidar profissional</button>
      </div>
    </SubScreen>
  );
}

// ─── Laboratórios ────────────────────────────────────
function LaboratoriosScreen() {
  const { go, showToast } = useNav();
  const labs = [
    { name: "Synlab", status: "Ligado", sub: "12 análises · última a 22 abr 2026", connected: true },
    { name: "Joaquim Chaves Saúde", status: "Ligado", sub: "3 análises · última a 06 dez 2025", connected: true },
    { name: "Germano de Sousa", status: "Não ligado", sub: "Importação por PDF disponível", connected: false },
    { name: "CUF Diagnóstico", status: "Não ligado", sub: "Importação por PDF disponível", connected: false },
  ];
  return (
    <SubScreen title="Laboratórios" onBack={() => go("profile")}>
      <div className="rv-device-list">
        {labs.map((l, i) => (
          <div key={i} className="rv-device-row" data-connected={l.connected}>
            <div className="rv-device-icon">{Icon.flask}</div>
            <div className="rv-device-meta">
              <div className="rv-device-name">{l.name}</div>
              <div className="rv-device-sub">{l.sub}</div>
            </div>
            {l.connected ? (
              <button className="rv-device-btn" data-tone="ghost" onClick={() => showToast(`${l.name} · desligado`)}>Desligar</button>
            ) : (
              <button className="rv-device-btn" data-tone="primary" onClick={() => showToast(`${l.name} · ligado`)}>Ligar</button>
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
  const meds = [
    { name: "Metformina 500 mg", dose: "1× pequeno-almoço", remaining: "18 dias", auto: true },
    { name: "Berberina 500 mg", dose: "1× antes do jantar", remaining: "11 dias", auto: true },
    { name: "Magnésio 400 mg", dose: "1× ao deitar", remaining: "24 dias", auto: false },
    { name: "Vitamina D 4000 UI", dose: "1× pequeno-almoço", remaining: "48 dias", auto: true },
  ];
  return (
    <SubScreen title="Farmácia" onBack={() => go("profile")}>
      <div className="rv-info-note" style={{margin: "0 20px 12px"}}>
        <strong>Farmácia das Avenidas</strong>
        <span>Entrega ao domicílio · renovação automática quando restam 7 dias.</span>
      </div>
      <div className="rv-toggle-list">
        {meds.map((m, i) => (
          <div key={i} className="rv-toggle-row">
            <div className="rv-toggle-meta">
              <div className="rv-toggle-label">{m.name}</div>
              <div className="rv-toggle-sub">{m.dose} · restam {m.remaining}</div>
            </div>
            <button
              className="rv-device-btn"
              data-tone={m.auto ? "ghost" : "primary"}
              onClick={() => showToast(m.auto ? "Renovação desativada" : "Renovação ativada")}
            >
              {m.auto ? "Auto ✓" : "Activar"}
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
  return (
    <SubScreen title="Exportar histórico" onBack={() => go("profile")}>
      <div style={{padding: "0 20px", color: "var(--fg-60)", fontSize: 13, lineHeight: 1.5, marginBottom: 16}}>
        Recebes um ficheiro com biomarcadores, planos, consultas e sintomas registados. Útil para segunda opinião ou portabilidade.
      </div>
      <div className="rv-list">
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => showToast("Exportação JSON enviada por email")}>
          <div className="rv-list-icon">{Icon.doc}</div>
          <div className="rv-list-text"><span className="rv-list-name">JSON completo</span><span className="rv-list-sub">Dados estruturados · ~ 84 KB</span></div>
          <span className="rv-chev">{Icon.chev}</span>
        </a>
        <a className="rv-list-row" style={{cursor: "pointer"}} onClick={() => showToast("Relatório PDF enviado por email")}>
          <div className="rv-list-icon">{Icon.doc}</div>
          <div className="rv-list-text"><span className="rv-list-name">Relatório PDF</span><span className="rv-list-sub">Resumo clínico · 12 páginas</span></div>
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
    case "alerts":    return <MensagensScreen />;
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

function AppV2Page() {
  const [route, setRoute] = useState<NavRoute>("home");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1800);
  }, []);

  return (
    <div className="rv-root" data-theme="dark">
      <NavCtx.Provider value={{ go: setRoute, current: route, showToast }}>
        <div className="rv-phone-shell">
          {renderScreen(route)}
          {toastMsg && <div className="rv-toast" role="status" aria-live="polite">{toastMsg}</div>}
          <AssistantFAB />
        </div>
      </NavCtx.Provider>
    </div>
  );
}
