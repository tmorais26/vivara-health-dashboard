import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Bell, ChevronDown, Plus, Search, Sparkles } from "lucide-react";
import { resumosUtentes, type ResumoUtente } from "@/data/mock-portal";
import { formatarData } from "@/data/mock-utente";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";

type SortKey = "alertas" | "proxima" | "ultima" | "nome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vivara Health — Portal Clínico" },
      {
        name: "description",
        content:
          "Portal clínico Vivara Health. Lista de utentes em medicina de longevidade com alertas funcionais.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("alertas");

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    let lista = q
      ? resumosUtentes.filter((u) => u.nome.toLowerCase().includes(q) || u.cidade.toLowerCase().includes(q))
      : [...resumosUtentes];
    lista.sort((a, b) => {
      switch (sort) {
        case "alertas":
          return b.alertasAtivos - a.alertasAtivos || b.marcadoresForaAlvo - a.marcadoresForaAlvo;
        case "proxima":
          return (a.proximaConsulta ?? "9999").localeCompare(b.proximaConsulta ?? "9999");
        case "ultima":
          return a.ultimaConsulta.localeCompare(b.ultimaConsulta);
        case "nome":
          return a.nome.localeCompare(b.nome);
      }
    });
    return lista;
  }, [query, sort]);

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1100px] px-6 py-10 pb-24 lg:pb-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Portal clínico
            </div>
            <h1 className="font-serif mt-2 text-4xl text-foreground">Os meus utentes</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {resumosUtentes.length} utentes activos. Cada utente é uma série temporal que se lê como um livro.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo utente
          </button>
        </div>

        {/* Search + sort */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por nome ou cidade…"
              className="w-full rounded-full border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
            />
          </div>
          <SortDropdown sort={sort} onChange={setSort} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filtrados.map((u) => (
            <UtenteCard key={u.id} u={u} />
          ))}
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground">
          Versão demonstrativa — apenas o perfil de Maria Antunes está disponível para navegação detalhada.
        </p>

        <Link
          to="/app"
          className="mt-4 inline-flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Ver app da utente <ArrowRight className="h-3 w-3" />
        </Link>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}

function SortDropdown({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  const labels: Record<SortKey, string> = {
    alertas: "Alertas (desc)",
    proxima: "Próxima consulta",
    ultima: "Última consulta",
    nome: "Nome (A–Z)",
  };
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3.5 py-2 text-xs font-medium text-foreground hover:bg-accent"
      >
        Ordenar: {labels[sort]}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
          {(Object.keys(labels) as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-accent ${
                sort === k ? "bg-accent text-foreground" : "text-foreground"
              }`}
            >
              {labels[k]}
              {sort === k && <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UtenteCard({ u }: { u: ResumoUtente }) {
  const conteudo = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-medium text-foreground">
          {u.iniciais}
          {u.novosDados && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-state-alert">
              <Sparkles className="h-2 w-2 text-primary-foreground" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-serif text-xl text-foreground">{u.nome}</span>
            <span className="text-xs text-muted-foreground">{u.idade} · {u.sexo}</span>
            {u.novosDados && (
              <span className="inline-flex items-center gap-1 rounded-full bg-state-alert-soft px-2 py-0.5 text-[10px] font-medium text-state-alert">
                <Sparkles className="h-2.5 w-2.5" />
                Novos dados
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{u.cidade}</span>
            <span>·</span>
            <span>Plano {u.plano}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>Última: {formatarData(u.ultimaConsulta)}</span>
            {u.proximaConsulta && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Bell className="h-3 w-3 text-state-warn" />
                Próxima: {formatarData(u.proximaConsulta)}
                {u.proximaConsultaHora ? ` · ${u.proximaConsultaHora}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 sm:gap-6">
        <Stat label="Alertas" value={String(u.alertasAtivos)} tone={u.alertasAtivos > 0 ? "alert" : "muted"} />
        <Stat label="Fora do alvo" value={String(u.marcadoresForaAlvo)} tone={u.marcadoresForaAlvo > 5 ? "warn" : "muted"} />
        <Stat label="Marcadores" value={String(u.totalMarcadores)} tone="muted" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );

  if (u.acessivel) {
    return (
      <Link
        to="/utentes/$utenteId"
        params={{ utenteId: u.id }}
        className="group block rounded-2xl border border-border bg-surface-raised p-5 transition-colors hover:border-foreground/20"
      >
        {conteudo}
      </Link>
    );
  }
  return (
    <div
      title="Demo: apenas o perfil de Maria Antunes está acessível"
      className="block cursor-not-allowed rounded-2xl border border-border bg-surface-raised p-5 opacity-60"
    >
      {conteudo}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "alert" | "warn" | "muted";
}) {
  const color =
    tone === "alert" ? "text-state-alert" : tone === "warn" ? "text-state-warn" : "text-foreground";
  return (
    <div className="text-right">
      <div className={`tabular text-xl font-light ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
