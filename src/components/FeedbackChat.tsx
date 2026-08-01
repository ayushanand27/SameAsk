"use client";

import { useEffect, useRef, useState } from "react";

type ChatMsg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "How do I get an OpenRouter key?",
  "What does Live test measure?",
  "Feedback: Find was confusing",
  "Feedback: Live results looked right",
];

function parseSseDelta(chunk: string): string {
  let out = "";
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: string }; message?: { content?: string } }[];
      };
      const delta =
        json.choices?.[0]?.delta?.content ??
        json.choices?.[0]?.message?.content ??
        "";
      out += delta;
    } catch {
      /* ignore partial JSON */
    }
  }
  return out;
}

export function FeedbackChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi — ask about SameAsk, OpenRouter setup, or leave product feedback. Powered by Groq + Sarvam with auto-failover.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const nextMessages: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error || `Feedback failed (${res.status})`);
      }

      const ctype = res.headers.get("content-type") || "";
      if (ctype.includes("application/json")) {
        const json = (await res.json()) as { reply?: string };
        setMessages([
          ...nextMessages,
          { role: "assistant", content: json.reply || "…" },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let assistant = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += parseSseDelta(decoder.decode(value, { stream: true }));
        setMessages([
          ...nextMessages,
          { role: "assistant", content: assistant || "…" },
        ]);
      }
      if (!assistant.trim()) {
        throw new Error("Empty stream — try again");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Chat failed";
      setError(msg);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Couldn't reach the feedback model right now. Try again in a moment, or email feedback via GitHub issues.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col border border-[var(--line)] bg-[var(--bg)] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--signal)]">
                Live feedback
              </p>
              <p className="text-sm text-[var(--ink)]">Ask · report · guide</p>
            </div>
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setOpen(false);
              }}
              className="font-mono text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`max-w-[92%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[var(--signal)]/15 px-3 py-2 text-[var(--ink)]"
                    : "mr-auto border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[var(--muted)]"
                }`}
              >
                {m.content || (loading ? "…" : "")}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[var(--line)] px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => void send(s)}
                  className="border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--muted)] hover:border-[var(--signal)] hover:text-[var(--ink)] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            {error && (
              <p className="mb-2 font-mono text-[10px] text-red-300">{error}</p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 1200))}
                placeholder="Type feedback or a question…"
                className="min-w-0 flex-1 border border-[var(--line)] bg-black/20 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--signal)]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[var(--signal)] px-3 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-[var(--signal)]/50 bg-[var(--panel)] px-4 py-2.5 font-mono text-xs text-[var(--signal)] shadow-lg transition hover:bg-[var(--signal)] hover:text-[var(--bg)]"
      >
        {open ? "Hide chat" : "Feedback chat"}
      </button>
    </div>
  );
}
