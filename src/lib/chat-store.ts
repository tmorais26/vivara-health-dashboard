import { useSyncExternalStore } from "react";
import { utente as utenteDemo } from "@/data/mock-utente";

// Chat médico ↔ utente. Opcional e controlado só pelo médico:
// - "desativado": o utente não vê a área de chat (estado inicial);
// - "ativo": conversa normal; o utente só pode responder depois da 1.ª mensagem do médico;
// - "bloqueado": ambos veem o histórico, ninguém escreve até o médico desbloquear.
// Demo: guardado em localStorage; os anexos não sobrevivem a um refresh.
export type EstadoChat = "desativado" | "ativo" | "bloqueado";

export type Anexo = { nome: string; tipo: string; tamanho: number; url?: string };

export type MensagemChat = {
  id: string;
  autor: "medico" | "utente";
  texto: string;
  enviadaEm: string;
  anexos?: Anexo[];
};

export type Chat = { estado: EstadoChat; mensagens: MensagemChat[] };

type Store = Record<string, Chat>;

const STORAGE_KEY = "vivara-chats";

function inicial(): Store {
  const demo = utenteDemo.conversas.find((c) => c.id === "c-sofia");
  return {
    [utenteDemo.id]: {
      estado: "ativo",
      mensagens: (demo?.mensagens ?? [])
        .filter((m) => m.autor !== "sistema")
        .map((m) => ({
          id: m.id,
          autor: m.autor === "medica" ? "medico" : "utente",
          texto: m.texto,
          enviadaEm: m.enviadaEm,
        })),
    },
  };
}

function carregar(): Store {
  if (typeof window === "undefined") return inicial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // ignora dados corrompidos
  }
  return inicial();
}

let store: Store = carregar();
const serverStore = inicial();
const listeners = new Set<() => void>();
const VAZIO: Chat = { estado: "desativado", mensagens: [] };

function guardar(novo: Store) {
  store = novo;
  try {
    const semUrls: Store = Object.fromEntries(
      Object.entries(novo).map(([k, c]) => [
        k,
        {
          ...c,
          mensagens: c.mensagens.map((m) => ({
            ...m,
            anexos: m.anexos?.map(({ url: _url, ...a }) => a),
          })),
        },
      ]),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(semUrls));
  } catch {
    // ignora
  }
  for (const l of listeners) l();
}

function atualizar(utenteId: string, fn: (c: Chat) => Chat) {
  guardar({ ...store, [utenteId]: fn(store[utenteId] ?? VAZIO) });
}

export function useChat(utenteId: string): Chat {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => store[utenteId] ?? VAZIO,
    () => serverStore[utenteId] ?? VAZIO,
  );
}

export const chatAcoes = {
  definirEstado(utenteId: string, estado: EstadoChat) {
    atualizar(utenteId, (c) => ({ ...c, estado }));
  },
  eliminarConversa(utenteId: string) {
    atualizar(utenteId, (c) => ({ ...c, mensagens: [] }));
  },
  enviar(utenteId: string, texto: string, anexos: Anexo[] = []) {
    atualizar(utenteId, (c) => {
      if (c.estado !== "ativo") return c;
      return {
        ...c,
        mensagens: [
          ...c.mensagens,
          {
            id: `m-${Date.now().toString(36)}`,
            autor: "medico",
            texto,
            enviadaEm: new Date().toISOString(),
            anexos: anexos.length ? anexos : undefined,
          },
        ],
      };
    });
  },
};
