/**
 * Aria AI client — works with z-ai-web-dev-sdk when available,
 * or with any OpenAI-compatible API via env vars (OPENAI_API_KEY / ZAI_API_KEY).
 * Structure of the app is unchanged; only the transport is more portable for Vercel.
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatCompletionResult = {
  choices: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
};

async function createViaSdk(messages: ChatMessage[], stream: boolean) {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  // Prefer env-based config so it works on Vercel without a .z-ai-config file
  const envKey = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY;
  const envBase =
    process.env.ZAI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";

  if (envKey) {
    // Construct a minimal client that mirrors the SDK shape without reading the filesystem
    const create = async (body: any) => {
      const url = `${envBase.replace(/\/$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${envKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: body.messages,
          stream: !!body.stream,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API ${res.status}: ${errText}`);
      }
      if (body.stream) return res.body;
      return res.json();
    };
    return {
      chat: {
        completions: {
          create: async (opts: any) => create({ ...opts, stream }),
        },
      },
    };
  }

  // Fall back to official SDK (reads .z-ai-config)
  return ZAI.create();
}

export async function createAriaClient() {
  return createViaSdk([], false);
}

export async function completeAria(
  messages: ChatMessage[]
): Promise<string> {
  const client = await createViaSdk(messages, false);
  const completion = (await client.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  })) as ChatCompletionResult;

  const reply = completion?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty AI response");
  return reply;
}

export async function streamAria(
  messages: ChatMessage[],
  onDelta: (delta: string) => void
): Promise<string> {
  const client = await createViaSdk(messages, true);
  const completion = await client.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
    stream: true,
  });

  let full = "";

  // SDK may return a ReadableStream (fetch body) or an async iterable
  if (completion && typeof (completion as any).getReader === "function") {
    const reader = (completion as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
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
  } else if (completion && Symbol.asyncIterator in Object(completion)) {
    for await (const chunk of completion as any) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) {
        full += delta;
        onDelta(delta);
      }
    }
  } else {
    // Non-stream fallback
    const reply =
      (completion as ChatCompletionResult)?.choices?.[0]?.message?.content?.trim() ||
      "";
    if (reply) {
      full = reply;
      onDelta(reply);
    }
  }

  if (!full.trim()) {
    full = "I'm here, and I heard you. Tell me a bit more?";
    onDelta(full);
  }
  return full;
}
