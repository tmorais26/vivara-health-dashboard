import {
  calcularEstado,
  formatarData,
  formatarValor,
  type Marcador,
  type TipoTarefa,
} from "@/data/mock-utente";
import { Bell, ChevronDown, FlaskConical, MessageSquare, Pencil, Pill, Stethoscope } from "lucide-react";
import { useState } from "react";
import { LongitudinalChart } from "./LongitudinalChart";
import { StateTag } from "./StateTag";

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
  const [notaInternaAberta, setNotaInternaAberta] = useState(false);

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
          </div>
        </Card>
      </div>

      {/* Notas + próxima recolha */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-raised p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nota da médica
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
              "Sem notas para este marcador. A tendência mantém-se dentro do alvo funcional definido."}
          </p>
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
