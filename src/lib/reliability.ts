/**
 * Answer-similarity scoring across repeated runs.
 *
 * This measures how much answers hold still — NOT answer quality.
 * A mediocre but repeated answer can outrank a better but rephrased one.
 */

const STOPWORDS = new Set(
  `a an the and or but if then else when while for of to in on at by from with
   as is are was were be been being this that these those it its they them their
   you your we our i me my not no yes do does did done have has had will would
   can could should may might must also just than so such into about over after
   before between through during without within up down out off more most some any
   each other another very really quite rather like etc etc.`.split(/\s+/),
);

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[`*_#>\[\]()"'“”‘’]/g, " ")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTokens(text: string): string[] {
  return normalizeAnswer(text)
    .split(" ")
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function tokenSet(text: string): Set<string> {
  return new Set(contentTokens(text));
}

function bigramSet(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    out.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}

function jaccard(A: Set<string>, B: Set<string>): number {
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let overlap = 0;
  for (const t of A) if (B.has(t)) overlap += 1;
  return overlap / (A.size + B.size - overlap);
}

function bagVector(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function cosineBags(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  for (const [k, va] of a) {
    const vb = b.get(k);
    if (vb) dot += va * vb;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Lexical paraphrase-aware similarity (0–1). Better than raw string equality. */
export function answerSimilarity(a: string, b: string): number {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.length === 0 && tb.length === 0) return 1;
  if (ta.length === 0 || tb.length === 0) return 0;

  const uni = jaccard(new Set(ta), new Set(tb));
  const bi = jaccard(bigramSet(ta), bigramSet(tb));
  const cos = cosineBags(bagVector(ta), bagVector(tb));

  // Weighted blend: content overlap + phrase overlap + frequency cosine
  return Math.min(1, 0.4 * uni + 0.35 * bi + 0.25 * cos);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Average pairwise similarity across runs.
 * Pass embeddings when available for semantic scoring; else lexical blend.
 */
export function consistencyScore(
  answers: string[],
  embeddings?: number[][],
): number {
  if (answers.length <= 1) return 1;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      if (
        embeddings &&
        embeddings[i]?.length &&
        embeddings[j]?.length &&
        embeddings[i].length === embeddings[j].length
      ) {
        // Blend semantic + lexical so total rewrites still get checked
        const sem = cosineSimilarity(embeddings[i], embeddings[j]);
        const lex = answerSimilarity(answers[i], answers[j]);
        sum += 0.7 * Math.max(0, sem) + 0.3 * lex;
      } else {
        sum += answerSimilarity(answers[i], answers[j]);
      }
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
  scoring: "semantic" | "lexical";
};

export type CompareRanking = {
  modelId: string;
  consistency: number;
  representative: string;
  avgLatencyMs: number;
  completedRuns: number;
  failedRuns: number;
  scoring: "semantic" | "lexical";
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
      scoring: r.scoring,
    }))
    .sort((a, b) => {
      if (a.completedRuns === 0 && b.completedRuns > 0) return 1;
      if (b.completedRuns === 0 && a.completedRuns > 0) return -1;
      if (b.consistency !== a.consistency) return b.consistency - a.consistency;
      return a.avgLatencyMs - b.avgLatencyMs;
    });
}
