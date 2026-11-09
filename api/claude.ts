// Server-side proxy for Anthropic calls so the API key never ships to the browser.
// Requires the ANTHROPIC_API_KEY environment variable (no VITE_ prefix) in Vercel.

const ALLOWED_MODELS = new Set(["claude-haiku-5-5", "claude-sonnet-5-5"]);
const MAX_TOKENS_CAP = 6000;
const MAX_INPUT_CHARS = 60000;

function originAllowed(request: Request): boolean {
  const source = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  try {
    const host = new URL(source).hostname;
    return (
      host === "forgessb.com" ||
      host === "www.forgessb.com" ||
      host === "localhost" ||
      host.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: { message: "Server is missing ANTHROPIC_API_KEY" } }, 500);
  if (!originAllowed(request)) return json({ error: { message: "Forbidden" } }, 403);

  let body: { model?: string; system?: string; messages?: { role: string; content: string }[]; max_tokens?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: "Invalid JSON" } }, 400);
  }

  const { model, system, messages, max_tokens } = body;
  if (!model || !ALLOWED_MODELS.has(model)) return json({ error: { message: "Model not allowed" } }, 400);
  if (typeof system !== "string" || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: { message: "Invalid request" } }, 400);
  }
  const size = system.length + messages.reduce((n, m) => n + String(m.content ?? "").length, 0);
  if (size > MAX_INPUT_CHARS) return json({ error: { message: "Input too large" } }, 413);

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      system,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "") })),
      max_tokens: Math.min(Number(max_tokens) || 1000, MAX_TOKENS_CAP),
    }),
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
