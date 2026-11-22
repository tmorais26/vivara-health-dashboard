import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FilePlus2, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  MODELOS_BASE,
  TIPOS_ADMINISTRATIVOS,
  descarregarDocumentoPdf,
  preencher,
  reverter,
  temPorPreencher,
  valoresCampos,
  type Cabecalho,
  type DocumentoEmitido,
  type ModeloDocumento,
  type TipoDocumento,
} from "@/lib/documentos";
import { dataHora, type ConsultaDb, type UtenteDb } from "@/lib/dados";
import { useIdioma, useT } from "@/lib/i18n";
import { e_clinico, useSessao } from "@/lib/sessao";

const botao =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent";

export function Documentos({
  utente,
  consultas,
  podeEmitir,
  nomeDe,
}: {
  utente: UtenteDb;
  consultas: ConsultaDb[];
  podeEmitir: boolean;
  nomeDe: (id: string | null) => string;
}) {
  const td = useT().documentos;
  const idioma = useIdioma();
  const [docs, setDocs] = useState<DocumentoEmitido[]>([]);
  const [aberto, setAberto] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("documentos_emitidos")
      .select("*")
      .eq("utente_id", utente.id)
      .order("emitido_em", { ascending: false });
    setDocs(data ?? []);
  }, [utente.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">{td.tab}</h2>
        {podeEmitir && (
          <button type="button" onClick={() => setAberto(true)} className={botao}>
            <FilePlus2 className="h-3.5 w-3.5" />
            {td.emitir}
          </button>
        )}
      </div>
      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{td.vazio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="text-sm text-foreground">{d.titulo}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {td.tipos[d.tipo]} · {dataHora(d.emitido_em, idioma)} ·{" "}
                    {td.por(nomeDe(d.autor_id))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={botao}
                onClick={() =>
                  void descarregarDocumentoPdf({
                    ...d,
                    cabecalho: d.cabecalho as unknown as Cabecalho,
                  })
                }
              >
                <Download className="h-3.5 w-3.5" />
                {td.descarregar}
              </button>
            </li>
          ))}
        </ul>
      )}
      {podeEmitir && (
        <EmitirDocumento
          open={aberto}
          onClose={() => setAberto(false)}
          utente={utente}
          consultas={consultas}
          onEmitido={() => {
            setAberto(false);
            void carregar();
          }}
        />
      )}
    </div>
  );
}

type Opcao = { id: string; tipo: TipoDocumento; titulo: string; corpo: string; meu?: boolean };

function EmitirDocumento({
  open,
  onClose,
  utente,
  consultas,
  onEmitido,
}: {
  open: boolean;
  onClose: () => void;
  utente: UtenteDb;
  consultas: ConsultaDb[];
  onEmitido: () => void;
}) {
  const t = useT();
  const td = t.documentos;
  const idioma = useIdioma();
  const { atual, perfil } = useSessao();
  const clinico = e_clinico(atual);
  const clinica = atual?.espaco.tipo === "clinica";

  const [modelos, setModelos] = useState<ModeloDocumento[]>([]);
  const [modeloId, setModeloId] = useState(MODELOS_BASE[0].id);
  const [consultaId, setConsultaId] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [aEmitir, setAEmitir] = useState(false);
  const [aGuardarModelo, setAGuardarModelo] = useState(false);
  const [nomeModelo, setNomeModelo] = useState("");
  const [partilhar, setPartilhar] = useState(false);

  // Consultas que fazem sentido para uma declaração: já começaram (hoje ou antes) e não foram canceladas.
  const consultasValidas = useMemo(
    () =>
      consultas.filter(
        (c) =>
          new Date(c.inicio).getTime() <= Date.now() + 12 * 3600 * 1000 &&
          c.estado !== "cancelada" &&
          c.estado !== "falta",
      ),
    [consultas],
  );

  const cabecalho: Cabecalho = useMemo(() => {
    const nome = clinico ? perfil?.nome || atual?.nome_exibicao || "" : atual?.nome_exibicao || "";
    return {
      nome,
      funcao: clinico ? perfil?.especialidade || atual?.profissao || "" : "",
      cedula: clinico ? perfil?.cedula_profissional || null : null,
      local,
      espaco: atual?.espaco.nome ?? "",
    };
  }, [clinico, perfil, atual, local]);

  const opcoes: Opcao[] = useMemo(() => {
    const permitido = (tipo: string) =>
      clinico || TIPOS_ADMINISTRATIVOS.includes(tipo as TipoDocumento);
    const base = MODELOS_BASE.filter((m) => permitido(m.tipo));
    const proprios = modelos
      .filter((m) => permitido(m.tipo))
      .map((m) => ({
        id: m.id,
        tipo: m.tipo as TipoDocumento,
        titulo: m.nome,
        corpo: m.corpo,
        meu: m.autor_id === atual?.id,
      }));
    return [...base, ...proprios];
  }, [modelos, clinico, atual?.id]);

  const valores = useMemo(() => {
    const c = consultasValidas.find((x) => x.id === consultaId) ?? null;
    const consulta = c
      ? {
          inicio: c.inicio,
          fim: new Date(new Date(c.inicio).getTime() + c.duracao_min * 60000).toISOString(),
        }
      : null;
    return valoresCampos({ utente, consulta, cabecalho });
  }, [consultasValidas, consultaId, utente, cabecalho]);

  const carregarModelos = useCallback(async () => {
    if (!atual) return;
    const { data } = await supabase
      .from("modelos_documento")
      .select("*")
      .eq("espaco_id", atual.espaco_id)
      .order("nome");
    setModelos(data ?? []);
  }, [atual]);

  // Ao abrir: valores por omissão.
  useEffect(() => {
    if (!open) return;
    void carregarModelos();
    setModeloId(opcoes[0]?.id ?? MODELOS_BASE[0].id);
    setConsultaId(consultasValidas[0]?.id ?? "");
    setLocal(clinica ? (atual?.espaco.nome ?? "") : perfil?.clinica || "");
    setErro(null);
    setAviso(null);
    setAGuardarModelo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Só volta a preencher o texto quando muda o modelo ou a consulta (não apaga o que já foi editado).
  const opcao = opcoes.find((o) => o.id === modeloId) ?? opcoes[0];
  useEffect(() => {
    if (!open || !opcao) return;
    setTitulo(opcao.titulo);
    setCorpo(preencher(opcao.corpo, valores));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opcao?.id, opcao?.corpo, consultaId]);

  async function emitir() {
    if (!atual || !opcao) return;
    setErro(null);
    if (!titulo.trim() || !corpo.trim()) return setErro(td.erro);
    if (temPorPreencher(corpo) || temPorPreencher(titulo)) return setErro(td.porPreencher);
    setAEmitir(true);
    const { data, error } = await supabase
      .from("documentos_emitidos")
      .insert({
        espaco_id: atual.espaco_id,
        utente_id: utente.id,
        autor_id: atual.id,
        consulta_id: consultaId || null,
        tipo: opcao.tipo,
        titulo: titulo.trim(),
        corpo: corpo.trim(),
        cabecalho,
      })
      .select("*")
      .single();
    setAEmitir(false);
    if (error || !data) return setErro(td.erro);
    await descarregarDocumentoPdf({ ...data, cabecalho });
    onEmitido();
  }

  async function guardarModelo() {
    if (!atual || !opcao || !nomeModelo.trim()) return;
    const { error } = await supabase.from("modelos_documento").insert({
      espaco_id: atual.espaco_id,
      autor_id: atual.id,
      tipo: opcao.tipo,
      nome: nomeModelo.trim(),
      corpo: reverter(corpo, valores),
      partilhado: clinica && partilhar,
    });
    if (error) return setErro(t.conta.erroGenerico);
    setAGuardarModelo(false);
    setNomeModelo("");
    setAviso(td.modeloGuardado);
    await carregarModelos();
  }

  async function apagarModelo() {
    if (!opcao?.meu) return;
    await supabase.from("modelos_documento").delete().eq("id", opcao.id);
    setModeloId(MODELOS_BASE[0].id);
    await carregarModelos();
  }

  const proprios = opcoes.filter((o) => !o.id.startsWith("base-"));

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={td.emitir}
      description={td.imutavel}
      width="lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={td.modelo}>
          <select
            className={inputClass}
            value={modeloId}
            onChange={(e) => setModeloId(e.target.value)}
          >
            <optgroup label={td.modelosBase}>
              {opcoes
                .filter((o) => o.id.startsWith("base-"))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {td.tipos[o.tipo] ?? o.titulo}
                  </option>
                ))}
            </optgroup>
            {proprios.some((o) => o.meu) && (
              <optgroup label={td.meusModelos}>
                {proprios
                  .filter((o) => o.meu)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titulo}
                    </option>
                  ))}
              </optgroup>
            )}
            {proprios.some((o) => !o.meu) && (
              <optgroup label={td.modelosEquipa}>
                {proprios
                  .filter((o) => !o.meu)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titulo}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </Field>
        <Field label={td.consulta}>
          <select
            className={inputClass}
            value={consultaId}
            onChange={(e) => setConsultaId(e.target.value)}
          >
            <option value="">{td.semConsulta}</option>
            {consultasValidas.map((c) => (
              <option key={c.id} value={c.id}>
                {dataHora(c.inicio, idioma)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={td.titulo}>
          <input
            className={inputClass}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={160}
          />
        </Field>
        <Field label={td.local}>
          <input
            className={inputClass}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            maxLength={120}
          />
        </Field>
      </div>
      <div className="mt-3">
        <Field label={td.texto} hint={td.textoAjuda}>
          <textarea
            className={`${textareaClass} min-h-[220px]`}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
          />
        </Field>
      </div>
      {(opcao?.tipo === "atestado" || opcao?.tipo === "outro") && (
        <p className="mt-2 text-[11px] text-muted-foreground">{td.naoCit}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!aGuardarModelo ? (
          <button type="button" className={botao} onClick={() => setAGuardarModelo(true)}>
            {td.guardarModelo}
          </button>
        ) : (
          <div className="flex w-full flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <Field label={td.nomeModelo}>
                <input
                  className={inputClass}
                  value={nomeModelo}
                  onChange={(e) => setNomeModelo(e.target.value)}
                  maxLength={120}
                />
              </Field>
            </div>
            {clinica && (
              <label className="flex items-center gap-2 pb-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={partilhar}
                  onChange={(e) => setPartilhar(e.target.checked)}
                  className="accent-foreground"
                />
                {td.partilharEquipa}
              </label>
            )}
            <button
              type="button"
              className={botao}
              disabled={!nomeModelo.trim()}
              onClick={() => void guardarModelo()}
            >
              {td.guardar}
            </button>
          </div>
        )}
        {opcao?.meu && (
          <button
            type="button"
            className={`${botao} text-state-alert`}
            onClick={() => void apagarModelo()}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {td.apagarModelo}
          </button>
        )}
      </div>

      {aviso && (
        <p role="status" className="mt-3 text-sm text-state-ok">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-3 text-sm text-state-alert">
          {erro}
        </p>
      )}
      <ModalActions>
        <SecondaryButton onClick={onClose}>{t.recomendar.cancelar}</SecondaryButton>
        <PrimaryButton onClick={() => void emitir()}>
          {aEmitir ? t.conta.aProcessar : td.emitirDescarregar}
        </PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}
