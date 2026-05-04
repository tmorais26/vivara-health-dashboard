import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  Monitor,
  Phone,
  Sparkles,
} from "lucide-react";
import type { Alerta, Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";
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
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onAlertClick(a)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[12px] ${tone}`}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{a.titulo}</span>
                      <span className="block opacity-70">{a.detalhe}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                  </button>
                </li>
              );
            })}
          </ul>
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
                Próxima revisão · {ultimaNota.proximaRevisao}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Diário interno (3 últimas) */}
      {notasRecentes.length > 1 && (
        <section className="border-b border-border px-4 py-5">
          <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <FileText className="inline h-3 w-3" />
            <span>Notas internas recentes</span>
          </div>
          <ul className="space-y-2">
            {notasRecentes.slice(1).map((n) => (
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
      )}

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
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-3 text-[12px] font-medium text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Mensagem
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