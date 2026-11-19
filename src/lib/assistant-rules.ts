// Assistente do utente por regras, sem modelo de linguagem.
//
// Responde só a perguntas sobre factos que a app já tem — datas de consultas,
// documentos, lembretes, notificações, plano — e mostra o documento em vez de
// o comentar. Não interpreta resultados nem dá conselhos: perguntas desse tipo
// recebem sempre a mesma resposta, a remeter para o médico.
//
// Não há fornecedor de IA, nem dados a sair do dispositivo, e por isso não há
// caminho pelo qual possa inventar um valor ou uma opinião. Isso é uma
// propriedade do desenho, não uma instrução que um modelo possa ignorar.

export type Lang = "pt" | "en";
export type Target = string | { route: "documento"; docId: string };

export interface AsstAppt { id: string; iso: string; titlePt: string; titleEn: string; by: "medico" | "administrativa" }
export interface AsstReminder { day: string; time: string | null; text: string }
export interface AsstDoc { id: string; iso: string; lab: string; titlePt: string; titleEn: string; markers: string[] }
export interface AsstNotif { titlePt: string; titleEn: string }
export interface AsstSupp { namePt: string; nameEn: string; whenPt: string; whenEn: string }

export interface Facts {
  today: string; // "2026-04-27"
  appts: AsstAppt[];
  reminders: AsstReminder[];
  docs: AsstDoc[];
  unread: AsstNotif[];
  supplements: AsstSupp[];
  conditions: string[];
}

export interface Action { label: string; to: Target }
export interface Reply { text: string; actions: Action[] }

const MONTHS = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function fmtDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[lang][m - 1]} ${y}`;
}
const fmtTime = (iso: string): string | null => (iso.length >= 16 && iso.slice(11, 16) !== "00:00" ? iso.slice(11, 16) : null);

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const has = (tokens: Set<string>, words: string[]) => words.some((w) => tokens.has(w));
const hasPhrase = (q: string, phrases: string[]) => phrases.some((p) => q.includes(p));

// Perguntas de interpretação ou de conselho: nunca se respondem.
const REFUSE_PHRASES = [
  "como estao", "como esta o", "como esta a", "esta bem", "estao bem", "esta mal", "estao mal",
  "bom sinal", "mau sinal", "o que significa", "o que quer dizer", "o que fazer", "o que devo", "posso tomar", "posso parar",
  "fora do alvo", "how are my", "how is my", "are my results", "is my result", "is it normal", "should i", "can i stop",
  "what does", "what should",
];
const REFUSE_WORDS = [
  "grave", "graves", "preocupante", "preocupar", "devo", "normal", "anormal", "diagnostico", "tratamento", "recomenda", "recomendas",
  "conselho", "aconselhas", "interpreta", "interpretar", "bons", "maus", "perigoso", "risco", "alto", "baixo", "elevado", "melhorar", "piorar",
  "mean", "meaning", "interpret", "serious", "worry", "worried", "diagnosis", "treatment", "recommend", "advice", "advise",
  "good", "bad", "high", "low", "risk", "improve",
];

const T = (lang: Lang, pt: string, en: string) => (lang === "pt" ? pt : en);

const byLabel = (by: AsstAppt["by"], lang: Lang) =>
  by === "medico" ? T(lang, "marcada pelo médico", "booked by the doctor") : T(lang, "marcada pela administrativa", "booked by the administrator");

function apptLine(a: AsstAppt, lang: Lang): string {
  const t = fmtTime(a.iso);
  return `${fmtDate(a.iso, lang)}${t ? ` ${T(lang, "às", "at")} ${t}` : ""} · ${T(lang, a.titlePt, a.titleEn)} (${byLabel(a.by, lang)})`;
}

const HELP = (lang: Lang): Reply => ({
  text: T(lang,
    "Posso ajudar com os seus dados: consultas, exames e documentos, lembretes, notificações, o plano de hoje e as condições que registou. Por exemplo: «Quando é a minha próxima consulta?» ou «Mostra-me o exame de 2020».\n\nNão interpreto resultados nem dou conselhos — isso é com o seu médico.",
    "I can help with your data: appointments, tests and documents, reminders, notifications, today's plan and the conditions you've recorded. For example: “When is my next appointment?” or “Show me my 2020 test”.\n\nI don't interpret results or give advice — that's for your doctor."),
  actions: [],
});

export function answer(question: string, facts: Facts, lang: Lang): Reply {
  const q = norm(question);
  if (!q) return HELP(lang);
  const tokens = new Set(q.split(" "));

  // 1) Interpretação e conselho: recusa sempre, antes de tudo o resto.
  if (hasPhrase(q, REFUSE_PHRASES) || has(tokens, REFUSE_WORDS)) {
    return {
      text: T(lang,
        "Isso é uma pergunta para o seu médico — não interpreto resultados nem dou opiniões ou conselhos de saúde. Posso mostrar-lhe os documentos, as datas e o que tem marcado.",
        "That's a question for your doctor — I don't interpret results or give health opinions or advice. I can show you your documents, dates and what's booked."),
      actions: [],
    };
  }

  // 2) Novidades.
  if (hasPhrase(q, ["novidade", "de novo", "notifica", "avisos", "whats new", "what s new", "unread"]) || has(tokens, ["news", "novidades"])) {
    if (facts.unread.length === 0) {
      return { text: T(lang, "Não tem notificações por ler.", "You have no unread notifications."), actions: [{ label: T(lang, "Abrir notificações", "Open notifications"), to: "alerts" }] };
    }
    const lines = facts.unread.slice(0, 5).map((n) => `• ${T(lang, n.titlePt, n.titleEn)}`).join("\n");
    return {
      text: T(lang, `Tem ${facts.unread.length} notificações por ler:\n${lines}`, `You have ${facts.unread.length} unread notifications:\n${lines}`),
      actions: [{ label: T(lang, "Abrir notificações", "Open notifications"), to: "alerts" }],
    };
  }

  // 3) Lembretes do próprio utente.
  if (has(tokens, ["lembrete", "lembretes", "reminder", "reminders"])) {
    const mine = facts.reminders.filter((r) => r.day >= facts.today).sort((a, b) => a.day.localeCompare(b.day));
    if (mine.length === 0) {
      return { text: T(lang, "Não tem lembretes seus a seguir.", "You have no upcoming reminders of your own."), actions: [{ label: T(lang, "Abrir calendário", "Open calendar"), to: "calendario" }] };
    }
    const lines = mine.slice(0, 5).map((r) => `• ${fmtDate(r.day, lang)}${r.time ? ` ${r.time}` : ""} · ${r.text}`).join("\n");
    return {
      text: T(lang, `Os seus lembretes (só seus, a clínica não os vê):\n${lines}`, `Your reminders (only yours, the clinic can't see them):\n${lines}`),
      actions: [{ label: T(lang, "Abrir calendário", "Open calendar"), to: "calendario" }],
    };
  }

  // 4) Consultas.
  if (has(tokens, ["consulta", "consultas", "marcacao", "marcacoes", "agenda", "calendario", "appointment", "appointments", "calendar", "visit"])) {
    const past = has(tokens, ["ultima", "anterior", "passada", "last", "previous", "past"]);
    const upcoming = facts.appts.filter((a) => a.iso.slice(0, 10) >= facts.today).sort((a, b) => a.iso.localeCompare(b.iso));
    const before = facts.appts.filter((a) => a.iso.slice(0, 10) < facts.today).sort((a, b) => b.iso.localeCompare(a.iso));
    const calendar: Action = { label: T(lang, "Abrir calendário", "Open calendar"), to: "calendario" };
    if (past) {
      return before.length
        ? { text: T(lang, `A sua última consulta foi a ${apptLine(before[0], lang)}.`, `Your last appointment was on ${apptLine(before[0], lang)}.`), actions: [{ label: T(lang, "Ver consultas", "See appointments"), to: "consultas" }] }
        : { text: T(lang, "Não tenho consultas anteriores registadas.", "I have no past appointments recorded."), actions: [calendar] };
    }
    if (upcoming.length === 0) {
      return { text: T(lang, "Não tem consultas marcadas pela clínica.", "You have no appointments booked by the clinic."), actions: [calendar] };
    }
    const rest = upcoming.length > 1
      ? T(lang, `\n\nTem mais ${upcoming.length - 1}:\n`, `\n\nYou have ${upcoming.length - 1} more:\n`) + upcoming.slice(1, 4).map((a) => `• ${apptLine(a, lang)}`).join("\n")
      : "";
    return {
      text: T(lang, `A sua próxima consulta é a ${apptLine(upcoming[0], lang)}.${rest}`, `Your next appointment is on ${apptLine(upcoming[0], lang)}.${rest}`),
      actions: [calendar],
    };
  }

  // 5) Exames e documentos: mostra-se o documento, não os valores.
  const yearM = q.match(/\b(19|20)\d{2}\b/);
  const wantsDocs = has(tokens, ["exame", "exames", "analise", "analises", "resultado", "resultados", "documento", "documentos", "pdf", "laboratorio", "synlab", "cuf", "exam", "exams", "test", "tests", "result", "results", "document", "documents", "report", "lab"]);
  const markerHit = [...new Set(facts.docs.flatMap((d) => d.markers))].find((m) => q.includes(norm(m)) && norm(m).length >= 3);
  if (wantsDocs || markerHit) {
    let docs = [...facts.docs].sort((a, b) => b.iso.localeCompare(a.iso));
    if (yearM) docs = docs.filter((d) => d.iso.startsWith(yearM[0]));
    if (markerHit) docs = docs.filter((d) => d.markers.includes(markerHit));
    const latest = has(tokens, ["ultimo", "ultima", "recente", "latest", "last", "recent"]);
    if (latest) docs = docs.slice(0, 1);

    if (docs.length === 0) {
      const all = [...facts.docs].sort((a, b) => b.iso.localeCompare(a.iso)).slice(0, 4);
      const what = yearM ? T(lang, ` de ${yearM[0]}`, ` from ${yearM[0]}`) : markerHit ? ` (${markerHit})` : "";
      const list = all.map((d) => `• ${fmtDate(d.iso, lang)} · ${T(lang, d.titlePt, d.titleEn)} · ${d.lab}`).join("\n");
      return {
        text: T(lang, `Não encontro nenhum exame${what}. Tenho estes:\n${list}`, `I can't find any test${what}. I have these:\n${list}`),
        actions: all.map((d) => ({ label: `${T(lang, "Abrir", "Open")} ${fmtDate(d.iso, lang)}`, to: { route: "documento" as const, docId: d.id } })),
      };
    }
    const shown = docs.slice(0, 4);
    const list = shown.map((d) => `• ${fmtDate(d.iso, lang)} · ${T(lang, d.titlePt, d.titleEn)} · ${d.lab}`).join("\n");
    const head = markerHit
      ? T(lang, `${markerHit} aparece em ${docs.length === 1 ? "este documento" : `${docs.length} documentos`}:`, `${markerHit} appears in ${docs.length === 1 ? "this document" : `${docs.length} documents`}:`)
      : T(lang, docs.length === 1 ? "Encontrei este documento:" : `Encontrei ${docs.length} documentos:`, docs.length === 1 ? "I found this document:" : `I found ${docs.length} documents:`);
    return {
      text: `${head}\n${list}\n\n${T(lang, "Abra o documento para ver o original — não comento os valores.", "Open the document to see the original — I don't comment on the values.")}`,
      actions: shown.map((d) => ({ label: `${T(lang, "Abrir", "Open")} ${fmtDate(d.iso, lang)}`, to: { route: "documento" as const, docId: d.id } })),
    };
  }

  // 6) Plano de hoje.
  if (has(tokens, ["suplemento", "suplementos", "medicacao", "plano", "tomo", "supplement", "supplements", "medication", "plan", "taking"])) {
    if (facts.supplements.length === 0) return { text: T(lang, "Não tem suplementos no plano.", "You have no supplements in your plan."), actions: [] };
    const lines = facts.supplements.map((s) => `• ${T(lang, s.namePt, s.nameEn)} — ${T(lang, s.whenPt, s.whenEn)}`).join("\n");
    return { text: T(lang, `O seu plano de hoje:\n${lines}`, `Your plan for today:\n${lines}`), actions: [{ label: T(lang, "Abrir suplementos", "Open supplements"), to: "nutricao" }] };
  }

  // 7) Condições registadas pelo utente.
  if (has(tokens, ["condicao", "condicoes", "doenca", "doencas", "condition", "conditions"])) {
    if (facts.conditions.length === 0) {
      return { text: T(lang, "Ainda não registou nenhuma condição.", "You haven't recorded any conditions yet."), actions: [{ label: T(lang, "Registar condição", "Add a condition"), to: "condicoes" }] };
    }
    return {
      text: T(lang, `As condições que registou:\n${facts.conditions.map((c) => `• ${c}`).join("\n")}`, `The conditions you've recorded:\n${facts.conditions.map((c) => `• ${c}`).join("\n")}`),
      actions: [{ label: T(lang, "Abrir condições", "Open conditions"), to: "condicoes" }],
    };
  }

  return HELP(lang);
}
