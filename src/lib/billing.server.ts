// Pagamentos do lado do servidor, independentes do prestador.
//
// Só corre com a chave de serviço, nunca no browser. Ainda não está ligado a
// nenhuma rota: entra quando houver um prestador (Stripe) e o aviso de pagamento
// dele, com a assinatura verificada. Até lá, nada de fora consegue chamar isto.
//
// Fluxo:
//  1. No PRIMEIRO pagamento bem-sucedido de um utente → onFirstSuccessfulPayment.
//     registar_primeiro_pagamento é idempotente: chamadas repetidas não dão
//     mais meses. Cria linhas em meses_gratis ('por_aplicar' ou, se passar de 12
//     no ano, 'limite_atingido').
//  2. applyPendingFreeMonths pede ao prestador para adiar a próxima cobrança um
//     mês (ou prolongar o plano anual um mês) por cada linha 'por_aplicar', e
//     marca-a como aplicada com a referência do prestador.
//
// MB WAY: na Stripe não faz cobrança recorrente automática; numa subscrição só
// funciona com faturas pagas pelo cliente em cada período (send_invoice). O mês
// grátis aplica-se da mesma forma: a fatura seguinte só é emitida um mês depois.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** O que cada prestador de pagamentos tem de saber fazer. */
export interface BillingProvider {
  readonly name: string;
  /**
   * Adia a próxima cobrança da subscrição do utilizador um mês (mensal) ou
   * prolonga o fim do período um mês (anual). Devolve a referência da operação
   * no prestador. Tem de ser idempotente para a mesma `idempotencyKey`.
   */
  deferOneMonth(userId: string, idempotencyKey: string): Promise<string>;
}

export async function onFirstSuccessfulPayment(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("registar_primeiro_pagamento", { p_user: userId });
  if (error) throw new Error(`registar_primeiro_pagamento: ${error.message}`);
}

/** Aplica no prestador os meses 'por_aplicar' do utilizador. Devolve quantos aplicou. */
export async function applyPendingFreeMonths(userId: string, provider: BillingProvider): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("meses_gratis")
    .select("id")
    .eq("beneficiario_id", userId)
    .eq("estado", "por_aplicar")
    .order("criado_em", { ascending: true });
  if (error) throw new Error(`meses_gratis: ${error.message}`);
  let applied = 0;
  for (const { id } of data ?? []) {
    // A chave de idempotência é o id da linha: repetir não adia duas vezes.
    const ref = await provider.deferOneMonth(userId, `mes-gratis:${id}`);
    const { error: e2 } = await supabaseAdmin.rpc("marcar_mes_aplicado", { p_mes: id, p_referencia: `${provider.name}:${ref}` });
    if (e2) throw new Error(`marcar_mes_aplicado: ${e2.message}`);
    applied++;
  }
  return applied;
}
