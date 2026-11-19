import type { ResumoUtente } from "@/data/mock-portal";
import type { Utente } from "@/data/mock-utente";
import { lerClinicas } from "@/lib/utente-clinica";
import { lerUtentes } from "@/lib/utentes-store";

export const FORMATO_EXPORTACAO = "vivara-export-v1";

export function descarregar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const hoje = () => new Date().toISOString().slice(0, 10);

function lerChats(): unknown {
  try {
    return JSON.parse(localStorage.getItem("vivara-chats") ?? "{}");
  } catch {
    return {};
  }
}

export function exportarTudo() {
  const dados = {
    formato: FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    utentes: lerUtentes(),
    clinicas: lerClinicas(),
    conversas: lerChats(),
  };
  descarregar(`vivara-dados-${hoje()}.json`, JSON.stringify(dados, null, 2), "application/json");
}

export function exportarUtenteJson(utente: Utente) {
  const dados = {
    formato: FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    utente,
    clinica: lerClinicas()[utente.id] ?? null,
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

export type UtenteImportado = Omit<ResumoUtente, "id" | "iniciais"> & { clinica?: string };

export type ResultadoImportacao =
  | { ok: true; utentes: UtenteImportado[]; ignoradas: number }
  | { ok: false };

function base(nome: string, idade: unknown, sexo: unknown, cidade: unknown): UtenteImportado {
  return {
    nome: nome.trim().slice(0, 120),
    idade: Math.max(0, Math.min(130, Number(idade) || 0)),
    sexo: String(sexo).trim().toUpperCase() === "M" ? "M" : "F",
    cidade: String(cidade ?? "").trim().slice(0, 80) || "—",
    plano: "Essencial",
    alertasAtivos: 0,
    marcadoresForaAlvo: 0,
    totalMarcadores: 0,
    ultimaConsulta: hoje(),
    acessivel: false,
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

export function interpretarImportacao(texto: string, nomeFicheiro: string): ResultadoImportacao {
  const conteudo = texto.replace(/^﻿/, "");
  if (nomeFicheiro.toLowerCase().endsWith(".json")) {
    try {
      const dados = JSON.parse(conteudo) as { formato?: string; utentes?: unknown };
      if (dados.formato !== FORMATO_EXPORTACAO || !Array.isArray(dados.utentes)) return { ok: false };
      const clinicas = (dados as { clinicas?: Record<string, { atual?: string }> }).clinicas ?? {};
      let ignoradas = 0;
      const utentes: UtenteImportado[] = [];
      for (const u of dados.utentes as Record<string, unknown>[]) {
        if (typeof u?.nome !== "string" || !u.nome.trim()) {
          ignoradas++;
          continue;
        }
        utentes.push({
          ...base(u.nome, u.idade, u.sexo, u.cidade),
          clinica: typeof u.id === "string" ? clinicas[u.id]?.atual : undefined,
        });
      }
      return { ok: true, utentes, ignoradas };
    } catch {
      return { ok: false };
    }
  }

  const linhas = conteudo.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return { ok: false };
  const sep = linhas[0].includes(";") ? ";" : ",";
  const cab = dividirCsv(linhas[0], sep).map((c) => c.toLowerCase());
  const col = (n: string) => cab.indexOf(n);
  if (col("nome") < 0) return { ok: false };
  let ignoradas = 0;
  const utentes: UtenteImportado[] = [];
  for (const l of linhas.slice(1)) {
    const c = dividirCsv(l, sep);
    const nome = c[col("nome")];
    if (!nome) {
      ignoradas++;
      continue;
    }
    utentes.push({
      ...base(nome, c[col("idade")], c[col("sexo")], c[col("cidade")]),
      clinica: col("clinica") >= 0 ? c[col("clinica")] || undefined : undefined,
    });
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
