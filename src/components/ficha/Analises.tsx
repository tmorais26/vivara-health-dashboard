import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Field,
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
  inputClass,
  textareaClass,
} from "@/components/portal/SimpleModal";
import {
  CATALOGO_MARCADORES,
  estadoReferencia,
  foraDoAlvo,
  formatarIntervalo,
  formatarNumero,
  grupoDe,
  lerNumero,
  normalizarMarcador,
  type EstadoRef,
} from "@/lib/marcadores";
import { eixoY } from "@/lib/eixo";
import { soData, type UtenteDb } from "@/lib/dados";
import { useIdioma, useT } from "@/lib/i18n";
import { useSessao } from "@/lib/sessao";
import { PedidosExame, type PedidoExameDb } from "@/components/ficha/PedidosExame";

type AnaliseDb = Tables<"analises">;
type ResultadoDb = Tables<"resultados">;
type AlvoDb = Tables<"alvos_marcador">;

const BUCKET = "analises";
const botao =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent";
const botaoPequeno =
  "rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-accent";

const COR_ESTADO: Record<EstadoRef, string> = {
  baixo: "bg-state-warn-soft text-foreground",
  alto: "bg-state-alert-soft text-state-alert",
  normal: "bg-state-ok-soft text-state-ok",
  sem_ref: "bg-muted text-muted-foreground",
};

type Serie = {
  chave: string;
  nome: string;
  unidade: string | null;
  grupo: string;
  pontos: (ResultadoDb & { data: string })[];
  alvo: AlvoDb | null;
};

export function Analises({
  utente,
  nomeDe,
}: {
  utente: UtenteDb;
  nomeDe: (id: string | null) => string;
}) {
  const ta = useT().analises;
  const idioma = useIdioma();
  const [analises, setAnalises] = useState<AnaliseDb[]>([]);
  const [resultados, setResultados] = useState<ResultadoDb[]>([]);
  const [alvos, setAlvos] = useState<AlvoDb[]>([]);
  const [pedidos, setPedidos] = useState<PedidoExameDb[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [registar, setRegistar] = useState(false);

  const carregar = useCallback(async () => {
    const [a, r, al, pe] = await Promise.all([
      supabase
        .from("analises")
        .select("*")
        .eq("utente_id", utente.id)
        .order("data_colheita", { ascending: false }),
      supabase.from("resultados").select("*").eq("utente_id", utente.id),
      supabase.from("alvos_marcador").select("*").eq("utente_id", utente.id),
      supabase
        .from("pedidos_exame")
        .select("*")
        .eq("utente_id", utente.id)
        .order("pedido_em", { ascending: false }),
    ]);
    setAnalises(a.data ?? []);
    setResultados(r.data ?? []);
    setAlvos(al.data ?? []);
    setPedidos(pe.data ?? []);
  }, [utente.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Agrupa os resultados por marcador (ignorando análises marcadas como erro), do mais antigo ao mais recente.
  const series = useMemo<Serie[]>(() => {
    const porAnalise = new Map(analises.map((a) => [a.id, a]));
    const mapa = new Map<string, Serie>();
    for (const r of resultados) {
      const a = porAnalise.get(r.analise_id);
      if (!a || a.estado === "erro") continue;
      const chave = normalizarMarcador(r.marcador);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          chave,
          nome: r.marcador,
          unidade: r.unidade,
          grupo: grupoDe(r.marcador),
          pontos: [],
          alvo: alvos.find((x) => normalizarMarcador(x.marcador) === chave) ?? null,
        });
      }
      mapa.get(chave)!.pontos.push({ ...r, data: a.data_colheita });
    }
    const lista = [...mapa.values()];
    for (const s of lista) {
      s.pontos.sort((x, y) => x.data.localeCompare(y.data));
      const ultimo = s.pontos[s.pontos.length - 1];
      s.nome = ultimo.marcador;
      s.unidade = ultimo.unidade;
    }
    return lista.sort((x, y) => x.grupo.localeCompare(y.grupo) || x.nome.localeCompare(y.nome));
  }, [analises, resultados, alvos]);

  const grupos = useMemo(() => {
    const g = new Map<string, Serie[]>();
    for (const s of series) (g.get(s.grupo) ?? g.set(s.grupo, []).get(s.grupo)!).push(s);
    return [...g.entries()];
  }, [series]);

  const nResultados = (id: string) => resultados.filter((r) => r.analise_id === id).length;

  // A janela abre logo no clique (senão o browser bloqueia-a por ser aberta depois de uma espera)
  // e só depois recebe a ligação temporária (2 minutos) para o relatório.
  async function abrirFicheiro(a: AnaliseDb) {
    if (!a.ficheiro_path) return;
    const janela = window.open("", "_blank");
    if (janela) janela.opener = null;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(a.ficheiro_path, 120);
    if (!data?.signedUrl) {
      janela?.close();
      return;
    }
    if (janela) janela.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  }

  async function marcarErro(a: AnaliseDb) {
    if (!window.confirm(ta.confirmarErro)) return;
    await supabase.from("analises").update({ estado: "erro" }).eq("id", a.id);
    await carregar();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRegistar(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {ta.registar}
        </button>
      </div>

      <PedidosExame utente={utente} pedidos={pedidos} onMudou={carregar} />

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          {ta.marcadores}
        </h2>
        {series.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ta.semMarcadores}</p>
        ) : (
          <div className="space-y-4">
            {grupos.map(([grupo, lista]) => (
              <div key={grupo}>
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">{grupo}</div>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {lista.map((s) => (
                    <LinhaMarcador
                      key={s.chave}
                      serie={s}
                      aberto={aberto === s.chave}
                      onAlternar={() => setAberto((x) => (x === s.chave ? null : s.chave))}
                      utente={utente}
                      onMudou={carregar}
                      idioma={idioma}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          {ta.relatorios}
        </h2>
        {analises.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ta.semRelatorios}</p>
        ) : (
          <ul className="divide-y divide-border">
            {analises.map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-start justify-between gap-2 py-3 ${a.estado === "erro" ? "opacity-50" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-sm text-foreground">
                    {a.titulo || ta.tipos[a.tipo]} · {soData(a.data_colheita, idioma)}
                    {a.estado === "erro" && (
                      <span className="ml-2 text-[11px] text-state-alert">({ta.erroBadge})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {[
                      a.laboratorio,
                      nResultados(a.id) ? ta.nResultados(nResultados(a.id)) : null,
                      ta.por(nomeDe(a.autor_id)),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {a.notas && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">{a.notas}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.ficheiro_path && (
                    <button
                      type="button"
                      className={`${botaoPequeno} inline-flex items-center gap-1`}
                      onClick={() => void abrirFicheiro(a)}
                    >
                      <FileText className="h-3 w-3" />
                      {ta.abrirRelatorio}
                    </button>
                  )}
                  {a.estado !== "erro" && (
                    <button
                      type="button"
                      className={botaoPequeno}
                      onClick={() => void marcarErro(a)}
                    >
                      {ta.marcarErro}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RegistarAnalise
        open={registar}
        onClose={() => setRegistar(false)}
        utente={utente}
        anteriores={resultados}
        pendentes={pedidos.filter((p) => p.estado === "pendente")}
        onGuardado={() => {
          setRegistar(false);
          void carregar();
        }}
      />
    </div>
  );
}

function Tendencia({ serie }: { serie: Serie }) {
  const n = serie.pontos.length;
  if (n < 2) return null;
  const a = serie.pontos[n - 2].valor;
  const b = serie.pontos[n - 1].valor;
  if (a === null || b === null) return null;
  const Icone = b > a ? ArrowUp : b < a ? ArrowDown : ArrowRight;
  return (
    <Icone
      className="h-3.5 w-3.5 text-muted-foreground"
      aria-label={`${formatarNumero(a)} → ${formatarNumero(b)}`}
    />
  );
}

function LinhaMarcador({
  serie,
  aberto,
  onAlternar,
  utente,
  onMudou,
  idioma,
}: {
  serie: Serie;
  aberto: boolean;
  onAlternar: () => void;
  utente: UtenteDb;
  onMudou: () => void;
  idioma: "pt" | "en";
}) {
  const ta = useT().analises;
  const ultimo = serie.pontos[serie.pontos.length - 1];
  const estado = estadoReferencia(ultimo.valor, ultimo.ref_min, ultimo.ref_max);
  const fora = serie.alvo
    ? foraDoAlvo(ultimo.valor, serie.alvo.alvo_min, serie.alvo.alvo_max)
    : null;

  return (
    <li>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left hover:bg-accent/50"
      >
        {aberto ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="min-w-[140px] flex-1 text-sm text-foreground">{serie.nome}</span>
        <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-foreground">
          {ultimo.valor !== null ? formatarNumero(ultimo.valor) : ultimo.valor_texto}
          <span className="text-[11px] font-normal text-muted-foreground">{serie.unidade}</span>
          <Tendencia serie={serie} />
        </span>
        <span className="text-[11px] text-muted-foreground">{soData(ultimo.data, idioma)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] ${COR_ESTADO[estado]}`}>
          {ta.estados[estado]}
        </span>
        {fora !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] ${fora ? "bg-state-warn-soft text-foreground" : "bg-state-ok-soft text-state-ok"}`}
          >
            {fora ? ta.foraAlvo : ta.noAlvo}
          </span>
        )}
      </button>
      {aberto && (
        <DetalheMarcador serie={serie} utente={utente} onMudou={onMudou} idioma={idioma} />
      )}
    </li>
  );
}

function DetalheMarcador({
  serie,
  utente,
  onMudou,
  idioma,
}: {
  serie: Serie;
  utente: UtenteDb;
  onMudou: () => void;
  idioma: "pt" | "en";
}) {
  const ta = useT().analises;
  const { atual } = useSessao();
  const numericos = serie.pontos.filter((p) => p.valor !== null);
  const ultimo = serie.pontos[serie.pontos.length - 1];
  const [editarAlvo, setEditarAlvo] = useState(false);
  const [alvoMin, setAlvoMin] = useState(serie.alvo?.alvo_min?.toString() ?? "");
  const [alvoMax, setAlvoMax] = useState(serie.alvo?.alvo_max?.toString() ?? "");
  const [justificacao, setJustificacao] = useState(serie.alvo?.justificacao ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const dados = numericos.map((p) => ({
    ts: new Date(p.data).getTime(),
    valor: p.valor as number,
    data: p.data,
  }));
  const valores = dados.map((d) => d.valor);
  const extremos = [
    ...valores,
    ...[
      ultimo.ref_min,
      ultimo.ref_max,
      serie.alvo?.alvo_min ?? null,
      serie.alvo?.alvo_max ?? null,
    ].filter((x): x is number => x !== null),
  ];
  const eixo = extremos.length
    ? eixoY(
        Math.min(...extremos),
        Math.max(...extremos),
        extremos.every((v) => v >= 0),
      )
    : null;

  async function guardarAlvo() {
    if (!atual) return;
    const min = lerNumero(alvoMin);
    const max = lerNumero(alvoMax);
    if ((min === null && max === null) || (min !== null && max !== null && min > max))
      return setErro(ta.alvoInvalido);
    const dadosAlvo = { alvo_min: min, alvo_max: max, justificacao: justificacao.trim() || null };
    const { error } = serie.alvo
      ? await supabase.from("alvos_marcador").update(dadosAlvo).eq("id", serie.alvo.id)
      : await supabase.from("alvos_marcador").insert({
          ...dadosAlvo,
          espaco_id: utente.espaco_id,
          utente_id: utente.id,
          autor_id: atual.id,
          marcador: serie.nome,
        });
    if (error) return setErro(ta.erro);
    setEditarAlvo(false);
    setErro(null);
    onMudou();
  }

  return (
    <div className="space-y-3 border-t border-border bg-background/50 px-3 py-3">
      {dados.length >= 2 && eixo && (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              {(ultimo.ref_min !== null || ultimo.ref_max !== null) && (
                <ReferenceArea
                  y1={ultimo.ref_min ?? eixo.dominio[0]}
                  y2={ultimo.ref_max ?? eixo.dominio[1]}
                  fill="var(--muted)"
                  fillOpacity={0.5}
                />
              )}
              {serie.alvo && (
                <ReferenceArea
                  y1={serie.alvo.alvo_min ?? eixo.dominio[0]}
                  y2={serie.alvo.alvo_max ?? eixo.dominio[1]}
                  fill="var(--state-ok)"
                  fillOpacity={0.08}
                  stroke="var(--state-ok)"
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                />
              )}
              <XAxis
                dataKey="ts"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) =>
                  new Date(t).toLocaleDateString(idioma === "pt" ? "pt-PT" : "en-GB", {
                    month: "short",
                    year: "2-digit",
                  })
                }
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                domain={eixo.dominio}
                ticks={eixo.ticks}
                tickFormatter={(v: number) => formatarNumero(v)}
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                formatter={(v: number) => [
                  `${formatarNumero(v)} ${serie.unidade ?? ""}`,
                  serie.nome,
                ]}
                labelFormatter={(t: number) =>
                  new Date(t).toLocaleDateString(idioma === "pt" ? "pt-PT" : "en-GB")
                }
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="var(--foreground)"
                strokeWidth={1.75}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {(ultimo.ref_min !== null || ultimo.ref_max !== null) && (
          <span>{ta.ref(formatarIntervalo(ultimo.ref_min, ultimo.ref_max))}</span>
        )}
        {serie.alvo && (
          <span className="text-state-ok">
            · {ta.alvo(formatarIntervalo(serie.alvo.alvo_min, serie.alvo.alvo_max))}
            {serie.alvo.justificacao ? ` — ${serie.alvo.justificacao}` : ""}
          </span>
        )}
        {!editarAlvo && (
          <button
            type="button"
            className={`${botaoPequeno} inline-flex items-center gap-1`}
            onClick={() => setEditarAlvo(true)}
          >
            <Target className="h-3 w-3" />
            {serie.alvo ? ta.alterarAlvo : ta.definirAlvo}
          </button>
        )}
      </div>

      {editarAlvo && (
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <p className="mb-2 text-[11px] text-muted-foreground">{ta.alvoAjuda}</p>
          <div className="grid gap-2 sm:grid-cols-[100px_100px_1fr_auto] sm:items-end">
            <Field label={ta.alvoMin}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={alvoMin}
                onChange={(e) => setAlvoMin(e.target.value)}
              />
            </Field>
            <Field label={ta.alvoMax}>
              <input
                className={inputClass}
                inputMode="decimal"
                value={alvoMax}
                onChange={(e) => setAlvoMax(e.target.value)}
              />
            </Field>
            <Field label={ta.justificacao}>
              <input
                className={inputClass}
                value={justificacao}
                onChange={(e) => setJustificacao(e.target.value)}
                maxLength={1000}
              />
            </Field>
            <div className="flex gap-1.5 pb-0.5">
              <button type="button" className={botaoPequeno} onClick={() => setEditarAlvo(false)}>
                {ta.cancelar}
              </button>
              <button type="button" className={botaoPequeno} onClick={() => void guardarAlvo()}>
                {ta.guardar}
              </button>
            </div>
          </div>
          {erro && (
            <p role="alert" className="mt-2 text-xs text-state-alert">
              {erro}
            </p>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          {ta.historico}
        </div>
        <ul className="space-y-0.5 text-xs">
          {[...serie.pontos].reverse().map((p) => (
            <li key={p.id} className="flex flex-wrap gap-x-3 text-foreground">
              <span className="w-24 text-muted-foreground">{soData(p.data, idioma)}</span>
              <span className="tabular-nums">
                {p.valor !== null ? formatarNumero(p.valor) : p.valor_texto} {p.unidade}
              </span>
              {(p.ref_min !== null || p.ref_max !== null) && (
                <span className="text-muted-foreground">
                  {ta.ref(formatarIntervalo(p.ref_min, p.ref_max))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type Linha = { marcador: string; valor: string; unidade: string; refMin: string; refMax: string };
const LINHA_VAZIA: Linha = { marcador: "", valor: "", unidade: "", refMin: "", refMax: "" };

function RegistarAnalise({
  open,
  onClose,
  utente,
  anteriores,
  pendentes,
  onGuardado,
}: {
  open: boolean;
  onClose: () => void;
  utente: UtenteDb;
  anteriores: ResultadoDb[];
  pendentes: PedidoExameDb[];
  onGuardado: () => void;
}) {
  const ta = useT().analises;
  const { atual } = useSessao();
  const [data, setData] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [tipo, setTipo] = useState("analises");
  const [titulo, setTitulo] = useState("");
  const [notas, setNotas] = useState("");
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([{ ...LINHA_VAZIA }]);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [responde, setResponde] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setResponde([]);
    setData(new Date().toISOString().slice(0, 10));
    setLaboratorio("");
    setTipo("analises");
    setTitulo("");
    setNotas("");
    setFicheiro(null);
    setLinhas([{ ...LINHA_VAZIA }]);
    setErro(null);
  }, [open]);

  // Sugestões: catálogo + marcadores já usados neste utente.
  const sugestoes = useMemo(() => {
    const nomes = new Map<string, string>();
    for (const m of CATALOGO_MARCADORES) nomes.set(normalizarMarcador(m.nome), m.nome);
    for (const r of anteriores) nomes.set(normalizarMarcador(r.marcador), r.marcador);
    return [...nomes.values()].sort((a, b) => a.localeCompare(b));
  }, [anteriores]);

  // Ao escolher um marcador, preenche a unidade e a referência que usou da última vez (ou a unidade do catálogo).
  function mudarMarcador(i: number, nome: string) {
    setLinhas((ls) =>
      ls.map((l, j) => {
        if (j !== i) return l;
        const chave = normalizarMarcador(nome);
        const ant = [...anteriores].reverse().find((r) => normalizarMarcador(r.marcador) === chave);
        const cat = CATALOGO_MARCADORES.find((m) => normalizarMarcador(m.nome) === chave);
        return {
          ...l,
          marcador: nome,
          unidade: l.unidade || ant?.unidade || cat?.unidade || "",
          refMin: l.refMin || (ant?.ref_min != null ? String(ant.ref_min) : ""),
          refMax: l.refMax || (ant?.ref_max != null ? String(ant.ref_max) : ""),
        };
      }),
    );
  }

  const set = (i: number, k: keyof Linha, v: string) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  async function guardar() {
    if (!atual) return;
    setErro(null);
    const preenchidas = linhas.filter((l) => l.marcador.trim() || l.valor.trim());
    for (let i = 0; i < preenchidas.length; i++) {
      if (!preenchidas[i].marcador.trim() || !preenchidas[i].valor.trim())
        return setErro(ta.linhaIncompleta(i + 1));
    }
    if (preenchidas.length === 0 && !ficheiro && !notas.trim()) return setErro(ta.semResultados);
    setAGuardar(true);

    let ficheiro_path: string | null = null;
    if (ficheiro) {
      const nomeSeguro = ficheiro.name
        .normalize("NFD")
        .replace(/[^\w.-]+/g, "_")
        .slice(-80);
      ficheiro_path = `${utente.espaco_id}/${utente.id}/${crypto.randomUUID()}-${nomeSeguro}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(ficheiro_path, ficheiro, { contentType: ficheiro.type });
      if (error) {
        setAGuardar(false);
        return setErro(ta.erroFicheiro);
      }
    }

    const analiseId = crypto.randomUUID();
    const { error: eA } = await supabase.from("analises").insert({
      id: analiseId,
      espaco_id: utente.espaco_id,
      utente_id: utente.id,
      autor_id: atual.id,
      data_colheita: data,
      laboratorio: laboratorio.trim() || null,
      tipo,
      titulo: titulo.trim() || null,
      notas: notas.trim() || null,
      ficheiro_path,
      ficheiro_nome: ficheiro?.name.slice(0, 200) ?? null,
    });
    if (eA) {
      setAGuardar(false);
      return setErro(ta.erro);
    }
    if (preenchidas.length) {
      const { error: eR } = await supabase.from("resultados").insert(
        preenchidas.map((l) => {
          const n = lerNumero(l.valor);
          return {
            analise_id: analiseId,
            espaco_id: utente.espaco_id,
            utente_id: utente.id,
            autor_id: atual.id,
            marcador: l.marcador.trim(),
            valor: n,
            valor_texto: n === null ? l.valor.trim() : null,
            unidade: l.unidade.trim() || null,
            ref_min: lerNumero(l.refMin),
            ref_max: lerNumero(l.refMax),
          };
        }),
      );
      if (eR) {
        setAGuardar(false);
        return setErro(ta.erro);
      }
    }
    // Os exames pedidos a que este registo responde deixam de estar pendentes.
    if (responde.length) {
      await supabase
        .from("pedidos_exame")
        .update({ estado: "recebido", analise_id: analiseId })
        .in("id", responde);
    }
    setAGuardar(false);
    onGuardado();
  }

  return (
    <SimpleModal open={open} onClose={onClose} title={ta.registar} width="lg">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={ta.dataColheita}>
          <input
            className={inputClass}
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </Field>
        <Field label={ta.tipo}>
          <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(ta.tipos).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label={ta.laboratorio}>
          <input
            className={inputClass}
            value={laboratorio}
            onChange={(e) => setLaboratorio(e.target.value)}
            maxLength={200}
          />
        </Field>
      </div>
      {tipo !== "analises" && (
        <div className="mt-3 grid gap-3">
          <Field label={ta.titulo}>
            <input
              className={inputClass}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={ta.tituloPlaceholder}
              maxLength={200}
            />
          </Field>
          <Field label={ta.notas}>
            <textarea
              className={textareaClass}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={4000}
            />
          </Field>
        </div>
      )}
      <div className="mt-3">
        <Field label={ta.ficheiro} hint={ta.ficheiroAjuda}>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => setFicheiro(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs"
          />
        </Field>
      </div>

      {pendentes.length > 0 && (
        <fieldset className="mt-4">
          <legend className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {ta.respondeA}
          </legend>
          <div className="space-y-1">
            {pendentes.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={responde.includes(p.id)}
                  onChange={(e) =>
                    setResponde((r) =>
                      e.target.checked ? [...r, p.id] : r.filter((x) => x !== p.id),
                    )
                  }
                  className="accent-foreground"
                />
                {p.descricao}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          {ta.resultados}
        </div>
        <p className="mb-2 text-[11px] text-muted-foreground">{ta.refAjuda}</p>
        <datalist id="marcadores-sugeridos">
          {sugestoes.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="space-y-2">
          {linhas.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.7fr_0.7fr_auto] sm:items-end"
            >
              <div className="col-span-2 sm:col-span-1">
                <Field label={i === 0 ? ta.marcador : ""}>
                  <input
                    className={inputClass}
                    list="marcadores-sugeridos"
                    value={l.marcador}
                    onChange={(e) => mudarMarcador(i, e.target.value)}
                    aria-label={`${ta.marcador} ${i + 1}`}
                    maxLength={120}
                  />
                </Field>
              </div>
              <Field label={i === 0 ? ta.valor : ""}>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={l.valor}
                  onChange={(e) => set(i, "valor", e.target.value)}
                  aria-label={`${ta.valor} ${i + 1}`}
                />
              </Field>
              <Field label={i === 0 ? ta.unidade : ""}>
                <input
                  className={inputClass}
                  value={l.unidade}
                  onChange={(e) => set(i, "unidade", e.target.value)}
                  aria-label={`${ta.unidade} ${i + 1}`}
                  maxLength={40}
                />
              </Field>
              <Field label={i === 0 ? ta.refMin : ""}>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={l.refMin}
                  onChange={(e) => set(i, "refMin", e.target.value)}
                  aria-label={`${ta.refMin} ${i + 1}`}
                />
              </Field>
              <Field label={i === 0 ? ta.refMax : ""}>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={l.refMax}
                  onChange={(e) => set(i, "refMax", e.target.value)}
                  aria-label={`${ta.refMax} ${i + 1}`}
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  setLinhas((ls) =>
                    ls.length > 1 ? ls.filter((_, j) => j !== i) : [{ ...LINHA_VAZIA }],
                  )
                }
                aria-label={`${ta.removerLinha} ${i + 1}`}
                className="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${botao} mt-2`}
          onClick={() => setLinhas((ls) => [...ls, { ...LINHA_VAZIA }])}
        >
          <Plus className="h-3.5 w-3.5" />
          {ta.adicionarLinha}
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-3 text-sm text-state-alert">
          {erro}
        </p>
      )}
      <ModalActions>
        <SecondaryButton onClick={onClose}>{ta.cancelar}</SecondaryButton>
        <PrimaryButton onClick={() => void guardar()}>{aGuardar ? "…" : ta.guardar}</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}
