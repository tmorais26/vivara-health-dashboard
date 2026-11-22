import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { URL_APP_UTENTE } from "@/lib/legal-docs";

export type EstadoConvite = "ok" | "sem_email" | "nao_configurado" | "ja_enviado" | "erro";

const escapar = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

// Email sem dados de saúde: só o nome do médico e a ligação. O convite associa o utente ao médico,
// mas só o utente beneficia (um mês grátis depois do primeiro pagamento).
function corpoEmail(medico: string, ligacao: string) {
  const m = escapar(medico);
  const assunto = "Convite para a app Vivara";
  const texto = [
    "Olá,",
    "",
    `O(a) Dr(a). ${medico} convidou-o(a) a usar a app Vivara, onde pode registar e acompanhar a sua saúde.`,
    "Ao criar conta por esta ligação, ganha um mês grátis depois do primeiro pagamento.",
    "",
    ligacao,
    "",
    `O(a) Dr(a). ${medico} não recebe nenhum benefício por este convite.`,
    "Se não estava à espera deste email, pode ignorá-lo.",
  ].join("\n");
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">
<p>Olá,</p>
<p>O(a) Dr(a). ${m} convidou-o(a) a usar a app Vivara, onde pode registar e acompanhar a sua saúde.</p>
<p>Ao criar conta por esta ligação, ganha um mês grátis depois do primeiro pagamento.</p>
<p><a href="${escapar(ligacao)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Criar conta na Vivara</a></p>
<p style="font-size:13px;color:#555">O(a) Dr(a). ${m} não recebe nenhum benefício por este convite.<br>Se não estava à espera deste email, pode ignorá-lo.</p>
</div>`;
  return { assunto, texto, html };
}

export const convidarUtenteApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { utenteId: string }) => {
    if (typeof d?.utenteId !== "string" || !/^[0-9a-f-]{36}$/i.test(d.utenteId))
      throw new Error("Dados inválidos");
    return { utenteId: d.utenteId };
  })
  .handler(async ({ data, context }): Promise<{ estado: EstadoConvite }> => {
    // A leitura com a sessão do médico aplica as regras de acesso: só convida quem vê o utente.
    const { data: utente } = await context.supabase
      .from("utentes")
      .select("id, email, espaco_id")
      .eq("id", data.utenteId)
      .maybeSingle();
    if (!utente) return { estado: "erro" };
    if (!utente.email) return { estado: "sem_email" };

    const chave = process.env.RESEND_API_KEY;
    const remetente = process.env.EMAIL_REMETENTE;
    if (!chave || !remetente) return { estado: "nao_configurado" };

    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("convites_app")
      .select("token", { count: "exact", head: true })
      .eq("utente_id", utente.id)
      .gte("criado_em", desde);
    if ((count ?? 0) > 0) return { estado: "ja_enviado" };

    const [{ data: perfil }, { data: membro }] = await Promise.all([
      supabaseAdmin
        .from("medico_perfis")
        .select("nome")
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabaseAdmin
        .from("membros")
        .select("nome_exibicao")
        .eq("user_id", context.userId)
        .eq("espaco_id", utente.espaco_id)
        .maybeSingle(),
    ]);
    const nome = (perfil?.nome || membro?.nome_exibicao || "")
      .replace(/^\s*(dr|dra)\.?\s+/i, "")
      .trim();
    if (!nome) return { estado: "erro" };

    const { data: convite, error } = await supabaseAdmin
      .from("convites_app")
      .insert({ convidante_id: context.userId, utente_id: utente.id })
      .select("token")
      .single();
    if (error || !convite) return { estado: "erro" };

    const ligacao = `${URL_APP_UTENTE}/registo?convite=${convite.token}`;
    const { assunto, texto, html } = corpoEmail(nome, ligacao);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: remetente,
        to: [utente.email],
        subject: assunto,
        text: texto,
        html,
      }),
    }).catch(() => null);
    if (!r || !r.ok) {
      await supabaseAdmin.from("convites_app").delete().eq("token", convite.token);
      return { estado: "erro" };
    }
    return { estado: "ok" };
  });
