import { useState } from "react";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarPlus,
  Camera,
  ChevronDown,
  ChevronRight,
  Footprints,
  FileText,
  HeartPulse,
  Monitor,
  Moon,
  Phone,
  Pill,
  Send,
  Scissors,
  Plus,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import type { Alerta, Utente } from "@/data/mock-utente";
import { calcularEstado, formatarData, formatarValor } from "@/data/mock-utente";
import { ALERTA_VS_ALVO_EXPLICACAO } from "@/data/mock-portal";
import { InfoHint } from "@/components/portal/InfoHint";
import { ChatModal } from "@/components/portal/ChatModal";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [openAlertaId, setOpenAlertaId] = useState<string | null>(null);
  const [notaRapida, setNotaRapida] = useState("");
  const [notaAberta, setNotaAberta] = useState(false);
  const [notasLocais, setNotasLocais] = useState<{ id: string; texto: string; ts: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);
  const [docsCarregados, setDocsCarregados] = useState<{ id: string; nome: string }[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

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
  const ficha = utente.fichaClinica;

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
          {t.nav.utentes}
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
              <span>{t.lista.plano} {utente.plano}</span>
            </div>
          </div>
        </div>

        {/* Accordion: detalhes secundários */}
        <button
          type="button"
          onClick={() => setDetalhesOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground"
        >
          <span>{t.mobile.detalhes}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${detalhesOpen ? "rotate-180" : ""}`}
          />
        </button>
        {detalhesOpen && (
          <div className="mt-2 space-y-2 rounded-xl border border-border bg-background p-3 text-[12px]">
            <Row label={t.mobile.demografia} value="F · 67 kg · 1.65 m" />
            <Row label={t.mobile.medica} value={utente.medicaResponsavel} />
            <Row label={t.mobile.contacto} value="+351 91 000 0000" icon={<Phone className="h-3 w-3" />} />
          </div>
        )}

        {/* Anamnese clínica — visível na app da médica, logo no topo do perfil */}
        <div className="mt-4 rounded-xl border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {t.mobile.anamneseClinica}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {t.mobile.anamneseResumida}
              </div>
            </div>
            <span className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[10px] text-muted-foreground">
              {formatarData(ficha.preenchidaEm)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <AnamneseMobileRow
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              title={t.mobile.alergias}
              items={ficha.alergiasMedicamentos.map((a) => `${a.substancia} · ${a.reacao}`)}
              alert
            />
            <AnamneseMobileRow
              icon={<HeartPulse className="h-3.5 w-3.5" />}
              title={t.mobile.antPessoais}
              items={ficha.antecedentesPessoais}
            />
            <AnamneseMobileRow
              icon={<Pill className="h-3.5 w-3.5" />}
              title={t.mobile.medicacao}
              items={ficha.medicacaoHabitual.map((m) => `${m.nome} · ${m.posologia}`)}
            />
            <AnamneseMobileRow
              icon={<Sparkles className="h-3.5 w-3.5" />}
              title={t.mobile.suplementacao}
              items={ficha.suplementacao.map((s) => `${s.nome} · ${s.posologia}`)}
            />
            <AnamneseMobileRow
              icon={<Scissors className="h-3.5 w-3.5" />}
              title={t.mobile.antCirurgicos}
              items={ficha.antecedentesCirurgicos.map((c) => `${c.intervencao} · ${c.ano}`)}
            />
            <AnamneseMobileRow
              icon={<Users className="h-3.5 w-3.5" />}
              title={t.mobile.antFamiliares}
              items={ficha.antecedentesFamiliares.map((af) => `${af.condicao} · ${af.familiar}`)}
            />
          </div>
        </div>

        {/* Próxima consulta — destaque */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-state-warn/30 bg-state-warn-soft/60 px-3 py-2.5 text-[12px] text-state-warn">
          <Bell className="h-3.5 w-3.5" />
          <span className="font-medium">{t.mobile.proximaConsulta}</span>
          <span className="ml-auto tabular text-foreground">
            {formatarData(utente.proximaConsulta)}
            {consultaProxima?.hora ? ` · ${consultaProxima.hora}` : ""}
          </span>
        </div>
      </section>

      {/* Alertas */}
      {utente.alertas.length > 0 && (
        <section className="border-b border-border px-4 py-5">
          <div className="mb-2.5 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {utente.alertas.length} {t.mobile.alertasClinicos}
              <InfoHint title={t.mobile.foraDoAlvoInfo}>
                <p>{ALERTA_VS_ALVO_EXPLICACAO}</p>
                <p className="text-muted-foreground">{t.mobile.foraDoAlvoTexto}</p>
              </InfoHint>
            </span>
            <span>11 {t.mobile.foraDoAlvoN}</span>
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
                            flash(t.mobile.toastMarcadorDesktop);
                          }}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          {t.mobile.verMarcador}
                        </button>
                        <button
                          type="button"
                          onClick={() => flash(t.mobile.toastLembrete)}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {t.mobile.lembrete}
                        </button>
                        <button
                          type="button"
                          onClick={() => flash(t.mobile.toastReanalise)}
                          className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-foreground hover:bg-accent"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          {t.mobile.reanalise}
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
          <span>{t.mobile.adesao}</span>
          <span className="tabular">73% {t.mobile.global}</span>
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
                      onClick={() => setChatOpen(true)}
                      className="inline-flex items-center gap-1 text-state-alert"
                    >
                      <Send className="h-3 w-3" />
                      {t.mobile.enviarMensagem}
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
            <span>{t.mobile.sinais}</span>
            <span>{t.mobile.wearable}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sono && (
              <VitalCard
                icon={<Moon className="h-3.5 w-3.5" />}
                label={t.mobile.sono}
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
                label={t.mobile.passos}
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
            <span>{t.mobile.ultimaConsulta}</span>
            <span className="tabular">{formatarData(ultimaNota.data)}</span>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4 text-[13px] text-foreground">
            {ultimaNota.subjetivo && (
              <NotaBlock label={t.mobile.subjetivo} value={ultimaNota.subjetivo} />
            )}
            {ultimaNota.avaliacao && (
              <NotaBlock label={t.mobile.avaliacao} value={ultimaNota.avaliacao} />
            )}
            {ultimaNota.plano && <NotaBlock label={t.mobile.plano} value={ultimaNota.plano} />}
            {ultimaNota.proximaRevisao && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {t.mobile.proximaRevisao} · {formatarData(ultimaNota.proximaRevisao)}
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
            {t.mobile.notasInternas}
          </span>
          <button
            type="button"
            onClick={() => setNotaAberta((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[10.5px] font-medium normal-case tracking-normal text-foreground"
          >
            <Plus className="h-3 w-3" />
            {t.mobile.notaRapida}
          </button>
        </div>
        {notaAberta && (
          <div className="mb-3 rounded-xl border border-border bg-surface-raised p-3">
            <textarea
              value={notaRapida}
              onChange={(e) => setNotaRapida(e.target.value)}
              placeholder={t.mobile.notaRapidaPlaceholder}
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
                {t.mobile.cancelar}
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
                  flash(t.mobile.toastNotaGuardada);
                }}
                className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
              >
                {t.mobile.guardar}
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
                <span>{t.mobile.notaRapidaTag}</span>
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
        {/* Carregar documento — usa input nativo, abre câmara/galeria/ficheiros do SO */}
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.mobile.carregarDocumento}
            </span>
            {docsCarregados.length > 0 && (
              <span className="text-[10.5px] text-muted-foreground">
                {docsCarregados.length} {t.mobile.nestaSessao}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-3 text-[12px] font-medium text-background"
            >
              <Camera className="h-3.5 w-3.5" />
              {t.mobile.tirarFoto}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-3 text-[12px] font-medium text-foreground"
            >
              <Upload className="h-3.5 w-3.5" />
              {t.mobile.ficheiros}
            </button>
          </div>
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const fs = e.target.files;
              if (fs && fs.length) {
                const novos = Array.from(fs).map((f, i) => ({
                  id: `lc-${Date.now()}-${i}`,
                  nome: f.name,
                }));
                setDocsCarregados((p) => [...novos, ...p]);
                flash(t.mobile.toastFotoCapturada);
              }
              e.target.value = "";
            }}
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.heic,.csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const fs = e.target.files;
              if (fs && fs.length) {
                const novos = Array.from(fs).map((f, i) => ({
                  id: `lf-${Date.now()}-${i}`,
                  nome: f.name,
                }));
                setDocsCarregados((p) => [...novos, ...p]);
                flash(t.mobile.toastFicheiros(novos.length));
              }
              e.target.value = "";
            }}
          />
          {docsCarregados.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {docsCarregados.slice(0, 3).map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px]"
                >
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">{d.nome}</span>
                  <span className="ml-auto shrink-0 text-state-warn">{t.mobile.aProcessar}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-[11.5px] text-muted-foreground">
          <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t.mobile.apenasDesktopAviso1}{" "}
            <span className="text-foreground">{t.mobile.apenasDesktopVistaDesktop}</span>
            {t.mobile.apenasDesktopAviso2}
          </span>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-[11.5px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} utente={utente} />
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

function AnamneseMobileRow({
  icon,
  title,
  items,
  alert = false,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  alert?: boolean;
}) {
  const t = useT();
  const tone = alert
    ? "border-state-alert/30 bg-state-alert-soft text-state-alert"
    : "border-border bg-surface-raised text-foreground";

  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-center gap-2 text-[12px] font-medium">
        {icon}
        <span>{title}</span>
        <span className="ml-auto text-[10.5px] text-muted-foreground">
          {items.length}
        </span>
      </div>
      <ul className="mt-2 space-y-1.5 text-[11.5px] text-muted-foreground">
        {items.length === 0 ? (
          <li>{t.mobile.semRegisto}</li>
        ) : (
          items.slice(0, 3).map((item) => (
            <li key={item} className="line-clamp-2">
              {item}
            </li>
          ))
        )}
      </ul>
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