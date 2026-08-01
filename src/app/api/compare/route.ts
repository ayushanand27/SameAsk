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
  consistencyScore,
  pickRepresentative,
  rankByReliability,
  type ModelRunResult,
} from "@/lib/reliability";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  prompt?: string;
  runs?: number;
  modelIds?: ModelId[];
  mode?: "auto" | "demo" | "live";
  keys?: KeyBag;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const runs = Math.min(5, Math.max(2, body.runs ?? 3));
  const selected = body.modelIds?.length
    ? CHAT_MODELS.filter((m) => body.modelIds!.includes(m.id))
    : CHAT_MODELS;

  if (selected.length === 0) {
    return NextResponse.json({ error: "No models selected" }, { status: 400 });
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

  const results: ModelRunResult[] = await Promise.all(
    targets.map(async (model) => {
      // Parallelize runs within each model to cut wall-clock latency
      const settled = await Promise.all(
        Array.from({ length: runs }, async (_, i) => {
          const started = Date.now();
          try {
            if (mode === "demo") {
              await new Promise((r) => setTimeout(r, 80 + i * 20));
              return {
                ok: true as const,
                text: demoAnswer(model.id, i),
                ms: demoLatency(model.id, i),
              };
            }
            const text = await callChatModel(model, prompt, keyBag, {
              temperature: 0.3,
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
      if (mode === "live" && answers.length >= 2) {
        embeddings = await embedTexts(answers, keyBag);
        if (embeddings) scoring = "semantic";
      }

      return {
        modelId: model.id,
        answers,
        errors,
        consistency:
          answers.length >= 2
            ? consistencyScore(answers, embeddings ?? undefined)
            : answers.length === 1
              ? 0.5
              : 0,
        representative: pickRepresentative(answers),
        latencyMs,
        scoring,
      };
    }),
  );

  const ranking = rankByReliability(results);
  const winner = ranking.find((r) => r.completedRuns > 0) ?? null;
  const usedSemantic = results.some((r) => r.scoring === "semantic");

  return NextResponse.json({
    prompt,
    runs,
    mode,
    scoring: usedSemantic ? "semantic" : "lexical",
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
      ? `Answer similarity across ${runs} runs (embedding + lexical blend) — not answer quality. A steady mediocre answer can outrank a better rephrased one. Raise runs for a stabler estimate.`
      : `Answer similarity across ${runs} runs (paraphrase-aware lexical score) — not answer quality. With an OpenRouter/OpenAI key we also use embeddings when available. Raise runs for a stabler estimate.`,
  });
}
