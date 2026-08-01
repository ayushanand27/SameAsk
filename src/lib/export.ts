/** Export helpers for market-ready result sharing. */

export type CompareSnapshot = {
  prompt: string;
  runs: number;
  mode: "demo" | "live";
  scoring: "semantic" | "lexical";
  temperature?: number;
  generatedAt: string;
  ranking: {
    modelId: string;
    name: string;
    consistency: number;
    avgLatencyMs: number;
    completedRuns: number;
    failedRuns: number;
    pairMin?: number;
    pairMax?: number;
    pairStdev?: number;
    representative: string;
  }[];
  insight: string;
};

export function toMarkdown(s: CompareSnapshot): string {
  const lines = [
    `# SameAsk result`,
    ``,
    `- Prompt: ${s.prompt}`,
    `- Runs: ${s.runs}`,
    `- Temperature: ${s.temperature ?? "n/a"}`,
    `- Mode: ${s.mode}`,
    `- Scoring: ${s.scoring}`,
    `- Generated: ${s.generatedAt}`,
    ``,
    `## Ranking (answer similarity — not quality)`,
    ``,
  ];
  s.ranking.forEach((r, i) => {
    const band =
      r.pairMin != null && r.pairMax != null
        ? ` · pair ${((r.pairMin ?? 0) * 100).toFixed(0)}–${((r.pairMax ?? 0) * 100).toFixed(0)}% · σ ${((r.pairStdev ?? 0) * 100).toFixed(0)}%`
        : "";
    lines.push(
      `${i + 1}. **${r.name}** — ${(r.consistency * 100).toFixed(0)}% similarity · ${r.completedRuns} ok / ${r.failedRuns} fail · ${Math.round(r.avgLatencyMs)}ms${band}`,
    );
    if (r.representative) lines.push(`   > ${r.representative.slice(0, 280)}`);
  });
  lines.push(
    ``,
    `## Note`,
    ``,
    s.insight,
    ``,
    `Methodology: https://sameask.vercel.app/methodology`,
    `Product: https://sameask.vercel.app`,
  );
  return lines.join("\n");
}

export function toJson(s: CompareSnapshot): string {
  return JSON.stringify(
    {
      schema: "sameask.compare.v1",
      disclaimer: "Answer similarity ≠ quality, accuracy, or Arena Elo.",
      ...s,
    },
    null,
    2,
  );
}

export function toCsv(s: CompareSnapshot): string {
  const header =
    "rank,model,similarity_pct,completed,failed,avg_latency_ms,pair_min_pct,pair_max_pct,pair_stdev_pct";
  const rows = s.ranking.map((r, i) =>
    [
      i + 1,
      csvEscape(r.name),
      (r.consistency * 100).toFixed(1),
      r.completedRuns,
      r.failedRuns,
      Math.round(r.avgLatencyMs),
      r.pairMin != null ? (r.pairMin * 100).toFixed(1) : "",
      r.pairMax != null ? (r.pairMax * 100).toFixed(1) : "",
      r.pairStdev != null ? (r.pairStdev * 100).toFixed(1) : "",
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
