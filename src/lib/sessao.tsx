import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Perfil = Tables<"medico_perfis">;
export type Espaco = Tables<"espacos">;
export type Membro = Tables<"membros">;
export type MembroComEspaco = Membro & { espaco: Espaco };

type Sessao = {
  user: User;
  perfil: Perfil | null;
  membros: MembroComEspaco[];
  atual: MembroComEspaco | null;
  carregando: boolean;
  escolherEspaco: (espacoId: string) => void;
  recarregar: () => Promise<void>;
};

const SessaoContext = createContext<Sessao | null>(null);
const CHAVE_ESPACO = "vivara-espaco";

export function SessaoProvider({ user, children }: { user: User; children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [membros, setMembros] = useState<MembroComEspaco[]>([]);
  const [espacoId, setEspacoId] = useState<string | null>(() => {
    try {
      return typeof window === "undefined" ? null : localStorage.getItem(CHAVE_ESPACO);
    } catch {
      return null;
    }
  });
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    const [{ data: p }, { data: ms }] = await Promise.all([
      supabase.from("medico_perfis").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("membros").select("*").eq("user_id", user.id).eq("estado", "ativo"),
    ]);
    const ids = (ms ?? []).map((m) => m.espaco_id);
    const { data: es } = ids.length
      ? await supabase.from("espacos").select("*").in("id", ids)
      : { data: [] as Espaco[] };
    const porId = new Map((es ?? []).map((e) => [e.id, e]));
    setPerfil(p ?? null);
    setMembros(
      (ms ?? [])
        .filter((m) => porId.has(m.espaco_id))
        .map((m) => ({ ...m, espaco: porId.get(m.espaco_id)! }))
        .sort((a, b) => a.espaco.nome.localeCompare(b.espaco.nome)),
    );
    setCarregando(false);
  }, [user.id]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const escolherEspaco = useCallback((id: string) => {
    setEspacoId(id);
    try {
      localStorage.setItem(CHAVE_ESPACO, id);
    } catch {
      // ignora
    }
  }, []);

  const atual = useMemo(
    () => membros.find((m) => m.espaco_id === espacoId) ?? membros[0] ?? null,
    [membros, espacoId],
  );

  const valor = useMemo(
    () => ({ user, perfil, membros, atual, carregando, escolherEspaco, recarregar }),
    [user, perfil, membros, atual, carregando, escolherEspaco, recarregar],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(SessaoContext);
  if (!s) throw new Error("useSessao fora de SessaoProvider");
  return s;
}

// Para componentes que também aparecem fora da sessão (ex.: demonstração).
export function useSessaoOpcional(): Sessao | null {
  return useContext(SessaoContext);
}

export function nomeAtual(s: Sessao): string {
  return s.atual?.nome_exibicao || s.perfil?.nome || (s.user.user_metadata?.nome as string | undefined) || s.user.email || "";
}

export function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 || p === p.toUpperCase())
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

export const e_admin = (m: Membro | null) => !!m?.papel_admin;
export const e_clinico = (m: Membro | null) => m?.funcao === "medico" || m?.funcao === "profissional";
