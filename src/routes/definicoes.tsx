import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Bell, KeyRound, Globe } from "lucide-react";
import { PortalShell, MobileNavTabs } from "@/components/portal/PortalShell";

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
      <main className="mx-auto max-w-[860px] px-6 py-10 pb-24 lg:pb-10">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portal</div>
          <h1 className="font-serif mt-2 text-4xl text-foreground">Definições</h1>
        </div>

        <div className="space-y-4">
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