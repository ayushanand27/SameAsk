import { NextResponse } from "next/server";
import { CHAT_MODELS, type ModelId } from "@/lib/models";
import {
  callChatModel,
  canCallModel,
  embedTexts,
  resolveKeys,
  type KeyBag,
} from "@/lib/providers";
import { demoAnswer, demoLatency } from "@/lib/demo";
import {
  pickRepresentative,
  rankByReliability,
  type ModelRunResult,
} from "@/lib/reliability";
import { confidenceNote, scoreAnswers } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PROMPT = 4000;
const MAX_MODELS = 8;

type Body = {
  prompt?: string;
  runs?: number;
  modelIds?: ModelId[];
  mode?: "auto" | "demo" | "live";
  keys?: KeyBag;
  temperature?: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `Prompt too long (max ${MAX_PROMPT} characters).` },
      { status: 400 },
    );
  }

  const runs = Math.min(5, Math.max(2, body.runs ?? 3));
  const temperature = Math.min(
    1,
    Math.max(0, Number.isFinite(body.temperature) ? Number(body.temperature) : 0.3),
  );
  let selected = body.modelIds?.length
    ? CHAT_MODELS.filter((m) => body.modelIds!.includes(m.id))
    : CHAT_MODELS;

  if (selected.length === 0) {
    return NextResponse.json({ error: "No models selected" }, { status: 400 });
  }
  if (selected.length > MAX_MODELS) {
    selected = selected.slice(0, MAX_MODELS);
  }

  const keys = resolveKeys(body.keys ?? {});
  const liveAvailable = selected.filter((m) => canCallModel(m, keys));
  const mode =
    body.mode === "demo"
      ? "demo"
      : body.mode === "live"
        ? "live"
        : liveAvailable.length > 0
          ? "live"
          : "demo";

  if (mode === "live" && liveAvailable.length === 0) {
    return NextResponse.json(
      {
        error:
          "No API keys found. Paste an OpenRouter key (covers many models) or a provider key — or use demo mode.",
      },
      { status: 400 },
    );
  }

  const targets = mode === "live" ? liveAvailable : selected;
  const keyBag = body.keys ?? {};
  const signal = req.signal;

  const results: ModelRunResult[] = await Promise.all(
    targets.map(async (model) => {
      if (signal.aborted) {
        return {
          modelId: model.id,
          answers: [],
          errors: ["Cancelled"],
          consistency: 0,
          pairStats: { mean: 0, min: 0, max: 0, stdev: 0, pairs: 0 },
          representative: "",
          latencyMs: [],
          scoring: "lexical" as const,
        };
      }

      const settled = await Promise.all(
        Array.from({ length: runs }, async (_, i) => {
          if (signal.aborted) {
            return {
              ok: false as const,
              error: "Cancelled",
              ms: 0,
            };
          }
          const started = Date.now();
          try {
            if (mode === "demo") {
              await new Promise((r) => setTimeout(r, 60 + i * 15));
              return {
                ok: true as const,
                text: demoAnswer(model.id, i),
                ms: demoLatency(model.id, i),
              };
            }
            const text = await callChatModel(model, prompt, keyBag, {
              temperature,
            });
            return { ok: true as const, text, ms: Date.now() - started };
          } catch (err) {
            return {
              ok: false as const,
              error: err instanceof Error ? err.message : "Unknown error",
              ms: Date.now() - started,
            };
          }
        }),
      );

      const answers: string[] = [];
      const errors: string[] = [];
      const latencyMs: number[] = [];
      for (const row of settled) {
        latencyMs.push(row.ms);
        if (row.ok) answers.push(row.text);
        else errors.push(row.error);
      }

      let embeddings: number[][] | null = null;
      let scoring: "semantic" | "lexical" = "lexical";
      if (mode === "live" && answers.length >= 2 && !signal.aborted) {
        embeddings = await embedTexts(answers, keyBag);
        if (embeddings) scoring = "semantic";
      }

      const scored = scoreAnswers(answers, embeddings ?? undefined);

      return {
        modelId: model.id,
        answers,
        errors,
        consistency: scored.consistency,
        pairStats: scored.pairStats,
        representative: pickRepresentative(answers),
        latencyMs,
        scoring,
      };
    }),
  );

  if (signal.aborted) {
    return NextResponse.json({ error: "Cancelled" }, { status: 400 });
  }

  const ranking = rankByReliability(results);
  const winner = ranking.find((r) => r.completedRuns > 0) ?? null;
  const usedSemantic = results.some((r) => r.scoring === "semantic");
  const bestCompleted = winner?.completedRuns ?? 0;

  return NextResponse.json({
    prompt,
    runs,
    temperature,
    mode,
    scoring: usedSemantic ? "semantic" : "lexical",
    confidence: confidenceNote(runs, bestCompleted),
    methodologyUrl: "/methodology",
    schema: "sameask.compare.v1",
    models: targets.map((m) => ({
      id: m.id,
      name: m.name,
      vendor: m.vendor,
      ui: m.ui,
      color: m.color,
      live: canCallModel(m, keys),
    })),
    results,
    ranking,
    winner,
    insight: usedSemantic
      ? `Answer similarity across ${runs} runs at temperature ${temperature} (embedding + lexical blend) — not answer quality. A steady mediocre answer can outrank a better rephrased one.`
      : `Answer similarity across ${runs} runs at temperature ${temperature} (paraphrase-aware lexical) — not answer quality. With OpenRouter/OpenAI keys we add embeddings when available.`,
  });
}
