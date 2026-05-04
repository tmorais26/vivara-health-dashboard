import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Pill,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionTimeoutBanner } from "./SessionTimeoutBanner";

type NavItem = {
  label: string;
  to: "/" | "/agenda" | "/prescricoes" | "/definicoes";
  icon: typeof Users;
  match?: (pathname: string) => boolean;
  badge?: number;
};

const items: NavItem[] = [
  {
    label: "Utentes",
    to: "/",
    icon: Users,
    match: (p) => p === "/" || p.startsWith("/utentes"),
  },
  { label: "Agenda", to: "/agenda", icon: Calendar, badge: 5 },
  { label: "Prescrições", to: "/prescricoes", icon: Pill, badge: 4 },
  { label: "Definições", to: "/definicoes", icon: Settings },
];

export function PortalShell({
  children,
  hideSidebarChrome = false,
}: {
  children: ReactNode;
  /** Quando true, não renderiza o topbar interno (rotas com header próprio como o perfil). */
  hideSidebarChrome?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
          <span className="font-serif text-base text-foreground">Vivara Health</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((it) => {
            const active = it.match
              ? it.match(pathname)
              : pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </span>
                {it.badge ? (
                  <span className="tabular rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-state-ok" />
            Dados de saúde · Acesso registado
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <SessionTimeoutBanner />
        {/* Mobile top bar — sempre visível em <lg, mesmo nas rotas com header próprio */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
            <span className="font-serif text-sm text-foreground">Vivara Health</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-state-ok/30 bg-state-ok-soft/60 px-2 py-0.5 text-[10px] font-medium text-state-ok">
              <ShieldCheck className="h-2.5 w-2.5" />
              MFA
            </span>
            <ThemeToggle />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              SC
            </div>
          </div>
        </header>
        {!hideSidebarChrome && (
          <header className="hidden border-b border-border bg-surface-raised lg:block">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground lg:hidden">
                <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
                <span className="font-serif text-sm text-foreground">Vivara Health</span>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span className="hidden items-center gap-1.5 rounded-full border border-state-ok/30 bg-state-ok-soft/60 px-2.5 py-1 text-[10.5px] font-medium text-state-ok sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" />
                  MFA activo
                </span>
                <ThemeToggle />
                <span>Dra. Sofia Cardoso</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                  SC
                </div>
              </div>
            </div>
          </header>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function MobileNavTabs() {
  // Bottom tabs para viewports estreitos (<lg). Manter visível abaixo da sidebar fixa.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface-raised lg:hidden">
      {items.map((it) => {
        const active = it.match ? it.match(pathname) : pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}

// Pequeno componente decorativo usado em headers vazios (para evitar warning de import não usado).
export function PortalActivityDot() {
  return <Activity className="h-3 w-3 text-muted-foreground" />;
}