// Funções de servidor da orientação nutricional com IA.
//
//  - gerarOrientacaoNutricional: verifica o consentimento, aplica a barreira de
//    segurança (sem IA), escolhe o que pode ir para a IA, chama a Claude API,
//    verifica a resposta e grava uma versão nova. Se a entrada não mudou desde a
//    última versão, devolve essa (sem nova chamada nem custo).
//  - getOrientacoesNutricionais: as versões da pessoa, da mais recente para a
//    mais antiga, e se tem um profissional ligado para validar.
//  - pedirValidacaoNutricional: pede validação (com a sessão da pessoa).
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  NUTRITION_PROMPT_VERSION, gate, inputHash, selectAiInput,
  type GateReason, type GuidanceContent,
} from "./nutrition.rules";
import { generateGuidance, isAnthropicConfigured } from "./nutrition.server";
import { validateGenInput } from "./nutrition.input";

export interface OrientacaoView {
  id: string;
  versao: number;
  estado: "gerado" | "em_validacao" | "validado" | "bloqueado";
  /** O que se mostra: a versão do profissional, se validada; senão a da IA. */
  conteudo: GuidanceContent | null;
  /** O texto gerado pela IA, quando o profissional o editou. */
  conteudoIa: GuidanceContent | null;
  motivos: GateReason[];
  marcadores: { name: string; value: number; unit: string; date: string }[];
  entradaHash: string;
  geradoEm: string;
  validadoPorNome: string | null;
  validadoEm: string | null;
  editado: boolean;
  observacao: string | null;
  pedidoPendenteEm: string | null;
}

type Row = {
  id: string; versao: number; estado: string; conteudo: Json; entrada: Json; entrada_hash: string; gerado_em: string;
  conteudo_validado: Json | null; editado: boolean; observacao: string | null; validado_por_nome: string | null; validado_em: string | null;
};

function toView(r: Row, pendingAt: string | null): OrientacaoView {
  const c = r.conteudo as unknown as (GuidanceContent & { motivos?: GateReason[] }) | null;
  const validated = r.conteudo_validado as unknown as GuidanceContent | null;
  const entrada = r.entrada as unknown as { markers?: OrientacaoView["marcadores"] } | null;
  const ai = c && Array.isArray(c.itens) ? { itens: c.itens, nota: c.nota } : null;
  return {
    id: r.id,
    versao: r.versao,
    estado: r.estado as OrientacaoView["estado"],
    conteudo: validated ?? ai,
    conteudoIa: validated && r.editado ? ai : null,
    motivos: c?.motivos ?? [],
    marcadores: (entrada?.markers ?? []).map((m) => ({ name: m.name, value: m.value, unit: m.unit, date: m.date })),
    entradaHash: r.entrada_hash,
    geradoEm: r.gerado_em,
    validadoPorNome: r.validado_por_nome,
    validadoEm: r.validado_em,
    editado: r.editado,
    observacao: r.observacao,
    pedidoPendenteEm: pendingAt,
  };
}

const COLS = "id, versao, estado, conteudo, entrada, entrada_hash, gerado_em, conteudo_validado, editado, observacao, validado_por_nome, validado_em";

async function audit(row: { orientacao_id: string | null; user_id: string; acao: string; detalhe?: Json }) {
  await supabaseAdmin.from("orientacoes_auditoria").insert({ ...row, ator_id: null });
}

async function hasConsent(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("consent_events").select("action")
    .eq("user_id", userId).eq("consent_type", "ai_nutricao")
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1);
  return data?.[0]?.action === "granted";
}

export type GenResult =
  | { ok: true; orientacao: OrientacaoView; reused: boolean }
  | { ok: false; error: "sem_consentimento" | "not_configured" | "recusado" | "saida_invalida" | "servidor" };

export const gerarOrientacaoNutricional = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator(validateGenInput)
  .handler(async ({ data, context }): Promise<GenResult> => {
    const uid = context.userId;
    try {
      if (!(await hasConsent(uid))) return { ok: false, error: "sem_consentimento" };

      const { data: last } = await supabaseAdmin.from("orientacoes_nutricionais").select(COLS)
        .eq("user_id", uid).order("versao", { ascending: false }).limit(1);
      const nextVersion = (last?.[0]?.versao ?? 0) + 1;

      // 1. Barreira de segurança (sem IA).
      const reasons = gate({ markers: data.markers, conditions: data.conditions, pregnantOrBreastfeeding: data.pregnantOrBreastfeeding, age: data.profile.age });
      const aiInput = selectAiInput(data.markers, data.profile, data.lang);
      const hash = await inputHash(aiInput);

      if (reasons.length) {
        // Guarda só os motivos (para auditoria e para o profissional), sem chamar a IA.
        const prev = last?.[0];
        if (prev && prev.estado === "bloqueado" && prev.entrada_hash === `bloq:${hash}`) {
          return { ok: true, orientacao: toView(prev as Row, await pendingAt(prev.id)), reused: true };
        }
        const { data: ins, error } = await supabaseAdmin.from("orientacoes_nutricionais").insert({
          user_id: uid, versao: nextVersion, estado: "bloqueado",
          conteudo: { motivos: reasons } as unknown as Json, entrada: aiInput as unknown as Json, entrada_hash: `bloq:${hash}`,
          lang: data.lang, versao_prompt: NUTRITION_PROMPT_VERSION,
        }).select(COLS).single();
        if (error || !ins) throw new Error(error?.message ?? "insert");
        await audit({ orientacao_id: ins.id, user_id: uid, acao: "bloqueado", detalhe: { motivos: reasons } as unknown as Json });
        return { ok: true, orientacao: toView(ins as Row, null), reused: false };
      }

      // 2. Mesma entrada que a última versão gerada: não se volta a chamar a IA.
      const prev = last?.[0];
      if (prev && prev.entrada_hash === hash && prev.estado !== "bloqueado") {
        return { ok: true, orientacao: toView(prev as Row, await pendingAt(prev.id)), reused: true };
      }

      // 3. IA.
      if (!isAnthropicConfigured()) return { ok: false, error: "not_configured" };
      const gen = await generateGuidance(aiInput);
      if (gen.kind === "refused") return { ok: false, error: "recusado" };
      if (gen.kind === "invalid") {
        await audit({ orientacao_id: null, user_id: uid, acao: "saida_rejeitada", detalhe: { problemas: gen.problems } as unknown as Json });
        return { ok: false, error: "saida_invalida" };
      }
      const { data: ins, error } = await supabaseAdmin.from("orientacoes_nutricionais").insert({
        user_id: uid, versao: nextVersion, estado: "gerado",
        conteudo: gen.content as unknown as Json, entrada: aiInput as unknown as Json, entrada_hash: hash,
        lang: data.lang, modelo: gen.model, versao_prompt: NUTRITION_PROMPT_VERSION,
      }).select(COLS).single();
      if (error || !ins) throw new Error(error?.message ?? "insert");
      await audit({ orientacao_id: ins.id, user_id: uid, acao: "gerado", detalhe: { modelo: gen.model } as unknown as Json });
      return { ok: true, orientacao: toView(ins as Row, null), reused: false };
    } catch (e) {
      console.error("[nutricao] gerar", e instanceof Error ? e.message : e);
      return { ok: false, error: "servidor" };
    }
  });

async function pendingAt(orientacaoId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("pedidos_validacao_nutricao").select("pedido_em")
    .eq("orientacao_id", orientacaoId).eq("estado", "pendente").limit(1);
  return data?.[0]?.pedido_em ?? null;
}

export interface OrientacoesState {
  consentimento: boolean;
  temProfissional: boolean;
  versoes: OrientacaoView[];
}

export const getOrientacoesNutricionais = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrientacoesState> => {
    const uid = context.userId;
    const [{ data: rows, error }, { data: pend }, { data: linked }, consent] = await Promise.all([
      supabaseAdmin.from("orientacoes_nutricionais").select(COLS).eq("user_id", uid).order("versao", { ascending: false }).limit(30),
      supabaseAdmin.from("pedidos_validacao_nutricao").select("orientacao_id, pedido_em").eq("user_id", uid).eq("estado", "pendente"),
      supabaseAdmin.rpc("tem_profissional_ligado", { p_user: uid }),
      hasConsent(uid),
    ]);
    if (error) throw new Error(`orientacoes: ${error.message}`);
    const pendingBy = new Map((pend ?? []).map((p) => [p.orientacao_id, p.pedido_em]));
    return {
      consentimento: consent,
      temProfissional: linked === true,
      versoes: (rows ?? []).map((r) => toView(r as Row, pendingBy.get(r.id) ?? null)),
    };
  });

export const pedirValidacaoNutricional = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((raw: unknown) => {
    const id = (raw as { id?: unknown })?.id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("pedido inválido");
    return { id };
  })
  .handler(async ({ data, context }) => {
    // Com a sessão da própria pessoa: a função na base de dados confirma que a
    // orientação é dela e que tem um profissional ligado.
    const { data: r, error } = await context.supabase.rpc("pedir_validacao_nutricao", { p_orientacao: data.id });
    if (error) throw new Error(error.message);
    return { result: (r ?? "erro") as "ok" | "ja_pedido" | "ja_validada" | "sem_profissional" | "nao_encontrada" | "erro" };
  });
