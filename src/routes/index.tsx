import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarClock, MessageSquare, Plus, Search, Upload, UserRoundCheck } from "lucide-react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { useIdioma, useT } from "@/lib/i18n";
import { e_clinico, iniciais, useSessao } from "@/lib/sessao";
import { dataHora, idade, listarUtentes, type ResumoUtenteDb } from "@/lib/dados";
import { NovoUtenteModal } from "@/components/portal/NovoUtenteModal";
import { ImportarUtentesModal } from "@/components/portal/ImportarUtentesModal";

type Ordem = "nome" | "proxima" | "recentes";
type Filtro = "sigo" | "todos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Utentes — Vivara Health" },
      { name: "description", content: "Portal clínico Vivara Health: lista de utentes." },
    ],
  }),
  component: Index,
});

function Index() {
  const t = useT();
  const tu = t.utentes;
  const idioma = useIdioma();
  const { atual } = useSessao();
  const clinico = e_clinico(atual);
  const [utentes, setUtentes] = useState<ResumoUtenteDb[] | null>(null);
  const [erro, setErro] = useState(false);
  const [query, setQuery] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome");
  const [filtro, setFiltro] = useState<Filtro>(clinico && atual?.espaco.tipo === "clinica" ? "sigo" : "todos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!atual) return;
    setErro(false);
    try {
      setUtentes(await listarUtentes(atual.espaco_id, atual.id));
    } catch {
      setErro(true);
    }
  }, [atual]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    if (!utentes) return [];
    const q = query.trim().toLowerCase();
    const lista = utentes.filter(
      (u) =>
        (filtro === "todos" || u.segue) &&
        (!q ||
          u.nome.toLowerCase().includes(q) ||
          (u.cidade ?? "").toLowerCase().includes(q) ||
          (u.telefone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
    );
    return lista.sort((a, b) =>
      ordem === "nome"
        ? a.nome.localeCompare(b.nome)
        : ordem === "recentes"
          ? b.criado_em.localeCompare(a.criado_em)
          : (a.proxima?.inicio ?? "9999").localeCompare(b.proxima?.inicio ?? "9999"),
    );
  }, [utentes, query, ordem, filtro]);

  const mostrarFiltro = clinico && atual?.espaco.tipo === "clinica";
  const vazio = utentes !== null && utentes.length === 0;

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{atual?.espaco.nome}</div>
            <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">{tu.titulo}</h1>
            {utentes && !vazio && <p className="mt-2 text-sm text-muted-foreground">{tu.sub(utentes.length)}</p>}
          </div>
          {!vazio && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportarOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Upload className="h-3.5 w-3.5" />
                {t.dados.importar}
              </button>
              <button
                type="button"
                onClick={() => setNovoOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {tu.novoTitulo}
              </button>
            </div>
          )}
        </div>

        {aviso && (
          <div role="status" className="mb-4 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground">
            {aviso}
          </div>
        )}
        {erro && (
          <div role="alert" className="mb-4 rounded-xl border border-state-alert/30 bg-state-alert-soft px-4 py-2.5 text-sm text-state-alert">
            {tu.erroCarregar}
          </div>
        )}

        {utentes === null && !erro && <ListaACarregar />}

        {vazio && (
          <div className="rounded-2xl border border-dashed border-border bg-surface-raised px-6 py-12 text-center">
            <h2 className="font-serif text-2xl text-foreground">{tu.vazioTitulo}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{tu.vazioTexto}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setNovoOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {tu.criarPrimeiro}
              </button>
              <button
                type="button"
                onClick={() => setImportarOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                {t.dados.importar}
              </button>
            </div>
            <Link
              to="/utentes/$utenteId"
              params={{ utenteId: "maria-antunes" }}
              className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {tu.verExemplo} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {utentes && !vazio && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tu.pesquisar}
                  aria-label={tu.pesquisar}
                  className="w-full rounded-full border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
                />
              </div>
              {mostrarFiltro && (
                <div role="group" className="flex rounded-full border border-border bg-surface-raised p-0.5 text-xs">
                  {(["sigo", "todos"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={filtro === f}
                      onClick={() => setFiltro(f)}
                      className={`rounded-full px-3 py-1.5 ${filtro === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {f === "sigo" ? tu.filtroSigo : tu.filtroTodos}
                    </button>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {tu.ordenar}
                <select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as Ordem)}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs text-foreground"
                >
                  <option value="nome">{tu.ordNome}</option>
                  <option value="proxima">{tu.ordProxima}</option>
                  <option value="recentes">{tu.ordRecentes}</option>
                </select>
              </label>
            </div>

            {filtrados.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{tu.semResultados}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3">
                {filtrados.map((u) => (
                  <li key={u.id}>
                    <UtenteCard u={u} idioma={idioma} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <MobileNavTabs />
      <NovoUtenteModal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        onCriado={() => {
          setNovoOpen(false);
          void carregar();
        }}
      />
      <ImportarUtentesModal
        open={importarOpen}
        onClose={() => setImportarOpen(false)}
        onImportados={(n) => {
          setAviso(t.dados.importados(n));
          void carregar();
        }}
      />
    </PortalShell>
  );
}

function ListaACarregar() {
  return (
    <ul className="grid grid-cols-1 gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-raised" />
      ))}
    </ul>
  );
}

function UtenteCard({ u, idioma }: { u: ResumoUtenteDb; idioma: "pt" | "en" }) {
  const tu = useT().utentes;
  const anos = idade(u.data_nascimento);
  const detalhe = [anos !== null ? tu.anos(anos) : null, u.sexo, u.cidade].filter(Boolean).join(" · ");
  return (
    <Link
      to="/utentes/$utenteId"
      params={{ utenteId: u.id }}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface-raised p-4 transition-colors hover:border-foreground/20 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-foreground">
        {iniciais(u.nome)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-serif text-lg text-foreground">{u.nome}</span>
          {u.segue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">
              <UserRoundCheck className="h-3 w-3" />
              {tu.segue}
            </span>
          )}
          {u.chat_estado === "ativo" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-state-ok-soft px-2 py-0.5 text-[10px] font-medium text-state-ok">
              <MessageSquare className="h-3 w-3" />
              {tu.chatAtivo}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
          {detalhe && <span>{detalhe}</span>}
          {u.clinica_onde_visto && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {u.clinica_onde_visto}
            </span>
          )}
        </div>
        <div className="mt-1 text-[12px]">
          {u.proxima ? (
            <span className="inline-flex items-center gap-1 text-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-state-warn" />
              {tu.proxima}: {dataHora(u.proxima.inicio, idioma)}
            </span>
          ) : (
            <span className="text-muted-foreground">{tu.semConsulta}</span>
          )}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
