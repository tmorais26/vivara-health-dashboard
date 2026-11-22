// Funções de servidor do programa de recomendação (lado do utente).
//
// As chamadas que o utente pode fazer com a sua sessão (validar_codigo,
// usar_codigo, aceitar_convite_app, meu_codigo_utente) vão diretas do telemóvel
// para o Supabase. Aqui fica só o que precisa da chave de serviço: ler os meses
// grátis do próprio (meses_gratis não tem leitura para o utente).
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FreeMonth } from "./referral";

export const getMyFreeMonths = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }): Promise<FreeMonth[]> => {
    const { data, error } = await supabaseAdmin
      .from("meses_gratis")
      .select("estado, ano, criado_em, aplicado_em")
      .eq("beneficiario_id", context.userId)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(`meses_gratis: ${error.message}`);
    return (data ?? []).map((m) => ({
      estado: m.estado as FreeMonth["estado"],
      ano: m.ano,
      criadoEm: m.criado_em,
      aplicadoEm: m.aplicado_em,
    }));
  });
