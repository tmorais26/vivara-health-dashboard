import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  FlaskConical,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import {
  formatarData,
  type Marcador,
  type TarefaPlano,
  type TipoTarefa,
  type Utente,
} from "@/data/mock-utente";

const tipoMeta: Record<
  TipoTarefa,
  { label: string; Icon: typeof Pill; tone: string }
> = {
  suplemento: {
    label: "Suplemento",
    Icon: Pill,
    tone: "bg-state-ok-soft text-state-ok",
  },
  medicacao: {
    label: "Medicação",
    Icon: Stethoscope,
    tone: "bg-state-warn-soft text-state-warn",
  },
  analise: {
    label: "Análise",
    Icon: FlaskConical,
    tone: "bg-accent text-foreground/80",
  },
};

export function PlanoPanel({
  utente,
  initialPrefill,
  onConsumePrefill,
}: {
  utente: Utente;
  initialPrefill?: { tipo: TipoTarefa; marcador?: Marcador } | null;
  onConsumePrefill?: () => void;
}) {
  const [tarefas, setTarefas] = useState<TarefaPlano[]>(utente.plano_tarefas);
  const [criando, setCriando] = useState<boolean>(Boolean(initialPrefill));
  const [draft, setDraft] = useState<{
    tipo: TipoTarefa;
    titulo: string;
    detalhe: string;
    prazo: string;
    marcadorId?: string;
  }>(() => prefillDraft(initialPrefill));

  function prefillDraft(p?: typeof initialPrefill | null) {
    if (p?.marcador) {
      const m = p.marcador;
      if (p.tipo === "analise") {
        return {
          tipo: p.tipo,
          titulo: `Repetir ${m.nome}`,
          detalhe: `Reavaliação após ajuste do plano. Jejum quando aplicável.`,
          prazo: "Até próxima consulta",
          marcadorId: m.id,
        };
      }
      return {
        tipo: p.tipo,
        titulo: "",
        detalhe: `Indicado para acompanhamento de ${m.nome}.`,
        prazo: "Diário",
        marcadorId: m.id,
      };
    }
    return { tipo: "suplemento" as TipoTarefa, titulo: "", detalhe: "", prazo: "Diário" };
  }

  function abrirNovo(tipo: TipoTarefa = "suplemento") {
    setDraft({ tipo, titulo: "", detalhe: "", prazo: tipo === "analise" ? "Até próxima consulta" : "Diário" });
    setCriando(true);
  }

  function fechar() {
    setCriando(false);
    onConsumePrefill?.();
  }

  function adicionar() {
    if (!draft.titulo.trim()) return;
    const nova: TarefaPlano = {
      id: `t-${Date.now()}`,
      tipo: draft.tipo,
      titulo: draft.titulo.trim(),
      detalhe: draft.detalhe.trim(),
      prazo: draft.prazo.trim() || undefined,
      marcadorId: draft.marcadorId,
      criadaEm: new Date().toISOString().slice(0, 10),
      feita: false,
    };
    setTarefas((prev) => [nova, ...prev]);
    fechar();
  }

  function toggle(id: string) {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, feita: !t.feita, feitaEm: !t.feita ? new Date().toISOString().slice(0, 10) : undefined }
          : t,
      ),
    );
  }

  function remover(id: string) {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  }

  const ativas = tarefas.filter((t) => !t.feita);
  const concluidas = tarefas.filter((t) => t.feita);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      {/* Lado da médica */}
      <section className="rounded-2xl border border-border bg-surface-raised">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Plano da utente
            </div>
            <h2 className="font-serif mt-1 text-2xl text-foreground">
              Instruções para {utente.nome.split(" ")[0]}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {ativas.length} ativas · {concluidas.length} concluídas · sincroniza com a app
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickAddButton tipo="suplemento" onClick={() => abrirNovo("suplemento")} />
            <QuickAddButton tipo="medicacao" onClick={() => abrirNovo("medicacao")} />
            <QuickAddButton tipo="analise" onClick={() => abrirNovo("analise")} />
          </div>
        </header>

        {criando && (
          <NovaTarefaForm
            draft={draft}
            onChange={setDraft}
            onCancel={fechar}
            onSave={adicionar}
            marcadorContexto={
              draft.marcadorId
                ? utente.marcadores.find((m) => m.id === draft.marcadorId)
                : undefined
            }
          />
        )}

        <div className="divide-y divide-border">
          {ativas.length === 0 && !criando && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Sem tarefas ativas. Adiciona uma instrução em cima ou a partir de um marcador.
            </div>
          )}
          {ativas.map((t) => (
            <TarefaRow
              key={t.id}
              tarefa={t}
              marcador={t.marcadorId ? utente.marcadores.find((m) => m.id === t.marcadorId) : undefined}
              onToggle={() => toggle(t.id)}
              onRemove={() => remover(t.id)}
            />
          ))}
        </div>

        {concluidas.length > 0 && (
          <div className="border-t border-border bg-surface/40">
            <div className="px-6 pt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
              Concluídas
            </div>
            <div className="divide-y divide-border">
              {concluidas.map((t) => (
                <TarefaRow
                  key={t.id}
                  tarefa={t}
                  marcador={
                    t.marcadorId ? utente.marcadores.find((m) => m.id === t.marcadorId) : undefined
                  }
                  onToggle={() => toggle(t.id)}
                  onRemove={() => remover(t.id)}
                  muted
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Preview mobile do utente */}
      <aside className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Pré-visualização — app da utente
        </div>
        <MobilePreview utente={utente} tarefas={tarefas} onToggle={toggle} />
        <p className="max-w-[320px] text-center text-[11px] text-muted-foreground">
          O que a Maria vê no telemóvel. Cada vez que faz check, atualiza no portal em tempo real.
        </p>
      </aside>
    </div>
  );
}

function QuickAddButton({
  tipo,
  onClick,
}: {
  tipo: TipoTarefa;
  onClick: () => void;
}) {
  const meta = tipoMeta[tipo];
  const Icon = meta.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
    >
      <Plus className="h-3 w-3" />
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </button>
  );
}

function NovaTarefaForm({
  draft,
  onChange,
  onCancel,
  onSave,
  marcadorContexto,
}: {
  draft: {
    tipo: TipoTarefa;
    titulo: string;
    detalhe: string;
    prazo: string;
    marcadorId?: string;
  };
  onChange: (d: typeof draft) => void;
  onCancel: () => void;
  onSave: () => void;
  marcadorContexto?: Marcador;
}) {
  const meta = tipoMeta[draft.tipo];
  const Icon = meta.Icon;
  return (
    <div className="border-b border-border bg-accent/30 px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          {marcadorContexto && (
            <span>
              ligado a <strong className="text-foreground">{marcadorContexto.nomeCurto}</strong>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <input
          autoFocus
          value={draft.titulo}
          onChange={(e) => onChange({ ...draft, titulo: e.target.value })}
          placeholder={
            draft.tipo === "analise"
              ? "Ex: Repetir HbA1c"
              : "Ex: Magnésio bisglicinato 300 mg"
          }
          className="font-serif w-full rounded-lg border border-border bg-background px-3 py-2 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
        />
        <textarea
          value={draft.detalhe}
          onChange={(e) => onChange({ ...draft, detalhe: e.target.value })}
          placeholder="Posologia, instruções, contexto clínico…"
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Prazo
          </label>
          <input
            value={draft.prazo}
            onChange={(e) => onChange({ ...draft, prazo: e.target.value })}
            placeholder="Ex: Diário, 8 semanas"
            className="tabular flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-foreground/30 focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!draft.titulo.trim()}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Enviar para a utente
        </button>
      </div>
    </div>
  );
}

function TarefaRow({
  tarefa,
  marcador,
  onToggle,
  onRemove,
  muted = false,
}: {
  tarefa: TarefaPlano;
  marcador?: Marcador;
  onToggle: () => void;
  onRemove: () => void;
  muted?: boolean;
}) {
  const meta = tipoMeta[tarefa.tipo];
  const Icon = meta.Icon;
  return (
    <div className={`group flex items-start gap-4 px-6 py-4 ${muted ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={tarefa.feita ? "Marcar como pendente" : "Marcar como feita"}
      >
        {tarefa.feita ? (
          <CheckCircle2 className="h-5 w-5 text-state-ok" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.tone}`}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
          {marcador && (
            <span className="text-[11px] text-muted-foreground">
              ligado a <strong className="text-foreground/80">{marcador.nomeCurto}</strong>
            </span>
          )}
          {tarefa.prazo && (
            <span className="tabular text-[11px] text-muted-foreground">· {tarefa.prazo}</span>
          )}
        </div>
        <div
          className={`font-serif mt-1.5 text-lg leading-snug text-foreground ${
            tarefa.feita ? "line-through decoration-muted-foreground/40" : ""
          }`}
        >
          {tarefa.titulo}
        </div>
        {tarefa.detalhe && (
          <p className="mt-1 text-sm text-muted-foreground">{tarefa.detalhe}</p>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground">
          {tarefa.feita && tarefa.feitaEm
            ? `Feita a ${formatarData(tarefa.feitaEm)}`
            : `Enviada a ${formatarData(tarefa.criadaEm)}`}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 transition-opacity hover:text-state-alert group-hover:opacity-100"
        aria-label="Remover"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function MobilePreview({
  utente,
  tarefas,
  onToggle,
}: {
  utente: Utente;
  tarefas: TarefaPlano[];
  onToggle: (id: string) => void;
}) {
  const ativas = tarefas.filter((t) => !t.feita);
  const concluidasHoje = tarefas.filter((t) => t.feita);
  const total = ativas.length + concluidasHoje.length;
  const pct = total === 0 ? 0 : Math.round((concluidasHoje.length / total) * 100);

  return (
    <div className="relative h-[640px] w-[320px] rounded-[44px] border-[10px] border-foreground/85 bg-background shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]">
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
      <div className="flex h-full flex-col overflow-hidden rounded-[34px] bg-surface">
        {/* status bar */}
        <div className="tabular flex items-center justify-between px-6 pt-3 text-[10px] text-foreground/60">
          <span>9:41</span>
          <span>vivara</span>
        </div>

        {/* header */}
        <div className="px-5 pt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Hoje
          </div>
          <h3 className="font-serif mt-0.5 text-2xl text-foreground">
            Olá, {utente.nome.split(" ")[0]}
          </h3>

          {/* progress */}
          <div className="mt-3 rounded-2xl border border-border bg-surface-raised p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Plano de hoje</span>
              <span className="tabular text-[11px] font-medium text-foreground">
                {concluidasHoje.length}/{total}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-state-ok transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* list */}
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {tarefas.length === 0 && (
            <div className="mt-10 text-center text-xs text-muted-foreground">
              Sem tarefas para hoje.
            </div>
          )}
          {tarefas.map((t) => {
            const meta = tipoMeta[t.tipo];
            const Icon = meta.Icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border border-border bg-surface-raised p-3 text-left transition-colors hover:border-foreground/20 ${
                  t.feita ? "opacity-55" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {t.feita ? (
                    <CheckCircle2 className="h-5 w-5 text-state-ok" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  <div
                    className={`font-serif mt-1 text-base leading-tight text-foreground ${
                      t.feita ? "line-through decoration-muted-foreground/40" : ""
                    }`}
                  >
                    {t.titulo}
                  </div>
                  {t.prazo && (
                    <div className="tabular mt-1 text-[10px] text-muted-foreground">
                      {t.prazo}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* tab bar */}
        <div className="flex items-center justify-around border-t border-border bg-surface-raised py-3 text-[10px] text-muted-foreground">
          <span className="text-foreground">Plano</span>
          <span>Marcadores</span>
          <span>Consultas</span>
        </div>
      </div>
    </div>
  );
}