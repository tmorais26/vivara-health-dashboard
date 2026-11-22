import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CAIXA_IDS, LEGAL_DOCS } from "@/lib/legal-docs";

function ipDoPedido(): string | null {
  const h = getRequest().headers;
  const xff = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || h.get("x-real-ip") || null;
}

const texto = (v: unknown, max = 600) => {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error("Dados inválidos");
  return v;
};
const opcional = (v: unknown, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

type EntradaAceitacao = {
  textos: { documentos: string; habilitacao: string; marketing: string };
  marketing: boolean;
  perfil?: { nome?: string; especialidade?: string; cedula?: string; clinica?: string };
  codigoConvite?: string;
  declaracao?: "habilitacao" | "funcoes";
};

export const registarAceitacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EntradaAceitacao) => ({
    textos: {
      documentos: texto(d?.textos?.documentos),
      habilitacao: texto(d?.textos?.habilitacao),
      marketing: texto(d?.textos?.marketing),
    },
    marketing: d?.marketing === true,
    perfil: d?.perfil,
    codigoConvite: typeof d?.codigoConvite === "string" ? d.codigoConvite.slice(0, 20) : undefined,
    declaracao: d?.declaracao === "funcoes" ? ("funcoes" as const) : ("habilitacao" as const),
  }))
  .handler(async ({ data, context }) => {
    const ip = ipDoPedido();
    const user_id = context.userId;
    const base = { user_id, ip };
    const { error } = await supabaseAdmin.from("medico_consentimentos").insert([
      {
        ...base,
        tipo: "documento",
        codigo: "termos",
        versao: LEGAL_DOCS.termos.versao,
        caixa_id: CAIXA_IDS.documentos,
        texto_caixa: data.textos.documentos,
      },
      {
        ...base,
        tipo: "documento",
        codigo: "acordo",
        versao: LEGAL_DOCS.acordo.versao,
        caixa_id: CAIXA_IDS.documentos,
        texto_caixa: data.textos.documentos,
      },
      {
        ...base,
        tipo: "declaracao",
        codigo: "habilitacao",
        versao: data.declaracao === "funcoes" ? "funcoes-v1" : "habilitacao-v1",
        caixa_id: data.declaracao === "funcoes" ? CAIXA_IDS.funcoes : CAIXA_IDS.habilitacao,
        texto_caixa: data.textos.habilitacao,
      },
    ]);
    if (error) throw new Error("Não foi possível registar a aceitação.");

    if (data.marketing) {
      await supabaseAdmin.from("medico_consentimento_marketing").insert({
        ...base,
        aceite: true,
        texto_caixa: data.textos.marketing,
      });
    }
    if (data.perfil) {
      await supabaseAdmin.from("medico_perfis").upsert({
        user_id,
        nome: opcional(data.perfil.nome),
        especialidade: opcional(data.perfil.especialidade),
        cedula_profissional: opcional(data.perfil.cedula, 50),
        clinica: opcional(data.perfil.clinica),
      });
    }
    // Código de convite usado no registo: só uma vez por conta e só no registo (regras na base de dados).
    let convite: string | null = null;
    if (data.codigoConvite) {
      const { data: r } = await supabaseAdmin.rpc("registar_recomendacao", {
        p_convidado: user_id,
        p_codigo: data.codigoConvite,
        p_convidado_tipo: "profissional",
      });
      convite = (r as string | null) ?? null;
    }
    return { ok: true as const, convite };
  });

export const estadoConsentimento = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: linhas } = await context.supabase
      .from("medico_consentimentos")
      .select("codigo, versao")
      .in("codigo", ["termos", "acordo"]);
    const aceites = new Set((linhas ?? []).map((l) => `${l.codigo}:${l.versao}`));
    const precisaConsentir =
      !aceites.has(`termos:${LEGAL_DOCS.termos.versao}`) ||
      !aceites.has(`acordo:${LEGAL_DOCS.acordo.versao}`);

    const { data: mk } = await context.supabase
      .from("medico_consentimento_marketing")
      .select("aceite, alterado_em")
      .order("alterado_em", { ascending: false })
      .limit(1);
    return {
      precisaConsentir,
      primeiraVez: (linhas ?? []).length === 0,
      marketing: mk?.[0]?.aceite ?? false,
      marketingDesde: mk?.[0]?.alterado_em ?? null,
    };
  });

export const definirMarketing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { aceite: boolean; texto?: string }) => ({
    aceite: d?.aceite === true,
    texto: opcional(d?.texto, 600),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("medico_consentimento_marketing").insert({
      user_id: context.userId,
      aceite: data.aceite,
      texto_caixa: data.texto,
      ip: ipDoPedido(),
    });
    if (error) throw new Error("Não foi possível guardar.");
    return { ok: true as const };
  });

export const registarFundamentoUtente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { utenteRefs: string[]; texto: string }) => {
    if (!Array.isArray(d?.utenteRefs) || d.utenteRefs.length === 0 || d.utenteRefs.length > 2000) {
      throw new Error("Dados inválidos");
    }
    return { utenteRefs: d.utenteRefs.map((r) => texto(r, 200)), texto: texto(d?.texto) };
  })
  .handler(async ({ data, context }) => {
    const ip = ipDoPedido();
    const { error } = await supabaseAdmin.from("medico_utente_fundamento").insert(
      data.utenteRefs.map((utente_ref) => ({
        user_id: context.userId,
        utente_ref,
        texto_confirmado: data.texto,
        ip,
      })),
    );
    if (error) throw new Error("Não foi possível registar a confirmação.");
    return { ok: true as const };
  });

export const registarDeclaracaoRecomendacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { texto: string }) => ({ texto: texto(d?.texto) }))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("recomendacao_declaracoes")
      .upsert(
        { user_id: context.userId, texto: data.texto, ip: ipDoPedido() },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    if (error) throw new Error("Não foi possível registar a declaração.");
    return { ok: true as const };
  });
