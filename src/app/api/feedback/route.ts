import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM = `You are SameAsk's in-product guide and feedback companion.
SameAsk helps people: (1) Find AI tools by need, (2) browse a Market map, (3) Live-test chat models for answer similarity (not quality).
Be concise (2–5 short sentences). Help with OpenRouter setup, keys, Live test tips, and methodology.
When users share feedback, acknowledge it clearly and ask one follow-up if useful.
You may reply in English or Hindi if the user writes in Hindi.
Never ask for API keys. Never invent features that don't exist.
If unsure, point to Methodology (/methodology) or Privacy (/privacy).`;

const MAX_MESSAGES = 16;
const MAX_CHARS = 1200;

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

async function callOpenRouterFallback(
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
  const sarvam = process.env.SARVAM_API_KEY?.trim();
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();

  if (!sarvam && !openrouter) {
    return NextResponse.json(
      {
        error:
          "Feedback chat is not configured yet. Add SARVAM_API_KEY (preferred) or OPENROUTER_API_KEY on the server.",
      },
      { status: 503 },
    );
  }

  let upstream: Response;
  try {
    upstream = sarvam
      ? await callSarvam(sarvam, messages, wantStream)
      : await callOpenRouterFallback(openrouter!, messages, wantStream);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Feedback provider unreachable",
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      {
        error: `Feedback model error (${upstream.status}): ${text.slice(0, 180)}`,
      },
      { status: 502 },
    );
  }

  if (wantStream && upstream.body) {
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const data = (await upstream.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim() || "";
  if (!reply) {
    return NextResponse.json({ error: "Empty reply" }, { status: 502 });
  }
  return NextResponse.json({ reply, provider: sarvam ? "sarvam" : "openrouter" });
}
