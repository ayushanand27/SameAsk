import { MARKET, type Category, type Tool } from "./catalog";

export type NeedAnswers = {
  job: Category | "unsure";
  budget: "free" | "cheap" | "ok-paid";
  priority: "reliability" | "speed" | "quality" | "privacy" | "cost";
  context: "student" | "builder" | "creator" | "analyst" | "team";
};

export type ScoredTool = {
  tool: Tool;
  score: number;
  /** 0–100 normalized fit for display */
  fit: number;
  reasons: string[];
  whenToUse: string;
  nextStep: string;
};

const JOB_LABEL: Record<NeedAnswers["job"], string> = {
  chat: "chat / write / research",
  coding: "coding",
  image: "image generation",
  video: "video generation",
  data: "data / Excel / BI",
  notes: "notes / teaching",
  aggregator: "multi-model hubs",
  unsure: "general AI work",
};

const CONTEXT_HINTS: Record<NeedAnswers["context"], string[]> = {
  student: ["study", "docs", "free", "research", "writing", "long-context", "citations"],
  builder: ["coding", "agents", "api", "dev", "ide", "cli", "rag"],
  creator: ["image", "video", "art", "avatar", "aesthetic"],
  analyst: ["excel", "csv", "bi", "plots", "sheets", "analysis"],
  team: ["enterprise", "office", "workspace", "self-host", "rag", "privacy"],
};

/** Soft boosts: tools that are classic "right tool, right time" picks. */
const CONTEXT_BOOSTS: Partial<Record<NeedAnswers["context"], string[]>> = {
  student: ["notebooklm", "perplexity", "kimi", "qwen", "deepseek", "chatgpt", "claude"],
  builder: ["cursor", "claude", "claude-code", "github-copilot", "windsurf", "deepseek", "phind"],
  creator: ["midjourney", "runway", "kling", "chatgpt-images", "ideogram", "luma"],
  analyst: ["julius", "chatgpt-excel", "copilot-excel", "gemini-sheets", "powerbi-copilot"],
  team: ["copilot-chat", "claude", "librechat", "anythingllm", "openrouter", "notebooklm"],
};

function whenToUse(tool: Tool, needs: NeedAnswers): string {
  const job = JOB_LABEL[needs.job === "unsure" ? tool.category : needs.job];
  if (tool.category === "aggregator") {
    return `Use when you want several ${job} options in one place instead of juggling tabs.`;
  }
  if (needs.priority === "privacy" && (tool.tags.includes("privacy") || tool.tags.includes("self-host"))) {
    return `Use when ${job} must stay more private or under your control.`;
  }
  if (needs.budget === "free" && (tool.freeTier || tool.pricing === "free")) {
    return `Use first when you need ${job} without paying — then upgrade only if you outgrow it.`;
  }
  return `Reach for this when your main job is ${tool.bestFor.slice(0, 2).join(" or ")}.`;
}

function nextStep(tool: Tool, needs: NeedAnswers): string {
  if (tool.liveTestable && (needs.job === "chat" || needs.job === "unsure" || needs.job === "aggregator")) {
    return "Open Live test → run your real prompt 3× → keep the model that stays consistent.";
  }
  if (tool.category === "coding") {
    return "Install it, run one real repo task, and judge edit quality — not a chat demo.";
  }
  if (tool.category === "image" || tool.category === "video") {
    return "Generate the same brief 2–3 times; keep the tool with the steadiest style match.";
  }
  return `Open ${tool.name}, try one real task from your week, then decide.`;
}

export function scoreTool(tool: Tool, needs: NeedAnswers): ScoredTool {
  let score = 0;
  const reasons: string[] = [];

  // Category / job fit
  if (needs.job !== "unsure" && tool.category === needs.job) {
    score += 42;
    reasons.push(`Built for ${JOB_LABEL[needs.job]}`);
  } else if (needs.job === "unsure") {
    // Prefer proven daily drivers + hubs when someone is lost
    if (["chatgpt", "claude", "gemini", "perplexity", "arena", "poe"].includes(tool.id)) {
      score += 16;
      reasons.push("Solid starting point if you're still exploring");
    } else {
      score += 4;
    }
  } else if (tool.category === "aggregator" && (needs.job === "chat" || needs.job === "coding")) {
    score += 24;
    reasons.push("One hub beats opening 20 model tabs");
  } else if (
    needs.job === "notes" &&
    (tool.category === "chat" || tool.id === "notebooklm")
  ) {
    if (tool.id === "notebooklm") {
      score += 38;
      reasons.push("Source-grounded study beats open chat for coursework");
    } else {
      score += 8;
    }
  } else {
    // Wrong category: soft penalty so they can still surface as secondary
    score -= 12;
  }

  // Budget
  if (needs.budget === "free") {
    if (tool.pricing === "free") {
      score += 22;
      reasons.push("Truly free to start");
    } else if (tool.freeTier) {
      score += 16;
      reasons.push("Has a usable free path");
    } else {
      score -= 28;
      reasons.push("Usually paid — skip unless budget opens up");
    }
  } else if (needs.budget === "cheap") {
    if (tool.pricing === "free" || tool.pricing === "freemium" || tool.pricing === "api") {
      score += 14;
      reasons.push("Cheap entry or BYOK");
    } else if (tool.pricing === "paid") {
      score -= 8;
    }
  } else {
    score += tool.reliability >= 4 ? 10 : 4;
    if (tool.pricing === "paid" && tool.reliability >= 4) {
      reasons.push("Worth paying if quality matters");
    }
  }

  // Priority
  switch (needs.priority) {
    case "reliability":
      score += tool.reliability * 7;
      if (tool.reliability >= 5) reasons.push("Top curated reliability");
      else if (tool.reliability >= 4) reasons.push("Strong curated reliability");
      break;
    case "cost":
      if (tool.pricing === "free" || tool.freeTier) score += 16;
      if (tool.tags.includes("value") || tool.id === "deepseek" || tool.id === "groq") {
        score += 10;
        reasons.push("Strong value / cost efficiency");
      }
      break;
    case "speed":
      if (tool.tags.includes("speed") || tool.id === "groq") {
        score += 20;
        reasons.push("Optimized for low latency");
      } else {
        score += tool.category === "chat" ? 3 : 0;
      }
      break;
    case "privacy":
      if (
        tool.tags.includes("privacy") ||
        tool.tags.includes("self-host") ||
        tool.tags.includes("local")
      ) {
        score += 22;
        reasons.push("Better privacy / self-host posture");
      } else {
        score -= 6;
      }
      break;
    case "quality":
      score += tool.reliability * 6;
      if (tool.pricing === "paid" || tool.reliability >= 5) {
        score += 8;
        reasons.push("Quality-first pick");
      }
      break;
  }

  // Persona / context
  const hints = CONTEXT_HINTS[needs.context];
  const hay = `${tool.bestFor.join(" ")} ${tool.tags.join(" ")} ${tool.notes} ${tool.name}`.toLowerCase();
  let hits = 0;
  for (const h of hints) {
    if (hay.includes(h)) hits += 1;
  }
  if (hits > 0) {
    score += Math.min(18, hits * 4);
    reasons.push(`Fits ${needs.context} workflows`);
  }

  const boosts = CONTEXT_BOOSTS[needs.context] ?? [];
  if (boosts.includes(tool.id)) {
    score += 12;
    if (!reasons.some((r) => r.includes("Fits"))) {
      reasons.push(`Commonly right for ${needs.context}s`);
    }
  }

  // Live-testable chat is a SameAsk superpower
  if (tool.liveTestable && (needs.job === "chat" || needs.job === "unsure")) {
    score += 6;
    reasons.push("You can prove consistency in Live test");
  }

  // Deduplicate reasons, keep strongest 3
  const uniq = [...new Set(reasons)].slice(0, 3);

  return {
    tool,
    score,
    fit: 0, // filled in recommend()
    reasons: uniq,
    whenToUse: whenToUse(tool, needs),
    nextStep: nextStep(tool, needs),
  };
}

export function recommend(needs: NeedAnswers, limit = 8): ScoredTool[] {
  const scored = MARKET.map((t) => scoreTool(t, needs)).sort(
    (a, b) => b.score - a.score,
  );

  // Diversify: avoid 8 near-identical chat clones crowding out a needed adjacent pick
  const picked: ScoredTool[] = [];
  const catCount: Partial<Record<Category, number>> = {};

  for (const item of scored) {
    if (picked.length >= limit) break;
    const cat = item.tool.category;
    const count = catCount[cat] ?? 0;
    const maxPer =
      needs.job === "unsure" ? 2 : needs.job === cat ? 5 : 2;
    if (count >= maxPer && item.score < (scored[0]?.score ?? 0) - 15) continue;
    if (count >= maxPer + 1) continue;
    picked.push(item);
    catCount[cat] = count + 1;
  }

  // Fill if diversification was too strict
  for (const item of scored) {
    if (picked.length >= limit) break;
    if (!picked.find((p) => p.tool.id === item.tool.id)) picked.push(item);
  }

  const max = Math.max(...picked.map((p) => p.score), 1);
  const min = Math.min(...picked.map((p) => p.score), 0);
  const span = Math.max(max - min, 1);

  return picked.map((p) => ({
    ...p,
    fit: Math.round(55 + ((p.score - min) / span) * 45), // 55–100 display band
  }));
}

export function filterMarket(opts: {
  category?: Category | "all";
  freeOnly?: boolean;
  liveOnly?: boolean;
  q?: string;
}): Tool[] {
  const q = opts.q?.trim().toLowerCase() ?? "";
  return MARKET.filter((t) => {
    if (opts.category && opts.category !== "all" && t.category !== opts.category)
      return false;
    if (opts.freeOnly && !(t.freeTier || t.pricing === "free")) return false;
    if (opts.liveOnly && !t.liveTestable) return false;
    if (!q) return true;
    const blob =
      `${t.name} ${t.vendor} ${t.bestFor.join(" ")} ${t.notFor.join(" ")} ${t.tags.join(" ")} ${t.notes}`.toLowerCase();
    return blob.includes(q);
  });
}

export function summaryForNeeds(needs: NeedAnswers): string {
  const job = JOB_LABEL[needs.job];
  const budget =
    needs.budget === "free"
      ? "free paths only"
      : needs.budget === "cheap"
        ? "cheap / BYOK"
        : "paid OK";
  return `Looking for ${job}, ${budget}, prioritizing ${needs.priority}, for a ${needs.context}.`;
}
