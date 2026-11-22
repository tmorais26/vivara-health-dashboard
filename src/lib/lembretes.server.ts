import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ZONA = "Europe/Lisbon";

// Diferença (em minutos) entre a hora de Lisboa e UTC num dado instante (0 no inverno, 60 no verão).
function desvioLisboa(d: Date) {
  const nome =
    new Intl.DateTimeFormat("en-US", { timeZone: ZONA, timeZoneName: "shortOffset" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-]\d+)?(?::(\d+))?/.exec(nome);
  const horas = m?.[1] ? Number(m[1]) : 0;
  const minutos = m?.[2] ? Number(m[2]) * Math.sign(horas || 1) : 0;
  return horas * 60 + minutos;
}

// Início (em UTC) de um dia de calendário em Lisboa.
function inicioDoDia(ano: number, mes: number, dia: number) {
  const aproximado = new Date(Date.UTC(ano, mes - 1, dia));
  return new Date(aproximado.getTime() - desvioLisboa(aproximado) * 60000);
}

// Intervalo [início, fim) do dia de amanhã em Lisboa.
export function amanhaEmLisboa(agora = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  );
  const hoje = new Date(
    Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day)),
  );
  const amanha = new Date(hoje.getTime() + 86400000);
  const depois = new Date(hoje.getTime() + 2 * 86400000);
  return {
    de: inicioDoDia(amanha.getUTCFullYear(), amanha.getUTCMonth() + 1, amanha.getUTCDate()),
    ate: inicioDoDia(depois.getUTCFullYear(), depois.getUTCMonth() + 1, depois.getUTCDate()),
  };
}

const escapar = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

// Sem dados de saúde: só a data, a hora, o local e o nome do profissional (sem especialidade).
export function emailLembrete(c: {
  inicio: string;
  tipo: string;
  utente_nome: string;
  espaco_nome: string;
  profissional_nome: string;
}) {
  const quando = new Date(c.inicio);
  const dia = quando.toLocaleDateString("pt-PT", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hora = quando.toLocaleTimeString("pt-PT", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
  });
  const primeiro = c.utente_nome.trim().split(/\s+/)[0] ?? "";
  const onde = c.tipo === "video" ? "por videoconsulta" : `em ${c.espaco_nome}`;
  const assunto = `Lembrete: consulta amanhã às ${hora}`;
  const linhas = [
    `Olá ${primeiro},`,
    "",
    `Lembramos que tem uma consulta amanhã, ${dia}, às ${hora}, ${onde}, com ${c.profissional_nome}.`,
    "",
    `Se não puder comparecer, avise ${c.espaco_nome} com antecedência.`,
    "",
    "Este é um email automático; não responda a esta mensagem.",
  ];
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:520px">
<p>Olá ${escapar(primeiro)},</p>
<p>Lembramos que tem uma consulta <strong>amanhã, ${escapar(dia)}, às ${escapar(hora)}</strong>, ${escapar(onde)}, com ${escapar(c.profissional_nome)}.</p>
<p>Se não puder comparecer, avise ${escapar(c.espaco_nome)} com antecedência.</p>
<p style="font-size:12px;color:#666">Este é um email automático; não responda a esta mensagem.</p>
</div>`;
  return { assunto, texto: linhas.join("\n"), html };
}

export async function enviarLembretesDeAmanha() {
  const chave = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_REMETENTE;
  if (!chave || !remetente) return { estado: "nao_configurado" as const, enviados: 0, falhados: 0 };

  const { de, ate } = amanhaEmLisboa();
  const { data, error } = await supabaseAdmin.rpc("consultas_para_lembrete", {
    p_de: de.toISOString(),
    p_ate: ate.toISOString(),
  });
  if (error) throw new Error("Não foi possível obter as consultas.");

  let enviados = 0;
  let falhados = 0;
  for (const c of data ?? []) {
    const { assunto, texto, html } = emailLembrete(c);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remetente, to: [c.email], subject: assunto, text: texto, html }),
    }).catch(() => null);
    if (r?.ok) {
      await supabaseAdmin.rpc("marcar_lembrete_enviado", { p_consulta: c.consulta_id });
      enviados++;
    } else {
      falhados++;
    }
  }
  return { estado: "ok" as const, enviados, falhados };
}
