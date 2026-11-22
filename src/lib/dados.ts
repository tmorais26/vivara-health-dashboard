import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type UtenteDb = Tables<"utentes">;
export type ConsultaDb = Tables<"consultas">;
export type DiarioDb = Tables<"diarios">;
export type ObservacaoDb = Tables<"observacoes">;
export type MembroDb = Tables<"membros">;
export type ChatMensagemDb = Tables<"chat_mensagens">;
export type PedidoExportacaoDb = Tables<"pedidos_exportacao">;
export type NotificacaoDb = Tables<"notificacoes">;

export function idade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const n = new Date(dataNascimento);
  const hoje = new Date();
  let a = hoje.getFullYear() - n.getFullYear();
  if (hoje.getMonth() < n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() < n.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

export function dataHora(iso: string, idioma: "pt" | "en" = "pt") {
  return new Date(iso).toLocaleString(idioma === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function soData(iso: string, idioma: "pt" | "en" = "pt") {
  return new Date(iso).toLocaleDateString(idioma === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function rotuloMembro(m: Pick<MembroDb, "nome_exibicao" | "funcao" | "profissao">, t: { medico: string; administrativo: string }) {
  const funcao = m.funcao === "medico" ? t.medico : m.funcao === "administrativo" ? t.administrativo : m.profissao ?? "";
  return funcao ? `${m.nome_exibicao} · ${funcao}` : m.nome_exibicao;
}

export type ResumoUtenteDb = UtenteDb & {
  proxima: ConsultaDb | null;
  segue: boolean;
};

export async function listarUtentes(espacoId: string, membroId: string): Promise<ResumoUtenteDb[]> {
  const agora = new Date().toISOString();
  const [{ data: us, error }, { data: cs }, { data: ss }] = await Promise.all([
    supabase.from("utentes").select("*").eq("espaco_id", espacoId).order("nome"),
    supabase
      .from("consultas")
      .select("*")
      .eq("espaco_id", espacoId)
      .eq("estado", "agendada")
      .gte("inicio", agora)
      .order("inicio"),
    supabase.from("seguimentos").select("utente_id").eq("membro_id", membroId),
  ]);
  if (error) throw error;
  const proximas = new Map<string, ConsultaDb>();
  for (const c of cs ?? []) if (!proximas.has(c.utente_id)) proximas.set(c.utente_id, c);
  const segue = new Set((ss ?? []).map((s) => s.utente_id));
  return (us ?? []).map((u) => ({ ...u, proxima: proximas.get(u.id) ?? null, segue: segue.has(u.id) }));
}

export async function membrosDoEspaco(espacoId: string): Promise<MembroDb[]> {
  const { data } = await supabase.from("membros").select("*").eq("espaco_id", espacoId).order("nome_exibicao");
  return data ?? [];
}

export type NovoUtente = Omit<TablesInsert<"utentes">, "espaco_id" | "criado_por">;

export async function criarUtente(espacoId: string, membroId: string, u: NovoUtente & { id: string }) {
  const { error } = await supabase.from("utentes").insert({ ...u, espaco_id: espacoId, criado_por: membroId });
  if (error) throw error;
}

export async function criarUtentes(espacoId: string, membroId: string, us: (NovoUtente & { id: string })[]) {
  if (!us.length) return;
  const { error } = await supabase
    .from("utentes")
    .insert(us.map((u) => ({ ...u, espaco_id: espacoId, criado_por: membroId })));
  if (error) throw error;
}
