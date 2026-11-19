// Dados do próprio utente guardados no dispositivo: lembretes, condições e o
// que já leu nas notificações. Ficam em localStorage, como as análises
// carregadas — nada daqui é enviado para a rede.
//
// Os lembretes são PRIVADOS e nunca chegam à clínica: não são consultas,
// são notas do utente para si.

export interface Reminder {
  id: string;
  day: string;          // "2026-05-12"
  time: string | null;  // "14:30" ou null
  text: string;
  createdISO: string;
}

export type ConditionStatus = "active" | "resolved";

export interface PatientCondition {
  id: string;
  name: string;         // como foi escolhido ou escrito (no idioma em que foi registado)
  custom: boolean;      // true = texto livre ("Outra")
  sinceYear: number | null;
  status: ConditionStatus;
  note: string;
  createdISO: string;
}

const K_REMINDERS = "rv-reminders-v1";
const K_CONDITIONS = "rv-conditions-v1";
const K_NOTIF_READ = "rv-notif-read-v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
}

const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ── Lembretes ──
export const loadReminders = (): Reminder[] => {
  const v = read<Reminder[]>(K_REMINDERS, []);
  return Array.isArray(v) ? v : [];
};

export function addReminder(r: { day: string; time: string | null; text: string }): Reminder[] {
  const list = [...loadReminders(), { id: newId("r"), createdISO: new Date().toISOString(), ...r, text: r.text.trim() }];
  write(K_REMINDERS, list);
  return list;
}

export function removeReminder(id: string): Reminder[] {
  const list = loadReminders().filter((r) => r.id !== id);
  write(K_REMINDERS, list);
  return list;
}

// ── Condições ──
export const loadConditions = (): PatientCondition[] => {
  const v = read<PatientCondition[]>(K_CONDITIONS, []);
  return Array.isArray(v) ? v : [];
};

export function saveCondition(c: Omit<PatientCondition, "id" | "createdISO"> & { id?: string }): PatientCondition[] {
  const all = loadConditions();
  const existing = c.id ? all.find((x) => x.id === c.id) : undefined;
  const next: PatientCondition = existing
    ? { ...existing, ...c, id: existing.id, note: c.note.trim() }
    : { ...c, id: newId("c"), createdISO: new Date().toISOString(), note: c.note.trim() };
  const list = existing ? all.map((x) => (x.id === next.id ? next : x)) : [...all, next];
  write(K_CONDITIONS, list);
  return list;
}

export function removeCondition(id: string): PatientCondition[] {
  const list = loadConditions().filter((c) => c.id !== id);
  write(K_CONDITIONS, list);
  return list;
}

// ── Notificações lidas ──
export const loadRead = (): string[] => {
  const v = read<string[]>(K_NOTIF_READ, []);
  return Array.isArray(v) ? v : [];
};

export function markRead(ids: string[]): string[] {
  const set = new Set([...loadRead(), ...ids]);
  const list = [...set];
  write(K_NOTIF_READ, list);
  return list;
}
