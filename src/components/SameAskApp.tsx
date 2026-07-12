"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAT_MODELS, type ModelId } from "@/lib/models";
import { HOW_IT_WORKS, LIVE_PROMPTS, PRODUCT } from "@/lib/copy";
import { MarketBrowser, NeedFinder } from "@/components/NeedFinder";

type Tab = "find" | "market" | "live";

type ApiModel = {
  id: ModelId;
  name: string;
  vendor: string;
  ui: string;
  color: string;
  live: boolean;
};

type Ranking = {
  modelId: string;
  consistency: number;
  representative: string;
  avgLatencyMs: number;
  completedRuns: number;
  failedRuns: number;
};

type CompareResponse = {
  prompt: string;
  runs: number;
  mode: "demo" | "live";
  models: ApiModel[];
  ranking: Ranking[];
  winner: Ranking | null;
  insight: string;
  results: {
    modelId: string;
    answers: string[];
    errors: string[];
    consistency: number;
  }[];
  error?: string;
};

type StoredKeys = {
  openrouter: string;
  openai: string;
  anthropic: string;
  google: string;
  xai: string;
  deepseek: string;
};

const KEY_STORAGE = "sameask.keys.v1";

const emptyKeys = (): StoredKeys => ({
  openrouter: "",
  openai: "",
  anthropic: "",
  google: "",
  xai: "",
  deepseek: "",
});

function consistencyLabel(score: number): string {
  if (score >= 0.85) return "Very steady";
  if (score >= 0.65) return "Mostly steady";
  if (score >= 0.4) return "Drifts";
  return "Unstable";
}

export function SameAskApp() {
  const [tab, setTab] = useState<Tab>("find");
  const [prompt, setPrompt] = useState(LIVE_PROMPTS[0].text);
  const [runs, setRuns] = useState(3);
  const [selected, setSelected] = useState<ModelId[]>(
    CHAT_MODELS.slice(0, 5).map((m) => m.id),
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<StoredKeys>(emptyKeys);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_STORAGE);
      if (raw) setKeys({ ...emptyKeys(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  function saveKeys(next: StoredKeys) {
    setKeys(next);
    localStorage.setItem(KEY_STORAGE, JSON.stringify(next));
  }

  const modelMeta = useMemo(() => {
    return new Map(CHAT_MODELS.map((m) => [m.id, m]));
  }, []);

  const hasAnyKey = Object.values(keys).some((v) => v.trim());

  function toggle(id: ModelId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const payloadKeys = {
        openrouter: keys.openrouter.trim() || undefined,
        openai: keys.openai.trim() || undefined,
        anthropic: keys.anthropic.trim() || undefined,
        google: keys.google.trim() || undefined,
        xai: keys.xai.trim() || undefined,
        deepseek: keys.deepseek.trim() || undefined,
      };
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          runs,
          modelIds: selected,
          mode: "auto",
          keys: payloadKeys,
        }),
      });
      const json = (await res.json()) as CompareResponse;
      if (!res.ok) throw new Error(json.error || "Compare failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(61,255,200,0.16),transparent_65%)] blur-2xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-6 sm:px-8">
        <div>
          <div className="font-display text-2xl tracking-tight text-[var(--ink)]">
            {PRODUCT.name}
          </div>
          <p className="font-mono text-[11px] text-[var(--muted)]">
            {PRODUCT.tagline}
          </p>
        </div>
        <nav className="flex flex-wrap gap-1 border border-[var(--line)] p-1">
          {(
            [
              ["find", "Find"],
              ["market", "Market"],
              ["live", "Live test"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-sm transition ${
                tab === id
                  ? "bg-[var(--signal)] text-[var(--bg)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8">
        {tab === "find" && (
          <>
            <section className="hero-enter mb-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-[var(--signal)]">
                  For everyone choosing AI in public
                </p>
                <h1 className="font-display text-[clamp(2.6rem,6.5vw,5rem)] leading-[0.94] tracking-[-0.03em] text-[var(--ink)]">
                  SameAsk
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
                  {PRODUCT.oneLiner}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                  {PRODUCT.problem}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("need-finder")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-[var(--signal)] px-5 py-3 font-medium text-[var(--bg)] transition hover:brightness-110"
                  >
                    Find my AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("live")}
                    className="border border-[var(--line)] px-5 py-3 text-[var(--ink)] transition hover:border-[var(--signal)]"
                  >
                    Live-test models
                  </button>
                </div>
              </div>

              <div className="border border-[var(--line)] bg-[linear-gradient(160deg,#15201c_0%,#0b1210_55%,#101820_100%)] p-5 sm:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--signal)]">
                  How it works
                </p>
                <ol className="mt-5 space-y-5">
                  {HOW_IT_WORKS.map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="font-mono text-xs text-[var(--signal)]">
                        {item.step}
                      </span>
                      <div>
                        <div className="text-sm text-[var(--ink)]">
                          {item.title}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <div id="need-finder">
              <NeedFinder onLiveTest={() => setTab("live")} />
            </div>
          </>
        )}

        {tab === "market" && <MarketBrowser />}

        {tab === "live" && (
          <section className="space-y-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
                Live reliability test
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)]">
                Same prompt. Multiple runs. Who holds still?
              </h2>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">
                Paste an{" "}
                <a
                  className="text-[var(--signal)] hover:underline"
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenRouter
                </a>{" "}
                key to hit many models with one key. Keys stay in your browser
                only. No key → demo mode still teaches the idea.
              </p>
            </div>

            <div className="border border-[var(--line)] bg-[var(--panel)] p-4">
              <button
                type="button"
                onClick={() => setShowKeys((s) => !s)}
                className="font-mono text-xs text-[var(--signal)]"
              >
                {showKeys ? "Hide" : "Show"} API keys (BYOK) ·{" "}
                {hasAnyKey ? "saved locally" : "empty → demo"}
              </button>
              {showKeys && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["openrouter", "OpenRouter (recommended)"],
                      ["openai", "OpenAI"],
                      ["anthropic", "Anthropic"],
                      ["google", "Google"],
                      ["xai", "xAI"],
                      ["deepseek", "DeepSeek"],
                    ] as const
                  ).map(([id, label]) => (
                    <label key={id} className="block">
                      <span className="mb-1 block font-mono text-[11px] text-[var(--muted)]">
                        {label}
                      </span>
                      <input
                        type="password"
                        value={keys[id]}
                        onChange={(e) =>
                          saveKeys({ ...keys, [id]: e.target.value })
                        }
                        className="w-full border border-[var(--line)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--signal)]"
                        placeholder="sk-…"
                        autoComplete="off"
                      />
                    </label>
                  ))}
                  <p className="sm:col-span-2 font-mono text-[11px] text-[var(--muted)]">
                    Keys never leave your device except to call the provider you
                    chose. We don&apos;t store them on a server.
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Starter prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {LIVE_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPrompt(p.text)}
                    className="border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--signal)] hover:text-[var(--ink)]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={onAsk} className="space-y-6">
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Your real prompt
                </span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full resize-y border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--signal)]"
                />
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Models
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CHAT_MODELS.map((m) => {
                      const on = selected.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggle(m.id)}
                          className={`border px-3 py-1.5 text-sm transition ${
                            on
                              ? "border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--ink)]"
                              : "border-[var(--line)] text-[var(--muted)]"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center gap-3 font-mono text-sm text-[var(--muted)]">
                  Runs
                  <input
                    type="range"
                    min={2}
                    max={5}
                    value={runs}
                    onChange={(e) => setRuns(Number(e.target.value))}
                    className="accent-[var(--signal)]"
                  />
                  <span className="text-[var(--ink)]">{runs}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || selected.length === 0}
                className="bg-[var(--ink)] px-6 py-3 font-medium text-[var(--bg)] transition hover:bg-white disabled:opacity-50"
              >
                {loading ? "Running same ask…" : "Compare reliability"}
              </button>
            </form>

            {error && (
              <p className="border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {data && (
              <div className="results-enter space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
                      {data.mode === "demo" ? "Demo" : "Live"} · {data.runs} runs
                      each
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-[var(--ink)]">
                      {data.winner
                        ? `${modelMeta.get(data.winner.modelId as ModelId)?.name ?? data.winner.modelId} held steadiest`
                        : "No complete runs"}
                    </h3>
                    {data.winner && (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {consistencyLabel(data.winner.consistency)} on this
                        prompt — use that signal for your real workflow.
                      </p>
                    )}
                  </div>
                  {data.winner && (
                    <p className="font-mono text-sm text-[var(--muted)]">
                      Consistency{" "}
                      <span className="text-[var(--signal)]">
                        {(data.winner.consistency * 100).toFixed(0)}%
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-[var(--muted)]">{data.insight}</p>
                <div className="grid gap-4">
                  {data.ranking.map((row, index) => {
                    const meta = modelMeta.get(row.modelId as ModelId);
                    const detail = data.results.find(
                      (r) => r.modelId === row.modelId,
                    );
                    return (
                      <article
                        key={row.modelId}
                        className={`border bg-[var(--panel)] p-5 ${
                          index === 0
                            ? "border-[var(--signal)]/45"
                            : "border-[var(--line)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-[var(--muted)]">
                              #{index + 1}
                            </span>
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: meta?.color }}
                            />
                            <div>
                              <h4 className="text-lg text-[var(--ink)]">
                                {meta?.name ?? row.modelId}
                              </h4>
                              <p className="font-mono text-xs text-[var(--muted)]">
                                {consistencyLabel(row.consistency)} ·{" "}
                                {row.completedRuns} ok / {row.failedRuns} fail ·{" "}
                                {Math.round(row.avgLatencyMs)}ms
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-2xl text-[var(--signal)]">
                              {(row.consistency * 100).toFixed(0)}%
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                              consistency
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-black/40">
                          <div
                            className="h-full bg-[var(--signal)]"
                            style={{
                              width: `${Math.max(4, row.consistency * 100)}%`,
                            }}
                          />
                        </div>
                        {row.representative && (
                          <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/90">
                            {row.representative}
                          </p>
                        )}
                        {detail && detail.answers.length > 1 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer font-mono text-xs text-[var(--muted)]">
                              All runs
                            </summary>
                            <ol className="mt-2 space-y-2">
                              {detail.answers.map((a, i) => (
                                <li
                                  key={i}
                                  className="border-l-2 border-[var(--line)] pl-3 text-sm text-[var(--muted)]"
                                >
                                  <span className="font-mono text-[10px] text-[var(--signal)]">
                                    run {i + 1}
                                  </span>
                                  <div>{a}</div>
                                </li>
                              ))}
                            </ol>
                          </details>
                        )}
                        {detail && detail.errors.length > 0 && (
                          <p className="mt-2 font-mono text-xs text-red-300">
                            Errors: {detail.errors.join(" · ")}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-[var(--line)] px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-[var(--muted)]">
            SameAsk helps people pick the right AI for the job — then prove chat
            models stay consistent. Curated market data; live scores from your
            keys.
          </p>
          <p className="font-mono text-[11px] text-[var(--muted)]">
            Free · BYOK · no account required
          </p>
        </div>
      </footer>
    </div>
  );
}
