import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Bell, KeyRound, Globe, BellRing } from "lucide-react";
import { useState } from "react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";
import { resumosUtentes } from "@/data/mock-portal";

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
  return (
    <PortalShell>
      <main className="mx-auto max-w-[860px] px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-3xl text-foreground sm:text-4xl">Definições</h1>
        </div>

        <div className="space-y-4">
          <NotificacoesGlobais />
          <NotificacoesPorUtente />

          <Card icon={<ShieldCheck className="h-4 w-4" />} title="Segurança da conta" sub="MFA activo · sessão expira em 15 min de inactividade">
            <Row label="Autenticação multifactor" value="TOTP · Authenticator" status="ok" />
            <Row label="Timeout de sessão" value="15 minutos" />
            <Row label="Última sessão" value="Hoje · 09:14 · IP 85.244.xxx.xxx" />
          </Card>

          <Card icon={<KeyRound className="h-4 w-4" />} title="Acessos delegados" sub="Quem mais vê estes utentes">
            <Row label="Inês Carvalho" value="Nutricionista · plano e composição" />
            <Row label="Margarida Lopes" value="Assistente clínica · agenda" />
          </Card>

          <Card icon={<Bell className="h-4 w-4" />} title="Notificações" sub="Como prefere ser avisada">
            <Row label="Novos dados de utente" value="Email + portal" />
            <Row label="Prescrições a expirar" value="Portal apenas" />
            <Row label="Alertas críticos" value="Email + SMS" />
          </Card>

          <Card icon={<Globe className="h-4 w-4" />} title="Clínica" sub="Identidade institucional">
            <Row label="Clínica" value="Lumiar Longevidade Clínica" />
            <Row label="OM" value="Cédula 48 217" />
            <Row label="Contactos" value="sofia@vivarahealth.pt · +351 21 000 0000" />
          </Card>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Versão demonstrativa — alterações reais ficam disponíveis quando a conta for activada.
        </p>
      </main>
      <MobileNavTabs />
    </PortalShell>
  );
}

const NOTIF_TIPOS = [
  { id: "fora-alvo", label: "Valor fora do alvo" },
  { id: "lembrete", label: "Lembrete de consulta" },
  { id: "novo-doc", label: "Novo upload de documento" },
  { id: "falha-adesao", label: "Falha de adesão (>3 dias)" },
] as const;
type NotifId = (typeof NOTIF_TIPOS)[number]["id"];

function NotificacoesGlobais() {
  const [state, setState] = useState<Record<NotifId, boolean>>({
    "fora-alvo": true,
    lembrete: true,
    "novo-doc": false,
    "falha-adesao": true,
  });
  return (
    <Card
      icon={<BellRing className="h-4 w-4" />}
      title="Notificações globais"
      sub="Aplicado a todos os utentes (default)"
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

function NotificacoesPorUtente() {
  const [state, setState] = useState<Record<string, Record<NotifId, boolean>>>(() => {
    const init: Record<string, Record<NotifId, boolean>> = {};
    for (const u of resumosUtentes) {
      init[u.id] = {
        "fora-alvo": true,
        lembrete: true,
        "novo-doc": true,
        "falha-adesao": true,
      };
    }
    return init;
  });

  function toggle(uid: string, k: NotifId, v: boolean) {
    setState((s) => ({ ...s, [uid]: { ...s[uid], [k]: v } }));
  }

  return (
    <Card
      icon={<Bell className="h-4 w-4" />}
      title="Notificações por utente"
      sub="Sobrepõem-se às definições globais"
    >
      {resumosUtentes.map((u) => (
        <div key={u.id} className="px-5 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-medium text-foreground">
              {u.iniciais}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">{u.nome}</div>
              <div className="text-[11px] text-muted-foreground">
                {u.plano} · {u.cidade}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NOTIF_TIPOS.map((t) => (
              <label
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <span className="text-[12px] text-foreground">{t.label}</span>
                <Toggle
                  checked={state[u.id][t.id]}
                  onChange={(v) => toggle(u.id, t.id, v)}
                />
              </label>
            ))}
          </div>
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