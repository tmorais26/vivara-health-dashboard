import { useMemo, useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Droplet,
  Sparkles,
  X,
  Plus,
  Pencil,
  Heart,
  Activity,
  NotebookPen,
} from "lucide-react";
import {
  type CicloMenstrual,
  type RegistoCicloDia,
  type FluxoMenstrual,
  type HumorCiclo,
  type SintomaCiclo,
  type EstiloVidaTag,
  formatarData,
  formatarDataCurta,
} from "@/data/mock-utente";

/**
 * Hoje fictício da app — alinhado com o resto do mock.
 */
const HOJE_ISO = "2026-04-29";

function parseISO(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return new Date(iso);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function diasEntre(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}
function addDias(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

type Previsao = {
  ultimoInicio: string;
  cicloMedio: number;
  duracaoMedia: number;
  proximoInicio: string;
  ovulacao: string;
  janelaFertilInicio: string;
  janelaFertilFim: string;
  diasParaProxima: number;
  diaCiclo: number;
  emMenstruacao: boolean;
  emJanelaFertil: boolean;
};

function calcularPrevisao(ciclos: CicloMenstrual[]): Previsao | null {
  if (ciclos.length === 0) return null;
  const ord = [...ciclos].sort((a, b) => (a.inicio < b.inicio ? 1 : -1));
  const ultimoInicio = ord[0].inicio;

  // Ciclo médio: média das diferenças entre inícios consecutivos
  const gaps: number[] = [];
  for (let i = 0; i < ord.length - 1; i++) {
    gaps.push(diasEntre(ord[i + 1].inicio, ord[i].inicio));
  }
  const cicloMedio = gaps.length
    ? Math.round(gaps.reduce((s, v) => s + v, 0) / gaps.length)
    : 28;

  // Duração média do período
  const duracoes = ord
    .filter((c) => c.fim)
    .map((c) => diasEntre(c.inicio, c.fim!) + 1);
  const duracaoMedia = duracoes.length
    ? Math.round(duracoes.reduce((s, v) => s + v, 0) / duracoes.length)
    : 5;

  const proximoInicio = addDias(ultimoInicio, cicloMedio);
  const ovulacao = addDias(proximoInicio, -14);
  const janelaFertilInicio = addDias(ovulacao, -5);
  const janelaFertilFim = addDias(ovulacao, 1);

  const diasParaProxima = diasEntre(HOJE_ISO, proximoInicio);
  const diaCiclo = diasEntre(ultimoInicio, HOJE_ISO) + 1;

  const ultimo = ord[0];
  const emMenstruacao = ultimo.fim
    ? HOJE_ISO >= ultimo.inicio && HOJE_ISO <= ultimo.fim
    : HOJE_ISO >= ultimo.inicio &&
      diasEntre(ultimo.inicio, HOJE_ISO) <= duracaoMedia;
  const emJanelaFertil = HOJE_ISO >= janelaFertilInicio && HOJE_ISO <= janelaFertilFim;

  return {
    ultimoInicio,
    cicloMedio,
    duracaoMedia,
    proximoInicio,
    ovulacao,
    janelaFertilInicio,
    janelaFertilFim,
    diasParaProxima,
    diaCiclo,
    emMenstruacao,
    emJanelaFertil,
  };
}

export function CicloMenstrualCard({
  ciclos,
  onChange,
  registos = [],
  onRegistosChange,
}: {
  ciclos: CicloMenstrual[];
  onChange: (next: CicloMenstrual[]) => void;
  registos?: RegistoCicloDia[];
  onRegistosChange?: (next: RegistoCicloDia[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const previsao = useMemo(() => calcularPrevisao(ciclos), [ciclos]);
  const registoHoje = useMemo(
    () => registos.find((r) => r.data === HOJE_ISO),
    [registos],
  );

  const status = previsao?.emMenstruacao
    ? { label: "Menstruação", tone: "bg-state-alert/15 text-state-alert", dot: "bg-state-alert" }
    : previsao?.emJanelaFertil
      ? { label: "Janela fértil", tone: "bg-primary/15 text-primary", dot: "bg-primary" }
      : { label: `Dia ${previsao?.diaCiclo ?? 0} do ciclo`, tone: "bg-accent text-foreground/80", dot: "bg-foreground/40" };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="text-[11px] font-medium text-foreground">Ciclo menstrual</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Registar
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-2xl border border-border bg-surface-raised p-3.5 text-left transition-colors hover:bg-accent/30"
      >
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${status.tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {previsao && (
            <span className="ml-auto tabular text-[10.5px] text-muted-foreground">
              ciclo médio · {previsao.cicloMedio}d
            </span>
          )}
        </div>

        {previsao ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-accent/40 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[9.5px] uppercase tracking-wide text-muted-foreground">
                <Droplet className="h-2.5 w-2.5" />
                Próxima
              </div>
              <div className="font-serif tabular mt-0.5 text-[15px] leading-tight text-foreground">
                {formatarDataCurta(previsao.proximoInicio)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {previsao.diasParaProxima > 0
                  ? `em ${previsao.diasParaProxima} dias`
                  : previsao.diasParaProxima === 0
                    ? "hoje"
                    : `há ${Math.abs(previsao.diasParaProxima)} dias (atrasada)`}
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[9.5px] uppercase tracking-wide text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                Dias férteis
              </div>
              <div className="font-serif tabular mt-0.5 text-[15px] leading-tight text-foreground">
                {formatarDataCurta(previsao.janelaFertilInicio)} – {formatarDataCurta(previsao.janelaFertilFim)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                ovulação · {formatarDataCurta(previsao.ovulacao)}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            <Plus className="h-3.5 w-3.5" />
            Regista o início do teu ciclo para veres a previsão.
          </div>
        )}
      </button>

      {open && (
        <CicloDrawer
          ciclos={ciclos}
          previsao={previsao}
          onClose={() => setOpen(false)}
          onChange={onChange}
          registos={registos}
          onRegistosChange={onRegistosChange}
        />
      )}
    </section>
  );
}

function CicloDrawer({
  ciclos,
  previsao,
  onClose,
  onChange,
  registos = [],
  onRegistosChange,
}: {
  ciclos: CicloMenstrual[];
  previsao: Previsao | null;
  onClose: () => void;
  onChange: (next: CicloMenstrual[]) => void;
  registos?: RegistoCicloDia[];
  onRegistosChange?: (next: RegistoCicloDia[]) => void;
}) {
  const ord = useMemo(
    () => [...ciclos].sort((a, b) => (a.inicio < b.inicio ? 1 : -1)),
    [ciclos],
  );
  const ultimo = ord[0];

  const [novoInicio, setNovoInicio] = useState<string>(HOJE_ISO);
  const [fimEdit, setFimEdit] = useState<string>(ultimo?.fim ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function registarInicio() {
    if (!novoInicio) return;
    // Se o último não tem fim, mantemos. Se o novo for posterior ao último, criamos novo ciclo.
    if (ord.find((c) => c.inicio === novoInicio)) return;
    const novo: CicloMenstrual = {
      id: `cic-${novoInicio}`,
      inicio: novoInicio,
    };
    onChange([novo, ...ciclos]);
  }

  function registarFim() {
    if (!ultimo || !fimEdit) return;
    if (fimEdit < ultimo.inicio) return;
    onChange(
      ciclos.map((c) => (c.id === ultimo.id ? { ...c, fim: fimEdit } : c)),
    );
  }

  function remover(id: string) {
    onChange(ciclos.filter((c) => c.id !== id));
  }

  const registoHoje = useMemo<RegistoCicloDia>(
    () =>
      registos.find((r) => r.data === HOJE_ISO) ?? {
        id: `reg-${HOJE_ISO}`,
        data: HOJE_ISO,
        humor: [],
        sintomas: [],
        estiloVida: [],
      },
    [registos],
  );

  function atualizarRegisto(patch: Partial<RegistoCicloDia>) {
    if (!onRegistosChange) return;
    const existe = registos.some((r) => r.data === HOJE_ISO);
    const novo: RegistoCicloDia = { ...registoHoje, ...patch };
    if (existe) {
      onRegistosChange(registos.map((r) => (r.data === HOJE_ISO ? novo : r)));
    } else {
      onRegistosChange([novo, ...registos]);
    }
  }

  function toggleArr<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-sm"
      />
      <div className="max-h-[88%] overflow-y-auto rounded-t-3xl border-t border-border bg-surface-raised px-5 pb-7 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-[20px] leading-tight text-foreground">
              Ciclo menstrual
            </h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Aponta o início e o fim. A previsão atualiza automaticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {previsao && (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-3.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Previsão
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2.5 text-[12px]">
              <div>
                <div className="text-[10px] text-muted-foreground">Próxima menstruação</div>
                <div className="font-serif tabular text-[14px] text-foreground">
                  {formatarData(previsao.proximoInicio)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Janela fértil</div>
                <div className="font-serif tabular text-[14px] text-foreground">
                  {formatarDataCurta(previsao.janelaFertilInicio)} – {formatarDataCurta(previsao.janelaFertilFim)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Ovulação estimada</div>
                <div className="font-serif tabular text-[14px] text-foreground">
                  {formatarData(previsao.ovulacao)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Ciclo / período médio</div>
                <div className="font-serif tabular text-[14px] text-foreground">
                  {previsao.cicloMedio}d · {previsao.duracaoMedia}d
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10.5px] leading-snug text-muted-foreground">
              Estimativa baseada nos últimos {ciclos.length} ciclos. Não substitui aconselhamento médico.
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <CalendarIcon className="h-3 w-3" /> Novo início
            </div>
            <input
              type="date"
              value={novoInicio}
              onChange={(e) => setNovoInicio(e.target.value)}
              max={HOJE_ISO}
              className="tabular mt-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
            />
            <button
              type="button"
              onClick={registarInicio}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:bg-foreground/85"
            >
              <Plus className="h-3.5 w-3.5" /> Registar início
            </button>
          </div>

          {ultimo && (
            <div className="rounded-2xl border border-border bg-surface p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Pencil className="h-3 w-3" /> Fim do último ciclo
              </div>
              <div className="mt-1 text-[10.5px] text-muted-foreground">
                Início · {formatarDataCurta(ultimo.inicio)}
              </div>
              <input
                type="date"
                value={fimEdit}
                onChange={(e) => setFimEdit(e.target.value)}
                min={ultimo.inicio}
                max={HOJE_ISO}
                className="tabular mt-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
              />
              <button
                type="button"
                onClick={registarFim}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent"
              >
                Guardar fim
              </button>
            </div>
          )}
        </div>

        {onRegistosChange && (
          <RegistoDiarioSection
            registo={registoHoje}
            onPatch={atualizarRegisto}
            toggleArr={toggleArr}
          />
        )}

        <div className="mt-5">
          <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Histórico
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {ord.map((c, i) => {
              const dur = c.fim ? diasEntre(c.inicio, c.fim) + 1 : null;
              const gap = i < ord.length - 1 ? diasEntre(ord[i + 1].inicio, c.inicio) : null;
              return (
                <li key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Droplet className="h-3.5 w-3.5 shrink-0 text-state-alert" />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif tabular text-[13px] text-foreground">
                      {formatarDataCurta(c.inicio)}
                      {c.fim && ` – ${formatarDataCurta(c.fim)}`}
                    </div>
                    <div className="tabular text-[10px] text-muted-foreground">
                      {dur ? `${dur} dias` : "a decorrer"}
                      {gap ? ` · ciclo de ${gap}d` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(c.id)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Remover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
            {ord.length === 0 && (
              <li className="px-3.5 py-4 text-center text-[12px] text-muted-foreground">
                Sem registos.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}