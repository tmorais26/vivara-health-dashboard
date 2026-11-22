import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Info, Pill, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Field,
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
  inputClass,
} from "@/components/portal/SimpleModal";
import { URL_PEM_SPMS } from "@/lib/legal-docs";
import { soData, type UtenteDb } from "@/lib/dados";
import { useIdioma, useT } from "@/lib/i18n";
import { useSessao } from "@/lib/sessao";

type MedicacaoDb = Tables<"medicacoes">;
type AlergiaDb = Tables<"alergias">;
type Estado = "suspensa" | "terminada" | "erro";

const FORMAS = [
  "comprimido",
  "cápsula",
  "comprimido revestido",
  "solução oral",
  "xarope",
  "gotas orais",
  "pó para suspensão oral",
  "solução injetável",
  "creme",
  "pomada",
  "gel",
  "inalador",
  "adesivo transdérmico",
  "supositório",
  "colírio",
  "spray nasal",
  "outra",
];
const VIAS = [
  "oral",
  "sublingual",
  "cutânea",
  "inalatória",
  "nasal",
  "oftálmica",
  "retal",
  "vaginal",
  "intramuscular",
  "subcutânea",
  "intravenosa",
  "outra",
];

const botao =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent";
const botaoPequeno =
  "rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground hover:bg-accent";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Correspondência simples por texto entre a substância e as alergias registadas. É um aviso, não substitui a avaliação clínica.
function alergiaCorrespondente(texto: string, alergias: AlergiaDb[]) {
  const t = norm(texto);
  if (t.length < 3) return null;
  return alergias.find((a) => {
    const s = norm(a.substancia);
    return s.length >= 3 && (t.includes(s) || s.includes(t));
  });
}

export function Medicacao({
  utente,
  nomeDe,
}: {
  utente: UtenteDb;
  nomeDe: (id: string | null) => string;
}) {
  const t = useT();
  const tm = t.medicacao;
  const idioma = useIdioma();
  const [meds, setMeds] = useState<MedicacaoDb[]>([]);
  const [alergias, setAlergias] = useState<AlergiaDb[]>([]);
  const [editar, setEditar] = useState<MedicacaoDb | "nova" | null>(null);
  const [mudarEstado, setMudarEstado] = useState<{ med: MedicacaoDb; estado: Estado } | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);

  const carregar = useCallback(async () => {
    const [m, a] = await Promise.all([
      supabase
        .from("medicacoes")
        .select("*")
        .eq("utente_id", utente.id)
        .order("inicio", { ascending: false }),
      supabase
        .from("alergias")
        .select("*")
        .eq("utente_id", utente.id)
        .eq("ativa", true)
        .order("criado_em"),
    ]);
    setMeds(m.data ?? []);
    setAlergias(a.data ?? []);
  }, [utente.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ativas = meds.filter((m) => m.estado === "ativa");
  const historico = meds.filter((m) => m.estado !== "ativa");

  async function reativar(m: MedicacaoDb) {
    await supabase
      .from("medicacoes")
      .update({ estado: "ativa", estado_motivo: null })
      .eq("id", m.id);
    await carregar();
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border border-border bg-surface-raised px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {tm.aviso}
      </p>

      <div className="flex flex-wrap gap-2">
        <a href={URL_PEM_SPMS} target="_blank" rel="noopener noreferrer" className={botao}>
          <ExternalLink className="h-3.5 w-3.5" />
          {tm.prescreverPem}
        </a>
        <button
          type="button"
          onClick={() => setEditar("nova")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {tm.registar}
        </button>
      </div>

      <Alergias utente={utente} alergias={alergias} onMudou={carregar} />

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          {tm.ativa}
        </h2>
        {ativas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tm.semAtiva}</p>
        ) : (
          <ul className="divide-y divide-border">
            {ativas.map((m) => (
              <li key={m.id} className="py-3">
                <LinhaMedicacao m={m} alergias={alergias} nomeDe={nomeDe} idioma={idioma} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button type="button" className={botaoPequeno} onClick={() => setEditar(m)}>
                    {tm.editar}
                  </button>
                  <button
                    type="button"
                    className={botaoPequeno}
                    onClick={() => setMudarEstado({ med: m, estado: "suspensa" })}
                  >
                    {tm.suspender}
                  </button>
                  <button
                    type="button"
                    className={botaoPequeno}
                    onClick={() => setMudarEstado({ med: m, estado: "terminada" })}
                  >
                    {tm.terminar}
                  </button>
                  <button
                    type="button"
                    className={botaoPequeno}
                    onClick={() => setMudarEstado({ med: m, estado: "erro" })}
                  >
                    {tm.marcarErro}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <button
          type="button"
          onClick={() => setVerHistorico((v) => !v)}
          aria-expanded={verHistorico}
          className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {tm.historico} ({historico.length}) {verHistorico ? "▴" : "▾"}
        </button>
        {verHistorico &&
          (historico.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{tm.semHistorico}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {historico.map((m) => (
                <li key={m.id} className={`py-3 ${m.estado === "erro" ? "opacity-60" : ""}`}>
                  <LinhaMedicacao m={m} alergias={[]} nomeDe={nomeDe} idioma={idioma} />
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {tm.estados[m.estado]}
                    {m.estado_em ? ` · ${soData(m.estado_em, idioma)}` : ""}
                    {m.estado_motivo ? ` · ${m.estado_motivo}` : ""}
                  </div>
                  {m.estado === "suspensa" && (
                    <button
                      type="button"
                      className={`${botaoPequeno} mt-2`}
                      onClick={() => void reativar(m)}
                    >
                      {tm.reativar}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </section>

      <EditarMedicacao
        aberto={editar}
        onClose={() => setEditar(null)}
        utente={utente}
        alergias={alergias}
        onGuardado={() => {
          setEditar(null);
          void carregar();
        }}
      />
      <MudarEstado
        pedido={mudarEstado}
        onClose={() => setMudarEstado(null)}
        onFeito={() => {
          setMudarEstado(null);
          void carregar();
        }}
      />
    </div>
  );
}

function LinhaMedicacao({
  m,
  alergias,
  nomeDe,
  idioma,
}: {
  m: MedicacaoDb;
  alergias: AlergiaDb[];
  nomeDe: (id: string | null) => string;
  idioma: "pt" | "en";
}) {
  const tm = useT().medicacao;
  const alerta = alergiaCorrespondente(`${m.dci} ${m.nome_comercial ?? ""}`, alergias);
  return (
    <div className="flex items-start gap-2">
      <Pill className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">
          {m.dci}
          {m.dosagem ? ` ${m.dosagem}` : ""}
          {m.forma ? ` · ${m.forma}` : ""}
          {m.nome_comercial ? (
            <span className="font-normal text-muted-foreground"> ({m.nome_comercial})</span>
          ) : null}
        </div>
        <div className="text-sm text-foreground">{m.posologia}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {tm.desde(soData(m.inicio, idioma))}
          {m.cronica ? ` · ${tm.cronicaBadge}` : m.fim ? ` · ${tm.ate(soData(m.fim, idioma))}` : ""}
          {m.motivo ? ` · ${m.motivo}` : ""}
          {` · ${tm.origens[m.origem]}`}
          {m.numero_receita ? ` · ${tm.receita(m.numero_receita)}` : ""}
          {` · ${tm.por(nomeDe(m.autor_id))}`}
        </div>
        {alerta && (
          <p className="mt-1 flex items-center gap-1 text-xs text-state-alert">
            <AlertTriangle className="h-3.5 w-3.5" />
            {tm.alertaAlergia(alerta.substancia)}
          </p>
        )}
      </div>
    </div>
  );
}

function Alergias({
  utente,
  alergias,
  onMudou,
}: {
  utente: UtenteDb;
  alergias: AlergiaDb[];
  onMudou: () => void;
}) {
  const tm = useT().medicacao;
  const { atual } = useSessao();
  const [aAdicionar, setAAdicionar] = useState(false);
  const [substancia, setSubstancia] = useState("");
  const [reacao, setReacao] = useState("");
  const [gravidade, setGravidade] = useState("desconhecida");
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar() {
    if (!atual || !substancia.trim()) return;
    const { error } = await supabase.from("alergias").insert({
      espaco_id: atual.espaco_id,
      utente_id: utente.id,
      autor_id: atual.id,
      substancia: substancia.trim(),
      reacao: reacao.trim() || null,
      gravidade,
    });
    if (error) return setErro(tm.erro);
    setSubstancia("");
    setReacao("");
    setGravidade("desconhecida");
    setAAdicionar(false);
    setErro(null);
    onMudou();
  }

  async function retirar(a: AlergiaDb) {
    await supabase.from("alergias").update({ ativa: false }).eq("id", a.id);
    onMudou();
  }

  const cor = (g: string) =>
    g === "grave"
      ? "border-state-alert/40 bg-state-alert-soft text-state-alert"
      : g === "moderada"
        ? "border-state-warn/40 bg-state-warn-soft text-foreground"
        : "border-border bg-background text-foreground";

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {tm.alergias}
        </h2>
        {!aAdicionar && (
          <button type="button" className={botaoPequeno} onClick={() => setAAdicionar(true)}>
            {tm.adicionarAlergia}
          </button>
        )}
      </div>
      {alergias.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tm.semAlergias}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {alergias.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${cor(a.gravidade)}`}
            >
              <span>
                <strong className="font-medium">{a.substancia}</strong>
                {a.reacao ? ` · ${a.reacao}` : ""} · {tm.gravidades[a.gravidade]}
              </span>
              <button
                type="button"
                onClick={() => void retirar(a)}
                className="text-[11px] underline opacity-70 hover:opacity-100"
              >
                {tm.retirarAlergia}
              </button>
            </li>
          ))}
        </ul>
      )}
      {aAdicionar && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <Field label={tm.substancia}>
            <input
              className={inputClass}
              value={substancia}
              onChange={(e) => setSubstancia(e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label={tm.reacao}>
            <input
              className={inputClass}
              value={reacao}
              onChange={(e) => setReacao(e.target.value)}
              maxLength={300}
            />
          </Field>
          <Field label={tm.gravidade}>
            <select
              className={inputClass}
              value={gravidade}
              onChange={(e) => setGravidade(e.target.value)}
            >
              {Object.entries(tm.gravidades).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-1.5 pb-0.5">
            <button type="button" className={botaoPequeno} onClick={() => setAAdicionar(false)}>
              {tm.cancelar}
            </button>
            <button
              type="button"
              className={botaoPequeno}
              disabled={!substancia.trim()}
              onClick={() => void adicionar()}
            >
              {tm.guardar}
            </button>
          </div>
        </div>
      )}
      {erro && (
        <p role="alert" className="mt-2 text-xs text-state-alert">
          {erro}
        </p>
      )}
    </section>
  );
}

const VAZIO = {
  dci: "",
  nome_comercial: "",
  dosagem: "",
  forma: "",
  via: "",
  posologia: "",
  embalagens: "",
  inicio: "",
  fim: "",
  cronica: false,
  motivo: "",
  origem: "pem_spms",
  numero_receita: "",
};

function EditarMedicacao({
  aberto,
  onClose,
  utente,
  alergias,
  onGuardado,
}: {
  aberto: MedicacaoDb | "nova" | null;
  onClose: () => void;
  utente: UtenteDb;
  alergias: AlergiaDb[];
  onGuardado: () => void;
}) {
  const tm = useT().medicacao;
  const { atual } = useSessao();
  const [f, setF] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    if (aberto === "nova") {
      setF({ ...VAZIO, inicio: new Date().toISOString().slice(0, 10) });
    } else {
      setF({
        dci: aberto.dci,
        nome_comercial: aberto.nome_comercial ?? "",
        dosagem: aberto.dosagem ?? "",
        forma: aberto.forma ?? "",
        via: aberto.via ?? "",
        posologia: aberto.posologia,
        embalagens: aberto.embalagens ? String(aberto.embalagens) : "",
        inicio: aberto.inicio,
        fim: aberto.fim ?? "",
        cronica: aberto.cronica,
        motivo: aberto.motivo ?? "",
        origem: aberto.origem,
        numero_receita: aberto.numero_receita ?? "",
      });
    }
  }, [aberto]);

  const alerta = useMemo(
    () => alergiaCorrespondente(`${f.dci} ${f.nome_comercial}`, alergias),
    [f.dci, f.nome_comercial, alergias],
  );

  const set =
    (k: keyof typeof VAZIO) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar() {
    if (!atual || !aberto) return;
    if (!f.dci.trim() || !f.posologia.trim()) return setErro(tm.obrigatorios);
    const receita = f.numero_receita.replace(/\s/g, "");
    if (receita && !/^[0-9]{10,25}$/.test(receita)) return setErro(tm.numeroReceitaInvalido);
    if (!f.cronica && f.fim && f.inicio && f.fim < f.inicio) return setErro(tm.datasInvalidas);
    const dados = {
      dci: f.dci.trim(),
      nome_comercial: f.nome_comercial.trim() || null,
      dosagem: f.dosagem.trim() || null,
      forma: f.forma || null,
      via: f.via || null,
      posologia: f.posologia.trim(),
      embalagens: f.embalagens ? Math.min(99, Math.max(1, Number(f.embalagens))) : null,
      inicio: f.inicio || new Date().toISOString().slice(0, 10),
      fim: f.cronica ? null : f.fim || null,
      cronica: f.cronica,
      motivo: f.motivo.trim() || null,
      origem: f.origem,
      numero_receita: receita || null,
    };
    setAGuardar(true);
    const { error } =
      aberto === "nova"
        ? await supabase.from("medicacoes").insert({
            ...dados,
            espaco_id: atual.espaco_id,
            utente_id: utente.id,
            autor_id: atual.id,
          })
        : await supabase.from("medicacoes").update(dados).eq("id", aberto.id);
    setAGuardar(false);
    if (error) return setErro(tm.erro);
    onGuardado();
  }

  return (
    <SimpleModal
      open={aberto !== null}
      onClose={onClose}
      title={aberto === "nova" ? tm.registar : tm.editar}
      width="lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`${tm.dci} *`}>
          <input
            className={inputClass}
            value={f.dci}
            onChange={set("dci")}
            maxLength={200}
            autoComplete="off"
          />
        </Field>
        <Field label={tm.nomeComercial}>
          <input
            className={inputClass}
            value={f.nome_comercial}
            onChange={set("nome_comercial")}
            maxLength={200}
            autoComplete="off"
          />
        </Field>
        <Field label={tm.dosagem}>
          <input
            className={inputClass}
            value={f.dosagem}
            onChange={set("dosagem")}
            maxLength={80}
            placeholder="500 mg"
          />
        </Field>
        <Field label={tm.forma}>
          <select className={inputClass} value={f.forma} onChange={set("forma")}>
            <option value="">—</option>
            {FORMAS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tm.via}>
          <select className={inputClass} value={f.via} onChange={set("via")}>
            <option value="">—</option>
            {VIAS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tm.embalagens}>
          <input
            className={inputClass}
            type="number"
            min={1}
            max={99}
            value={f.embalagens}
            onChange={set("embalagens")}
          />
        </Field>
      </div>
      {alerta && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-state-alert/40 bg-state-alert-soft px-3 py-2 text-xs text-state-alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {tm.alertaAlergia(alerta.substancia)}
        </p>
      )}
      <div className="mt-3">
        <Field label={`${tm.posologia} *`}>
          <input
            className={inputClass}
            value={f.posologia}
            onChange={set("posologia")}
            maxLength={500}
            placeholder={tm.posologiaPlaceholder}
          />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={tm.inicio}>
          <input className={inputClass} type="date" value={f.inicio} onChange={set("inicio")} />
        </Field>
        <Field label={tm.fim}>
          <input
            className={inputClass}
            type="date"
            value={f.fim}
            onChange={set("fim")}
            disabled={f.cronica}
          />
        </Field>
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={f.cronica}
          onChange={(e) => setF((x) => ({ ...x, cronica: e.target.checked }))}
          className="accent-foreground"
        />
        {tm.cronica}
      </label>
      <div className="mt-3">
        <Field label={tm.motivo}>
          <input className={inputClass} value={f.motivo} onChange={set("motivo")} maxLength={500} />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={tm.origem}>
          <select className={inputClass} value={f.origem} onChange={set("origem")}>
            {Object.entries(tm.origens).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tm.numeroReceita} hint={tm.numeroReceitaAjuda}>
          <input
            className={inputClass}
            value={f.numero_receita}
            onChange={set("numero_receita")}
            inputMode="numeric"
            maxLength={30}
          />
        </Field>
      </div>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-state-alert">
          {erro}
        </p>
      )}
      <ModalActions>
        <SecondaryButton onClick={onClose}>{tm.cancelar}</SecondaryButton>
        <PrimaryButton onClick={() => void guardar()}>{aGuardar ? "…" : tm.guardar}</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}

function MudarEstado({
  pedido,
  onClose,
  onFeito,
}: {
  pedido: { med: MedicacaoDb; estado: Estado } | null;
  onClose: () => void;
  onFeito: () => void;
}) {
  const tm = useT().medicacao;
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setMotivo("");
    setErro(null);
  }, [pedido]);

  if (!pedido) return null;
  const acao =
    pedido.estado === "suspensa"
      ? tm.suspender
      : pedido.estado === "terminada"
        ? tm.terminar
        : tm.marcarErro;

  async function confirmar() {
    if (!pedido) return;
    const { error } = await supabase
      .from("medicacoes")
      .update({
        estado: pedido.estado,
        estado_motivo: motivo.trim() || null,
        fim:
          pedido.estado === "terminada" && !pedido.med.fim
            ? new Date().toISOString().slice(0, 10)
            : pedido.med.fim,
      })
      .eq("id", pedido.med.id);
    if (error) return setErro(tm.erro);
    onFeito();
  }

  return (
    <SimpleModal
      open
      onClose={onClose}
      title={tm.motivoTitulo(acao)}
      description={pedido.med.dci}
      width="sm"
    >
      <Field label={tm.motivoEstado}>
        <input
          className={inputClass}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={500}
          autoFocus
        />
      </Field>
      {erro && (
        <p role="alert" className="mt-2 text-sm text-state-alert">
          {erro}
        </p>
      )}
      <ModalActions>
        <SecondaryButton onClick={onClose}>{tm.cancelar}</SecondaryButton>
        <PrimaryButton onClick={() => void confirmar()}>{tm.confirmar}</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}
