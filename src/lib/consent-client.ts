import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { registarAceitacao } from "@/lib/consent.functions";

type Textos = { documentos: string; habilitacao: string; marketing: string };

// Grava a aceitação no servidor (que regista o IP). Os dados do perfil e a opção de
// marketing escolhidos no registo viajam em user_metadata até haver sessão.
export async function gravarAceitacao(user: User, textos: Textos, marketingAgora = false) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const codigoConvite = typeof meta.codigo_convite === "string" ? meta.codigo_convite : undefined;
  const pendente =
    typeof meta.especialidade === "string" || meta.marketing_opt_in === true || !!codigoConvite;
  await registarAceitacao({
    data: {
      textos,
      marketing: marketingAgora || meta.marketing_opt_in === true,
      codigoConvite,
      perfil: pendente
        ? {
            nome: meta.nome as string | undefined,
            especialidade: meta.especialidade as string | undefined,
            cedula: meta.cedula as string | undefined,
            clinica: meta.clinica as string | undefined,
          }
        : undefined,
    },
  });
  if (pendente) {
    await supabase.auth.updateUser({
      data: {
        nome: null,
        especialidade: null,
        cedula: null,
        clinica: null,
        marketing_opt_in: null,
        codigo_convite: null,
      },
    });
  }
}
