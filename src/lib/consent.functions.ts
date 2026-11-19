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
  }))
  .handler(async ({ data, context }) => {
    const ip = ipDoPedido();
    const user_id = context.userId;
    const base = { user_id, ip };
    const { error } = await supabaseAdmin.from("medico_consentimentos").insert([
      { ...base, tipo: "documento", codigo: "termos", versao: LEGAL_DOCS.termos.versao, caixa_id: CAIXA_IDS.documentos, texto_caixa: data.textos.documentos },
      { ...base, tipo: "documento", codigo: "acordo", versao: LEGAL_DOCS.acordo.versao, caixa_id: CAIXA_IDS.documentos, texto_caixa: data.textos.documentos },
      { ...base, tipo: "declaracao", codigo: "habilitacao", versao: "habilitacao-v1", caixa_id: CAIXA_IDS.habilitacao, texto_caixa: data.textos.habilitacao },
    ]);
    if (error) throw new Error("Não foi possível registar a aceitação.");

    if (data.marketing) {
      await supabaseAdmin.from("medico_consentimento_marketing").insert({
        ...base, aceite: true, texto_caixa: data.textos.marketing,
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
    return { ok: true as const };
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
      user_id: context.userId, aceite: data.aceite, texto_caixa: data.texto, ip: ipDoPedido(),
    });
    if (error) throw new Error("Não foi possível guardar.");
    return { ok: true as const };
  });

export const registarFundamentoUtente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { utenteRef: string; texto: string }) => ({
    utenteRef: texto(d?.utenteRef, 200),
    texto: texto(d?.texto),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("medico_utente_fundamento").insert({
      user_id: context.userId, utente_ref: data.utenteRef, texto_confirmado: data.texto, ip: ipDoPedido(),
    });
    if (error) throw new Error("Não foi possível registar a confirmação.");
    return { ok: true as const };
  });
