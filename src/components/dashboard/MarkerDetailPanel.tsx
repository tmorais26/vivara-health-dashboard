import {
  calcularEstado,
  formatarData,
  formatarValor,
  type Marcador,
  type TipoTarefa,
} from "@/data/mock-utente";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  MessageSquare,
  Pencil,
  Pill,
  Stethoscope,
  Target,
} from "lucide-react";
import { useState } from "react";
import { LongitudinalChart } from "./LongitudinalChart";
import { StateTag } from "./StateTag";
import {
  Field,
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
  inputClass,
  textareaClass,
} from "@/components/portal/SimpleModal";

const categoriaLabel: Record<string, string> = {
  analises: "Análises clínicas",
  composicao: "Composição corporal",
  wearable: "Wearable",
  genomica: "Genómica",
  prescricoes: "Prescrições",
};

export function MarkerDetailPanel({
  marcador,
  onPrescrever,
}: {
  marcador: Marcador;
  onPrescrever?: (tipo: TipoTarefa) => void;
}) {
  const estado = calcularEstado(marcador);
  const s = marcador.serie;
  const ultimo = s[s.length - 1];
  const anterior = s[s.length - 2];
  const haUmAno = s.find((p) => {
    const diff = (new Date(ultimo.data).getTime() - new Date(p.data).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 330 && diff <= 400;
  }) ?? s[0];

  const delta = ultimo.valor - anterior.valor;
  const deltaAno = ultimo.valor - haUmAno.valor;
  const pctAno = (deltaAno / Math.max(Math.abs(haUmAno.valor), 0.0001)) * 100;

  const formatDelta = (n: number) => {
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(Math.abs(n) < 10 ? 2 : 1)}`;
  };

  const [alvoMin, alvoMax] = marcador.alvoFuncional;
  const [labMin, labMax] = marcador.intervaloLab;
  const [novaPrescAberta, setNovaPrescAberta] = useState(false);
  const [editarAlvoOpen, setEditarAlvoOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* Header do marcador */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {categoriaLabel[marcador.categoria]}
          </div>
          <h2 className="font-serif mt-1 text-3xl text-foreground">{marcador.nome}</h2>
          <div className="mt-2 flex items-center gap-3">
            <StateTag estado={estado} />
            <span className="text-xs text-muted-foreground">
              Última recolha · {formatarData(ultimo.data)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="tabular text-5xl font-light text-foreground">
              {formatarValor(marcador)}
            </span>
            <span className="text-sm text-muted-foreground">{marcador.unidade}</span>
          </div>
          {onPrescrever && (
            <div className="relative mt-3 flex items-center justify-end gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNovaPrescAberta((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Pill className="h-3.5 w-3.5" />
                  Nova prescrição
                  <ChevronDown className="h-3 w-3" />
                </button>
                {novaPrescAberta && (
                  <div className="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        onPrescrever("medicacao");
                        setNovaPrescAberta(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      Medicamento
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPrescrever("suplemento");
                        setNovaPrescAberta(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                    >
                      <Pill className="h-3.5 w-3.5" />
                      Suplemento
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPrescrever("analise");
                        setNovaPrescAberta(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Análise / reanálise
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovaPrescAberta(false)}
                      className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Nota partilhada à utente
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onPrescrever("analise")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                title="Cria uma tarefa no plano e lembrete na app da utente"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Pedir reanálise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <LongitudinalChart marcador={marcador} />

      {/* Cards de leitura */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card label="Δ vs medição anterior" sub={formatarData(anterior.data)}>
          <span className="tabular text-2xl font-light text-foreground">{formatDelta(delta)}</span>
          <span className="ml-1 text-xs text-muted-foreground">{marcador.unidade}</span>
        </Card>
        <Card label="Δ vs há 12 meses" sub={formatarData(haUmAno.data)}>
          <span className="tabular text-2xl font-light text-foreground">{formatDelta(deltaAno)}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            ({pctAno > 0 ? "+" : ""}
            {pctAno.toFixed(1)}%)
          </span>
        </Card>
        <Card label="Alvo funcional vs intervalo lab" sub="Definido pela médica">
          <div className="flex flex-col gap-1">
            <span className="tabular text-base font-medium text-foreground">
              {alvoMin}–{alvoMax}{" "}
              <span className="text-xs text-muted-foreground">{marcador.unidade}</span>
            </span>
            <span className="tabular text-xs text-muted-foreground">
              Lab: {labMin}–{labMax}
            </span>
            <button
              type="button"
              onClick={() => setEditarAlvoOpen(true)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Target className="h-3 w-3" />
              Editar alvo (com justificação)
            </button>
          </div>
        </Card>
      </div>

      {/* Notas + próxima recolha */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {/* Nota interna — só médico */}
          <div className="rounded-2xl border border-state-warn/30 bg-state-warn-soft/30 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-state-warn">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-warn" />
                Nota interna · só visível ao médico
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            </div>
            <p className="font-serif mt-3 text-lg leading-relaxed text-foreground">
              {marcador.notaMedica ??
                "Sem notas internas. A tendência mantém-se dentro do alvo funcional definido."}
            </p>
          </div>

          {/* Nota partilhada — visível na app */}
          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-ok" />
                Nota partilhada · visível na app da utente
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            </div>
            <p className="font-serif mt-3 text-base leading-relaxed text-foreground">
              {marcador.notaPartilhada ?? (
                <span className="text-muted-foreground italic">
                  Nada partilhado com a utente para este marcador.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Próxima recolha
          </div>
          <div className="font-serif mt-3 text-2xl text-foreground">
            {marcador.proximaRecolha ?? "Não agendada"}
          </div>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Bell className="h-3.5 w-3.5" />
            Adicionar lembrete
          </button>
        </div>
      </div>

      {/* Adesão ao plano (visível à médica) */}
      <AdesaoCard marcador={marcador} />

      <EditarAlvoModal
        open={editarAlvoOpen}
        onClose={() => setEditarAlvoOpen(false)}
        marcador={marcador}
      />
    </div>
  );
}

function Card({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-3">{children}</div>
      {sub && <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function AdesaoCard({ marcador }: { marcador: Marcador }) {
  // Mock determinístico de adesão por marcador.
  const tomas = 30;
  const feitas = marcador.id === "vitd" ? 25 : marcador.id === "ldl" ? 22 : 28;
  const taxa = Math.round((feitas / tomas) * 100);
  const tone =
    taxa >= 85
      ? "text-state-ok bg-state-ok-soft border-state-ok/30"
      : taxa >= 60
        ? "text-state-warn bg-state-warn-soft border-state-warn/30"
        : "text-state-alert bg-state-alert-soft border-state-alert/30";
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          Adesão ao plano · últimos 30 dias
        </div>
        <span className={`tabular rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}>
          {taxa}%
        </span>
      </div>
      <p className="mt-3 text-sm text-foreground">
        Marcou <span className="tabular font-medium">{feitas}</span> em{" "}
        <span className="tabular font-medium">{tomas}</span> dias as tomas associadas a este marcador.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Dados sincronizados a partir do plano da app. Falhas registadas pelo próprio utente.
      </p>
    </div>
  );
}

function EditarAlvoModal({
  open,
  onClose,
  marcador,
}: {
  open: boolean;
  onClose: () => void;
  marcador: Marcador;
}) {
  const [min, setMin] = useState(marcador.alvoFuncional[0]);
  const [max, setMax] = useState(marcador.alvoFuncional[1]);
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={`Editar alvo funcional · ${marcador.nomeCurto}`}
      description="Cada alteração fica registada com data e justificação clínica. O gráfico marca o ponto de mudança."
      width="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Mínimo (${marcador.unidade})`}>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label={`Máximo (${marcador.unidade})`}>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="Justificação clínica"
          hint="Visível em auditoria. Necessária para conformidade RGPD/Art. 9."
        >
          <textarea
            className={textareaClass}
            placeholder="Ex.: alvo mais agressivo dada a história familiar paterna de enfarte aos 58 anos."
          />
        </Field>
        <div className="rounded-xl border border-border bg-background p-3 text-[11px] text-muted-foreground">
          Alvo anterior:{" "}
          <span className="tabular text-foreground">
            {marcador.alvoFuncional[0]}–{marcador.alvoFuncional[1]} {marcador.unidade}
          </span>
          <span className="mx-2">→</span>
          Novo:{" "}
          <span className="tabular text-foreground">
            {min}–{max} {marcador.unidade}
          </span>
        </div>
      </div>
      <ModalActions>
        <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
        <PrimaryButton onClick={onClose}>Guardar alteração</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}
