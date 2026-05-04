import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { utente, type Categoria, type Marcador, type TipoTarefa } from "@/data/mock-utente";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { MarkerList } from "@/components/dashboard/MarkerList";
import { MarkerDetailPanel } from "@/components/dashboard/MarkerDetailPanel";
import { GenomicaPanel } from "@/components/dashboard/GenomicaPanel";
import { PrescricoesPanel } from "@/components/dashboard/PrescricoesPanel";
import { PlanoPanel } from "@/components/dashboard/PlanoPanel";
import { AnamnesePanel } from "@/components/dashboard/AnamnesePanel";
import { ConsultasPanel } from "@/components/dashboard/ConsultasPanel";
import { CompararPanel } from "@/components/dashboard/CompararPanel";

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

type Tab = Categoria | "plano" | "anamnese" | "consultas" | "comparar";
const tabs: { id: Tab; label: string }[] = [
  { id: "anamnese", label: "Anamnese" },
  { id: "analises", label: "Análises" },
  { id: "composicao", label: "Composição" },
  { id: "wearable", label: "Wearable" },
  { id: "comparar", label: "Comparar" },
  { id: "genomica", label: "Genómica" },
  { id: "prescricoes", label: "Prescrições" },
  { id: "consultas", label: "Consultas" },
  { id: "plano", label: "Plano" },
];

function DashboardUtente() {
  const [activeTab, setActiveTab] = useState<Tab>("analises");
  const [selectedId, setSelectedId] = useState<string>("ldl");
  const [planoPrefill, setPlanoPrefill] = useState<{
    tipo: TipoTarefa;
    marcador?: Marcador;
  } | null>(null);

  const marcadoresFiltrados = useMemo(
    () =>
      activeTab === "plano" ||
      activeTab === "genomica" ||
      activeTab === "prescricoes" ||
      activeTab === "anamnese" ||
      activeTab === "consultas" ||
      activeTab === "comparar"
        ? []
        : utente.marcadores.filter((m) => m.categoria === (activeTab as Categoria)),
    [activeTab],
  );

  const selecionado =
    utente.marcadores.find((m) => m.id === selectedId) ?? marcadoresFiltrados[0];

  // ao mudar de tab, se o seleccionado não pertence à nova categoria, escolher o primeiro
  function handleTab(id: Tab) {
    setActiveTab(id);
    if (
      id === "genomica" ||
      id === "prescricoes" ||
      id === "plano" ||
      id === "anamnese" ||
      id === "consultas" ||
      id === "comparar"
    )
      return;
    const lista = utente.marcadores.filter((m) => m.categoria === (id as Categoria));
    if (!lista.find((m) => m.id === selectedId) && lista[0]) {
      setSelectedId(lista[0].id);
    }
  }

  function handlePrescrever(tipo: TipoTarefa, marcador: Marcador) {
    setPlanoPrefill({ tipo, marcador });
    setActiveTab("plano");
  }

  return (
    <PortalShell hideSidebarChrome>
      <PatientHeader
        utente={utente}
        onAlertClick={(a) => {
          const m = utente.marcadores.find((mm) => mm.id === a.marcadorId);
          if (m) {
            setActiveTab(m.categoria);
            setSelectedId(m.id);
          }
        }}
      />

      {/* Tabs */}
      <nav className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex items-center gap-1 px-8">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTab(t.id)}
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
      </nav>

      {/* Body */}
      <main className="mx-auto max-w-[1440px] px-8 py-8 pb-24 lg:pb-8">
        {activeTab === "anamnese" ? (
          <AnamnesePanel utente={utente} />
        ) : activeTab === "consultas" ? (
          <ConsultasPanel utente={utente} />
        ) : activeTab === "comparar" ? (
          <CompararPanel utente={utente} />
        ) : activeTab === "plano" ? (
          <PlanoPanel
            utente={utente}
            initialPrefill={planoPrefill}
            onConsumePrefill={() => setPlanoPrefill(null)}
          />
        ) : activeTab === "genomica" ? (
          <GenomicaPanel utente={utente} />
        ) : activeTab === "prescricoes" ? (
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
      <MobileNavTabs />
    </PortalShell>
  );
}
