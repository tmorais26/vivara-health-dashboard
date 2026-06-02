import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  FlaskConical,
  Pill,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { agendaSemana } from "@/data/mock-portal";
import { formatarData, utente as mariaMock } from "@/data/mock-utente";

export const Route = createFileRoute("/consulta/$eventoId")({
  head: () => ({
    meta: [
      { title: "Consulta — Vivara Health" },
      { name: "description", content: "Workspace clínico para registar consulta, prescrever e requisitar exames." },
    ],
  }),
  notFoundComponent: () => (
    <PortalShell>
      <main className="mx-auto max-w-[700px] px-6 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Consulta não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O evento que tentas abrir já não existe na agenda.
        </p>
        <Link
          to="/agenda"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar à agenda
        </Link>
      </main>
    </PortalShell>
  ),
  component: ConsultaPage,
});

type Prescricao = {
  id: string;
  farmaco: string;
  posologia: string;
  duracao: string;
  notas: string;
};

type Requisicao = {
  id: string;
  tipo: "analise" | "imagiologia" | "outro";
  exame: string;
  justificacao: string;
};

function ConsultaPage() {
  const { eventoId } = Route.useParams();
  const navigate = useNavigate();
  const evento = agendaSemana.find((e) => e.id === eventoId);

  if (!evento) {
    throw new Error("Evento não encontrado");
  }

  const isMaria = evento.utenteId === mariaMock.id;

  const [subjetivo, setSubjetivo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [avaliacao, setAvaliacao] = useState("");
  const [plano, setPlano] = useState("");

  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  function notificar(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function addPrescricao() {
    setPrescricoes((p) => [
      ...p,
      { id: `p-${Date.now()}`, farmaco: "", posologia: "", duracao: "", notas: "" },
    ]);
  }

  function addRequisicao(tipo: Requisicao["tipo"]) {
    setRequisicoes((r) => [
      ...r,
      { id: `r-${Date.now()}`, tipo, exame: "", justificacao: "" },
    ]);
  }

  function updatePrescricao(id: string, patch: Partial<Prescricao>) {
    setPrescricoes((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function updateRequisicao(id: string, patch: Partial<Requisicao>) {
    setRequisicoes((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function removePrescricao(id: string) {
    setPrescricoes((p) => p.filter((x) => x.id !== id));
  }

  function removeRequisicao(id: string) {
    setRequisicoes((r) => r.filter((x) => x.id !== id));
  }

  function guardar() {
    notificar("Rascunho guardado");
  }

  function finalizar() {
    notificar("Consulta finalizada e enviada à utente");
    setTimeout(() => navigate({ to: "/agenda" }), 900);
  }

  const alertas = isMaria ? mariaMock.alertas : [];
  const ficha = isMaria ? mariaMock.fichaClinica : null;

  return (
    <PortalShell>
      <main className="mx-auto max-w-[1200px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/agenda"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Agenda
            </Link>
            <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">
              Consulta — {evento.utenteNome}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatarData(evento.data)} · {evento.hora} · {evento.duracao}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5">
                {evento.tipo === "video" ? <Video className="h-3 w-3" /> : null}
                {evento.tipo}
              </span>
              <Link
                to="/utentes/$utenteId"
                params={{ utenteId: evento.utenteId }}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Abrir perfil clínico →
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{evento.motivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar rascunho
            </button>
            <button
              type="button"
              onClick={finalizar}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" />
              Finalizar consulta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* Workspace de escrita */}
          <div className="space-y-5">
            {/* SOAP */}
            <section className="rounded-2xl border border-border bg-surface-raised">
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">Nota de consulta</h2>
                </div>
                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  SOAP
                </span>
              </header>
              <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                <SoapField
                  label="S · Subjetivo"
                  hint="Queixas, contexto referido pela utente"
                  value={subjetivo}
                  onChange={setSubjetivo}
                />
                <SoapField
                  label="O · Objetivo"
                  hint="Exame físico, sinais vitais, dados objetivos"
                  value={objetivo}
                  onChange={setObjetivo}
                />
                <SoapField
                  label="A · Avaliação"
                  hint="Diagnóstico, hipóteses, raciocínio clínico"
                  value={avaliacao}
                  onChange={setAvaliacao}
                />
                <SoapField
                  label="P · Plano"
                  hint="Conduta, próximos passos, follow-up"
                  value={plano}
                  onChange={setPlano}
                />
              </div>
            </section>

            {/* Prescrições */}
            <section className="rounded-2xl border border-border bg-surface-raised">
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">
                    Prescrições <span className="text-muted-foreground">· {prescricoes.length}</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addPrescricao}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </button>
              </header>
              <div className="divide-y divide-border">
                {prescricoes.length === 0 && (
                  <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                    Sem prescrições. Adiciona um fármaco para começar.
                  </div>
                )}
                {prescricoes.map((p) => (
                  <div key={p.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-12">
                    <input
                      value={p.farmaco}
                      onChange={(e) => updatePrescricao(p.id, { farmaco: e.target.value })}
                      placeholder="Fármaco e dose (ex: Atorvastatina 20 mg)"
                      className="font-serif rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-5"
                    />
                    <input
                      value={p.posologia}
                      onChange={(e) => updatePrescricao(p.id, { posologia: e.target.value })}
                      placeholder="Posologia (ex: 1 cp ao deitar)"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-3"
                    />
                    <input
                      value={p.duracao}
                      onChange={(e) => updatePrescricao(p.id, { duracao: e.target.value })}
                      placeholder="Duração (ex: 3 meses)"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-3"
                    />
                    <button
                      type="button"
                      onClick={() => removePrescricao(p.id)}
                      aria-label="Remover"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-state-alert md:col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <textarea
                      value={p.notas}
                      onChange={(e) => updatePrescricao(p.id, { notas: e.target.value })}
                      placeholder="Notas / instruções adicionais"
                      rows={1}
                      className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-12"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Requisições */}
            <section className="rounded-2xl border border-border bg-surface-raised">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">
                    Requisições <span className="text-muted-foreground">· {requisicoes.length}</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ReqButton onClick={() => addRequisicao("analise")} label="Análise" />
                  <ReqButton onClick={() => addRequisicao("imagiologia")} label="Imagiologia" />
                  <ReqButton onClick={() => addRequisicao("outro")} label="Outro" />
                </div>
              </header>
              <div className="divide-y divide-border">
                {requisicoes.length === 0 && (
                  <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                    Sem requisições. Pede uma análise ou exame para começar.
                  </div>
                )}
                {requisicoes.map((r) => (
                  <div key={r.id} className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-12">
                    <span className="inline-flex items-center self-start rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-foreground/80 md:col-span-2">
                      {r.tipo}
                    </span>
                    <input
                      value={r.exame}
                      onChange={(e) => updateRequisicao(r.id, { exame: e.target.value })}
                      placeholder={
                        r.tipo === "analise"
                          ? "Ex: HbA1c, perfil lipídico, TSH"
                          : r.tipo === "imagiologia"
                            ? "Ex: Ecografia tiroideia"
                            : "Descreve a requisição"
                      }
                      className="font-serif rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-9"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequisicao(r.id)}
                      aria-label="Remover"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-state-alert md:col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <textarea
                      value={r.justificacao}
                      onChange={(e) => updateRequisicao(r.id, { justificacao: e.target.value })}
                      placeholder="Justificação clínica"
                      rows={1}
                      className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none md:col-span-12"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Contexto lateral */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-surface-raised p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Contexto da utente
              </div>
              {alertas.length > 0 ? (
                <ul className="space-y-1.5">
                  {alertas.slice(0, 3).map((a) => (
                    <li
                      key={a.id}
                      className="rounded-lg border border-state-warn/30 bg-state-warn-soft px-2.5 py-1.5 text-[11.5px] text-state-warn"
                    >
                      <div className="font-medium">{a.titulo}</div>
                      <div className="opacity-70">{a.detalhe}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground">Sem alertas activos.</p>
              )}
            </section>

            {ficha && (
              <section className="rounded-2xl border border-border bg-surface-raised p-4">
                <div className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Alergias e medicação
                </div>
                <div className="space-y-2 text-[12px] text-foreground">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-state-alert">
                      Alergias
                    </div>
                    {ficha.alergiasMedicamentos.length === 0 ? (
                      <p className="text-muted-foreground">Sem alergias conhecidas</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {ficha.alergiasMedicamentos.map((a, i) => (
                          <li key={i}>{a.substancia} · {a.reacao}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      Medicação habitual
                    </div>
                    {ficha.medicacaoHabitual.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {ficha.medicacaoHabitual.map((m, i) => (
                          <li key={i}>{m.nome} · {m.posologia}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            <Link
              to="/utentes/$utenteId"
              params={{ utenteId: evento.utenteId }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
            >
              Ver perfil completo
            </Link>
          </aside>
        </div>

        {toast && (
          <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {toast}
            </span>
          </div>
        )}
      </main>
    </PortalShell>
  );
}

function SoapField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4">
      <div>
        <div className="text-[10.5px] uppercase tracking-wider text-foreground">{label}</div>
        <div className="text-[10.5px] text-muted-foreground">{hint}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Escreve aqui…"
        className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:outline-none"
      />
    </div>
  );
}

function ReqButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}
