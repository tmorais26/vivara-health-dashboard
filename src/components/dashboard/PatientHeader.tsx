import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  History,
  Lock,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { Alerta, Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PatientHeader({
  utente,
  onAlertClick,
}: {
  utente: Utente;
  onAlertClick: (a: Alerta) => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const iniciais = utente.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="border-b border-border bg-surface-raised">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-8 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Utentes
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
            <span className="font-serif text-base text-foreground">Vivara Health</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-state-ok/30 bg-state-ok-soft/60 px-2.5 py-1 text-[10.5px] font-medium text-state-ok"
            title="Sessão protegida com autenticação multifator"
          >
            <ShieldCheck className="h-3 w-3" />
            MFA activo
          </span>
          <span
            className="tabular inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground"
            title="Tempo restante de sessão antes de logout automático por inatividade"
          >
            <Lock className="h-3 w-3" />
            Sessão · 14:32
          </span>
          <ThemeToggle />
          <span>{utente.medicaResponsavel}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
            SC
          </div>
        </div>
      </div>

      {/* Patient identity */}
      <div className="px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-medium text-foreground">
              {iniciais}
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground">
                {utente.nome}
                <span className="ml-2 text-muted-foreground">, {utente.idade}</span>
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{utente.cidade}</span>
                <span>·</span>
                <span>Plano {utente.plano}</span>
                <span>·</span>
                <span>Última consulta {formatarData(utente.ultimaConsulta)}</span>
                <span>·</span>
                <span>Próxima {formatarData(utente.proximaConsulta)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <FileText className="h-3.5 w-3.5" />
              Nova nota
            </button>
            <button
              type="button"
              onClick={() => setAuditOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                auditOpen
                  ? "border-foreground/40 bg-accent text-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
              title="Registo de acessos a este perfil (RGPD)"
            >
              <History className="h-3.5 w-3.5" />
              Acessos
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Alertas
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
                <ChevronDown className="h-3 w-3" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
                  <ExportItem label="PDF · Resumo clínico" hint="Para utente ou outro médico" />
                  <ExportItem label="CSV · Marcadores tabulares" hint="Para análise externa" />
                  <ExportItem label="HL7 FHIR · Bundle" hint="Interoperabilidade clínica" />
                </div>
              )}
            </div>
          </div>
        </div>

        {auditOpen && (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <History className="h-3 w-3" />
                Registo de acessos · últimos 7 dias
              </div>
              <span className="text-[10.5px] text-muted-foreground">
                Conservado 6 anos · RGPD Art. 30
              </span>
            </div>
            <ul className="divide-y divide-border text-[12px]">
              <AuditRow when="Hoje · 09:14" who="Dra. Sofia Cardoso" what="Visualizou marcadores · Análises" />
              <AuditRow when="Ontem · 18:22" who="Dra. Sofia Cardoso" what="Editou nota interna · LDL-C" />
              <AuditRow when="27 abr · 10:05" who="Inês Carvalho (Nutrição)" what="Visualizou plano + composição" />
              <AuditRow when="22 abr · 11:14" who="Sistema" what="Carregou análise PDF (Synlab)" />
            </ul>
          </div>
        )}

        {/* Alerts band */}
        {utente.alertas.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {utente.alertas.length} alertas activos
            </span>
            <span className="text-muted-foreground/40">·</span>
            {utente.alertas.map((a) => {
              const tone =
                a.estado === "alerta"
                  ? "border-state-alert/30 bg-state-alert-soft text-state-alert hover:border-state-alert/50"
                  : "border-state-warn/30 bg-state-warn-soft text-state-warn hover:border-state-warn/50";
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAlertClick(a)}
                  className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${tone}`}
                >
                  <span className="font-medium">{a.titulo}</span>
                  <span className="opacity-70">{a.detalhe}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

function ExportItem({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      type="button"
      className="block w-full px-3 py-2.5 text-left hover:bg-accent"
    >
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="text-[10.5px] text-muted-foreground">{hint}</div>
    </button>
  );
}

function AuditRow({ when, who, what }: { when: string; who: string; what: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <div className="text-[12px] text-foreground">{who}</div>
        <div className="text-[11px] text-muted-foreground">{what}</div>
      </div>
      <div className="tabular text-[11px] text-muted-foreground">{when}</div>
    </li>
  );
}
