import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Bell, KeyRound, Globe, BellRing, Languages, Mail } from "lucide-react";
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
          <IdiomaCard />
          <NotificacoesGlobais />
          <MarketingCard />

          <Card icon={<ShieldCheck className="h-4 w-4" />} title={t.definicoes.seguranca} sub={t.definicoes.segurancaSub}>
            <Row label={t.definicoes.mfa} value="TOTP · Authenticator" status="ok" />
            <Row label={t.definicoes.timeout} value={t.definicoes.timeoutValor} />
            <Row label={t.definicoes.ultimaSessao} value="09:14 · IP 85.244.xxx.xxx" />
          </Card>

          <Card icon={<KeyRound className="h-4 w-4" />} title={t.definicoes.acessos} sub={t.definicoes.acessosSub}>
            <Row label="Inês Carvalho" value="Nutricionista · plano e composição" />
            <Row label="Margarida Lopes" value="Assistente clínica · agenda" />
          </Card>

          <Card icon={<Bell className="h-4 w-4" />} title={t.definicoes.notificacoes} sub={t.definicoes.notificacoesSub}>
            <Row label={t.definicoes.notifNovosDados} value="Email + portal" />
            <Row label={t.definicoes.notifCriticos} value="Email + SMS" />
          </Card>

          <Card icon={<Globe className="h-4 w-4" />} title={t.definicoes.clinica} sub={t.definicoes.clinicaSub}>
            <Row label={t.definicoes.clinica} value="Lumiar Longevidade Clínica" />
            <Row label="OM" value="Cédula 48 217" />
            <Row label={t.definicoes.contactos} value="sofia@vivarahealth.pt · +351 21 000 0000" />
          </Card>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">{t.definicoes.demoRodape}</p>
      </main>
      <MobileNavTabs />
    </PortalShell>
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
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
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

function Row({ label, value, status }: { label: string; value: string; status?: "ok" }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
        {status === "ok" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-ok" />}
        {value}
      </span>
    </div>
  );
}