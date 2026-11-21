// Funções de servidor do programa de recomendação.
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clientIp } from "./request-info.server";
import { checkCode, myCode, mySummary } from "./referral.server";
import { referralLink, type CodeCheck, type ReferralSummary } from "./referral";

/** Validação em tempo real do código no registo (sem sessão; com limite de pedidos). */
export const checkReferralCode = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({ code: typeof (raw as { code?: unknown })?.code === "string" ? ((raw as { code: string }).code).slice(0, 40) : "" }))
  .handler(async ({ data }): Promise<CodeCheck> => {
    try {
      return await checkCode(data.code, clientIp());
    } catch (e) {
      console.error("[referral] check", e instanceof Error ? e.message : e);
      return { state: "unavailable" };
    }
  });

export interface MyReferral {
  code: string;
  link: string;
  summary: ReferralSummary;
}

/** O código da pessoa, a sua ligação e as contagens. */
export const getMyReferral = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyReferral> => {
    const [code, summary] = await Promise.all([myCode(context.userId), mySummary(context.userId)]);
    // Ligação com o domínio configurado (APP_PUBLIC_URL) ou, por omissão, o do pedido.
    const base = process.env.APP_PUBLIC_URL || `${new URL(getRequestUrl()).origin}/app-v2`;
    return { code, link: referralLink(base, code), summary };
  });
