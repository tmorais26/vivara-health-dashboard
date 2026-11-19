import { criarStore } from "@/lib/local-store";

// Preferências do médico individual. A agenda é opcional: há quem use o sistema da clínica.
export type PrefsMedico = { usarAgenda: boolean };

const store = criarStore<PrefsMedico>("vivara-prefs-medico", { usarAgenda: true });

export const usePrefsMedico = store.use;

export function definirUsarAgenda(usarAgenda: boolean) {
  store.definir((p) => ({ ...p, usarAgenda }));
}
