/** Shared product copy — keep tone direct and useful. Dual Simple / Technical. */

import type { NeedAnswers } from "@/lib/needs";
import type { ViewMode } from "@/lib/viewMode";

export const PRODUCT = {
  name: "SameAsk",
  tagline: {
    simple: "Find the right AI.",
    technical: "Right AI. Right time.",
  },
  oneLiner: {
    simple:
      "Tell us what you need. Get a shortlist. Check that chat models give the same answer again.",
    technical:
      "Tell us the job. Get a shortlist. Prove chat models stay consistent — before you trust them.",
  },
  problem: {
    simple:
      "Too many AI tools. Too much hype. SameAsk helps you pick what fits — and see if it holds still.",
    technical:
      "Labs fight over who is smartest. People drown in tabs. The real question is which tool fits your need — and whether it holds still.",
  },
  heroEyebrow: {
    simple: "Pick AI without the overwhelm",
    technical: "For everyone choosing AI in public",
  },
  footer: {
    simple:
      "SameAsk helps you pick the right AI for the job — then check that chat models stay steady. Browse tools, then try your own prompt.",
    technical:
      "SameAsk helps people pick the right AI for the job — then prove chat models stay consistent. Curated market data; live scores from your keys.",
  },
  footerMeta: {
    simple: "Free · your own API key · no account",
    technical: "Free · BYOK · no account required",
  },
} as const;

export const LIVE_PROMPTS = [
  {
    label: { simple: "Student / docs", technical: "Student / docs" },
    text: "I have a 40-page PDF to study this week. Recommend one free AI approach and the exact workflow in 5 steps.",
  },
  {
    label: { simple: "Coding pick", technical: "Coding pick" },
    text: "I ship web apps solo. Should I use Cursor, Claude, or Copilot as my primary coding AI this month? One clear pick and why.",
  },
  {
    label: { simple: "Steady answers", technical: "Reliability" },
    text: "In two sentences: what is the reliability gap in chat models, and how should a user test for it?",
  },
  {
    label: { simple: "Budget", technical: "Budget" },
    text: "I can only use free tiers. Rank the best free chat options for careful writing vs fast answers.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: { simple: "Say what you need", technical: "Say the need" },
    body: {
      simple: "Job, budget, what matters most, who you are — four quick answers.",
      technical: "Job, budget, priority, who you are — four answers beat forty tabs.",
    },
  },
  {
    step: "02",
    title: { simple: "Get a shortlist", technical: "Get a shortlist" },
    body: {
      simple:
        "Ranked tools for chat, coding, image, video, data, and notes — with when to use each.",
      technical:
        "Ranked tools across chat, coding, image, video, data, and notes — with when-to-use guidance.",
    },
  },
  {
    step: "03",
    title: { simple: "Try it live", technical: "Prove it" },
    body: {
      simple:
        "Ask chat models the same question a few times. Prefer the one that gives the same answer again.",
      technical:
        "Live-test chat models on YOUR prompt, multiple runs. Consistency > one clever reply.",
    },
  },
] as const;

export const FIND = {
  eyebrow: { simple: "Quick finder", technical: "Need finder" },
  title: {
    simple: "What do you need AI for?",
    technical: "What should you use right now?",
  },
  blurb: {
    simple:
      "Four short answers. A ranked shortlist. Clear next steps — so you pick what fits today.",
    technical:
      "Four answers. A ranked shortlist. Clear next steps — so you pick the right AI for this job, not last week's hype winner.",
  },
  budget: {
    free: { simple: "Free only", technical: "Free only" },
    cheap: { simple: "Cheap / own key", technical: "Cheap / BYOK" },
    "ok-paid": { simple: "OK to pay", technical: "OK to pay" },
  },
  priority: {
    reliability: { simple: "How steady it is", technical: "Reliability" },
    quality: { simple: "Best quality", technical: "Peak quality" },
    speed: { simple: "Speed", technical: "Speed" },
    cost: { simple: "Lowest cost", technical: "Lowest cost" },
    privacy: { simple: "Privacy", technical: "Privacy" },
  },
  shortlistMeta: {
    simple: (n: number) =>
      `Top ${n} matches · try chat picks in Live test`,
    technical: (n: number) =>
      `Top ${n} fits · curated scores · prove chat picks in Live test`,
  },
  liveCta: {
    simple: "Skip to Live test →",
    technical: "Skip to Live test →",
  },
  fitLabel: { simple: "match", technical: "fit" },
  reliabilityLabel: {
    simple: "how steady",
    technical: "reliability",
  },
  proveCta: {
    simple: "Check if it stays steady",
    technical: "Prove reliability here",
  },
  marketCoverage: {
    simple: "What's covered",
    technical: "Market coverage",
  },
  showDetails: "Show details",
  hideDetails: "Hide details",
} as const;

export const MARKET = {
  eyebrow: { simple: "Browse tools", technical: "Market map" },
  title: {
    simple: "Tools people actually use",
    technical: "Browse the stack people actually open",
  },
  blurb: {
    simple:
      "Chat, coding, image, video, data, notes, and hubs. Filter free options. Stars are our guide — your prompt is the real test.",
    technical:
      "Chat, coding, image, video, data, notes, aggregators. Filter free paths or live-testable models. Stars are curated — your prompt is the real exam.",
  },
  freePath: { simple: "Free options", technical: "Free path" },
  liveTestable: { simple: "Can live-test", technical: "Live-testable" },
  liveTag: { simple: " · live test", technical: " · live-testable" },
  reliabilityTitle: {
    simple: (n: number) => `How steady: ${n}/5`,
    technical: (n: number) => `Curated reliability ${n}/5`,
  },
} as const;

export const LIVE = {
  eyebrow: {
    simple: "Live test",
    technical: "Live reliability test",
  },
  title: {
    simple: "Same question. A few times. Who stays steady?",
    technical: "Same prompt. Multiple runs. Who holds still?",
  },
  blurbBeforeLink: {
    simple: "Paste an",
    technical: "Paste an",
  },
  blurbAfterLink: {
    simple:
      "key to try many models with one key. Keys stay in your browser. No key? Demo mode still shows the idea.",
    technical:
      "key to hit many models with one key. Keys stay in your browser only. No key → demo mode still teaches the idea.",
  },
  keysToggle: {
    simple: (show: boolean, hasKey: boolean) =>
      `${show ? "Hide" : "Show"} your API keys · ${hasKey ? "saved on this device" : "empty → demo"}`,
    technical: (show: boolean, hasKey: boolean) =>
      `${show ? "Hide" : "Show"} API keys (BYOK) · ${hasKey ? "saved locally" : "empty → demo"}`,
  },
  keysHint: {
    simple:
      "Keys stay on your device except when calling the provider you chose. We don't keep them on a server.",
    technical:
      "Keys never leave your device except to call the provider you chose. We don't store them on a server.",
  },
  starterPrompts: {
    simple: "Try a starter",
    technical: "Starter prompts",
  },
  promptLabel: {
    simple: "Your question",
    technical: "Your real prompt",
  },
  submit: {
    simple: "Compare how steady they are",
    technical: "Compare reliability",
  },
  submitting: {
    simple: "Asking the same thing…",
    technical: "Running same ask…",
  },
  consistencyMetric: {
    simple: "same answer again",
    technical: "consistency",
  },
  allRuns: {
    simple: "Show details",
    technical: "All runs",
  },
  winnerHint: {
    simple: "on this question — use that for your real work.",
    technical: "on this prompt — use that signal for your real workflow.",
  },
} as const;

export const CTAS = {
  findMyAi: "Find my AI",
  liveTest: {
    simple: "Try models live",
    technical: "Live-test models",
  },
} as const;

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

export function summaryForNeedsMode(
  needs: NeedAnswers,
  mode: ViewMode,
): string {
  const job = JOB_LABEL[needs.job];
  if (mode === "simple") {
    const budget =
      needs.budget === "free"
        ? "free only"
        : needs.budget === "cheap"
          ? "cheap or your own API key"
          : "OK to pay";
    const priority = FIND.priority[needs.priority].simple;
    return `Looking for ${job}, ${budget}, prioritizing ${priority.toLowerCase()}, for a ${needs.context}.`;
  }
  const budget =
    needs.budget === "free"
      ? "free paths only"
      : needs.budget === "cheap"
        ? "cheap / BYOK"
        : "paid OK";
  return `Looking for ${job}, ${budget}, prioritizing ${needs.priority}, for a ${needs.context}.`;
}

/** Soften jargon in dynamic reason chips for Simple view. */
export function softenReason(reason: string, mode: ViewMode): string {
  if (mode === "technical") return reason;
  return reason
    .replace(/Top curated reliability/gi, "Very steady pick")
    .replace(/Strong curated reliability/gi, "Steady pick")
    .replace(/curated reliability/gi, "how steady it is")
    .replace(/Cheap entry or BYOK/gi, "Cheap or your own API key")
    .replace(/\bBYOK\b/g, "your own API key")
    .replace(/prove consistency/gi, "check same answer again")
    .replace(/\bconsistency\b/gi, "same answer again")
    .replace(/\breliability\b/gi, "how steady it is");
}

export function softenNextStep(step: string, mode: ViewMode): string {
  if (mode === "technical") return step;
  return step
    .replace(/stays consistent/gi, "gives the same answer again")
    .replace(/\bconsistency\b/gi, "same answer again");
}

export function pick<T>(mode: ViewMode, map: { simple: T; technical: T }): T {
  return map[mode];
}
