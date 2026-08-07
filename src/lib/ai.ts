/**
 * Aria AI client — OpenAI-compatible API via env vars only.
 * Set OPENAI_API_KEY or ZAI_API_KEY (and optional OPENAI_BASE_URL / ZAI_BASE_URL / AI_MODEL).
 * No private SDK required — works on Vercel.
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatCompletionResult = {
  choices: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
};

function getConfig() {
  const apiKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (
    process.env.ZAI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

async function chatCompletions(messages: ChatMessage[], stream: boolean) {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) {
    throw new Error(
      "AI is not configured. Set OPENAI_API_KEY or ZAI_API_KEY in environment variables."
    );
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API ${res.status}: ${errText}`);
  }
  if (stream) return res;
  return res.json() as Promise<ChatCompletionResult>;
}

export async function completeAria(messages: ChatMessage[]): Promise<string> {
  const completion = (await chatCompletions(messages, false)) as ChatCompletionResult;
  const reply = completion?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty AI response");
  return reply;
}

export async function streamAria(
  messages: ChatMessage[],
  onDelta: (delta: string) => void
): Promise<string> {
  const res = (await chatCompletions(messages, true)) as Response;
  const reader = res.body?.getReader();
  if (!reader) {
    const fallback = "I'm here, and I heard you. Tell me a bit more?";
    onDelta(fallback);
    return fallback;
  }

  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  if (!full.trim()) {
    full = "I'm here, and I heard you. Tell me a bit more?";
    onDelta(full);
  }
  return full;
}
