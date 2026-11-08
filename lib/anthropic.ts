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

