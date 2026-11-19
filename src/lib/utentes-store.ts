import { resumosUtentes as iniciais, type ResumoUtente } from "@/data/mock-portal";
import { criarStore } from "@/lib/local-store";

const store = criarStore<ResumoUtente[]>("vivara-utentes", iniciais);

export const useUtentes = store.use;
export const lerUtentes = store.ler;

export function adicionarUtentes(novos: ResumoUtente[]) {
  store.definir((lista) => [...novos, ...lista]);
}
