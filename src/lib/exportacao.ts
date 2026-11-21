import type { Utente } from "@/data/mock-utente";
import { supabase } from "@/integrations/supabase/client";
import type { NovoUtente } from "@/lib/dados";

export const FORMATO_EXPORTACAO = "vivara-export-v2";

export function descarregar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const hoje = () => new Date().toISOString().slice(0, 10);

// Exporta tudo o que o utilizador pode ver neste espaço. Fica registado na auditoria
// (no Plano Médico o pedido é aprovado automaticamente; na clínica tem de estar aprovado).
export async function exportarEspaco(espacoId: string, pedidoId?: string) {
  let id = pedidoId;
  if (!id) {
    const { data, error } = await supabase.rpc("pedir_exportacao", { p_espaco: espacoId, p_ambito: "tudo" });
    if (error || !data) throw error ?? new Error("pedido");
    id = data;
  }
  const { error: eUsar } = await supabase.rpc("usar_exportacao", { p_pedido: id });
  if (eUsar) throw eUsar;
  const [utentes, consultas, diarios, observacoes, registos, chat] = await Promise.all([
    supabase.from("utentes").select("*").eq("espaco_id", espacoId),
    supabase.from("consultas").select("*").eq("espaco_id", espacoId),
    supabase.from("diarios").select("*").eq("espaco_id", espacoId),
    supabase.from("observacoes").select("*").eq("espaco_id", espacoId),
    supabase.from("registos_clinicos").select("*").eq("espaco_id", espacoId),
    supabase.from("chat_mensagens").select("*").eq("espaco_id", espacoId),
  ]);
  const dados = {
    formato: FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    utentes: utentes.data ?? [],
    consultas: consultas.data ?? [],
    diarios: diarios.data ?? [],
    observacoes: observacoes.data ?? [],
    registosClinicos: registos.data ?? [],
    chat: chat.data ?? [],
  };
  descarregar(`vivara-dados-${hoje()}.json`, JSON.stringify(dados, null, 2), "application/json");
}

// Exporta um utente (com tudo o que o utilizador pode ver dele). Usa uma autorização.
export async function exportarUtenteDb(espacoId: string, utenteId: string, pedidoId?: string) {
  let id = pedidoId;
  if (!id) {
    const { data, error } = await supabase.rpc("pedir_exportacao", { p_espaco: espacoId, p_ambito: "utente", p_utente: utenteId });
    if (error || !data) throw error ?? new Error("pedido");
    id = data;
  }
  const { error: eUsar } = await supabase.rpc("usar_exportacao", { p_pedido: id });
  if (eUsar) throw eUsar;
  const [utente, consultas, diarios, observacoes, registos, chat] = await Promise.all([
    supabase.from("utentes").select("*").eq("id", utenteId).maybeSingle(),
    supabase.from("consultas").select("*").eq("utente_id", utenteId),
    supabase.from("diarios").select("*").eq("utente_id", utenteId),
    supabase.from("observacoes").select("*").eq("utente_id", utenteId),
    supabase.from("registos_clinicos").select("*").eq("utente_id", utenteId),
    supabase.from("chat_mensagens").select("*").eq("utente_id", utenteId),
  ]);
  const dados = {
    formato: FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    utentes: utente.data ? [utente.data] : [],
    consultas: consultas.data ?? [],
    diarios: diarios.data ?? [],
    observacoes: observacoes.data ?? [],
    registosClinicos: registos.data ?? [],
    chat: chat.data ?? [],
  };
  descarregar(`vivara-utente-${hoje()}.json`, JSON.stringify(dados, null, 2), "application/json");
}

export function exportarUtenteJson(utente: Utente) {
  const dados = {
    formato: FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    utente,
  };
  descarregar(`vivara-${utente.id}-${hoje()}.json`, JSON.stringify(dados, null, 2), "application/json");
}

const csvCampo = (v: unknown) => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportarMarcadoresCsv(utente: Utente) {
  const linhas = [["marcador", "categoria", "unidade", "data", "valor"].join(",")];
  for (const m of utente.marcadores) {
    for (const p of m.serie) {
      linhas.push([m.nome, m.categoria, m.unidade, p.data, p.valor].map(csvCampo).join(","));
    }
  }
  descarregar(`vivara-${utente.id}-marcadores-${hoje()}.csv`, linhas.join("\n"), "text/csv");
}

// --- Importação -----------------------------------------------------------

export type UtenteImportado = NovoUtente & { nome: string };

export type ResultadoImportacao =
  | { ok: true; utentes: UtenteImportado[]; ignoradas: number }
  | { ok: false };

const texto = (v: unknown, max = 200) => {
  const t = String(v ?? "").trim().slice(0, max);
  return t || null;
};

function dataIso(v: unknown): string | null {
  const t = String(v ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function base(o: Record<string, unknown>): UtenteImportado | null {
  const nome = texto(o.nome, 200);
  if (!nome) return null;
  const sexo = String(o.sexo ?? "").trim().toUpperCase();
  return {
    nome,
    data_nascimento: dataIso(o.data_nascimento ?? o.nascimento),
    sexo: sexo === "F" || sexo === "M" ? sexo : null,
    cidade: texto(o.cidade, 80),
    telefone: texto(o.telefone, 40),
    email: texto(o.email, 200),
    clinica_onde_visto: texto(o.clinica_onde_visto ?? o.clinica, 200),
  };
}

function dividirCsv(linha: string, sep: string): string[] {
  const out: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      out.push(atual);
      atual = "";
    } else atual += c;
  }
  out.push(atual);
  return out.map((x) => x.trim());
}

export function interpretarImportacao(conteudoBruto: string, nomeFicheiro: string): ResultadoImportacao {
  const conteudo = conteudoBruto.replace(/^\uFEFF/, "");
  let linhas: Record<string, unknown>[] = [];
  if (nomeFicheiro.toLowerCase().endsWith(".json")) {
    try {
      const dados = JSON.parse(conteudo) as { formato?: string; utentes?: unknown };
      if (!String(dados.formato ?? "").startsWith("vivara-export") || !Array.isArray(dados.utentes)) return { ok: false };
      linhas = dados.utentes as Record<string, unknown>[];
    } catch {
      return { ok: false };
    }
  } else {
    const ls = conteudo.split(/\r?\n/).filter((l) => l.trim());
    if (ls.length < 2) return { ok: false };
    const sep = ls[0].includes(";") ? ";" : ",";
    const cab = dividirCsv(ls[0], sep).map((c) => c.toLowerCase());
    if (!cab.includes("nome")) return { ok: false };
    linhas = ls.slice(1).map((l) => {
      const c = dividirCsv(l, sep);
      return Object.fromEntries(cab.map((k, i) => [k, c[i]]));
    });
  }
  let ignoradas = 0;
  const utentes: UtenteImportado[] = [];
  for (const l of linhas) {
    const u = base(l);
    if (u) utentes.push(u);
    else ignoradas++;
  }
  return { ok: true, utentes, ignoradas };
}

export function idDeNome(nome: string) {
  return `${nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
}

export function iniciaisDe(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
