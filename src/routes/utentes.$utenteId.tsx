import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { utente, type Categoria } from "@/data/mock-utente";
import { PatientHeader } from "@/components/dashboard/PatientHeader";
import { MarkerList } from "@/components/dashboard/MarkerList";
import { MarkerDetailPanel } from "@/components/dashboard/MarkerDetailPanel";
import { GenomicaPanel } from "@/components/dashboard/GenomicaPanel";
import { PrescricoesPanel } from "@/components/dashboard/PrescricoesPanel";

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

const tabs: { id: Categoria; label: string }[] = [
  { id: "analises", label: "Análises" },
  { id: "composicao", label: "Composição" },
  { id: "wearable", label: "Wearable" },
  { id: "genomica", label: "Genómica" },
  { id: "prescricoes", label: "Prescrições" },
];

function DashboardUtente() {
  const [activeTab, setActiveTab] = useState<Categoria>("analises");
  const [selectedId, setSelectedId] = useState<string>("ldl");

  const marcadoresFiltrados = useMemo(
    () => utente.marcadores.filter((m) => m.categoria === activeTab),
    [activeTab],
  );

  const selecionado =
    utente.marcadores.find((m) => m.id === selectedId) ?? marcadoresFiltrados[0];

  // ao mudar de tab, se o seleccionado não pertence à nova categoria, escolher o primeiro
  function handleTab(id: Categoria) {
    setActiveTab(id);
    if (id === "genomica" || id === "prescricoes") return;
    const lista = utente.marcadores.filter((m) => m.categoria === id);
    if (!lista.find((m) => m.id === selectedId) && lista[0]) {
      setSelectedId(lista[0].id);
    }
  }

  return (
    <div className="min-h-screen bg-background">
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
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        {activeTab === "genomica" ? (
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
            <section>{selecionado && <MarkerDetailPanel marcador={selecionado} />}</section>
          </div>
        )}
      </main>
    </div>
  );
}
