import type { ChatModel } from "./models";

const SYSTEM =
  "Answer the user clearly and directly. Keep the answer concise (under 180 words) unless they ask for more. Do not mention that you are being evaluated.";

/** Keep output small so free OpenRouter credits can afford the reservation. */
const MAX_TOKENS = 600;

export type KeyBag = {
  openai?: string;
  anthropic?: string;
  google?: string;
  xai?: string;
  deepseek?: string;
  openrouter?: string;
};

function friendlyProviderError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 402 || lower.includes("more credits") || lower.includes("can only afford")) {
    return "OpenRouter credits too low for this model. Add credits, or pick cheaper models (Llama, DeepSeek, Qwen, Gemini Flash Lite).";
  }
  if (status === 404 && (lower.includes("deprecated") || lower.includes("no endpoints"))) {
    return "Model ID unavailable on OpenRouter right now. SameAsk model list may need a refresh.";
  }
  if (status === 401 || status === 403) {
    return "API key rejected. Check your OpenRouter / provider key.";
  }
  if (status === 429) {
    return "Rate limited. Wait a moment and try fewer models or fewer runs.";
  }
  // Keep a short snippet for debugging without dumping full JSON
  const snippet = body.replace(/\s+/g, " ").slice(0, 160);
  return `${status}: ${snippet}`;
}

async function openAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const isOpenRouter = baseUrl.includes("openrouter.ai");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(isOpenRouter
        ? {
            "HTTP-Referer": "https://sameask.vercel.app",
            "X-Title": "SameAsk",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(friendlyProviderError(res.status, body));
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

async function callAnthropic(apiKey: string, model: string, prompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(friendlyProviderError(res.status, body));
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

async function callGoogle(apiKey: string, model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: MAX_TOKENS },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(friendlyProviderError(res.status, body));
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Empty response");
  return text;
}

function envOr(bag: KeyBag, envName: string, bagKey: keyof KeyBag): string | undefined {
  return bag[bagKey]?.trim() || process.env[envName]?.trim() || undefined;
}

export function resolveKeys(bag: KeyBag = {}): Required<Record<keyof KeyBag, string | undefined>> {
  return {
    openai: envOr(bag, "OPENAI_API_KEY", "openai"),
    anthropic: envOr(bag, "ANTHROPIC_API_KEY", "anthropic"),
    google: envOr(bag, "GOOGLE_API_KEY", "google"),
    xai: envOr(bag, "XAI_API_KEY", "xai"),
    deepseek: envOr(bag, "DEEPSEEK_API_KEY", "deepseek"),
    openrouter: envOr(bag, "OPENROUTER_API_KEY", "openrouter"),
  };
}

export function canCallModel(model: ChatModel, keys: ReturnType<typeof resolveKeys>): boolean {
  if (keys.openrouter && model.openRouterId) return true;
  switch (model.provider) {
    case "openai":
      return Boolean(keys.openai);
    case "anthropic":
      return Boolean(keys.anthropic);
    case "google":
      return Boolean(keys.google);
    case "xai":
      return Boolean(keys.xai);
    case "deepseek":
      return Boolean(keys.deepseek);
    default:
      return false;
  }
}

export async function callChatModel(
  model: ChatModel,
  prompt: string,
  keyBag: KeyBag = {},
): Promise<string> {
  const keys = resolveKeys(keyBag);

  // Prefer native provider keys; fall back to OpenRouter for broad coverage.
  if (model.provider === "openai" && keys.openai) {
    return openAiCompatible("https://api.openai.com/v1", keys.openai, model.apiModel, prompt);
  }
  if (model.provider === "xai" && keys.xai) {
    return openAiCompatible("https://api.x.ai/v1", keys.xai, model.apiModel, prompt);
  }
  if (model.provider === "deepseek" && keys.deepseek) {
    return openAiCompatible("https://api.deepseek.com", keys.deepseek, model.apiModel, prompt);
  }
  if (model.provider === "anthropic" && keys.anthropic) {
    return callAnthropic(keys.anthropic, model.apiModel, prompt);
  }
  if (model.provider === "google" && keys.google) {
    return callGoogle(keys.google, model.apiModel, prompt);
  }
  if (keys.openrouter && model.openRouterId) {
    return openAiCompatible(
      "https://openrouter.ai/api/v1",
      keys.openrouter,
      model.openRouterId,
      prompt,
    );
  }

  throw new Error(`No key for ${model.name}. Add a provider key or OPENROUTER_API_KEY.`);
}
