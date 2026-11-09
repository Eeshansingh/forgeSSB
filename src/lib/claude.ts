export const CLAUDE_MODELS = {
  fast: "claude-haiku-5-5",
  analysis: "claude-sonnet-5-5",
} as const;

export async function callClaudeJson<T = unknown>(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<T> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${data?.error?.message ?? "request failed"}`);
  }
  const raw: string = (data?.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Claude returned no JSON");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function callClaudeText(opts: {
  model: string;
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${data?.error?.message ?? "request failed"}`);
  }
  const text: string = (data?.content ?? [])
    .filter((b: { type?: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned an empty reply");
  return text;
}
