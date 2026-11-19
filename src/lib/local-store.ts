import { useSyncExternalStore } from "react";

// Pequeno store persistido em localStorage (modo demo), partilhado entre ecrãs.
export function criarStore<T>(chave: string, inicial: T) {
  let valor: T = inicial;
  let carregado = false;
  const listeners = new Set<() => void>();

  function ler(): T {
    if (!carregado && typeof window !== "undefined") {
      carregado = true;
      try {
        const raw = localStorage.getItem(chave);
        if (raw) valor = JSON.parse(raw) as T;
      } catch {
        // ignora dados corrompidos
      }
    }
    return valor;
  }

  function definir(fn: (v: T) => T) {
    valor = fn(ler());
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // ignora
    }
    for (const l of listeners) l();
  }

  function use(): T {
    return useSyncExternalStore(
      (cb) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      ler,
      () => inicial,
    );
  }

  return { use, ler, definir };
}
