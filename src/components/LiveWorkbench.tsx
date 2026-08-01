"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CHAT_MODELS, type ModelId } from "@/lib/models";
import { LIVE, LIVE_PROMPTS, pick } from "@/lib/copy";
import { useViewMode } from "@/components/ViewModeContext";
import { OpenRouterOnboard } from "@/components/OpenRouterOnboard";
import {
  downloadText,
  toCsv,
  toJson,
  toMarkdown,
  type CompareSnapshot,
} from "@/lib/export";
import {
  clearHistory,
  loadHistory,
  saveHistoryItem,
  type HistoryItem,
} from "@/lib/history";

type Ranking = {
  modelId: string;
  consistency: number;
  representative: string;
  avgLatencyMs: number;
  completedRuns: number;
  failedRuns: number;
  pairMin?: number;
  pairMax?: number;
  pairStdev?: number;
};

type CompareResponse = {
  prompt: string;
  runs: number;
  temperature?: number;
  mode: "demo" | "live";
  scoring?: "semantic" | "lexical";
  confidence?: string;
  insight: string;
  ranking: Ranking[];
  winner: Ranking | null;
  models: { id: ModelId; name: string; color: string }[];
  results: {
    modelId: string;
    answers: string[];
    errors: string[];
    consistency: number;
    pairStats?: {
      mean: number;
      min: number;
      max: number;
      stdev: number;
      pairs: number;
    };
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

function similarityLabel(score: number, completedRuns = 1): string {
  if (completedRuns <= 0) return "Failed";
  if (score >= 0.85) return "Very similar";
  if (score >= 0.65) return "Mostly similar";
  if (score >= 0.4) return "Rephrases a lot";
  return "Diverges";
}

type SortKey = "similarity" | "latency" | "stability";

export function LiveWorkbench() {
  const { mode } = useViewMode();
  const [prompt, setPrompt] = useState<string>(LIVE_PROMPTS[0].text);
  const [runs, setRuns] = useState(3);
  const [temperature, setTemperature] = useState(0.3);
  const [selected, setSelected] = useState<ModelId[]>(
    CHAT_MODELS.slice(0, 5).map((m) => m.id),
  );
  const [loading, setLoading] = useState(false);
  const [progressHint, setProgressHint] = useState("");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keys, setKeys] = useState<StoredKeys>(emptyKeys);
  const [showKeys, setShowKeys] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [forceDemo, setForceDemo] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("similarity");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissOnboard, setDismissOnboard] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_STORAGE);
      if (raw) setKeys({ ...emptyKeys(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHistory(loadHistory());
  }, []);

  const modelMeta = useMemo(
    () => new Map(CHAT_MODELS.map((m) => [m.id, m])),
    [],
  );
  const hasAnyKey = Object.values(keys).some((v) => v.trim());
  const showOnboard = !hasAnyKey && !dismissOnboard;

  function applyFreeFriendlyPreset() {
    setSelected(["gemini", "deepseek", "qwen", "llama"]);
    setRuns(3);
    setTemperature(0.3);
    setShowAdvanced(false);
  }

  const sortedRanking = useMemo(() => {
    if (!data) return [];
    const rows = [...data.ranking];
    if (sortKey === "latency") {
      rows.sort((a, b) => {
        if (a.completedRuns === 0) return 1;
        if (b.completedRuns === 0) return -1;
        return a.avgLatencyMs - b.avgLatencyMs;
      });
    } else if (sortKey === "stability") {
      rows.sort((a, b) => {
        if (a.completedRuns === 0) return 1;
        if (b.completedRuns === 0) return -1;
        return (a.pairStdev ?? 1) - (b.pairStdev ?? 1);
      });
    }
    return rows;
  }, [data, sortKey]);

  function saveKeys(next: StoredKeys) {
    setKeys(next);
    localStorage.setItem(KEY_STORAGE, JSON.stringify(next));
  }

  function toggle(id: ModelId) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
  }

  function toSnapshot(json: CompareResponse): CompareSnapshot {
    return {
      prompt: json.prompt,
      runs: json.runs,
      mode: json.mode,
      scoring: json.scoring ?? "lexical",
      temperature: json.temperature,
      generatedAt: new Date().toISOString(),
      insight: json.insight,
      ranking: json.ranking.map((r) => ({
        modelId: r.modelId,
        name: modelMeta.get(r.modelId as ModelId)?.name ?? r.modelId,
        consistency: r.consistency,
        avgLatencyMs: r.avgLatencyMs,
        completedRuns: r.completedRuns,
        failedRuns: r.failedRuns,
        pairMin: r.pairMin,
        pairMax: r.pairMax,
        pairStdev: r.pairStdev,
        representative: r.representative,
      })),
    };
  }

  function cancelRun() {
    abortRef.current?.abort();
    if (tickRef.current) clearInterval(tickRef.current);
    setLoading(false);
    setProgressHint("");
  }

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || selected.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setCompareIds(null);

    const total = selected.length * runs;
    let tick = 0;
    setProgressHint(`Starting ${selected.length} models × ${runs} runs…`);
    tickRef.current = setInterval(() => {
      tick += 1;
      const pct = Math.min(92, Math.round((tick / Math.max(8, total)) * 100));
      setProgressHint(
        `Running live compare… ~${pct}% (models in parallel; embeddings after)`,
      );
    }, 700);

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
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          runs,
          temperature,
          modelIds: selected,
          mode: forceDemo ? "demo" : "auto",
          keys: payloadKeys,
        }),
      });
      const json = (await res.json()) as CompareResponse;
      if (!res.ok) throw new Error(json.error || "Compare failed");
      setData(json);
      setProgressHint("Done");
      if (json.mode === "live") {
        setHistory(saveHistoryItem(toSnapshot(json)));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Run cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      if (tickRef.current) clearInterval(tickRef.current);
      setLoading(false);
      setTimeout(() => setProgressHint(""), 1200);
    }
  }

  function exportMd() {
    if (!data) return;
    downloadText(
      `sameask-${Date.now()}.md`,
      toMarkdown(toSnapshot(data)),
      "text/markdown",
    );
  }

  function exportCsv() {
    if (!data) return;
    downloadText(
      `sameask-${Date.now()}.csv`,
      toCsv(toSnapshot(data)),
      "text/csv",
    );
  }

  function exportJson() {
    if (!data) return;
    downloadText(
      `sameask-${Date.now()}.json`,
      toJson(toSnapshot(data)),
      "application/json",
    );
  }

  async function copySummary() {
    if (!data) return;
    await navigator.clipboard.writeText(toMarkdown(toSnapshot(data)));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function shareResult() {
    if (!data) return;
    const text = toMarkdown(toSnapshot(data));
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SameAsk result",
          text,
          url: "https://sameask.vercel.app",
        });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const sideA = compareIds
    ? data?.results.find((r) => r.modelId === compareIds[0])
    : null;
  const sideB = compareIds
    ? data?.results.find((r) => r.modelId === compareIds[1])
    : null;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
            {pick(mode, LIVE.eyebrow)}
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)]">
            {pick(mode, LIVE.title)}
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            {pick(mode, LIVE.blurbBeforeLink)}{" "}
            <a
              className="text-[var(--signal)] hover:underline"
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
            >
              OpenRouter
            </a>{" "}
            {pick(mode, LIVE.blurbAfterLink)}
          </p>
          <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
            <Link href="/methodology" className="text-[var(--signal)] hover:underline">
              Methodology
            </Link>
            {" · "}
            <Link href="/privacy" className="text-[var(--signal)] hover:underline">
              Privacy
            </Link>
            {" · "}
            Answer similarity ≠ quality
          </p>
        </div>
      </div>

      {showOnboard && (
        <OpenRouterOnboard
          openrouterKey={keys.openrouter}
          onOpenrouterChange={(value) => {
            saveKeys({ ...keys, openrouter: value });
            if (value.trim().length > 8) setShowKeys(false);
          }}
          onContinue={() => setDismissOnboard(true)}
          onFreeFriendlyPreset={applyFreeFriendlyPreset}
        />
      )}

      {!showOnboard && !hasAnyKey && (
        <button
          type="button"
          onClick={() => setDismissOnboard(false)}
          className="font-mono text-xs text-[var(--signal)]"
        >
          Show OpenRouter setup again
        </button>
      )}

      <div className="border border-[var(--line)] bg-[var(--panel)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowKeys((s) => !s)}
            className="font-mono text-xs text-[var(--signal)]"
          >
            {LIVE.keysToggle[mode](showKeys, hasAnyKey)}
          </button>
          {hasAnyKey && (
            <button
              type="button"
              onClick={applyFreeFriendlyPreset}
              className="font-mono text-[11px] text-[var(--muted)] hover:text-[var(--signal)]"
            >
              Free-friendly preset
            </button>
          )}
        </div>
        {(showKeys || (!hasAnyKey && !showOnboard)) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["openrouter", "OpenRouter (recommended · free models)"],
                ["openai", "OpenAI"],
                ["anthropic", "Anthropic"],
                ["google", "Google AI Studio (free tier)"],
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
                  onChange={(e) => saveKeys({ ...keys, [id]: e.target.value })}
                  className="w-full border border-[var(--line)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--signal)]"
                  placeholder={id === "openrouter" ? "sk-or-v1-…" : "sk-…"}
                  autoComplete="off"
                />
              </label>
            ))}
            <p className="sm:col-span-2 font-mono text-[11px] text-[var(--muted)]">
              {pick(mode, LIVE.keysHint)}{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--signal)] hover:underline"
              >
                Get OpenRouter key
              </a>
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {pick(mode, LIVE.starterPrompts)}
        </p>
        <div className="flex flex-wrap gap-2">
          {LIVE_PROMPTS.map((p) => (
            <button
              key={p.label.technical}
              type="button"
              onClick={() => setPrompt(p.text)}
              className="border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--signal)] hover:text-[var(--ink)]"
            >
              {pick(mode, p.label)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onAsk} className="space-y-6">
        <label className="block">
          <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {pick(mode, LIVE.promptLabel)}
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
            rows={4}
            maxLength={4000}
            className="w-full resize-y border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--signal)]"
          />
          <span className="mt-1 block text-right font-mono text-[10px] text-[var(--muted)]">
            {prompt.length}/4000
          </span>
        </label>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Models
            </span>
            <div className="flex gap-3 font-mono text-[11px]">
              <button
                type="button"
                className="text-[var(--signal)]"
                onClick={() =>
                  setSelected(CHAT_MODELS.slice(0, 8).map((m) => m.id))
                }
              >
                Select up to 8
              </button>
              <button
                type="button"
                className="text-[var(--muted)] hover:text-[var(--ink)]"
                onClick={() => setSelected([])}
              >
                Clear
              </button>
            </div>
          </div>
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

        <div className="flex flex-wrap items-center gap-6">
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
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="font-mono text-xs text-[var(--signal)]"
          >
            {showAdvanced ? "Hide" : "Show"} advanced
          </button>
        </div>

        {showAdvanced && (
          <div className="grid gap-4 border border-[var(--line)] bg-[var(--panel)] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 font-mono text-sm text-[var(--muted)]">
              Temperature ({temperature.toFixed(1)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="accent-[var(--signal)]"
              />
              <span className="text-[11px]">
                Lower = steadier wording. Default 0.3 for similarity tests.
              </span>
            </label>
            <div className="space-y-3 font-mono text-xs text-[var(--muted)]">
              <label className="flex items-center gap-2 text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={forceDemo}
                  onChange={(e) => setForceDemo(e.target.checked)}
                  className="accent-[var(--signal)]"
                />
                Force demo mode (no API spend)
              </label>
              <p>Production notes</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>3 runs = screen; 5 runs = stabler</li>
                <li>Similarity ≠ correctness</li>
                <li>Export MD / CSV / JSON for audits</li>
                <li>Max 8 models per run</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || selected.length === 0}
            className="bg-[var(--ink)] px-6 py-3 font-medium text-[var(--bg)] transition hover:bg-white disabled:opacity-50"
          >
            {loading ? pick(mode, LIVE.submitting) : pick(mode, LIVE.submit)}
          </button>
          {loading && (
            <button
              type="button"
              onClick={cancelRun}
              className="border border-[var(--line)] px-5 py-3 text-[var(--ink)]"
            >
              Cancel
            </button>
          )}
        </div>
        {progressHint && (
          <div className="space-y-2">
            <p className="font-mono text-xs text-[var(--signal)]">{progressHint}</p>
            <div className="h-1.5 w-full max-w-md bg-black/40">
              <div className="h-full w-2/3 animate-pulse bg-[var(--signal)]" />
            </div>
          </div>
        )}
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
                {data.mode === "demo" ? "Demo" : "Live"} · {data.runs} runs ·
                temp {data.temperature ?? temperature}
              </p>
              <h3 className="mt-2 font-display text-2xl text-[var(--ink)]">
                {data.winner
                  ? `${modelMeta.get(data.winner.modelId as ModelId)?.name ?? data.winner.modelId} stayed closest`
                  : "No complete runs"}
              </h3>
              {data.winner && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {similarityLabel(
                    data.winner.consistency,
                    data.winner.completedRuns,
                  )}{" "}
                  {pick(mode, LIVE.winnerHint)}
                </p>
              )}
              <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
                Scoring:{" "}
                {data.scoring === "semantic"
                  ? "semantic embeddings + lexical"
                  : "paraphrase-aware lexical"}{" "}
                · {data.confidence}
              </p>
            </div>
            {data.winner && (
              <p className="font-mono text-sm text-[var(--muted)]">
                {pick(mode, LIVE.consistencyMetric)}{" "}
                <span className="text-[var(--signal)]">
                  {(data.winner.consistency * 100).toFixed(0)}%
                </span>
              </p>
            )}
          </div>

          <p className="text-sm text-[var(--muted)]">{data.insight}</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportMd}
              className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--ink)] hover:border-[var(--signal)]"
            >
              Export Markdown
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--ink)] hover:border-[var(--signal)]"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--ink)] hover:border-[var(--signal)]"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => void copySummary()}
              className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--ink)] hover:border-[var(--signal)]"
            >
              {copied ? "Copied" : "Copy summary"}
            </button>
            <button
              type="button"
              onClick={() => void shareResult()}
              className="border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--ink)] hover:border-[var(--signal)]"
            >
              Share
            </button>
            <label className="flex items-center gap-2 border border-[var(--line)] px-3 py-1.5 font-mono text-xs text-[var(--muted)]">
              Sort
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-[var(--ink)] outline-none"
              >
                <option value="similarity">Similarity</option>
                <option value="stability">Lowest variance</option>
                <option value="latency">Fastest</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4">
            {sortedRanking.map((row, index) => {
              const meta = modelMeta.get(row.modelId as ModelId);
              const detail = data.results.find((r) => r.modelId === row.modelId);
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
                          {similarityLabel(row.consistency, row.completedRuns)} ·{" "}
                          {row.completedRuns} ok / {row.failedRuns} fail ·{" "}
                          {Math.round(row.avgLatencyMs)}ms
                          {row.pairStdev != null && row.completedRuns >= 2 && (
                            <>
                              {" "}
                              · σ {(row.pairStdev * 100).toFixed(0)}% · range{" "}
                              {((row.pairMin ?? 0) * 100).toFixed(0)}–
                              {((row.pairMax ?? 0) * 100).toFixed(0)}%
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-[var(--signal)]">
                        {(row.consistency * 100).toFixed(0)}%
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        {pick(mode, LIVE.consistencyMetric)}
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
                  <div className="mt-3 flex flex-wrap gap-3">
                    {detail && detail.answers.length > 1 && (
                      <details>
                        <summary className="cursor-pointer font-mono text-xs text-[var(--muted)]">
                          {pick(mode, LIVE.allRuns)}
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
                    {data.winner && row.modelId !== data.winner.modelId && (
                      <button
                        type="button"
                        className="font-mono text-xs text-[var(--signal)]"
                        onClick={() =>
                          setCompareIds([data.winner!.modelId, row.modelId])
                        }
                      >
                        Compare vs #{1}
                      </button>
                    )}
                  </div>
                  {detail && detail.errors.length > 0 && (
                    <p className="mt-2 font-mono text-xs text-red-300">
                      Errors: {detail.errors.join(" · ")}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {compareIds && sideA && sideB && (
            <div className="border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display text-xl text-[var(--ink)]">
                  Side-by-side
                </h4>
                <button
                  type="button"
                  onClick={() => setCompareIds(null)}
                  className="font-mono text-xs text-[var(--muted)]"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[sideA, sideB].map((side) => (
                  <div key={side.modelId}>
                    <p className="font-mono text-xs text-[var(--signal)]">
                      {modelMeta.get(side.modelId as ModelId)?.name ??
                        side.modelId}
                    </p>
                    <ol className="mt-2 space-y-2">
                      {side.answers.map((a, i) => (
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-[var(--line)] pt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Local history ({history.length})
            </p>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                setHistory([]);
              }}
              className="font-mono text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Clear
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {history.slice(0, 8).map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-[var(--line)] px-3 py-2"
              >
                <button
                  type="button"
                  className="text-left text-sm text-[var(--ink)] hover:underline"
                  onClick={() =>
                    setData({
                      prompt: h.snapshot.prompt,
                      runs: h.snapshot.runs,
                      temperature: h.snapshot.temperature,
                      mode: h.snapshot.mode,
                      scoring: h.snapshot.scoring,
                      insight: h.snapshot.insight,
                      confidence: undefined,
                      winner: h.snapshot.ranking[0]
                        ? {
                            modelId: h.snapshot.ranking[0].modelId,
                            consistency: h.snapshot.ranking[0].consistency,
                            representative:
                              h.snapshot.ranking[0].representative,
                            avgLatencyMs: h.snapshot.ranking[0].avgLatencyMs,
                            completedRuns: h.snapshot.ranking[0].completedRuns,
                            failedRuns: h.snapshot.ranking[0].failedRuns,
                            pairMin: h.snapshot.ranking[0].pairMin,
                            pairMax: h.snapshot.ranking[0].pairMax,
                            pairStdev: h.snapshot.ranking[0].pairStdev,
                          }
                        : null,
                      ranking: h.snapshot.ranking.map((r) => ({
                        modelId: r.modelId,
                        consistency: r.consistency,
                        representative: r.representative,
                        avgLatencyMs: r.avgLatencyMs,
                        completedRuns: r.completedRuns,
                        failedRuns: r.failedRuns,
                        pairMin: r.pairMin,
                        pairMax: r.pairMax,
                        pairStdev: r.pairStdev,
                      })),
                      models: [],
                      results: h.snapshot.ranking.map((r) => ({
                        modelId: r.modelId,
                        answers: r.representative ? [r.representative] : [],
                        errors: [],
                        consistency: r.consistency,
                      })),
                    })
                  }
                >
                  {h.snapshot.prompt.slice(0, 72)}
                  {h.snapshot.prompt.length > 72 ? "…" : ""}
                </button>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {new Date(h.savedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
