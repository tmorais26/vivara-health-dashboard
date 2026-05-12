import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { utente, type Categoria, type Marcador, type TipoTarefa } from "@/data/mock-utente";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { PatientMobileView } from "@/components/portal/PatientMobileView";
import { MarkerList } from "@/components/dashboard/MarkerList";
import { MarkerDetailPanel } from "@/components/dashboard/MarkerDetailPanel";
import { GenomicaPanel } from "@/components/dashboard/GenomicaPanel";
import { PrescricoesPanel } from "@/components/dashboard/PrescricoesPanel";
import { PlanoPanel } from "@/components/dashboard/PlanoPanel";
import { AnamnesePanel } from "@/components/dashboard/AnamnesePanel";
import { ConsultasPanel } from "@/components/dashboard/ConsultasPanel";
import { CompararPanel } from "@/components/dashboard/CompararPanel";
import { DocumentosPanel } from "@/components/dashboard/DocumentosPanel";

export const Route = createFileRoute("/utentes/$utenteId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.utenteId === "maria-antunes" ? "Maria Antunes" : "Utente"} — Vivara Health` },
      {
        name: "description",
        content:
          "Vista longitudinal de marcadores clínicos, composição corporal e dados de wearable. Vivara Health, plataforma de medicina de longevidade.",
      },
    ],
  }),
  component: DashboardUtente,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-foreground">Utente não encontrado</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Voltar à lista
        </Link>
      </div>
    </div>
  ),
});

type MainTab = "clinico" | "genomica" | "plano" | "prescricoes" | "consultas-docs";
type ClinicoSub = "analises" | "composicao" | "wearable" | "comparar";
type CDSub = "consultas" | "documentos";

const mainTabs: { id: MainTab; label: string }[] = [
  { id: "clinico", label: "Clínico" },
  { id: "genomica", label: "Genómica" },
  { id: "plano", label: "Plano" },
  { id: "prescricoes", label: "Prescrições" },
  { id: "consultas-docs", label: "Consultas & Docs" },
];

const clinicoSubs: { id: ClinicoSub; label: string }[] = [
  { id: "analises", label: "Análises" },
  { id: "composicao", label: "Composição" },
  { id: "wearable", label: "Wearable" },
  { id: "comparar", label: "Comparar" },
];

const cdSubs: { id: CDSub; label: string }[] = [
  { id: "consultas", label: "Consultas" },
  { id: "documentos", label: "Documentos" },
];

function DashboardUtente() {
  const [mainTab, setMainTab] = useState<MainTab>("clinico");
  const [clinicoSub, setClinicoSub] = useState<ClinicoSub>("analises");
  const [cdSub, setCdSub] = useState<CDSub>("consultas");
  const [anamneseOpen, setAnamneseOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("ldl");
  const [novosDadosFiltro, setNovosDadosFiltro] = useState(false);
  const [planoPrefill, setPlanoPrefill] = useState<{
    tipo: TipoTarefa;
    marcador?: Marcador;
  } | null>(null);

  const marcadoresFiltrados = useMemo(
    () => {
      const showMarkers =
        mainTab === "clinico" &&
        (clinicoSub === "analises" ||
          clinicoSub === "composicao" ||
          clinicoSub === "wearable");
      const base = !showMarkers
        ? []
        : utente.marcadores.filter((m) => m.categoria === (clinicoSub as Categoria));
      if (!novosDadosFiltro) return base;
      // Considera "novo" se a última medição é nos últimos 14 dias
      const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
      return base.filter((m) => {
        const last = m.serie[m.serie.length - 1];
        return last && new Date(last.data).getTime() >= cutoff;
      });
    },
    [mainTab, clinicoSub, novosDadosFiltro],
  );

  const selecionado =
    utente.marcadores.find((m) => m.id === selectedId) ?? marcadoresFiltrados[0];

  function handleClinicoSub(id: ClinicoSub) {
    setClinicoSub(id);
    if (id === "comparar") return;
    const lista = utente.marcadores.filter((m) => m.categoria === (id as Categoria));
    if (!lista.find((m) => m.id === selectedId) && lista[0]) {
      setSelectedId(lista[0].id);
    }
  }

  function handlePrescrever(tipo: TipoTarefa, marcador: Marcador) {
    setPlanoPrefill({ tipo, marcador });
    setMainTab("plano");
  }

  return (
    <PortalShell hideSidebarChrome>
      {/* Vista mobile focada — apenas <lg */}
      <div className="lg:hidden">
        <PatientMobileView
          utente={utente}
          onAlertClick={(a) => {
            const m = utente.marcadores.find((mm) => mm.id === a.marcadorId);
            if (m) {
              setMainTab("clinico");
              setClinicoSub(m.categoria as ClinicoSub);
              setSelectedId(m.id);
            }
          }}
        />
      </div>

      {/* Vista desktop completa — apenas lg+ */}
      <div className="hidden lg:block">
      <PatientHeader
        utente={utente}
        novosDadosAtivo={novosDadosFiltro}
        onShowNovosDados={() => {
          setMainTab("clinico");
          setClinicoSub("analises");
          setNovosDadosFiltro((v) => !v);
        }}
        onAlertClick={(a) => {
          const m = utente.marcadores.find((mm) => mm.id === a.marcadorId);
          if (m) {
            setMainTab("clinico");
            setClinicoSub(m.categoria as ClinicoSub);
            setSelectedId(m.id);
          }
        }}
      />

      {/* Anamnese — accordion sempre visível abaixo do header */}
      <section className="border-b border-border bg-surface-raised">
        <button
          type="button"
          onClick={() => setAnamneseOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-8 py-3 text-left transition-colors hover:bg-accent/40"
          aria-expanded={anamneseOpen}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Anamnese
            </span>
            <span className="text-sm text-foreground">
              Ficha clínica · alergias, antecedentes, medicação, hábitos
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${anamneseOpen ? "rotate-180" : ""}`}
          />
        </button>
        {anamneseOpen && (
          <div className="border-t border-border px-8 py-6">
            <AnamnesePanel utente={utente} />
          </div>
        )}
      </section>

      {/* Tabs */}
      <nav className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex items-center gap-1 px-8">
          {mainTabs.map((t) => {
            const isActive = mainTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMainTab(t.id)}
                className={`relative px-4 py-3.5 text-sm transition-colors ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
        {(mainTab === "clinico" || mainTab === "consultas-docs") && (
          <div className="flex items-center gap-1 border-t border-border bg-background/60 px-8 py-2">
            {(mainTab === "clinico" ? clinicoSubs : cdSubs).map((s) => {
              const isActive =
                mainTab === "clinico" ? clinicoSub === s.id : cdSub === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    mainTab === "clinico"
                      ? handleClinicoSub(s.id as ClinicoSub)
                      : setCdSub(s.id as CDSub)
                  }
                  className={`rounded-full px-3 py-1 text-[11.5px] transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Body */}
      <main className="mx-auto max-w-[1440px] px-8 py-8 pb-24 lg:pb-8">
        {mainTab === "consultas-docs" ? (
          cdSub === "consultas" ? (
            <ConsultasPanel utente={utente} />
          ) : (
            <DocumentosPanel utente={utente} />
          )
        ) : mainTab === "clinico" && clinicoSub === "comparar" ? (
          <CompararPanel utente={utente} />
        ) : mainTab === "plano" ? (
          <PlanoPanel
            utente={utente}
            initialPrefill={planoPrefill}
            onConsumePrefill={() => setPlanoPrefill(null)}
          />
        ) : mainTab === "genomica" ? (
          <GenomicaPanel utente={utente} />
        ) : mainTab === "prescricoes" ? (
          <PrescricoesPanel utente={utente} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            {/* Marker list */}
            <aside className="rounded-2xl border border-border bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {marcadoresFiltrados.length} marcadores
                </div>
                <div className="text-[11px] text-muted-foreground">18 meses</div>
              </div>
              <MarkerList
                marcadores={marcadoresFiltrados}
                selectedId={selecionado?.id ?? ""}
                onSelect={setSelectedId}
              />
            </aside>

            {/* Detail */}
            <section>
              {selecionado && (
                <MarkerDetailPanel
                  marcador={selecionado}
                  onPrescrever={(tipo) => handlePrescrever(tipo, selecionado)}
                />
              )}
            </section>
          </div>
        )}
      </main>
      </div>
      <MobileNavTabs />
    </PortalShell>
  );
}
