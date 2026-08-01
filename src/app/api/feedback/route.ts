import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant" | "system"; content: string };
type ProviderId = "groq" | "sarvam" | "openrouter";

const SYSTEM = `You are SameAsk's in-product guide and feedback companion.
SameAsk helps people: (1) Find AI tools by need, (2) browse a Market map, (3) Live-test chat models for answer similarity (not quality).
Be concise (2–5 short sentences). Help with OpenRouter setup, keys, Live test tips, and methodology.
When users share feedback, acknowledge it clearly and ask one follow-up if useful.
You may reply in English or Hindi if the user writes in Hindi.
Never ask for API keys. Never invent features that don't exist.
If unsure, point to Methodology (/methodology) or Privacy (/privacy).`;

const MAX_MESSAGES = 16;
const MAX_CHARS = 1200;

/** Devanagari / common Indic scripts → prefer Sarvam. */
function looksIndic(text: string): boolean {
  return /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F]/.test(
    text,
  );
}

function lastUserText(messages: Msg[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

/**
 * Industry mix:
 * - Groq = default for English help (fast free streaming)
 * - Sarvam = Indic / Hindi / India-context feedback
 * - Failover order flips so the other provider covers outages
 */
function providerOrder(messages: Msg[]): ProviderId[] {
  const indic = looksIndic(lastUserText(messages));
  const groq = process.env.GROQ_API_KEY?.trim();
  const sarvam = process.env.SARVAM_API_KEY?.trim();
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();

  const preferred: ProviderId[] = indic
    ? ["sarvam", "groq", "openrouter"]
    : ["groq", "sarvam", "openrouter"];

  return preferred.filter((id) => {
    if (id === "groq") return Boolean(groq);
    if (id === "sarvam") return Boolean(sarvam);
    return Boolean(openrouter);
  });
}

async function callGroq(
  key: string,
  messages: Msg[],
  stream: boolean,
): Promise<Response> {
  const model =
    process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      stream,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
  });
}

async function callSarvam(
  key: string,
  messages: Msg[],
  stream: boolean,
): Promise<Response> {
  return fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": key,
    },
    body: JSON.stringify({
      model: process.env.SARVAM_MODEL?.trim() || "sarvam-30b",
      temperature: 0.4,
      max_tokens: 500,
      stream,
      reasoning_effort: null,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
  });
}

async function callOpenRouter(
  key: string,
  messages: Msg[],
  stream: boolean,
): Promise<Response> {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://sameask.vercel.app",
      "X-Title": "SameAsk Feedback",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      temperature: 0.4,
      max_tokens: 500,
      stream,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
  });
}

async function callProvider(
  id: ProviderId,
  messages: Msg[],
  stream: boolean,
): Promise<Response> {
  if (id === "groq") {
    return callGroq(process.env.GROQ_API_KEY!.trim(), messages, stream);
  }
  if (id === "sarvam") {
    return callSarvam(process.env.SARVAM_API_KEY!.trim(), messages, stream);
  }
  return callOpenRouter(
    process.env.OPENROUTER_API_KEY!.trim(),
    messages,
    stream,
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages?: Msg[];
    stream?: boolean;
  };

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: String(m.content ?? "").slice(0, MAX_CHARS),
    }))
    .filter((m) => m.content.trim());

  if (messages.length === 0) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const wantStream = body.stream !== false;
  const order = providerOrder(messages);

  if (order.length === 0) {
    return NextResponse.json(
      {
        error:
          "Feedback chat needs GROQ_API_KEY and/or SARVAM_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const errors: string[] = [];

  for (const id of order) {
    try {
      const upstream = await callProvider(id, messages, wantStream);
      if (!upstream.ok) {
        const text = await upstream.text();
        errors.push(`${id}:${upstream.status} ${text.slice(0, 100)}`);
        continue;
      }

      if (wantStream && upstream.body) {
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-SameAsk-Provider": id,
          },
        });
      }

      const data = (await upstream.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = data.choices?.[0]?.message?.content?.trim() || "";
      if (!reply) {
        errors.push(`${id}:empty`);
        continue;
      }
      return NextResponse.json({ reply, provider: id });
    } catch (err) {
      errors.push(
        `${id}:${err instanceof Error ? err.message : "unreachable"}`,
      );
    }
  }

  return NextResponse.json(
    {
      error: `All feedback providers failed. ${errors.join(" · ")}`.slice(
        0,
        280,
      ),
    },
    { status: 502 },
  );
}
