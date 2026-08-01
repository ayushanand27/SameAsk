/** Pairwise answer-similarity stats for market-grade reporting. */

import {
  answerSimilarity,
  consistencyScore,
  cosineSimilarity,
} from "./reliability";

export type PairStats = {
  mean: number;
  min: number;
  max: number;
  stdev: number;
  pairs: number;
};

export function pairwiseSimilarities(
  answers: string[],
  embeddings?: number[][],
): number[] {
  const scores: number[] = [];
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      if (
        embeddings?.[i]?.length &&
        embeddings?.[j]?.length &&
        embeddings[i].length === embeddings[j].length
      ) {
        const sem = cosineSimilarity(embeddings[i], embeddings[j]);
        const lex = answerSimilarity(answers[i], answers[j]);
        scores.push(0.7 * Math.max(0, sem) + 0.3 * lex);
      } else {
        scores.push(answerSimilarity(answers[i], answers[j]));
      }
    }
  }
  return scores;
}

export function summarizePairs(scores: number[]): PairStats {
  if (scores.length === 0) {
    return { mean: 0, min: 0, max: 0, stdev: 0, pairs: 0 };
  }
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const variance =
    scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
  return {
    mean,
    min,
    max,
    stdev: Math.sqrt(variance),
    pairs: scores.length,
  };
}

export function scoreAnswers(
  answers: string[],
  embeddings?: number[][],
): { consistency: number; pairStats: PairStats } {
  if (answers.length >= 2) {
    const scores = pairwiseSimilarities(answers, embeddings);
    const pairStats = summarizePairs(scores);
    return {
      consistency: consistencyScore(answers, embeddings),
      pairStats,
    };
  }
  if (answers.length === 1) {
    return {
      consistency: 0.5,
      pairStats: { mean: 0.5, min: 0.5, max: 0.5, stdev: 0, pairs: 0 },
    };
  }
  return {
    consistency: 0,
    pairStats: { mean: 0, min: 0, max: 0, stdev: 0, pairs: 0 },
  };
}

/** Rough band: with few pairs, stdev of the estimate is high. */
export function confidenceNote(runs: number, completed: number): string {
  if (completed < 2) return "Need at least 2 successful runs for similarity.";
  if (runs <= 3) return "Thin sample (≤3 runs) — treat as directional, not final.";
  if (runs === 4) return "Moderate sample — good for screening.";
  return "Stronger sample (5 runs) — stabler estimate for this prompt.";
}
