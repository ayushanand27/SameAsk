/** Lightweight reliability scoring for chat answers across repeated runs. */

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_#>\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeAnswer(text)
      .split(" ")
      .filter((t) => t.length > 2),
  );
}

/** Jaccard similarity between two answers (0–1). */
export function answerSimilarity(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let overlap = 0;
  for (const t of A) if (B.has(t)) overlap += 1;
  return overlap / (A.size + B.size - overlap);
}

/**
 * Consistency = average pairwise similarity across runs.
 * Capability alone does not equal this — a model can be smart and unstable.
 */
export function consistencyScore(answers: string[]): number {
  if (answers.length <= 1) return 1;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      sum += answerSimilarity(answers[i], answers[j]);
      pairs += 1;
    }
  }
  return pairs === 0 ? 1 : sum / pairs;
}

export function pickRepresentative(answers: string[]): string {
  if (answers.length === 0) return "";
  if (answers.length === 1) return answers[0];
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < answers.length; i++) {
    let score = 0;
    for (let j = 0; j < answers.length; j++) {
      if (i === j) continue;
      score += answerSimilarity(answers[i], answers[j]);
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return answers[bestIdx];
}

export type ModelRunResult = {
  modelId: string;
  answers: string[];
  errors: string[];
  consistency: number;
  representative: string;
  latencyMs: number[];
};

export type CompareRanking = {
  modelId: string;
  consistency: number;
  representative: string;
  avgLatencyMs: number;
  completedRuns: number;
  failedRuns: number;
};

export function rankByReliability(results: ModelRunResult[]): CompareRanking[] {
  return results
    .map((r) => ({
      modelId: r.modelId,
      consistency: r.consistency,
      representative: r.representative,
      avgLatencyMs:
        r.latencyMs.length === 0
          ? 0
          : r.latencyMs.reduce((a, b) => a + b, 0) / r.latencyMs.length,
      completedRuns: r.answers.length,
      failedRuns: r.errors.length,
    }))
    .sort((a, b) => {
      if (b.consistency !== a.consistency) return b.consistency - a.consistency;
      return a.avgLatencyMs - b.avgLatencyMs;
    });
}
