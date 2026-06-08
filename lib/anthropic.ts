import Anthropic from "@anthropic-ai/sdk";

// ── Provider detection ────────────────────────────────────────────────────────

function groqApiKey(): string | null {
  return process.env.GROQ_API_KEY ?? null;
}

function anthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY ?? null;
}

export function hasAnthropicKey(): boolean {
  return !!(anthropicApiKey() ?? groqApiKey());
}

// ── One-shot JSON generation (edge-score, hr-nuke, daily-picks) ───────────────

function stripJsonFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const anthKey = anthropicApiKey();
  if (!anthKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({ apiKey: anthKey });
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

// ── Streaming chat (Edge AI) ──────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FRIENDLY_ERROR = "Still in development — check back later when it is ready!";

// ── Groq streaming (free tier, Llama 3.3 70B) ────────────────────────────────

function streamWithGroq(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens: number,
  apiKey: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: maxTokens,
            temperature: 0.4,
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
          }),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Groq ${res.status}: ${detail.slice(0, 120)}`);
        }

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const delta = JSON.parse(raw).choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // skip malformed SSE chunk
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode(FRIENDLY_ERROR));
      } finally {
        controller.close();
      }
    },
  });
}

// ── Anthropic (Claude) streaming ──────────────────────────────────────────────

function streamWithAnthropic(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens: number,
  apiKey: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const client  = new Anthropic({ apiKey });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
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
      } catch {
        controller.enqueue(encoder.encode(FRIENDLY_ERROR));
      } finally {
        controller.close();
      }
    },
  });
}

// ── Fallback stream (no keys configured) ─────────────────────────────────────

function streamFallback(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(FRIENDLY_ERROR));
      controller.close();
    },
  });
}

// ── Public entrypoint — tries Groq first (free), then Anthropic ──────────────

/**
 * Priority: Groq (free tier) → Anthropic (paid) → friendly fallback message.
 * Set GROQ_API_KEY in env to enable the free Groq path.
 * Get a free key at https://console.groq.com
 */
export function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 1200,
): ReadableStream<Uint8Array> {
  const groq      = groqApiKey();
  const anthropic = anthropicApiKey();

  if (groq)      return streamWithGroq(systemPrompt, messages, maxTokens, groq);
  if (anthropic) return streamWithAnthropic(systemPrompt, messages, maxTokens, anthropic);
  return streamFallback();
}
