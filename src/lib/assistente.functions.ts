import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

type ChatRole = "user" | "assistant";
interface ChatMessage {
  role: ChatRole;
  content: string;
}
interface AssistenteInput {
  messages: ChatMessage[];
  context: string;
}

const INSTRUCTIONS = `Respondes apenas com base nos dados fornecidos sobre o histórico, valores e plano do utente.
Nunca interpretes o que os valores significam clinicamente, nunca dês conselhos de saúde, nunca sugiras
ações (dieta, exercício, suplementos, dosagens), e nunca compares com outras pessoas.
Se a pergunta pedir interpretação clínica, opinião sobre gravidade, ou recomendação
(ex.: 'isto é grave?', 'devo parar X?', 'o que devo fazer?'), responde de forma breve e empática
que essa pergunta é para a médica responsável, e sugere enviar mensagem à Dra. Sofia Cardoso.
Para perguntas factuais sobre os dados (valores, datas, alvos definidos, plano), responde
diretamente e com precisão. Responde sempre em português europeu, de forma curta e clara.`;

function validate(input: unknown): AssistenteInput {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const i = input as Record<string, unknown>;
  if (!Array.isArray(i.messages)) throw new Error("messages required");
  if (typeof i.context !== "string") throw new Error("context required");
  for (const m of i.messages) {
    if (!m || typeof m !== "object") throw new Error("bad message");
    const mm = m as Record<string, unknown>;
    if (mm.role !== "user" && mm.role !== "assistant") throw new Error("bad role");
    if (typeof mm.content !== "string" || mm.content.length === 0) throw new Error("bad content");
    if (mm.content.length > 4000) throw new Error("message too long");
  }
  if (i.messages.length === 0 || i.messages.length > 40) throw new Error("history bounds");
  return { messages: i.messages as ChatMessage[], context: i.context.slice(0, 8000) };
}

export const askAssistente = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway não configurado");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `${INSTRUCTIONS}\n\nDADOS DO UTENTE (Maria A.):\n${data.context}`;

    try {
      const result = await generateText({
        model,
        system,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      return { text: result.text };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Demasiados pedidos. Tenta novamente em instantes.");
      if (msg.includes("402")) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui responder agora.");
    }
  });
