import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Bell,
  BellPlus,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Footprints,
  FileText,
  HeartPulse,
  MessageSquare,
  Monitor,
  Moon,
  Phone,
  Send,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Alerta, Utente } from "@/data/mock-utente";
import { calcularEstado, formatarData, formatarValor } from "@/data/mock-utente";
import { ALERTA_VS_ALVO_EXPLICACAO } from "@/data/mock-portal";

/**
 * Vista mobile focada para a médica — consulta rápida entre consultas.
 * Mostra resumo, alertas, próxima/última consulta e últimas notas internas.
 * Edição completa (marcadores, plano, prescrições) fica relegada para desktop.
 */
export function PatientMobileView({
  utente,
  onAlertClick,
}: {
  utente: Utente;
  onAlertClick: (a: Alerta) => void;
}) {
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [openAlertaId, setOpenAlertaId] = useState<string | null>(null);
  const [notaRapida, setNotaRapida] = useState("");
  const [notaAberta, setNotaAberta] = useState(false);
  const [notasLocais, setNotasLocais] = useState<{ id: string; texto: string; ts: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const ultimaNota = [...utente.notasMedicas].sort((a, b) =>
    b.data.localeCompare(a.data),
  )[0];
  const notasRecentes = [...utente.notasMedicas]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 3);

  const iniciais = utente.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  // Próxima consulta agendada para esta utente — buscar hora real
  const consultaProxima = utente.consultas.find(
    (c) => c.estado === "agendada" && c.data === utente.proximaConsulta,
  );

  // Adesão (mock determinístico) — pior casos primeiro
  const adesao = [
    { id: "vitd", titulo: "Vitamina D3 5000 UI", taxa: 20, dias: "2 de 10 dias", tom: "alert" as const },
    { id: "berb", titulo: "Berberina 500 mg", taxa: 60, dias: "6 de 10 dias", tom: "warn" as const },
    { id: "mag", titulo: "Magnésio bisglicinato", taxa: 90, dias: "9 de 10 dias", tom: "ok" as const },
  ];

  // Sinais vitais — últimos 7 dias agregados a partir da série
  const wearable = utente.marcadores.filter((m) => m.categoria === "wearable");
  const sono = wearable.find((m) => m.id === "sono");
  const hrv = wearable.find((m) => m.id === "hrv");
  const passos = wearable.find((m) => m.id === "passos");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Voltar */}
      <div className="border-b border-border bg-surface-raised px-4 py-2.5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Utentes
        </Link>
      </div>

      {/* Identidade */}
      <section className="border-b border-border bg-surface-raised px-4 pb-5 pt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-foreground">
            {iniciais}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl text-foreground">
              {utente.nome}
              <span className="ml-1.5 text-base text-muted-foreground">
                , {utente.idade}
              </span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>F · {utente.cidade}</span>
              <span>·</span>
              <span>Plano {utente.plano}</span>
            </div>
          </div>
        </div>

        {/* Accordion: detalhes secundários */}
        <button
          type="button"
          onClick={() => setDetalhesOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground"
        >
          <span>Detalhes & segurança</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${detalhesOpen ? "rotate-180" : ""}`}
          />
        </button>
        {detalhesOpen && (
          <div className="mt-2 space-y-2 rounded-xl border border-border bg-background p-3 text-[12px]">
            <Row label="Demografia" value="F · 67 kg · 1.65 m" />
            <Row label="Médica" value={utente.medicaResponsavel} />
            <Row label="Contacto" value="+351 91 000 0000" icon={<Phone className="h-3 w-3" />} />
            <Row label="MFA" value="Activo · TOTP" />
            <Row label="Sessão" value="Expira em 14:32" />
            <Row label="Acessos" value="Hoje · Dra. Sofia Cardoso" />
          </div>
        )}

        {/* Próxima consulta — destaque */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-state-warn/30 bg-state-warn-soft/60 px-3 py-2.5 text-[12px] text-state-warn">
          <Bell className="h-3.5 w-3.5" />
          <span className="font-medium">Próxima consulta</span>
          <span className="ml-auto tabular text-foreground">
            {formatarData(utente.proximaConsulta)}
            {consultaProxima?.hora ? ` · ${consultaProxima.hora}` : ""}
          </span>
        </div>
      </section>

      {/* Alertas */}
      {utente.alertas.length > 0 && (
        <section className="border-b border-border px-4 py-5">
          <div
            className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground"
            title={ALERTA_VS_ALVO_EXPLICACAO}
          >
            <span>{utente.alertas.length} alertas clínicos</span>
            <span>11 fora do alvo</span>
          </div>
          <ul className="space-y-2">
            {utente.alertas.map((a) => {
              const tone =
                a.estado === "alerta"
                  ? "border-state-alert/30 bg-state-alert-soft text-state-alert"
                  : "border-state-warn/30 bg-state-warn-soft text-state-warn";
              const aberto = openAlertaId === a.id;
              return (
                <li key={a.id}>
                  <div className={`overflow-hidden rounded-xl border ${tone}`}>
                    <button
                      type="button"
                      onClick={() => setOpenAlertaId(aberto ? null : a.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[12px]"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{a.titulo}</span>
                        <span className="block opacity-70">{a.detalhe}</span>
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${aberto ? "rotate-90" : ""}`}
                      />
                    </button>
                    {aberto && (
                      <div className="grid grid-cols-3 gap-1 border-t border-current/10 bg-background/60 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            onAlertClick(a);
                            flash("Marcador aberto na vista desktop");
                          }}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          Ver marcador
                        </button>
                        <button
                          type="button"
                          onClick={() => flash("Lembrete enviado à utente")}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Lembrete
                        </button>
                        <button
                          type="button"
                          onClick={() => flash("Reanálise pedida")}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Reanálise
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Adesão ao plano */}
      <section className="border-b border-border px-4 py-5">
        <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <span>Adesão · últimos 10 dias</span>
          <span className="tabular">73% global</span>
        </div>
        <ul className="space-y-2">
          {adesao.map((a) => {
            const barColor =
              a.tom === "alert"
                ? "bg-state-alert"
                : a.tom === "warn"
                  ? "bg-state-warn"
                  : "bg-state-ok";
            const txtColor =
              a.tom === "alert"
                ? "text-state-alert"
                : a.tom === "warn"
                  ? "text-state-warn"
                  : "text-state-ok";
            return (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-surface-raised p-3"
              >
                <div className="flex items-center justify-between text-[12px] text-foreground">
                  <span className="truncate">{a.titulo}</span>
                  <span className={`tabular text-[11px] font-medium ${txtColor}`}>
                    {a.taxa}%
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${barColor}`} style={{ width: `${a.taxa}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                  <span>{a.dias}</span>
                  {a.tom === "alert" && (
                    <button
                      type="button"
                      onClick={() => flash("Mensagem enviada à utente")}
                      className="inline-flex items-center gap-1 text-state-alert"
                    >
                      <Send className="h-3 w-3" />
                      Enviar mensagem
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sinais vitais — últimos 7 dias */}
      {(sono || hrv || passos) && (
        <section className="border-b border-border px-4 py-5">
          <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <span>Sinais · últimos 7 dias</span>
            <span>Wearable</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sono && (
              <VitalCard
                icon={<Moon className="h-3.5 w-3.5" />}
                label="Sono"
                value={formatarValor(sono)}
                tom={calcularEstado(sono)}
              />
            )}
            {hrv && (
              <VitalCard
                icon={<HeartPulse className="h-3.5 w-3.5" />}
                label="HRV"
                value={`${formatarValor(hrv)} ms`}
                tom={calcularEstado(hrv)}
              />
            )}
            {passos && (
              <VitalCard
                icon={<Footprints className="h-3.5 w-3.5" />}
                label="Passos"
                value={formatarValor(passos)}
                tom={calcularEstado(passos)}
              />
            )}
          </div>
        </section>
      )}

      {/* Última consulta */}
      {ultimaNota && (
        <section className="border-b border-border px-4 py-5">
          <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <span>Última consulta</span>
            <span className="tabular">{formatarData(ultimaNota.data)}</span>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4 text-[13px] text-foreground">
            {ultimaNota.subjetivo && (
              <NotaBlock label="Subjectivo" value={ultimaNota.subjetivo} />
            )}
            {ultimaNota.avaliacao && (
              <NotaBlock label="Avaliação" value={ultimaNota.avaliacao} />
            )}
            {ultimaNota.plano && <NotaBlock label="Plano" value={ultimaNota.plano} />}
            {ultimaNota.proximaRevisao && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Próxima revisão · {formatarData(ultimaNota.proximaRevisao)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Diário interno (3 últimas) */}
      <section className="border-b border-border px-4 py-5">
        <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Notas internas
          </span>
          <button
            type="button"
            onClick={() => setNotaAberta((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[10.5px] font-medium normal-case tracking-normal text-foreground"
          >
            <Plus className="h-3 w-3" />
            Nota rápida
          </button>
        </div>
        {notaAberta && (
          <div className="mb-3 rounded-xl border border-border bg-surface-raised p-3">
            <textarea
              value={notaRapida}
              onChange={(e) => setNotaRapida(e.target.value)}
              placeholder="Anotação rápida — guarda como nota interna com timestamp"
              className="min-h-[72px] w-full resize-y rounded-lg border border-border bg-background p-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNotaAberta(false);
                  setNotaRapida("");
                }}
                className="rounded-full px-3 py-1 text-[11px] text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!notaRapida.trim()}
                onClick={() => {
                  const ts = new Date().toISOString();
                  setNotasLocais((arr) => [
                    { id: `nl-${arr.length + 1}`, texto: notaRapida.trim(), ts },
                    ...arr,
                  ]);
                  setNotaRapida("");
                  setNotaAberta(false);
                  flash("Nota guardada (interna)");
                }}
                className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
        <ul className="space-y-2">
          {notasLocais.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-state-ok/30 bg-state-ok-soft/40 p-3 text-[12px] text-foreground"
            >
              <div className="mb-1 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <span>nota rápida</span>
                <span className="tabular">{formatarData(n.ts.slice(0, 10))}</span>
              </div>
              <p className="text-muted-foreground">{n.texto}</p>
            </li>
          ))}
          {notasRecentes.slice(notasLocais.length > 0 ? 0 : 1).map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-border bg-surface-raised p-3 text-[12px] text-foreground"
            >
              <div className="mb-1 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <span>{n.tipo}</span>
                <span className="tabular">{formatarData(n.data)}</span>
              </div>
              <p className="line-clamp-3 text-muted-foreground">
                {n.plano ?? n.avaliacao ?? n.subjetivo ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Acções rápidas */}
      <section className="px-4 py-5">
        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:+351910000000"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-3 text-[12px] font-medium text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </a>
          <button
            type="button"
            onClick={() => flash("Mensagem rápida enviada")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-3 text-[12px] font-medium text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Mensagem
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => flash("Pedido de reanálise criado")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-3 text-[12px] font-medium text-foreground"
          >
            <BellPlus className="h-3.5 w-3.5" />
            Pedir reanálise
          </button>
          <button
            type="button"
            onClick={() => flash("Consulta agendada")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-3 text-[12px] font-medium text-foreground"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Agendar
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-[11.5px] text-muted-foreground">
          <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Edição de marcadores, plano, prescrições e comparação longitudinal está
            disponível na <span className="text-foreground">vista de desktop</span>. Esta
            vista é optimizada para consulta rápida entre consultas.
          </span>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-[11.5px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-foreground">
        {icon}
        {value}
      </span>
    </div>
  );
}

function NotaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="leading-relaxed">{value}</p>
    </div>
  );
}

function VitalCard({
  icon,
  label,
  value,
  tom,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tom: "ok" | "atencao" | "alerta";
}) {
  const ring =
    tom === "alerta"
      ? "border-state-alert/30"
      : tom === "atencao"
        ? "border-state-warn/30"
        : "border-border";
  const valColor =
    tom === "alerta"
      ? "text-state-alert"
      : tom === "atencao"
        ? "text-state-warn"
        : "text-foreground";
  return (
    <div className={`rounded-xl border ${ring} bg-surface-raised p-2.5 text-center`}>
      <div className="mx-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`tabular mt-1 text-base font-semibold ${valColor}`}>{value}</div>
    </div>
  );
}