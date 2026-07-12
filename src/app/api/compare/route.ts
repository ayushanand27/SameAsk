import { NextResponse } from "next/server";
import { CHAT_MODELS, type ModelId } from "@/lib/models";
import {
  callChatModel,
  canCallModel,
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

  const results: ModelRunResult[] = await Promise.all(
    targets.map(async (model) => {
      const answers: string[] = [];
      const errors: string[] = [];
      const latencyMs: number[] = [];

      for (let i = 0; i < runs; i++) {
        const started = Date.now();
        try {
          if (mode === "demo") {
            await new Promise((r) => setTimeout(r, 120 + i * 30));
            answers.push(demoAnswer(model.id, i));
            latencyMs.push(demoLatency(model.id, i));
          } else {
            const text = await callChatModel(model, prompt, body.keys ?? {});
            answers.push(text);
            latencyMs.push(Date.now() - started);
          }
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Unknown error");
          latencyMs.push(Date.now() - started);
        }
      }

      return {
        modelId: model.id,
        answers,
        errors,
        consistency: answers.length ? consistencyScore(answers) : 0,
        representative: pickRepresentative(answers),
        latencyMs,
      };
    }),
  );

  const ranking = rankByReliability(results);
  const winner = ranking.find((r) => r.completedRuns > 0) ?? null;

  return NextResponse.json({
    prompt,
    runs,
    mode,
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
    insight:
      "Match the tool to your need first. Then trust the model that stays consistent on YOUR prompt — not the one that won a leaderboard once.",
  });
}
