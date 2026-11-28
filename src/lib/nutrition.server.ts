// Chamada à Claude API para a orientação nutricional. Só corre no servidor.
//
// A IA recebe apenas o que selectAiInput deixou passar e responde num formato
// JSON fixo (structured outputs). A resposta é depois verificada em código
// (checkOutput); se não passar, não é mostrada.
import Anthropic from "@anthropic-ai/sdk";
import {
  GUIDANCE_SCHEMA, checkOutput, systemPrompt, userPrompt,
  type AiInput, type GuidanceContent, type OutputProblem,
} from "./nutrition.rules";

export const NUTRITION_MODEL = "claude-opus-5-5";

export type GenerationResult =
  | { kind: "ok"; content: GuidanceContent; model: string }
  | { kind: "refused" }
  | { kind: "invalid"; problems: OutputProblem[] };

export const isAnthropicConfigured = () => !!process.env.ANTHROPIC_API_KEY;

async function once(client: Anthropic, input: AiInput): Promise<GenerationResult> {
  const response = await client.beta.messages.create({
    model: NUTRITION_MODEL,
    max_tokens: 16000,
    // Se o modelo recusar o pedido, a Anthropic repete-o noutro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: GUIDANCE_SCHEMA as unknown as Record<string, unknown> },
    },
    system: systemPrompt(input.lang),
    messages: [{ role: "user", content: userPrompt(input) }],
  });
  if (response.stop_reason === "refusal") return { kind: "refused" };
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? "";
  let parsed: GuidanceContent;
  try {
    parsed = JSON.parse(text) as GuidanceContent;
  } catch {
    return { kind: "invalid", problems: [{ kind: "empty" }] };
  }
  const problems = checkOutput(parsed, input.markers.map((m) => m.name));
  if (problems.length) return { kind: "invalid", problems };
  return { kind: "ok", content: { itens: parsed.itens, nota: parsed.nota }, model: response.model };
}

/** Gera a orientação; uma segunda tentativa se a primeira não passar nas verificações. */
export async function generateGuidance(input: AiInput): Promise<GenerationResult> {
  const client = new Anthropic();
  const first = await once(client, input);
  if (first.kind !== "invalid") return first;
  const second = await once(client, input);
  return second.kind === "invalid" ? { kind: "invalid", problems: [...first.problems, ...second.problems] } : second;
}
