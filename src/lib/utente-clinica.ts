import { criarStore } from "@/lib/local-store";

// "Clínica onde o utente é visto" (Plano Médico). O médico pode mudar de clínica e continuar a
// acompanhar o mesmo utente; o histórico de mudanças fica registado.
export type ClinicaUtente = { atual: string; historico: { clinica: string; desde: string }[] };

const INICIAL: Record<string, ClinicaUtente> = {
  "maria-antunes": {
    atual: "Lumiar Longevidade Clínica",
    historico: [{ clinica: "Lumiar Longevidade Clínica", desde: "2024-11-04" }],
  },
};

const store = criarStore<Record<string, ClinicaUtente>>("vivara-clinica-utente", INICIAL);

export function useClinicaUtente(utenteId: string): ClinicaUtente | undefined {
  return store.use()[utenteId];
}

export function useClinicasConhecidas(): string[] {
  const todas = store.use();
  return [...new Set(Object.values(todas).flatMap((c) => c.historico.map((h) => h.clinica)))].sort();
}

export function definirClinica(utenteId: string, clinica: string) {
  const nome = clinica.trim();
  store.definir((todas) => {
    const atual = todas[utenteId];
    if (atual?.atual === nome) return todas;
    const historico = atual?.historico ?? [];
    return {
      ...todas,
      [utenteId]: {
        atual: nome,
        historico: nome ? [...historico, { clinica: nome, desde: new Date().toISOString().slice(0, 10) }] : historico,
      },
    };
  });
}

export function lerClinicas() {
  return store.ler();
}
