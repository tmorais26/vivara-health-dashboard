import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Calendar,
  MessagesSquare,
  UsersRound,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useNotificacoesDb } from "@/lib/notificacoes";
import { usePrefsMedico } from "@/lib/medico-prefs";
import { iniciais, nomeAtual, useSessaoOpcional } from "@/lib/sessao";

type NavItem = {
  label: string;
  to: "/" | "/agenda" | "/mensagens" | "/notificacoes" | "/equipa" | "/definicoes";
  soDesktop?: boolean;
  icon: typeof Users;
  match?: (pathname: string) => boolean;
  badge?: number;
};

function useNavItems(): NavItem[] {
  const t = useT();
  const { naoLidas } = useNotificacoesDb();
  const { usarAgenda } = usePrefsMedico();
  const sessao = useSessaoOpcional();
  const clinica = sessao?.atual?.espaco.tipo === "clinica";
  const items: NavItem[] = [
    {
      label: t.nav.utentes,
      to: "/",
      icon: Users,
      match: (p) => p === "/" || p.startsWith("/utentes"),
    },
    { label: t.nav.agenda, to: "/agenda", icon: Calendar },
    ...(clinica
      ? [{ label: t.mensagens.nav, to: "/mensagens" as const, icon: MessagesSquare }]
      : []),
    { label: t.notifDb.titulo, to: "/notificacoes", icon: Bell, badge: naoLidas },
    ...(clinica
      ? [{ label: t.equipa.nav, to: "/equipa" as const, icon: UsersRound, soDesktop: true }]
      : []),
    { label: t.nav.definicoes, to: "/definicoes", icon: Settings },
  ];
  return usarAgenda ? items : items.filter((i) => i.to !== "/agenda");
}

export function PortalShell({
  children,
  hideSidebarChrome = false,
}: {
  children: ReactNode;
  /** Quando true, não renderiza o topbar interno (rotas com header próprio como o perfil). */
  hideSidebarChrome?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const t = useT();
  const items = useNavItems();
  const sessao = useSessaoOpcional();
  const nome = sessao ? nomeAtual(sessao) : "";
  const ini = iniciais(nome);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { saiu: 1 } });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
          <span className="font-serif text-base text-foreground">Vivara Health</span>
        </div>
        <SeletorEspaco />

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((it) => {
            const active = it.match ? it.match(pathname) : pathname === it.to;
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
            {t.nav.dadosSaude}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-3 w-3" />
            {t.nav.sair}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar — sempre visível em <lg, mesmo nas rotas com header próprio */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-state-ok" />
            <span className="font-serif text-sm text-foreground">Vivara Health</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <LanguageToggle />
            <Link
              to="/definicoes"
              aria-label={nome}
              title={nome}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
            >
              {ini}
            </Link>
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
                <LanguageToggle />
                <ThemeToggle />
                <span>{nome}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                  {ini}
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
  const items = useNavItems().filter((i) => !i.soDesktop);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid auto-cols-fr grid-flow-col border-t border-border bg-surface-raised lg:hidden">
      {items.map((it) => {
        const active = it.match ? it.match(pathname) : pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="relative">
              <it.icon className="h-4 w-4" />
              {it.badge ? (
                <span className="tabular absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-state-alert px-1 text-[9px] font-medium text-primary-foreground">
                  {it.badge}
                </span>
              ) : null}
            </span>
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
function SeletorEspaco() {
  const sessao = useSessaoOpcional();
  const t = useT();
  if (!sessao?.atual) return null;
  const { membros, atual, escolherEspaco } = sessao;
  const tipo = atual.espaco.tipo === "individual" ? t.espaco.planoMedico : t.espaco.planoClinica;
  return (
    <div className="border-b border-border px-3 py-3">
      {membros.length > 1 ? (
        <label className="block">
          <span className="sr-only">{t.espaco.escolher}</span>
          <select
            value={atual.espaco_id}
            onChange={(e) => escolherEspaco(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {membros.map((m) => (
              <option key={m.espaco_id} value={m.espaco_id}>
                {m.espaco.nome}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="truncate px-2 text-sm font-medium text-foreground">{atual.espaco.nome}</div>
      )}
      <div className="mt-1 px-2 text-[10.5px] text-muted-foreground">{tipo}</div>
    </div>
  );
}
