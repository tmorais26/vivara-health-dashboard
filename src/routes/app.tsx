import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  FlaskConical,
  Home,
  LineChart as LineChartIcon,
  MessageCircle,
  Pill,
  Settings,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import {
  utente,
  calcularDirecao,
  calcularEstado,
  formatarData,
  formatarValor,
  type Categoria,
  type Marcador,
  type TarefaPlano,
  type TipoTarefa,
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
          "Aplicação mobile Vivara Health para utentes de medicina de longevidade. Plano diário, marcadores e mensagens com a equipa clínica.",
      },
    ],
  }),
  component: AppUtente,
});

type Tab = "hoje" | "plano" | "saude" | "perfil";

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
  const [tarefas, setTarefas] = useState<TarefaPlano[]>(utente.plano_tarefas);
  const [marcadorAberto, setMarcadorAberto] = useState<Marcador | null>(null);

  function toggle(id: string) {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              feita: !t.feita,
              feitaEm: !t.feita ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : t,
      ),
    );
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
              {tab === "hoje" && <HojeView tarefas={tarefas} onToggle={toggle} onJump={() => setTab("plano")} />}
              {tab === "plano" && <PlanoView tarefas={tarefas} onToggle={toggle} />}
              {tab === "saude" && (
                <SaudeView
                  onOpen={(m) => setMarcadorAberto(m)}
                />
              )}
              {tab === "perfil" && <PerfilView />}
            </div>

            {/* bottom nav */}
            <nav className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-surface-raised/95 backdrop-blur">
              <div className="grid grid-cols-4 px-2 pb-3 pt-2">
                <NavItem id="hoje" label="Hoje" Icon={Home} active={tab === "hoje"} onClick={setTab} />
                <NavItem id="plano" label="Plano" Icon={CheckCircle2} active={tab === "plano"} onClick={setTab} badge={tarefas.filter((t) => !t.feita).length} />
                <NavItem id="saude" label="Saúde" Icon={Activity} active={tab === "saude"} onClick={setTab} />
                <NavItem id="perfil" label="Perfil" Icon={User} active={tab === "perfil"} onClick={setTab} />
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
        O que a Maria vê no telemóvel. Os checks aqui sincronizam com o portal da Dra. Sofia.
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

/* ---------- HOJE ---------- */

function HojeView({
  tarefas,
  onToggle,
  onJump,
}: {
  tarefas: TarefaPlano[];
  onToggle: (id: string) => void;
  onJump: () => void;
}) {
  const total = tarefas.length;
  const feitas = tarefas.filter((t) => t.feita).length;
  const pct = total === 0 ? 0 : Math.round((feitas / total) * 100);
  const proximas = tarefas.filter((t) => !t.feita).slice(0, 3);

  // Quick health snapshot — escolhe 3 marcadores wearable representativos
  const sono = utente.marcadores.find((m) => m.id === "sono")!;
  const hrv = utente.marcadores.find((m) => m.id === "hrv")!;
  const passos = utente.marcadores.find((m) => m.id === "passos")!;

  return (
    <div className="space-y-5 px-5 pt-3">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Quarta · 29 abril
        </div>
        <h2 className="font-serif mt-0.5 text-[28px] leading-tight text-foreground">
          Olá, {utente.nome.split(" ")[0]}
        </h2>
      </header>

      {/* Ring de progresso do dia */}
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
          <div className="mt-1 text-[11px] text-muted-foreground">
            {pct === 100 ? "Tudo concluído. Bom trabalho." : "Toca para ver o plano completo"}
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
              Sem ações pendentes para hoje.
            </div>
          )}
          {proximas.map((t) => (
            <TarefaCard key={t.id} tarefa={t} onToggle={() => onToggle(t.id)} />
          ))}
        </div>
      </section>

      {/* Mensagem da médica */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
            SC
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">Dra. Sofia Cardoso</div>
            <div className="text-[10px] text-muted-foreground">há 2 dias</div>
          </div>
        </div>
        <p className="font-serif mt-3 text-[15px] leading-snug text-foreground">
          “Maria, ajustei a Vitamina D para 5000 UI. Vamos reavaliar em 8 semanas. Continua a caminhar.”
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:opacity-80"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Responder
        </button>
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
      <section className="rounded-2xl border border-border bg-accent/40 p-4">
        <div className="flex items-center gap-3">
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
        </div>
      </section>
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
        <p className="mt-1 text-[11px] text-muted-foreground">
          {ativas.length} pendentes · {feitas.length} concluídas
        </p>
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

      {/* segmented */}
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
      <div className="rounded-t-3xl border-t border-border bg-surface-raised px-5 pb-6 pt-3 shadow-2xl">
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

        {marcador.notaMedica && (
          <div className="mt-3 rounded-xl border border-border bg-accent/40 p-3">
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

/* ---------- PERFIL ---------- */

function PerfilView() {
  return (
    <div className="space-y-4 px-5 pt-3">
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
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
            SC
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">{utente.medicaResponsavel}</div>
            <div className="text-[10.5px] text-muted-foreground">{utente.plano}</div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
        <PerfilRow Icon={Bell} label="Notificações" hint="Lembretes 30 min antes" />
        <PerfilRow Icon={Activity} label="Wearables" hint="Apple Watch · Withings" />
        <PerfilRow Icon={MessageCircle} label="Mensagens" hint="2 não lidas" />
        <PerfilRow Icon={Settings} label="Definições" />
      </section>

      <p className="px-1 text-center text-[10px] text-muted-foreground">
        Vivara Health · v0.1 demo
      </p>
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