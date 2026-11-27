// Calendário do utente: ajudas de datas e a grelha do mês.
//
// Tudo em data local, sem fusos: as consultas e os lembretes são "dia tal",
// não instantes. Usar toISOString() aqui deslocaria o dia à noite.

export const pad2 = (n: number) => String(n).padStart(2, "0");

// "2026-04-27" a partir de uma Date local.
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// A parte de data de um ISO ("2026-05-12T14:30:00" → "2026-05-12").
export const dayOf = (iso: string): string => iso.slice(0, 10);

export interface DayCell { key: string; day: number; inMonth: boolean }

// Seis semanas a começar na segunda-feira, para a grelha ter sempre a mesma
// altura entre meses.
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // 0 = segunda
  const start = new Date(year, month, 1 - lead);
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ key: dayKey(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

const MONTHS = {
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
export const monthName = (month: number, lang: "pt" | "en") => MONTHS[lang][month];
