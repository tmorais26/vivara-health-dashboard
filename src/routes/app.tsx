import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Edit3,
  FileText,
  Flame,
  FlaskConical,
  Headphones,
  Heart,
  Home,
  Info,
  LineChart as LineChartIcon,
  MessageCircle,
  MoreHorizontal,
  Pill,
  Play,
  Plus,
  Send,
  Settings,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  utente,
  calcularDirecao,
  calcularEstado,
  calcularScoreLongevidade,
  formatarData,
  formatarDataCurta,
  formatarDataHora,
  formatarValor,
  scoreBreakdown,
  type Categoria,
  type Conteudo,
  type Conversa,
  type Consulta,
  type EntradaDiario,
  type Marcador,
  type Mensagem,
  type Notificacao,
  type TarefaPlano,
  type TipoTarefa,
  type ValorExtraido,
} from "@/data/mock-utente";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StateDot, StateTag } from "@/components/dashboard/StateTag";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Vivara — App da utente" },
      {
        name: "description",
        content:
          "Aplicação mobile Vivara Health para utentes de medicina de longevidade. Plano diário, marcadores, mensagens, consultas e diário.",
      },
    ],
  }),
  component: AppUtente,
});

type Tab = "hoje" | "plano" | "saude" | "mais";
type SubView =
  | null
  | "mensagens"
  | "conversa"
  | "consultas"
  | "consulta"
  | "aprender"
  | "conteudo"
  | "diario"
  | "novoDiario"
  | "perfil";

const tipoMeta: Record<
  TipoTarefa,
  { label: string; Icon: typeof Pill; tone: string; dot: string }
> = {
  suplemento: {
    label: "Suplemento",
    Icon: Pill,
    tone: "bg-state-ok-soft text-state-ok",
    dot: "bg-state-ok",
  },
  medicacao: {
    label: "Medicação",
    Icon: Stethoscope,
    tone: "bg-state-warn-soft text-state-warn",
    dot: "bg-state-warn",
  },
  analise: {
    label: "Análise",
    Icon: FlaskConical,
    tone: "bg-accent text-foreground/80",
    dot: "bg-foreground/50",
  },
};

function AppUtente() {
  const [tab, setTab] = useState<Tab>("hoje");
  const [sub, setSub] = useState<SubView>(null);
  const [subContext, setSubContext] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<TarefaPlano[]>(utente.plano_tarefas);
  const [marcadorAberto, setMarcadorAberto] = useState<Marcador | null>(null);
  const [diario, setDiario] = useState<EntradaDiario[]>(utente.diario);

  function toggle(id: string) {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              feita: !t.feita,
              feitaEm: !t.feita ? "2026-04-29" : undefined,
            }
          : t,
      ),
    );
  }

  function openSub(view: SubView, ctx?: string) {
    setSub(view);
    setSubContext(ctx ?? null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/40 via-background to-accent/20 px-4 py-8">
      {/* Top bar fora do telefone */}
      <div className="mx-auto flex max-w-[420px] items-center justify-between pb-5">
        <Link
          to="/"
          className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Portal clínico
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          App da utente
        </div>
      </div>

      {/* Phone frame */}
      <div className="mx-auto w-fit">
        <div className="relative h-[760px] w-[380px] rounded-[52px] border-[12px] border-foreground/85 bg-background shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)]">
          <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
          <div className="relative flex h-full flex-col overflow-hidden rounded-[40px] bg-surface">
            {/* status bar */}
            <div className="tabular flex shrink-0 items-center justify-between px-7 pt-3.5 text-[11px] text-foreground/60">
              <span>9:41</span>
              <span className="font-serif text-[13px] tracking-tight text-foreground/80">vivara</span>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto pb-20">
              {sub === null && (
                <>
                  {tab === "hoje" && (
                    <HojeView
                      tarefas={tarefas}
                      onToggle={toggle}
                      onJump={() => setTab("plano")}
                      onOpenSub={openSub}
                    />
                  )}
                  {tab === "plano" && <PlanoView tarefas={tarefas} onToggle={toggle} />}
                  {tab === "saude" && (
                    <SaudeView onOpen={(m) => setMarcadorAberto(m)} />
                  )}
                  {tab === "mais" && <MaisHub onOpenSub={openSub} />}
                </>
              )}

              {sub === "mensagens" && (
                <MensagensView
                  onBack={() => setSub(null)}
                  onOpen={(id) => openSub("conversa", id)}
                />
              )}
              {sub === "conversa" && subContext && (
                <ConversaView conversaId={subContext} onBack={() => openSub("mensagens")} />
              )}
              {sub === "consultas" && (
                <ConsultasView
                  onBack={() => setSub(null)}
                  onOpen={(id) => openSub("consulta", id)}
                />
              )}
              {sub === "consulta" && subContext && (
                <ConsultaView consultaId={subContext} onBack={() => openSub("consultas")} />
              )}
              {sub === "aprender" && (
                <AprenderView
                  onBack={() => setSub(null)}
                  onOpen={(id) => openSub("conteudo", id)}
                />
              )}
              {sub === "conteudo" && subContext && (
                <ConteudoView conteudoId={subContext} onBack={() => openSub("aprender")} />
              )}
              {sub === "diario" && (
                <DiarioView
                  diario={diario}
                  onBack={() => setSub(null)}
                  onNovo={() => setSub("novoDiario")}
                />
              )}
              {sub === "novoDiario" && (
                <NovoDiarioView
                  onBack={() => setSub("diario")}
                  onSave={(e) => {
                    setDiario((prev) => [e, ...prev]);
                    setSub("diario");
                  }}
                />
              )}
              {sub === "perfil" && <PerfilView onBack={() => setSub(null)} />}
            </div>

            {/* bottom nav */}
            <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-surface-raised/95 backdrop-blur">
              <div className="grid grid-cols-4 px-2 pb-3 pt-2">
                <NavItem
                  id="hoje"
                  label="Hoje"
                  Icon={Home}
                  active={tab === "hoje" && sub === null}
                  onClick={(t) => {
                    setTab(t);
                    setSub(null);
                  }}
                />
                <NavItem
                  id="plano"
                  label="Plano"
                  Icon={CheckCircle2}
                  active={tab === "plano" && sub === null}
                  onClick={(t) => {
                    setTab(t);
                    setSub(null);
                  }}
                  badge={tarefas.filter((t) => !t.feita).length}
                />
                <NavItem
                  id="saude"
                  label="Saúde"
                  Icon={Activity}
                  active={tab === "saude" && sub === null}
                  onClick={(t) => {
                    setTab(t);
                    setSub(null);
                  }}
                />
                <NavItem
                  id="mais"
                  label="Mais"
                  Icon={MoreHorizontal}
                  active={tab === "mais" || sub !== null}
                  onClick={(t) => {
                    setTab(t);
                    setSub(null);
                  }}
                  badge={
                    utente.conversas.flatMap((c) => c.mensagens).filter((m) => !m.lida).length
                  }
                />
              </div>
            </nav>

            {/* Marker detail sheet */}
            {marcadorAberto && (
              <MarkerSheet
                marcador={marcadorAberto}
                onClose={() => setMarcadorAberto(null)}
              />
            )}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-[380px] text-center text-[11px] text-muted-foreground">
        O que a Maria vê no telemóvel. Os checks, mensagens e diário sincronizam com o portal da Dra. Sofia.
      </p>
    </div>
  );
}

/* ---------- Bottom nav item ---------- */

function NavItem({
  id,
  label,
  Icon,
  active,
  onClick,
  badge,
}: {
  id: Tab;
  label: string;
  Icon: typeof Home;
  active: boolean;
  onClick: (t: Tab) => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="relative">
        <Icon className={`h-5 w-5 ${active ? "stroke-[2.2]" : ""}`} />
        {badge !== undefined && badge > 0 && (
          <span className="tabular absolute -right-2 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-state-alert px-1 text-[9px] font-medium text-state-alert-soft">
            {badge}
          </span>
        )}
      </div>
      <span className="tracking-wide">{label}</span>
    </button>
  );
}

/* ---------- Sub-view header ---------- */

function SubHeader({
  onBack,
  title,
  subtitle,
  action,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-serif truncate text-[17px] leading-tight text-foreground">{title}</div>
          {subtitle && (
            <div className="truncate text-[10.5px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

/* ---------- HOJE ---------- */

function HojeView({
  tarefas,
  onToggle,
  onJump,
  onOpenSub,
}: {
  tarefas: TarefaPlano[];
  onToggle: (id: string) => void;
  onJump: () => void;
  onOpenSub: (v: SubView, ctx?: string) => void;
}) {
  const total = tarefas.length;
  const feitas = tarefas.filter((t) => t.feita).length;
  const pct = total === 0 ? 0 : Math.round((feitas / total) * 100);
  const proximas = tarefas.filter((t) => !t.feita).slice(0, 3);

  const score = useMemo(() => calcularScoreLongevidade(), []);
  const breakdown = useMemo(() => scoreBreakdown(), []);

  // Quick health snapshot
  const sono = utente.marcadores.find((m) => m.id === "sono")!;
  const hrv = utente.marcadores.find((m) => m.id === "hrv")!;
  const passos = utente.marcadores.find((m) => m.id === "passos")!;

  // Mensagens não lidas
  const naoLidas = utente.conversas
    .flatMap((c) => c.mensagens)
    .filter((m) => !m.lida && m.autor === "medica").length;

  // Insight do dia (determinístico)
  const insight = useMemo(() => {
    const hrvEstado = calcularEstado(hrv);
    if (hrvEstado !== "ok") {
      return {
        titulo: "O teu HRV está abaixo da linha de base",
        texto:
          "Esta semana 18% abaixo da tua média de 12 meses. Ontem dormiste menos. Tenta deitar-te 30 min mais cedo hoje.",
        cta: { label: "Ver HRV", action: () => onOpenSub("aprender", "ed2") },
      };
    }
    return {
      titulo: "Estás em boa forma",
      texto: "A tua recuperação esta semana está dentro do teu normal. Continua.",
      cta: { label: "Ver Saúde", action: onJump },
    };
  }, [hrv, onJump, onOpenSub]);

  return (
    <div className="space-y-5 px-5 pt-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Quarta · 29 abril
          </div>
          <h2 className="font-serif mt-0.5 text-[28px] leading-tight text-foreground">
            Olá, {utente.nome.split(" ")[0]}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenSub("mensagens")}
          className="relative mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised border border-border hover:border-foreground/20"
          aria-label="Mensagens"
        >
          <MessageCircle className="h-4 w-4 text-foreground" />
          {naoLidas > 0 && (
            <span className="tabular absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-state-alert px-1 text-[9px] font-medium text-state-alert-soft">
              {naoLidas}
            </span>
          )}
        </button>
      </header>

      {/* Score de longevidade */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-4">
          <ScoreRing value={score} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Score de longevidade
            </div>
            <div className="font-serif mt-0.5 text-[22px] leading-tight text-foreground">
              {score} <span className="text-muted-foreground text-base">/100</span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Calculado a partir dos teus 24 marcadores
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {breakdown.map((b) => (
            <div key={b.pilar} className="rounded-xl border border-border bg-surface p-2.5">
              <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
                {b.pilar}
              </div>
              <div className="font-serif tabular mt-0.5 text-base text-foreground">
                {b.valor}
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insight do dia */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-accent/20 p-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-foreground/70">
          <Sparkles className="h-3 w-3" />
          Insight do dia
        </div>
        <div className="font-serif mt-1.5 text-[17px] leading-snug text-foreground">
          {insight.titulo}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/75">
          {insight.texto}
        </p>
        <button
          type="button"
          onClick={insight.cta.action}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:opacity-80"
        >
          {insight.cta.label} <ChevronRight className="h-3 w-3" />
        </button>
      </section>

      {/* Plano de hoje */}
      <button
        type="button"
        onClick={onJump}
        className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface-raised p-4 text-left transition-colors hover:border-foreground/20"
      >
        <ProgressRing pct={pct} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Plano de hoje
          </div>
          <div className="font-serif mt-0.5 text-xl text-foreground">
            {feitas} de {total} feitas
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame className="h-3 w-3 text-state-warn" />
            <span className="tabular">{utente.streakDias} dias</span> de sequência
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Próximas ações */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            A seguir
          </div>
          <button
            type="button"
            onClick={onJump}
            className="text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver tudo
          </button>
        </div>
        <div className="space-y-2">
          {proximas.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center text-xs text-muted-foreground">
              Tudo concluído. Bom trabalho.
            </div>
          )}
          {proximas.map((t) => (
            <TarefaCard key={t.id} tarefa={t} onToggle={() => onToggle(t.id)} />
          ))}
        </div>
      </section>

      {/* Saúde rápida */}
      <section>
        <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Os teus sinais — últimos 7 dias
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniMarker marcador={sono} />
          <MiniMarker marcador={hrv} />
          <MiniMarker marcador={passos} />
        </div>
      </section>

      {/* Próxima consulta */}
      <button
        type="button"
        onClick={() => onOpenSub("consultas")}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-accent/40 p-4 text-left transition-colors hover:bg-accent/60"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
          <CalendarClock className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Próxima consulta
          </div>
          <div className="font-serif mt-0.5 text-[15px] leading-tight text-foreground">
            {formatarData(utente.proximaConsulta)} · 10:30
          </div>
          <div className="text-[11px] text-muted-foreground">com {utente.medicaResponsavel}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--state-ok)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="tabular absolute inset-0 flex items-center justify-center text-[12px] font-medium text-foreground">
        {pct}%
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  const stroke =
    value >= 75 ? "var(--state-ok)" : value >= 55 ? "var(--state-warn)" : "var(--state-alert)";
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif tabular text-[22px] leading-none text-foreground">{value}</div>
        <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground">de 100</div>
      </div>
    </div>
  );
}

function MiniMarker({ marcador }: { marcador: Marcador }) {
  const estado = calcularEstado(marcador);
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{marcador.nomeCurto}</span>
        <StateDot estado={estado} />
      </div>
      <div className="font-serif tabular mt-1 text-lg leading-none text-foreground">
        {formatarValor(marcador)}
      </div>
      <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        {marcador.unidade}
      </div>
      <div className="mt-1.5 -mx-1">
        <Sparkline marcador={marcador} estado={estado} height={22} />
      </div>
    </div>
  );
}

/* ---------- PLANO ---------- */

function PlanoView({
  tarefas,
  onToggle,
}: {
  tarefas: TarefaPlano[];
  onToggle: (id: string) => void;
}) {
  const ativas = tarefas.filter((t) => !t.feita);
  const feitas = tarefas.filter((t) => t.feita);

  return (
    <div className="space-y-5 px-5 pt-3">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Plano da Dra. Sofia
        </div>
        <h2 className="font-serif mt-0.5 text-[26px] leading-tight text-foreground">
          O que tens a fazer
        </h2>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            {ativas.length} pendentes · {feitas.length} concluídas
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-state-warn" />
            <span className="tabular">{utente.streakDias}</span> dias
          </span>
        </div>
      </header>

      {ativas.length > 0 && (
        <section>
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Pendentes
          </div>
          <div className="space-y-2">
            {ativas.map((t) => (
              <TarefaCard key={t.id} tarefa={t} onToggle={() => onToggle(t.id)} expanded />
            ))}
          </div>
        </section>
      )}

      {feitas.length > 0 && (
        <section>
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Concluídas
          </div>
          <div className="space-y-2">
            {feitas.map((t) => (
              <TarefaCard key={t.id} tarefa={t} onToggle={() => onToggle(t.id)} expanded muted />
            ))}
          </div>
        </section>
      )}

      {tarefas.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface-raised p-6 text-center text-xs text-muted-foreground">
          Sem tarefas atribuídas.
        </div>
      )}
    </div>
  );
}

function TarefaCard({
  tarefa,
  onToggle,
  expanded = false,
  muted = false,
}: {
  tarefa: TarefaPlano;
  onToggle: () => void;
  expanded?: boolean;
  muted?: boolean;
}) {
  const meta = tipoMeta[tarefa.tipo];
  const Icon = meta.Icon;
  const marcador = tarefa.marcadorId
    ? utente.marcadores.find((m) => m.id === tarefa.marcadorId)
    : undefined;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-2xl border border-border bg-surface-raised p-3.5 text-left transition-colors hover:border-foreground/20 ${
        muted ? "opacity-55" : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {tarefa.feita ? (
          <CheckCircle2 className="h-5 w-5 text-state-ok" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wider ${meta.tone}`}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          {tarefa.prazo && (
            <span className="tabular text-[10px] text-muted-foreground">{tarefa.prazo}</span>
          )}
        </div>
        <div
          className={`font-serif mt-1.5 text-[16px] leading-snug text-foreground ${
            tarefa.feita ? "line-through decoration-muted-foreground/40" : ""
          }`}
        >
          {tarefa.titulo}
        </div>
        {expanded && tarefa.detalhe && (
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{tarefa.detalhe}</p>
        )}
        {expanded && marcador && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <LineChartIcon className="h-3 w-3" />
            ligado a <span className="font-medium text-foreground/80">{marcador.nomeCurto}</span>
          </div>
        )}
      </div>
    </button>
  );
}

/* ---------- SAÚDE ---------- */

const categoriaLabels: Record<Categoria, string> = {
  analises: "Análises",
  composicao: "Composição",
  wearable: "Wearable",
  genomica: "Genómica",
  prescricoes: "Prescrições",
};

function SaudeView({ onOpen }: { onOpen: (m: Marcador) => void }) {
  const [cat, setCat] = useState<Categoria>("analises");
  const lista = useMemo(
    () => utente.marcadores.filter((m) => m.categoria === cat),
    [cat],
  );
  const visiveis: Categoria[] = ["analises", "composicao", "wearable"];

  return (
    <div className="space-y-4 px-5 pt-3">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          A tua saúde
        </div>
        <h2 className="font-serif mt-0.5 text-[26px] leading-tight text-foreground">
          Marcadores
        </h2>
      </header>

      <div className="flex gap-1 rounded-full border border-border bg-surface-raised p-1">
        {visiveis.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              cat === c
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {categoriaLabels[c]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {lista.map((m) => {
          const estado = calcularEstado(m);
          const dir = calcularDirecao(m);
          const TrendIcon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : null;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpen(m)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-raised p-3.5 text-left transition-colors hover:border-foreground/20"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <StateDot estado={estado} />
                  <span className="text-[13px] font-medium text-foreground">{m.nomeCurto}</span>
                </div>
                <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{m.nome}</div>
              </div>
              <Sparkline marcador={m} estado={estado} height={24} />
              <div className="text-right">
                <div className="font-serif tabular text-base leading-none text-foreground">
                  {formatarValor(m)}
                </div>
                <div className="mt-1 flex items-center justify-end gap-0.5 text-[9.5px] text-muted-foreground">
                  {TrendIcon && <TrendIcon className="h-2.5 w-2.5" />}
                  {m.unidade}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MarkerSheet({ marcador, onClose }: { marcador: Marcador; onClose: () => void }) {
  const estado = calcularEstado(marcador);
  const ultimas = [...marcador.serie].slice(-6).reverse();

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/60 backdrop-blur-sm">
      <button type="button" onClick={onClose} className="flex-1" aria-label="Fechar" />
      <div className="max-h-[78%] overflow-y-auto rounded-t-3xl border-t border-border bg-surface-raised px-5 pb-6 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {categoriaLabels[marcador.categoria]}
            </div>
            <h3 className="font-serif mt-0.5 text-[22px] leading-tight text-foreground">
              {marcador.nome}
            </h3>
          </div>
          <StateTag estado={estado} />
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div className="font-serif tabular text-[40px] leading-none text-foreground">
            {formatarValor(marcador)}
          </div>
          <div className="pb-1.5 text-[11px] text-muted-foreground">{marcador.unidade}</div>
          <div className="ml-auto pb-1">
            <Sparkline marcador={marcador} estado={estado} height={36} />
          </div>
        </div>

        <div className="tabular mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Alvo funcional
            </div>
            <div className="mt-0.5 text-foreground">
              {marcador.alvoFuncional[0]}–{marcador.alvoFuncional[1]}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Intervalo lab
            </div>
            <div className="mt-0.5 text-foreground">
              {marcador.intervaloLab[0]}–{marcador.intervaloLab[1]}
            </div>
          </div>
        </div>

        {/* Comparação com pares */}
        {marcador.percentilPares !== undefined && (
          <div className="mt-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
              <Users className="h-3 w-3" />
              Comparação com pares
            </div>
            <div className="font-serif mt-1 text-[14px] leading-snug text-foreground">
              Percentil {marcador.percentilPares}
              <span className="ml-1 text-muted-foreground text-[12px]">
                · {marcador.coorteDescricao ?? "população de referência"}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{ width: `${marcador.percentilPares}%` }}
              />
            </div>
            <div className="tabular mt-1 flex justify-between text-[9px] text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        )}

        {/* Explicação simples */}
        {marcador.explicacaoSimples && (
          <div className="mt-3 rounded-xl border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-foreground/70">
              <Info className="h-3 w-3" />O que é isto?
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/85">
              {marcador.explicacaoSimples}
            </p>
            {marcador.porqueImporta && (
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">Porque importa: </span>
                {marcador.porqueImporta}
              </p>
            )}
          </div>
        )}

        {marcador.notaMedica && (
          <div className="mt-3 rounded-xl border border-border bg-surface p-3">
            <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
              Nota da Dra. Sofia
            </div>
            <p className="font-serif mt-1 text-[13px] leading-snug text-foreground">
              {marcador.notaMedica}
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
            Histórico recente
          </div>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {ultimas.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 text-[12px]"
              >
                <span className="text-muted-foreground">{formatarData(p.data)}</span>
                <span className="tabular font-medium text-foreground">
                  {p.valor} <span className="text-muted-foreground">{marcador.unidade}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- MAIS (hub) ---------- */

function MaisHub({ onOpenSub }: { onOpenSub: (v: SubView, ctx?: string) => void }) {
  const naoLidas = utente.conversas
    .flatMap((c) => c.mensagens)
    .filter((m) => !m.lida && m.autor === "medica").length;
  const novosConteudos = utente.conteudos.filter((c) => c.novo).length;
  const proxima = utente.consultas.find((c) => c.estado === "agendada");

  const items: {
    id: SubView;
    Icon: typeof MessageCircle;
    label: string;
    hint: string;
    badge?: number | string;
  }[] = [
    {
      id: "mensagens",
      Icon: MessageCircle,
      label: "Mensagens",
      hint: "Fala com a equipa clínica",
      badge: naoLidas || undefined,
    },
    {
      id: "consultas",
      Icon: CalendarClock,
      label: "Consultas",
      hint: proxima ? `Próxima: ${formatarDataCurta(proxima.data)}` : "Sem agendadas",
    },
    {
      id: "aprender",
      Icon: BookOpen,
      label: "Aprender",
      hint: "Conteúdos personalizados",
      badge: novosConteudos ? `${novosConteudos} novo${novosConteudos > 1 ? "s" : ""}` : undefined,
    },
    {
      id: "diario",
      Icon: Heart,
      label: "Diário",
      hint: "Como te sentiste hoje?",
    },
    {
      id: "perfil",
      Icon: User,
      label: "Perfil e definições",
      hint: utente.plano,
    },
  ];

  return (
    <div className="space-y-4 px-5 pt-3">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Mais
        </div>
        <h2 className="font-serif mt-0.5 text-[26px] leading-tight text-foreground">
          A tua jornada
        </h2>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
        {items.map((it, idx) => {
          const Icon = it.Icon;
          return (
            <button
              key={String(it.id)}
              type="button"
              onClick={() => onOpenSub(it.id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40 ${
                idx !== items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-foreground">{it.label}</div>
                <div className="text-[10.5px] text-muted-foreground">{it.hint}</div>
              </div>
              {it.badge !== undefined && (
                <span className="tabular rounded-full bg-state-alert px-2 py-0.5 text-[9.5px] font-medium text-state-alert-soft">
                  {it.badge}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </section>
    </div>
  );
}

/* ---------- MENSAGENS ---------- */

function MensagensView({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <SubHeader onBack={onBack} title="Mensagens" subtitle="Equipa clínica" />
      <div className="px-4 py-3">
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
          {utente.conversas.map((c, i) => {
            const ultima = c.mensagens[c.mensagens.length - 1];
            const naoLidas = c.mensagens.filter((m) => !m.lida && m.autor === "medica").length;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpen(c.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/40 ${
                    i !== utente.conversas.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                    {c.iniciais}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="truncate text-[13.5px] font-medium text-foreground">
                        {c.com}
                      </div>
                      <div className="tabular shrink-0 text-[10px] text-muted-foreground">
                        {formatarDataHora(ultima.enviadaEm)}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.papel}</div>
                    <div
                      className={`mt-1 line-clamp-2 text-[12px] ${
                        naoLidas > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {ultima.texto}
                    </div>
                  </div>
                  {naoLidas > 0 && (
                    <span className="tabular shrink-0 self-start rounded-full bg-state-alert px-1.5 py-0.5 text-[9px] font-medium text-state-alert-soft">
                      {naoLidas}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ConversaView({
  conversaId,
  onBack,
}: {
  conversaId: string;
  onBack: () => void;
}) {
  const conversa = utente.conversas.find((c) => c.id === conversaId);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Mensagem[]>(conversa?.mensagens ?? []);

  if (!conversa) return null;

  function send() {
    if (!draft.trim()) return;
    setMsgs((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        autor: "utente",
        texto: draft.trim(),
        enviadaEm: "2026-04-29T09:41:00",
        lida: true,
      },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <SubHeader onBack={onBack} title={conversa.com} subtitle={conversa.papel} />
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {msgs.map((m) => {
          const mine = m.autor === "utente";
          const marcador = m.marcadorId
            ? utente.marcadores.find((x) => x.id === m.marcadorId)
            : undefined;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${
                  mine
                    ? "bg-foreground text-background"
                    : "bg-surface-raised text-foreground border border-border"
                }`}
              >
                {marcador && !mine && (
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground/70">
                    <LineChartIcon className="h-2.5 w-2.5" />
                    {marcador.nomeCurto}
                  </div>
                )}
                <div>{m.texto}</div>
                <div
                  className={`tabular mt-1 text-[9px] ${
                    mine ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {formatarDataHora(m.enviadaEm)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border bg-surface-raised px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escrever mensagem…"
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            type="button"
            onClick={send}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
            aria-label="Enviar"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- CONSULTAS ---------- */

function ConsultasView({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const agendada = utente.consultas.filter((c) => c.estado === "agendada");
  const realizadas = utente.consultas.filter((c) => c.estado === "realizada");

  return (
    <div>
      <SubHeader onBack={onBack} title="Consultas" subtitle="Agenda e histórico" />
      <div className="space-y-4 px-4 py-3">
        {agendada.length > 0 && (
          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Agendada
            </div>
            <div className="space-y-2">
              {agendada.map((c) => (
                <ConsultaCard key={c.id} consulta={c} onClick={() => onOpen(c.id)} highlight />
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Anteriores
          </div>
          <div className="space-y-2">
            {realizadas.map((c) => (
              <ConsultaCard key={c.id} consulta={c} onClick={() => onOpen(c.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ConsultaCard({
  consulta,
  onClick,
  highlight,
}: {
  consulta: Consulta;
  onClick: () => void;
  highlight?: boolean;
}) {
  const Icon = consulta.tipo === "video" ? Video : Stethoscope;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors hover:border-foreground/20 ${
        highlight ? "border-foreground/40 bg-accent/40" : "border-border bg-surface-raised"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-serif text-[15px] leading-tight text-foreground">
          {formatarData(consulta.data)} · {consulta.hora}
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{consulta.motivo}</div>
        <div className="tabular mt-1 text-[10px] text-muted-foreground">
          {consulta.duracao} · {consulta.tipo === "video" ? "Vídeo-consulta" : "Presencial"}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ConsultaView({ consultaId, onBack }: { consultaId: string; onBack: () => void }) {
  const consulta = utente.consultas.find((c) => c.id === consultaId);
  if (!consulta) return null;

  return (
    <div>
      <SubHeader
        onBack={onBack}
        title={formatarData(consulta.data)}
        subtitle={`${consulta.hora} · ${consulta.duracao}`}
      />
      <div className="space-y-4 px-4 py-3">
        <section className="rounded-2xl border border-border bg-surface-raised p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Motivo
          </div>
          <div className="font-serif mt-1 text-[16px] leading-snug text-foreground">
            {consulta.motivo}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] text-foreground/80">
            {consulta.tipo === "video" ? (
              <Video className="h-3 w-3" />
            ) : (
              <Stethoscope className="h-3 w-3" />
            )}
            {consulta.tipo === "video" ? "Vídeo-consulta" : "Presencial"}
          </div>
        </section>

        {consulta.estado === "agendada" && consulta.preparacao && (
          <section className="rounded-2xl border border-border bg-surface-raised p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Como te preparares
            </div>
            <ul className="mt-2 space-y-2">
              {consulta.preparacao.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-ok" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {consulta.resumo && (
          <section className="rounded-2xl border border-border bg-surface-raised p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Resumo da consulta
            </div>
            <p className="font-serif mt-1.5 text-[14px] leading-snug text-foreground">
              {consulta.resumo}
            </p>
          </section>
        )}

        {consulta.estado === "agendada" && (
          <button
            type="button"
            className="w-full rounded-full border border-border bg-surface-raised py-3 text-[12.5px] font-medium text-foreground hover:bg-accent/40"
          >
            Pedir remarcação
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- APRENDER ---------- */

const formatoIcone = {
  artigo: FileText,
  video: Play,
  audio: Headphones,
} as const;

function AprenderView({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const novos = utente.conteudos.filter((c) => c.novo);
  const outros = utente.conteudos.filter((c) => !c.novo);

  return (
    <div>
      <SubHeader onBack={onBack} title="Aprender" subtitle="Curado pela tua equipa" />
      <div className="space-y-5 px-4 py-3">
        {novos.length > 0 && (
          <section>
            <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Para ti, esta semana
            </div>
            <div className="space-y-2">
              {novos.map((c) => (
                <ConteudoCard key={c.id} c={c} onClick={() => onOpen(c.id)} highlight />
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Biblioteca
          </div>
          <div className="space-y-2">
            {outros.map((c) => (
              <ConteudoCard key={c.id} c={c} onClick={() => onOpen(c.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ConteudoCard({
  c,
  onClick,
  highlight,
}: {
  c: Conteudo;
  onClick: () => void;
  highlight?: boolean;
}) {
  const Icon = formatoIcone[c.formato];
  const marcador = c.marcadorId
    ? utente.marcadores.find((m) => m.id === c.marcadorId)
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors hover:border-foreground/20 ${
        highlight ? "border-foreground/30 bg-accent/40" : "border-border bg-surface-raised"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
            {c.formato} · {c.duracao}
          </span>
          {marcador && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-foreground/70">
              {marcador.nomeCurto}
            </span>
          )}
        </div>
        <div className="font-serif mt-0.5 text-[15px] leading-snug text-foreground">
          {c.titulo}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{c.descricao}</div>
        <div className="mt-1.5 text-[10px] text-muted-foreground">por {c.curadoPor}</div>
      </div>
    </button>
  );
}

function ConteudoView({
  conteudoId,
  onBack,
}: {
  conteudoId: string;
  onBack: () => void;
}) {
  const c = utente.conteudos.find((x) => x.id === conteudoId);
  if (!c) return null;
  const Icon = formatoIcone[c.formato];
  const marcador = c.marcadorId
    ? utente.marcadores.find((m) => m.id === c.marcadorId)
    : undefined;
  return (
    <div>
      <SubHeader onBack={onBack} title="Aprender" />
      <div className="space-y-4 px-5 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {c.formato} · {c.duracao}
        </div>
        <h2 className="font-serif text-[24px] leading-tight text-foreground">{c.titulo}</h2>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          por <span className="text-foreground/80">{c.curadoPor}</span>
          {marcador && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-foreground/70">
              ligado a {marcador.nomeCurto}
            </span>
          )}
        </div>

        <div className="flex h-44 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-accent/60 to-accent/20">
          <Icon className="h-10 w-10 text-foreground/60" />
        </div>

        <p className="text-[13px] leading-relaxed text-foreground/85">{c.descricao}</p>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Este conteúdo foi seleccionado pela tua equipa clínica com base nos teus marcadores
          actuais. Faz parte do teu plano educativo personalizado.
        </p>

        <button
          type="button"
          className="mt-2 w-full rounded-full bg-foreground py-3 text-[13px] font-medium text-background hover:opacity-90"
        >
          {c.formato === "artigo" ? "Ler artigo" : c.formato === "video" ? "Ver vídeo" : "Ouvir áudio"}
        </button>
      </div>
    </div>
  );
}

/* ---------- DIÁRIO ---------- */

const humorEmoji = ["😞", "😕", "😐", "🙂", "😄"];
const energiaLabel = ["Muito baixa", "Baixa", "Média", "Boa", "Óptima"];

function DiarioView({
  diario,
  onBack,
  onNovo,
}: {
  diario: EntradaDiario[];
  onBack: () => void;
  onNovo: () => void;
}) {
  const hoje = "2026-04-29";
  const jaEscrevi = diario.some((d) => d.data === hoje);

  return (
    <div>
      <SubHeader
        onBack={onBack}
        title="Diário"
        subtitle="Como te sentiste"
        action={
          <button
            type="button"
            onClick={onNovo}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
            aria-label="Novo registo"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="space-y-3 px-4 py-3">
        {!jaEscrevi && (
          <button
            type="button"
            onClick={onNovo}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-foreground/30 bg-accent/30 p-4 text-left hover:bg-accent/50"
          >
            <Heart className="h-5 w-5 text-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[15px] text-foreground">Como te sentes hoje?</div>
              <div className="text-[11px] text-muted-foreground">
                Demora 30 segundos. Ajuda a Dra. Sofia a perceber o que os números não dizem.
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div className="space-y-2">
          {diario.map((e) => (
            <article
              key={e.id}
              className="rounded-2xl border border-border bg-surface-raised p-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground">{formatarData(e.data)}</div>
                <div className="text-xl">{humorEmoji[e.humor - 1]}</div>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Energia
                  </div>
                  <div className="text-foreground">{energiaLabel[e.energia - 1]}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Sintomas
                  </div>
                  <div className="text-foreground">
                    {e.sintomas.length === 0 ? "Nenhum" : e.sintomas.join(", ")}
                  </div>
                </div>
              </div>
              {e.nota && (
                <p className="font-serif mt-2 text-[13px] leading-snug text-foreground/90">
                  “{e.nota}”
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function NovoDiarioView({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (e: EntradaDiario) => void;
}) {
  const [humor, setHumor] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energia, setEnergia] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [nota, setNota] = useState("");

  const opcoesSint = ["Sono leve", "Cefaleia", "Cansaço", "Stress", "Dor articular", "Tudo bem"];

  function toggleSint(s: string) {
    setSintomas((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function save() {
    onSave({
      id: `local-${Date.now()}`,
      data: "2026-04-29",
      humor,
      energia,
      sintomas: sintomas.includes("Tudo bem") ? [] : sintomas,
      nota: nota.trim() || undefined,
    });
  }

  return (
    <div>
      <SubHeader onBack={onBack} title="Como te sentes?" subtitle="29 abril" />
      <div className="space-y-5 px-5 py-4">
        <section>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Humor</div>
          <div className="mt-2 flex justify-between">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHumor(n)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl transition-all ${
                  humor === n
                    ? "border-foreground/60 bg-accent scale-105"
                    : "border-border bg-surface-raised hover:border-foreground/20"
                }`}
              >
                {humorEmoji[n - 1]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Energia</div>
          <div className="mt-2 flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEnergia(n)}
                className={`h-3 flex-1 rounded-full transition-all ${
                  n <= energia ? "bg-foreground" : "bg-border"
                }`}
                aria-label={`Energia ${n}`}
              />
            ))}
          </div>
          <div className="tabular mt-1.5 text-center text-[11px] text-muted-foreground">
            {energiaLabel[energia - 1]}
          </div>
        </section>

        <section>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sintomas</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {opcoesSint.map((s) => {
              const on = sintomas.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSint(s)}
                  className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface-raised text-foreground hover:border-foreground/30"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Nota (opcional)
          </div>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Algo que queiras partilhar com a Dra. Sofia…"
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface-raised p-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40"
          />
        </section>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-full bg-foreground py-3 text-[13px] font-medium text-background hover:opacity-90"
        >
          Guardar registo
        </button>
      </div>
    </div>
  );
}

/* ---------- PERFIL ---------- */

function PerfilView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <SubHeader onBack={onBack} title="Perfil" subtitle="Definições" />
      <div className="space-y-4 px-5 py-3">
        <header className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-serif text-xl text-foreground">
            MA
          </div>
          <div className="min-w-0">
            <div className="font-serif text-xl leading-tight text-foreground">{utente.nome}</div>
            <div className="text-[11px] text-muted-foreground">
              {utente.idade} anos · {utente.cidade}
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-surface-raised p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Equipa clínica
          </div>
          <div className="mt-2 space-y-2.5">
            {utente.conversas.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                  {c.iniciais}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-foreground">{c.com}</div>
                  <div className="text-[10.5px] text-muted-foreground">{c.papel}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            Plano: <span className="text-foreground">{utente.plano}</span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
          <PerfilRow Icon={Bell} label="Notificações" hint="Lembretes 30 min antes" />
          <PerfilRow Icon={Activity} label="Wearables" hint="Apple Watch · Withings" />
          <PerfilRow Icon={MessageCircle} label="Mensagens" hint="2 não lidas" />
          <PerfilRow Icon={Settings} label="Definições" />
        </section>

        <p className="px-1 text-center text-[10px] text-muted-foreground">
          Vivara Health · v0.2 demo
        </p>
      </div>
    </div>
  );
}

function PerfilRow({
  Icon,
  label,
  hint,
}: {
  Icon: typeof Bell;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 hover:bg-accent/40"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-foreground">{label}</div>
        {hint && <div className="text-[10.5px] text-muted-foreground">{hint}</div>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
