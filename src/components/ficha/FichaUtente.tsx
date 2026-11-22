import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { MarcarConsultaModal } from "@/components/portal/MarcarConsultaModal";
import { ChatUtente } from "@/components/ficha/ChatUtente";
import { PedirExportacao } from "@/components/ficha/PedirExportacao";
import { ConvidarApp } from "@/components/ficha/ConvidarApp";
import { Documentos } from "@/components/ficha/Documentos";
import { useIdioma, useT } from "@/lib/i18n";
import { e_admin, e_clinico, iniciais, useSessao } from "@/lib/sessao";
import {
  dataHora,
  idade,
  membrosDoEspaco,
  rotuloMembro,
  type ConsultaDb,
  type DiarioDb,
  type MembroDb,
  type ObservacaoDb,
  type UtenteDb,
} from "@/lib/dados";

type Tab = "resumo" | "diario" | "outros" | "observacoes" | "consultas" | "documentos";
type Partilhas = Record<string, string[]>;

export function FichaUtente({ utenteId }: { utenteId: string }) {
  const t = useT();
  const tf = t.ficha;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const [utente, setUtente] = useState<UtenteDb | null | undefined>(undefined);
  const [membros, setMembros] = useState<MembroDb[]>([]);
  const [seguidores, setSeguidores] = useState<string[]>([]);
  const [consultas, setConsultas] = useState<ConsultaDb[]>([]);
  const [diarios, setDiarios] = useState<DiarioDb[]>([]);
  const [observacoes, setObservacoes] = useState<ObservacaoDb[]>([]);
  const [partilhasD, setPartilhasD] = useState<Partilhas>({});
  const [partilhasO, setPartilhasO] = useState<Partilhas>({});
  const [tab, setTab] = useState<Tab>("resumo");
  const [marcarOpen, setMarcarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const carregar = useCallback(async () => {
    if (!atual) return;
    const { data: u } = await supabase.from("utentes").select("*").eq("id", utenteId).maybeSingle();
    setUtente(u ?? null);
    if (!u) return;
    const [ms, ss, cs, ds, os] = await Promise.all([
      membrosDoEspaco(u.espaco_id),
      supabase.from("seguimentos").select("membro_id").eq("utente_id", u.id),
      supabase
        .from("consultas")
        .select("*")
        .eq("utente_id", u.id)
        .order("inicio", { ascending: false }),
      supabase
        .from("diarios")
        .select("*")
        .eq("utente_id", u.id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("observacoes")
        .select("*")
        .eq("utente_id", u.id)
        .order("criado_em", { ascending: false }),
    ]);
    setMembros(ms);
    setSeguidores((ss.data ?? []).map((s) => s.membro_id));
    setConsultas(cs.data ?? []);
    setDiarios(ds.data ?? []);
    setObservacoes(os.data ?? []);
    const dIds = (ds.data ?? []).map((d) => d.id);
    const oIds = (os.data ?? []).map((o) => o.id);
    const [pd, po] = await Promise.all([
      dIds.length
        ? supabase.from("diario_partilhas").select("*").in("diario_id", dIds)
        : Promise.resolve({ data: [] }),
      oIds.length
        ? supabase.from("observacao_partilhas").select("*").in("observacao_id", oIds)
        : Promise.resolve({ data: [] }),
    ]);
    const agrupar = <T,>(rows: T[] | null, chave: (r: T) => string, valor: (r: T) => string) =>
      (rows ?? []).reduce<Partilhas>((acc, r) => {
        (acc[chave(r)] ??= []).push(valor(r));
        return acc;
      }, {});
    setPartilhasD(
      agrupar(
        pd.data as { diario_id: string; membro_id: string }[] | null,
        (r) => r.diario_id,
        (r) => r.membro_id,
      ),
    );
    setPartilhasO(
      agrupar(
        po.data as { observacao_id: string; membro_id: string }[] | null,
        (r) => r.observacao_id,
        (r) => r.membro_id,
      ),
    );
  }, [atual, utenteId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const porId = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros]);
  const rot = { medico: tf.medico, administrativo: tf.administrativo };
  const nomeDe = (id: string | null) =>
    id && porId.get(id) ? rotuloMembro(porId.get(id)!, rot) : "—";

  if (utente === undefined) {
    return (
      <PortalShell>
        <div className="px-6 py-16 text-center text-xs text-muted-foreground">
          {t.conta.aProcessar}
        </div>
      </PortalShell>
    );
  }
  if (utente === null || !atual) {
    return (
      <PortalShell>
        <main className="px-6 py-16 text-center">
          <p className="text-sm text-foreground">{tf.naoEncontrado}</p>
          <Link to="/" className="mt-3 inline-block text-sm text-muted-foreground underline">
            {tf.voltar}
          </Link>
        </main>
        <MobileNavTabs />
      </PortalShell>
    );
  }

  const souClinico = e_clinico(atual);
  const souAdmin = e_admin(atual);
  const sigo = souClinico && seguidores.includes(atual.id);
  const anos = idade(utente.data_nascimento);
  const agora = Date.now();
  const proximas = consultas
    .filter((c) => new Date(c.inicio).getTime() >= agora && c.estado === "agendada")
    .reverse();
  const anteriores = consultas.filter((c) => !proximas.includes(c));
  const meusDiarios = diarios.filter((d) => d.autor_id === atual.id);
  const outrosDiarios = diarios.filter((d) => d.autor_id !== atual.id);

  // Quem pode receber um diário privado: profissionais que seguem o utente e a administração.
  const elegiveisDiario = membros.filter(
    (m) =>
      m.id !== atual.id &&
      m.estado === "ativo" &&
      (!!m.papel_admin ||
        ((m.funcao === "medico" || m.funcao === "profissional") && seguidores.includes(m.id))),
  );
  const elegiveisObs = membros.filter((m) => m.id !== atual.id && m.estado === "ativo");

  const tabs: { id: Tab; label: string; mostrar: boolean }[] = [
    { id: "resumo", label: tf.tabResumo, mostrar: true },
    { id: "diario", label: tf.tabDiario, mostrar: sigo },
    { id: "outros", label: tf.tabOutros, mostrar: souClinico || souAdmin },
    { id: "observacoes", label: tf.tabObservacoes, mostrar: true },
    { id: "consultas", label: tf.tabConsultas, mostrar: true },
    {
      id: "documentos",
      label: t.documentos.tab,
      mostrar: sigo || atual.funcao === "administrativo",
    },
  ];

  const aviso = sigo
    ? null
    : souClinico
      ? tf.naoSegueTexto
      : souAdmin
        ? tf.adminTexto
        : tf.administrativoTexto;

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tf.voltar}
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-base font-medium text-foreground">
              {iniciais(utente.nome)}
            </div>
            <div>
              <h1 className="font-serif text-3xl text-foreground">
                {utente.nome}
                {anos !== null && <span className="text-muted-foreground">, {anos}</span>}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {utente.sexo && (
                  <span>{utente.sexo === "F" ? t.utentes.sexoF : t.utentes.sexoM}</span>
                )}
                {utente.cidade && <span>{utente.cidade}</span>}
                {utente.telefone && (
                  <a
                    href={`tel:${utente.telefone}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {utente.telefone}
                  </a>
                )}
                {utente.email && (
                  <a
                    href={`mailto:${utente.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="h-3 w-3" />
                    {utente.email}
                  </a>
                )}
                {utente.clinica_onde_visto && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {utente.clinica_onde_visto}
                  </span>
                )}
              </div>
              {souClinico && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium ${sigo ? "bg-state-ok-soft text-state-ok" : "bg-accent text-muted-foreground"}`}
                >
                  {sigo ? tf.segue : tf.naoSegue}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sigo && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {tf.chat}
              </button>
            )}
            {sigo && <ConvidarApp utente={utente} />}
            {sigo && <PedirExportacao utente={utente} />}
            <button
              type="button"
              onClick={() => setMarcarOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {tf.marcarConsulta}
            </button>
          </div>
        </header>

        {aviso && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface-raised px-4 py-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {aviso}
          </p>
        )}

        <nav role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs
            .filter((x) => x.mostrar)
            .map((x) => (
              <button
                key={x.id}
                role="tab"
                type="button"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={`relative whitespace-nowrap px-4 py-3 text-sm ${tab === x.id ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {x.label}
                {tab === x.id && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-foreground" />
                )}
              </button>
            ))}
        </nav>

        <section className="mt-6">
          {tab === "resumo" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Bloco titulo={tf.proximas}>
                <ListaConsultas consultas={proximas.slice(0, 5)} nomeDe={nomeDe} idioma={idioma} />
              </Bloco>
              <Bloco titulo={tf.equipa} icon={<Users className="h-4 w-4" />}>
                {seguidores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{tf.equipaVazia}</p>
                ) : (
                  <ul className="space-y-1.5 text-sm text-foreground">
                    {seguidores.map((id) => (
                      <li key={id}>{nomeDe(id)}</li>
                    ))}
                  </ul>
                )}
              </Bloco>
            </div>
          )}

          {tab === "diario" && sigo && (
            <div className="space-y-4">
              <Editor
                tipo="diario"
                utente={utente}
                elegiveis={elegiveisDiario}
                consultas={consultas}
                rot={rot}
                onGuardado={carregar}
              />
              <ListaRegistos
                itens={meusDiarios}
                partilhas={partilhasD}
                nomeDe={nomeDe}
                vazio={tf.vazioDiario}
                idioma={idioma}
                podeApagar={(r) => r.autor_id === atual.id}
                tabela="diarios"
                onApagado={carregar}
              />
            </div>
          )}

          {tab === "outros" && (
            <ListaRegistos
              itens={outrosDiarios}
              partilhas={partilhasD}
              nomeDe={nomeDe}
              vazio={tf.vazioOutros}
              idioma={idioma}
              mostrarAutor
              tabela="diarios"
            />
          )}

          {tab === "observacoes" && (
            <div className="space-y-4">
              <Editor
                tipo="observacao"
                utente={utente}
                elegiveis={elegiveisObs}
                consultas={consultas}
                rot={rot}
                onGuardado={carregar}
              />
              <ListaRegistos
                itens={observacoes}
                partilhas={partilhasO}
                nomeDe={nomeDe}
                vazio={tf.vazioObs}
                idioma={idioma}
                mostrarAutor
                podeApagar={(r) => r.autor_id === atual.id}
                tabela="observacoes"
                onApagado={carregar}
              />
            </div>
          )}

          {tab === "consultas" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Bloco titulo={tf.proximas}>
                <ListaConsultas consultas={proximas} nomeDe={nomeDe} idioma={idioma} />
              </Bloco>
              <Bloco titulo={tf.anteriores}>
                <ListaConsultas consultas={anteriores} nomeDe={nomeDe} idioma={idioma} />
              </Bloco>
            </div>
          )}
          {tab === "documentos" && (
            <Documentos
              utente={utente}
              consultas={consultas}
              podeEmitir={sigo || atual.funcao === "administrativo"}
              nomeDe={nomeDe}
            />
          )}
        </section>
      </main>
      <MobileNavTabs />
      <MarcarConsultaModal
        open={marcarOpen}
        onClose={() => setMarcarOpen(false)}
        utenteFixo={utente}
        onMarcada={() => {
          setMarcarOpen(false);
          void carregar();
        }}
      />
      {sigo && (
        <ChatUtente
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          utente={utente}
          onEstadoMudou={carregar}
        />
      )}
    </PortalShell>
  );
}

function Bloco({
  titulo,
  icon,
  children,
}: {
  titulo: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function ListaConsultas({
  consultas,
  nomeDe,
  idioma,
}: {
  consultas: ConsultaDb[];
  nomeDe: (id: string) => string;
  idioma: "pt" | "en";
}) {
  const tf = useT().ficha;
  if (consultas.length === 0)
    return <p className="text-sm text-muted-foreground">{tf.semConsultas}</p>;
  return (
    <ul className="divide-y divide-border">
      {consultas.map((c) => (
        <li key={c.id}>
          <Link
            to="/consulta/$eventoId"
            params={{ eventoId: c.id }}
            className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
          >
            <span>
              <span className="block text-sm text-foreground">{dataHora(c.inicio, idioma)}</span>
              <span className="block text-xs text-muted-foreground">
                {nomeDe(c.profissional_id)} · {tf.duracao(c.duracao_min)} ·{" "}
                {c.tipo === "video" ? tf.video : tf.presencial}
                {c.motivo ? ` · ${c.motivo}` : ""}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10.5px] text-foreground">
              {tf.estado[c.estado] ?? c.estado}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type Registo = (DiarioDb | ObservacaoDb) & { autor_id: string };

export function ListaRegistos({
  itens,
  partilhas,
  nomeDe,
  vazio,
  idioma,
  mostrarAutor,
  podeApagar,
  tabela,
  onApagado,
}: {
  itens: Registo[];
  partilhas: Partilhas;
  nomeDe: (id: string) => string;
  vazio: string;
  idioma: "pt" | "en";
  mostrarAutor?: boolean;
  podeApagar?: (r: Registo) => boolean;
  tabela: "diarios" | "observacoes";
  onApagado?: () => void;
}) {
  const tf = useT().ficha;
  if (itens.length === 0)
    return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>;

  async function apagar(id: string) {
    if (!window.confirm(tf.confirmarApagar)) return;
    await supabase.from(tabela).delete().eq("id", id);
    onApagado?.();
  }

  return (
    <ol className="space-y-3">
      {itens.map((r) => {
        const quem = partilhas[r.id] ?? [];
        return (
          <li key={r.id} className="rounded-2xl border border-border bg-surface-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>
                {dataHora(r.criado_em, idioma)}
                {mostrarAutor && ` · ${nomeDe(r.autor_id)}`}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 ${r.visibilidade === "privado" ? "bg-state-warn-soft text-state-warn" : "bg-accent text-foreground"}`}
                >
                  {r.visibilidade === "privado"
                    ? `${tf.privado} · ${tf.partilhadoCom(quem.length)}`
                    : tf.publico}
                </span>
                {podeApagar?.(r) && (
                  <button
                    type="button"
                    onClick={() => apagar(r.id)}
                    aria-label={tf.apagar}
                    className="rounded-full p-1 hover:bg-accent hover:text-state-alert"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.texto}</p>
            {r.visibilidade === "privado" && quem.length > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {quem.map(nomeDe).join(", ")}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Editor({
  tipo,
  utente,
  elegiveis,
  consultas,
  rot,
  onGuardado,
  consultaFixaId,
  soap,
}: {
  tipo: "diario" | "observacao";
  utente: UtenteDb;
  elegiveis: MembroDb[];
  consultas: ConsultaDb[];
  rot: { medico: string; administrativo: string };
  onGuardado: () => void;
  consultaFixaId?: string;
  soap?: boolean;
}) {
  const t = useT();
  const tf = t.ficha;
  const tc = t.consultaDb;
  const { atual } = useSessao();
  const [textoLivre, setTextoLivre] = useState("");
  const [partes, setPartes] = useState({ s: "", o: "", a: "", p: "" });
  const texto = soap
    ? (["s", "o", "a", "p"] as const)
        .filter((k) => partes[k].trim())
        .map((k) => `${tc[k]}\n${partes[k].trim()}`)
        .join("\n\n")
    : textoLivre;
  const setTexto = (v: string) => {
    setTextoLivre(v);
    if (!v) setPartes({ s: "", o: "", a: "", p: "" });
  };
  const [vis, setVis] = useState<"publico" | "privado">("publico");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [consultaId, setConsultaId] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const id = `editor-${tipo}`;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!atual || !texto.trim()) return;
    if (vis === "privado" && escolhidos.length === 0 && tipo === "observacao")
      return setMsg({ tipo: "erro", texto: tf.escolhaAlguem });
    setAGuardar(true);
    setMsg(null);
    const base = {
      espaco_id: utente.espaco_id,
      utente_id: utente.id,
      autor_id: atual.id,
      texto: texto.trim(),
      visibilidade: vis,
      consulta_id: consultaFixaId ?? (consultaId || null),
    };
    const res =
      tipo === "diario"
        ? await supabase.from("diarios").insert(base).select("id").single()
        : await supabase.from("observacoes").insert(base).select("id").single();
    if (res.error || !res.data) {
      setAGuardar(false);
      return setMsg({ tipo: "erro", texto: t.conta.erroGenerico });
    }
    if (vis === "privado" && escolhidos.length) {
      const { error } =
        tipo === "diario"
          ? await supabase
              .from("diario_partilhas")
              .insert(escolhidos.map((membro_id) => ({ diario_id: res.data.id, membro_id })))
          : await supabase
              .from("observacao_partilhas")
              .insert(escolhidos.map((membro_id) => ({ observacao_id: res.data.id, membro_id })));
      if (error) {
        setAGuardar(false);
        return setMsg({ tipo: "erro", texto: t.conta.erroGenerico });
      }
    }
    setAGuardar(false);
    setTexto("");
    setVis("publico");
    setEscolhidos([]);
    setConsultaId("");
    setMsg({ tipo: "ok", texto: tf.guardado });
    onGuardado();
  }

  const ajuda =
    tipo === "diario"
      ? vis === "publico"
        ? tf.publicoDiarioAjuda
        : tf.privadoDiarioAjuda
      : vis === "publico"
        ? tf.publicoObsAjuda
        : tf.privadoObsAjuda;

  return (
    <form onSubmit={guardar} className="rounded-2xl border border-border bg-surface-raised p-4">
      {soap ? (
        <>
          <h2 className="text-sm font-medium text-foreground">{tc.soap}</h2>
          <p className="text-[11px] text-muted-foreground">{tc.soapAjuda}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(["s", "o", "a", "p"] as const).map((k) => (
              <label key={k} className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {tc[k]}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {tc[`${k}Ajuda` as "sAjuda"]}
                </span>
                <textarea
                  value={partes[k]}
                  onChange={(e) => setPartes((x) => ({ ...x, [k]: e.target.value }))}
                  placeholder={tc.escreva}
                  className="mt-1 min-h-[110px] w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
            ))}
          </div>
        </>
      ) : (
        <>
          <label
            htmlFor={id}
            className="text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {tipo === "diario" ? tf.novoDiario : tf.novaObservacao}
          </label>
          <textarea
            id={id}
            value={textoLivre}
            onChange={(e) => setTextoLivre(e.target.value)}
            placeholder={tipo === "diario" ? tf.escreverDiario : tf.escreverObservacao}
            className="mt-2 min-h-[110px] w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label={tf.publico + " / " + tf.privado}
          className="flex rounded-full border border-border p-0.5 text-xs"
        >
          {(["publico", "privado"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={vis === v}
              onClick={() => setVis(v)}
              className={`rounded-full px-3 py-1 ${vis === v ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              {v === "publico" ? tf.publico : tf.privado}
            </button>
          ))}
        </div>
        {!consultaFixaId && consultas.length > 0 && (
          <select
            value={consultaId}
            onChange={(e) => setConsultaId(e.target.value)}
            aria-label={tf.tabConsultas}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
          >
            <option value="">{tf.tabConsultas}: —</option>
            {consultas.slice(0, 20).map((c) => (
              <option key={c.id} value={c.id}>
                {dataHora(c.inicio)}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{ajuda}</p>
      {vis === "privado" && (
        <fieldset className="mt-2">
          <legend className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {tf.escolherPessoas}
          </legend>
          {elegiveis.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">{tf.semElegiveis}</p>
          ) : (
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {elegiveis.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    className="accent-foreground"
                    checked={escolhidos.includes(m.id)}
                    onChange={(e) =>
                      setEscolhidos((xs) =>
                        e.target.checked ? [...xs, m.id] : xs.filter((x) => x !== m.id),
                      )
                    }
                  />
                  {rotuloMembro(m, rot)}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}
      <div className="mt-3 flex items-center justify-end gap-3">
        {msg && (
          <span
            role={msg.tipo === "erro" ? "alert" : "status"}
            className={`text-xs ${msg.tipo === "erro" ? "text-state-alert" : "text-state-ok"}`}
          >
            {msg.texto}
          </span>
        )}
        <button
          type="submit"
          disabled={aGuardar || !texto.trim()}
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
        >
          {aGuardar ? t.conta.aProcessar : soap ? tc.guardarDiario : tf.guardar}
        </button>
      </div>
    </form>
  );
}
