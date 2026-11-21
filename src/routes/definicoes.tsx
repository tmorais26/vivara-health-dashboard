import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Languages, Mail, Calendar, Database, Download, Upload, UserRound, KeyRound, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSessao } from "@/lib/sessao";
import { definirUsarAgenda, usePrefsMedico } from "@/lib/medico-prefs";
import { exportarEspaco } from "@/lib/exportacao";
import { ImportarUtentesModal } from "@/components/portal/ImportarUtentesModal";
import { useEffect, useState } from "react";
import { definirMarketing, estadoConsentimento } from "@/lib/consent.functions";
import { formatarData } from "@/data/mock-utente";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { setIdioma, useIdioma, useT, type Idioma } from "@/lib/i18n";

export const Route = createFileRoute("/definicoes")({
  head: () => ({
    meta: [
      { title: "Definições — Vivara Health" },
      { name: "description", content: "Definições da conta da médica no portal Vivara Health." },
    ],
  }),
  component: DefinicoesPage,
});

function DefinicoesPage() {
  const t = useT();
  return (
    <PortalShell>
      <main className="mx-auto max-w-[860px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.comum.portal}</div>
          <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">{t.definicoes.titulo}</h1>
        </div>

        <div className="space-y-4">
          <PerfilCard />
          <ContaCard />
          <NotificacoesGlobais />
          <AgendaCard />
          <DadosCard />
          <IdiomaCard />
          <MarketingCard />
        </div>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}

function PerfilCard() {
  const t = useT();
  const tp = t.perfil;
  const sessao = useSessao();
  const p = sessao.perfil;
  const [nome, setNome] = useState(p?.nome ?? sessao.atual?.nome_exibicao ?? "");
  const [especialidade, setEspecialidade] = useState(p?.especialidade ?? "");
  const [cedula, setCedula] = useState(p?.cedula_profissional ?? "");
  const [clinica, setClinica] = useState(p?.clinica ?? "");
  const [estado, setEstado] = useState<"" | "aGuardar" | "guardado" | "erro">("");
  const [erroNome, setErroNome] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErroNome(true);
      return;
    }
    setErroNome(false);
    setEstado("aGuardar");
    const { error } = await supabase.rpc("guardar_perfil", {
      p_nome: nome,
      p_especialidade: especialidade,
      p_cedula: cedula,
      p_clinica: clinica,
    });
    if (error) return setEstado("erro");
    await sessao.recarregar();
    setEstado("guardado");
  }

  const campo = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  return (
    <Card icon={<UserRound className="h-4 w-4" />} title={tp.titulo} sub={sessao.user.email ?? ""}>
      <form onSubmit={guardar} noValidate className="grid gap-3 px-5 py-4 sm:grid-cols-2">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.conta.nome}
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={erroNome} aria-describedby={erroNome ? "perfil-nome-erro" : undefined} />
          {erroNome && <span id="perfil-nome-erro" role="alert" className="mt-1 block normal-case tracking-normal text-state-alert">{t.conta.erroObrigatorio}</span>}
        </label>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.conta.especialidade}
          <input className={campo} value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} />
        </label>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.conta.cedula}
          <input className={campo} value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <span className="mt-1 block normal-case tracking-normal">
            {p?.cedula_validada ? tp.cedulaValidada : tp.cedulaPorValidar}
          </span>
        </label>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {tp.clinicaHabitual}
          <input className={campo} value={clinica} onChange={(e) => setClinica(e.target.value)} />
        </label>
        <div className="flex items-center justify-end gap-3 sm:col-span-2">
          {estado === "guardado" && <span role="status" className="text-xs text-state-ok">{tp.guardado}</span>}
          {estado === "erro" && <span role="alert" className="text-xs text-state-alert">{t.conta.erroGenerico}</span>}
          <button type="submit" disabled={estado === "aGuardar"} className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50">
            {estado === "aGuardar" ? t.conta.aProcessar : tp.guardar}
          </button>
        </div>
      </form>
    </Card>
  );
}

function ContaCard() {
  const t = useT();
  const navigate = useNavigate();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  async function mudar(e: React.FormEvent) {
    e.preventDefault();
    if (p1.length < 6) return setMsg({ tipo: "erro", texto: t.conta.erroPalavraPasse });
    if (p1 !== p2) return setMsg({ tipo: "erro", texto: t.conta.novaDiferentes });
    setAGuardar(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setAGuardar(false);
    if (error) return setMsg({ tipo: "erro", texto: error.code === "weak_password" || error.code === "same_password" ? t.conta.erroPalavraPasseFraca : t.conta.erroGenerico });
    setP1("");
    setP2("");
    setMsg({ tipo: "ok", texto: t.conta.novaGuardada });
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const campo = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  return (
    <Card icon={<KeyRound className="h-4 w-4" />} title={t.perfil.contaTitulo}>
      <form onSubmit={mudar} noValidate className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.conta.novaTitulo}
          <input type="password" autoComplete="new-password" className={campo} value={p1} onChange={(e) => setP1(e.target.value)} />
        </label>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.conta.novaConfirmar}
          <input type="password" autoComplete="new-password" className={campo} value={p2} onChange={(e) => setP2(e.target.value)} />
        </label>
        <button type="submit" disabled={aGuardar || !p1} className="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50">
          {aGuardar ? t.conta.aProcessar : t.perfil.mudarPalavraPasse}
        </button>
        {msg && (
          <p role={msg.tipo === "erro" ? "alert" : "status"} className={`text-xs sm:col-span-3 ${msg.tipo === "erro" ? "text-state-alert" : "text-state-ok"}`}>
            {msg.texto}
          </p>
        )}
      </form>
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <span className="text-sm text-foreground">{t.perfil.tema}</span>
        <ThemeToggle />
      </div>
      <div className="px-5 py-3">
        <button type="button" onClick={sair} className="inline-flex items-center gap-2 text-sm text-state-alert hover:underline">
          <LogOut className="h-4 w-4" />
          {t.nav.sair}
        </button>
      </div>
    </Card>
  );
}

function AgendaCard() {
  const t = useT().agendaPref;
  const { usarAgenda } = usePrefsMedico();
  return (
    <Card icon={<Calendar className="h-4 w-4" />} title={t.titulo} sub={t.sub}>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p id="pref-agenda" className="text-sm text-foreground">{t.usar}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t.ajuda}</p>
        </div>
        <Toggle checked={usarAgenda} onChange={definirUsarAgenda} labelledBy="pref-agenda" />
      </div>
    </Card>
  );
}

function DadosCard() {
  const t = useT().dados;
  const tc = useT().conta;
  const sessao = useSessao();
  const [importarOpen, setImportarOpen] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // No Plano Clínica a exportação passa por aprovação da administração (ver Equipa).
  if (sessao.atual?.espaco.tipo !== "individual") return null;
  return (
    <Card icon={<Database className="h-4 w-4" />} title={t.titulo} sub={t.sub}>
      <div className="px-5 py-4">
        <p className="text-[12px] text-muted-foreground">{t.nota}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={async () => {
              if (!sessao.atual) return;
              try {
                await exportarEspaco(sessao.atual.espaco_id);
              } catch {
                setAviso(tc.erroGenerico);
              }
            }}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-accent"
          >
            <Download className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm text-foreground">{t.exportarTudo}</span>
              <span className="block text-[11px] text-muted-foreground">{t.exportarTudoAjuda}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setImportarOpen(true)}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-accent"
          >
            <Upload className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span>
              <span className="block text-sm text-foreground">{t.importar}</span>
              <span className="block text-[11px] text-muted-foreground">{t.importarAjuda}</span>
            </span>
          </button>
        </div>
        {aviso && (
          <p role="status" className="mt-3 text-xs text-foreground">
            {aviso}
          </p>
        )}
      </div>
      <ImportarUtentesModal
        open={importarOpen}
        onClose={() => setImportarOpen(false)}
        onImportados={(n) => setAviso(t.importados(n))}
      />
    </Card>
  );
}

function MarketingCard() {
  const t = useT();
  const [estado, setEstado] = useState<{ aceite: boolean; desde: string | null } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    estadoConsentimento()
      .then((r) => setEstado({ aceite: r.marketing, desde: r.marketingDesde }))
      .catch(() => setErro(true));
  }, []);

  async function alterar(aceite: boolean) {
    setAGuardar(true);
    setErro(false);
    try {
      await definirMarketing({ data: { aceite, texto: aceite ? t.consent.marketing : undefined } });
      setEstado({ aceite, desde: new Date().toISOString() });
    } catch {
      setErro(true);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <Card icon={<Mail className="h-4 w-4" />} title={t.consent.mkTitulo} sub={t.consent.mkSub}>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-sm text-foreground">
            {estado?.aceite ? t.consent.mkAtivo : t.consent.mkInativo}
          </p>
          {estado?.desde && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {t.consent.mkDesde(formatarData(estado.desde.slice(0, 10)))}
            </p>
          )}
          {erro && (
            <p role="alert" className="mt-1 text-xs text-state-alert">
              {t.conta.erroGenerico}
            </p>
          )}
        </div>
        {estado && (
          <button
            type="button"
            disabled={aGuardar}
            onClick={() => alterar(!estado.aceite)}
            className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
          >
            {estado.aceite ? t.consent.mkRetirar : t.consent.mkAceitar}
          </button>
        )}
      </div>
    </Card>
  );
}

const IDIOMAS: { id: Idioma; label: string; detalhe: string }[] = [
  { id: "pt", label: "Português", detalhe: "PT" },
  { id: "en", label: "English", detalhe: "EN" },
];

function IdiomaCard() {
  const t = useT();
  const atual = useIdioma();
  return (
    <Card
      icon={<Languages className="h-4 w-4" />}
      title={t.definicoes.idioma}
      sub={t.definicoes.idiomaSub}
    >
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          {IDIOMAS.map((i) => {
            const activo = atual === i.id;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => setIdioma(i.id)}
                aria-pressed={activo}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                  activo
                    ? "border-foreground/40 bg-accent text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-sm font-medium">{i.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    activo ? "bg-foreground text-background" : "border border-border text-muted-foreground"
                  }`}
                >
                  {i.detalhe}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t.definicoes.idiomaNota}</p>
      </div>
    </Card>
  );
}

const NOTIF_IDS = ["fora-alvo", "lembrete", "novo-doc", "falha-adesao"] as const;
type NotifId = (typeof NOTIF_IDS)[number];

function useNotifTipos(): { id: NotifId; label: string }[] {
  const t = useT();
  return [
    { id: "fora-alvo", label: t.definicoes.notifForaAlvo },
    { id: "lembrete", label: t.definicoes.notifLembrete },
    { id: "novo-doc", label: t.definicoes.notifNovoDoc },
    { id: "falha-adesao", label: t.definicoes.notifFalhaAdesao },
  ];
}

function NotificacoesGlobais() {
  const t = useT();
  const NOTIF_TIPOS = useNotifTipos();
  const [state, setState] = useState<Record<NotifId, boolean>>({
    "fora-alvo": true,
    lembrete: true,
    "novo-doc": false,
    "falha-adesao": true,
  });
  return (
    <Card
      icon={<BellRing className="h-4 w-4" />}
      title={t.definicoes.notifGlobais}
      sub={t.definicoes.notifGlobaisSub}
    >
      {NOTIF_TIPOS.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-4 px-5 py-3"
        >
          <span className="text-sm text-foreground">{t.label}</span>
          <Toggle
            checked={state[t.id]}
            onChange={(v) => setState((s) => ({ ...s, [t.id]: v }))}
          />
        </div>
      ))}
    </Card>
  );
}

function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-foreground" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Card({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}
