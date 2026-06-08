import Anthropic from "@anthropic-ai/sdk";

export const EDGE_AI_MODEL = "claude-sonnet-4-6";

function getClient(): Anthropic {
  const apiKey =
    process.env.ANTHROPIC_API_KEY ??
    process.env.CLAUDE_API_KEY ??
    null;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

export function hasAnthropicKey(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY);
}

// ── One-shot JSON generation (used by edge-score, hr-nuke, daily-picks) ───────

function stripJsonFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const client = getClient();
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
    max_tokens: 1400,
    temperature: 0.2,
    system: "You are an elite MLB betting analyst. Return valid JSON only, with no markdown.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return JSON.parse(stripJsonFence(text)) as T;
}

// ── Streaming chat (used by Edge AI) ─────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Returns a ReadableStream that emits text chunks as they arrive from Claude.
 * Designed for use in Next.js App Router streaming route handlers.
 */
export function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 1200,
): ReadableStream<Uint8Array> {
  const client = getClient();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: EDGE_AI_MODEL,
          max_tokens: maxTokens,
          temperature: 0.4,
          system: systemPrompt,
          messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI stream error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });
}
