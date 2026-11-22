import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessaoOpcional } from "@/lib/sessao";
import type { NotificacaoDb } from "@/lib/dados";

type Valor = {
  lista: NotificacaoDb[] | null;
  naoLidas: number;
  marcarLida: (id: string) => Promise<void>;
  marcarTodas: () => Promise<void>;
  recarregar: () => Promise<void>;
};

const Ctx = createContext<Valor | null>(null);

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const valor = useFonte();
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useNotificacoesDb(): Valor {
  return useContext(Ctx) ?? { lista: null, naoLidas: 0, marcarLida: async () => {}, marcarTodas: async () => {}, recarregar: async () => {} };
}

// Notificações do utilizador (geradas pela base de dados), com atualização em tempo real.
function useFonte(): Valor {
  const sessao = useSessaoOpcional();
  const userId = sessao?.user.id;
  const [lista, setLista] = useState<NotificacaoDb[] | null>(null);

  const carregar = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userId)
      .order("criada_em", { ascending: false })
      .limit(100);
    setLista(data ?? []);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void carregar();
    const canal = supabase
      .channel(`notificacoes-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${userId}` }, () => void carregar())
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [userId, carregar]);

  const marcarLida = useCallback(
    async (id: string) => {
      setLista((xs) => xs?.map((n) => (n.id === id ? { ...n, lida: true } : n)) ?? xs);
      await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    },
    [],
  );

  const marcarTodas = useCallback(async () => {
    if (!userId) return;
    setLista((xs) => xs?.map((n) => ({ ...n, lida: true })) ?? xs);
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", userId).eq("lida", false);
  }, [userId]);

  return useMemo(
    () => ({ lista, naoLidas: (lista ?? []).filter((n) => !n.lida).length, marcarLida, marcarTodas, recarregar: carregar }),
    [lista, marcarLida, marcarTodas, carregar],
  );
}
