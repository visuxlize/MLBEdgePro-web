const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_CLAUDE_MODEL = "claude-3-5-sonnet-20241022";

function anthropicApiKey(): string | null {
  return (
    process.env.ANTHROPIC_API_KEY ??
    process.env.CLAUDE_API_KEY ??
    process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ??
    null
  );
}

export function hasAnthropicKey(): boolean {
  return anthropicApiKey() !== null;
}

function stripJsonFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const key = anthropicApiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_CLAUDE_MODEL,
      max_tokens: 1400,
      temperature: 0.2,
      system: "You are an elite MLB betting analyst. Return valid JSON only, with no markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude analysis failed (${res.status}): ${detail.slice(0, 220)}`);
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .filter((part: { type?: string; text?: string }) => part.type === "text" && part.text)
    .map((part: { text: string }) => part.text)
    .join("\n");

  return JSON.parse(stripJsonFence(text)) as T;
}
