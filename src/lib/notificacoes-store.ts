import { useSyncExternalStore } from "react";

// Notificações do portal do médico. Tipos simples, sem conteúdo clínico no texto.
export type TipoNotificacao = "analise" | "exame" | "consulta" | "mensagem";

export type NotificacaoMedico = {
  id: string;
  tipo: TipoNotificacao;
  utenteId: string;
  utenteNome: string;
  quando: string;
  lida: boolean;
};

const STORAGE_KEY = "vivara-notificacoes-medico";

const INICIAIS: NotificacaoMedico[] = [
  { id: "nm-1", tipo: "mensagem", utenteId: "maria-antunes", utenteNome: "Maria Antunes", quando: "2026-04-29T19:05:00", lida: false },
  { id: "nm-2", tipo: "analise", utenteId: "maria-antunes", utenteNome: "Maria Antunes", quando: "2026-04-29T11:20:00", lida: false },
  { id: "nm-3", tipo: "consulta", utenteId: "rui-pereira", utenteNome: "Rui Pereira", quando: "2026-04-28T16:40:00", lida: false },
  { id: "nm-4", tipo: "exame", utenteId: "ines-rocha", utenteNome: "Inês Rocha", quando: "2026-04-27T10:15:00", lida: true },
];

function carregar(): NotificacaoMedico[] {
  if (typeof window === "undefined") return INICIAIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NotificacaoMedico[];
  } catch {
    // ignora
  }
  return INICIAIS;
}

let lista = carregar();
const listeners = new Set<() => void>();

function guardar(nova: NotificacaoMedico[]) {
  lista = nova;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nova));
  } catch {
    // ignora
  }
  for (const l of listeners) l();
}

export function useNotificacoes(): NotificacaoMedico[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => lista,
    () => INICIAIS,
  );
}

export function useNaoLidas(): number {
  return useNotificacoes().filter((n) => !n.lida).length;
}

export const notificacoesAcoes = {
  marcarLida(id: string) {
    guardar(lista.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  },
  marcarTodasLidas() {
    guardar(lista.map((n) => ({ ...n, lida: true })));
  },
};
