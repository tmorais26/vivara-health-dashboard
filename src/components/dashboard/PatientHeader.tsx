import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  History,
  Info,
  Lock,
  MessageSquare,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Alerta, Utente } from "@/data/mock-utente";
import { formatarData } from "@/data/mock-utente";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ALERTA_VS_ALVO_EXPLICACAO } from "@/data/mock-portal";
import { InfoHint } from "@/components/portal/InfoHint";
import {
  Field,
  ModalActions,
  PrimaryButton,
  SecondaryButton,
  SimpleModal,
  inputClass,
  textareaClass,
} from "@/components/portal/SimpleModal";

export function PatientHeader({
  utente,
  onAlertClick,
}: {
  utente: Utente;
  onAlertClick: (a: Alerta) => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [novaNotaOpen, setNovaNotaOpen] = useState(false);
  const [novoAlertaOpen, setNovoAlertaOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sessão countdown — começa a 14:32
  const [sessao, setSessao] = useState(14 * 60 + 32);
  useEffect(() => {
    const id = setInterval(() => setSessao((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const sessaoFmt = `${String(Math.floor(sessao / 60)).padStart(2, "0")}:${String(sessao % 60).padStart(2, "0")}`;
  const sessaoBaixa = sessao <= 180;

  const iniciais = utente.nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="border-b border-border bg-surface-raised">
      {/* Top bar com breadcrumb */}
      <div className="flex items-center justify-between border-b border-border px-8 py-3">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Utentes
            </Link>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-foreground">{utente.nome}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span>Análises</span>
          </nav>
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
            className={`tabular inline-flex items-center gap-1.5 text-[10.5px] ${sessaoBaixa ? "font-medium text-state-warn" : "text-muted-foreground"}`}
            title="Tempo restante de sessão antes de logout automático por inatividade"
          >
            <Lock className="h-3 w-3" />
            Sessão · {sessaoFmt}
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
                <span>F · 67 kg · 1.65 m</span>
                <span>·</span>
                <span>{utente.cidade}</span>
                <span>·</span>
                <span>Plano {utente.plano}</span>
                <span>·</span>
                <span>Última consulta {formatarData(utente.ultimaConsulta)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-foreground">
                  <Bell className="h-3 w-3 text-state-warn" />
                  Próxima {formatarData(utente.proximaConsulta)}
                </span>
                <span>·</span>
                <a href="mailto:maria@example.pt" className="inline-flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-3 w-3" />
                  +351 91 000 0000
                </a>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-state-alert/30 bg-state-alert-soft px-2.5 py-1 text-[10.5px] font-medium text-state-alert">
                  <Sparkles className="h-2.5 w-2.5" />
                  Novos dados desde a tua última visita · 14 valores
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMsgOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Mensagem
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              title="Pré-visualizar o que a utente vê na app"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver app
            </button>
            <button
              type="button"
              onClick={() => setNovaNotaOpen(true)}
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
              onClick={() => setNovoAlertaOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              title="Criar regra de alerta personalizada (ex.: HbA1c > 5.7%)"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Novo alerta
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
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              {utente.alertas.length} alertas clínicos · 11 fora do alvo
              <InfoHint title="Alertas clínicos vs. fora do alvo">
                <p>{ALERTA_VS_ALVO_EXPLICACAO}</p>
                <p className="text-muted-foreground">
                  Em prática: nem tudo o que está fora do alvo gera alerta —
                  apenas os marcadores com tendência ou magnitude clinicamente
                  relevante surgem como alerta para acção.
                </p>
              </InfoHint>
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

      {/* Modais */}
      <NovaNotaModal open={novaNotaOpen} onClose={() => setNovaNotaOpen(false)} utente={utente} />
      <NovoAlertaModal open={novoAlertaOpen} onClose={() => setNovoAlertaOpen(false)} />
      <MensagemModal open={msgOpen} onClose={() => setMsgOpen(false)} utente={utente} />
      <PreviewAppModal open={previewOpen} onClose={() => setPreviewOpen(false)} utente={utente} />
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

function NovaNotaModal({
  open,
  onClose,
  utente,
}: {
  open: boolean;
  onClose: () => void;
  utente: Utente;
}) {
  const [tipo, setTipo] = useState<"consulta" | "avulsa" | "followup">("consulta");
  const [enviarUtente, setEnviarUtente] = useState(false);
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="Nova nota"
      description={`Anexada ao perfil de ${utente.nome}. Por defeito é interna.`}
      width="md"
    >
      <div className="space-y-4">
        <Field label="Tipo de nota">
          <div className="grid grid-cols-3 gap-2">
            {(["consulta", "avulsa", "followup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  tipo === t
                    ? "border-foreground/40 bg-accent text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "consulta" ? "Consulta" : t === "avulsa" ? "Avulsa" : "Follow-up"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Conteúdo">
          <textarea
            className={textareaClass}
            placeholder="O que foi falado, raciocínio clínico, próximos passos…"
          />
        </Field>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="h-3 w-3" />
          Gerar rascunho com IA · revistas pela médica
        </button>
        <label className="flex items-start gap-2 rounded-xl border border-border bg-background p-3">
          <input
            type="checkbox"
            checked={enviarUtente}
            onChange={(e) => setEnviarUtente(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground">
            Enviar versão partilhada para a app da utente
            <span className="block text-[11px] text-muted-foreground">
              A nota interna fica sempre privada. Só o resumo aprovado é enviado.
            </span>
          </span>
        </label>
      </div>
      <ModalActions>
        <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
        <PrimaryButton onClick={onClose}>
          {enviarUtente ? "Guardar e enviar" : "Guardar interna"}
        </PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}

function NovoAlertaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="Novo alerta personalizado"
      description="Define uma regra que dispara uma notificação no portal e/ou na app."
      width="md"
    >
      <div className="space-y-4">
        <Field label="Marcador">
          <select className={inputClass}>
            <option>HbA1c</option>
            <option>LDL-C</option>
            <option>hsCRP</option>
            <option>Vitamina D</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Condição">
            <select className={inputClass}>
              <option>maior que</option>
              <option>menor que</option>
              <option>variação ≥ %</option>
            </select>
          </Field>
          <Field label="Valor">
            <input className={inputClass} placeholder="5.7" />
          </Field>
        </div>
        <Field label="Quem é avisado">
          <div className="flex flex-col gap-2 text-xs text-foreground">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Médica responsável (portal + email)
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" /> Utente (notificação na app)
            </label>
          </div>
        </Field>
      </div>
      <ModalActions>
        <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
        <PrimaryButton onClick={onClose}>Criar alerta</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}

function MensagemModal({
  open,
  onClose,
  utente,
}: {
  open: boolean;
  onClose: () => void;
  utente: Utente;
}) {
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={`Mensagem para ${utente.nome}`}
      description="Aparece imediatamente na app. Curta e específica."
      width="md"
    >
      <div className="space-y-3">
        <textarea
          className={textareaClass}
          placeholder="Maria, os teus resultados chegaram. Falta repetir Vitamina D…"
        />
        <div className="text-[11px] text-muted-foreground">
          A utente vê a mensagem na inbox da app e pode responder. Tudo fica registado em RGPD/Art. 30.
        </div>
      </div>
      <ModalActions>
        <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
        <PrimaryButton onClick={onClose}>Enviar mensagem</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}

function PreviewAppModal({
  open,
  onClose,
  utente,
}: {
  open: boolean;
  onClose: () => void;
  utente: Utente;
}) {
  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title="O que a utente vê"
      description="Pré-visualização read-only da app de Maria. Nada do que vês aqui é editável."
      width="lg"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PreviewCard title="Plano de hoje">
          <ul className="space-y-2 text-xs text-foreground">
            <li>· 08:00 — Vitamina D3 5000 UI ao p.almoço</li>
            <li>· 13:00 — Berberina 500 mg ao almoço</li>
            <li>· 22:30 — Magnésio bisglicinato ao deitar</li>
          </ul>
        </PreviewCard>
        <PreviewCard title="Notas partilhadas activas">
          <p className="text-xs text-foreground">
            “O teu LDL tem subido nos últimos meses. Vamos reforçar fibra solúvel e reavaliar.”
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">Sobre LDL-C · Dra. Sofia Cardoso</p>
        </PreviewCard>
        <PreviewCard title="Próxima consulta">
          <p className="text-xs text-foreground">
            {formatarData(utente.proximaConsulta)} · 10:30 · presencial
          </p>
        </PreviewCard>
        <PreviewCard title="Lembretes activos">
          <ul className="space-y-1 text-xs text-foreground">
            <li>· Repetir painel lipídico até 15 Mai</li>
            <li>· Repetir Vitamina D após 8 semanas</li>
          </ul>
        </PreviewCard>
      </div>
      <ModalActions>
        <PrimaryButton onClick={onClose}>Fechar</PrimaryButton>
      </ModalActions>
    </SimpleModal>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
