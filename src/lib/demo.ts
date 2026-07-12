import type { ModelId } from "./models";

const BANK: Record<ModelId, string[]> = {
  chatgpt: [
    "Pick by your job and budget first, then prove consistency with the same prompt run 3 times.",
    "Choose tools by need (chat vs coding vs image), then verify the shortlist with repeated asks.",
    "Don't crown a winner from one clever reply — match the category, then measure steadiness.",
  ],
  claude: [
    "For careful writing and coding explanations, Claude often holds answers steady across runs. Still verify on your prompt.",
    "For careful writing and coding explanations, Claude often holds answers steady across runs. Still verify on your prompt.",
    "For careful writing and coding explanations, Claude often holds answers steady across runs. Still verify on your prompt.",
  ],
  gemini: [
    "Gemini fits Google-native work and multimodal asks. Reliability still needs a multi-run check.",
    "Use Gemini when Sheets/Docs/Search matter. Confirm consistency before trusting a single draft.",
    "Google stack? Start Gemini. Then SameAsk it — capability demos are not repeatability.",
  ],
  grok: [
    "Grok is strong for live X-context brainstorming; expect more stylistic drift than enterprise-toned models.",
    "Fun and timely, but score consistency before using Grok for specs.",
    "If you need steady policy tone, compare Grok against Claude/ChatGPT on your exact prompt.",
  ],
  deepseek: [
    "DeepSeek is a value pick for reasoning/coding. Free/API friendly — great for BYOK reliability tests.",
    "Cost-efficient does not mean unstable — measure it. DeepSeek often earns a shortlist slot on budget.",
    "High volume or student budget? DeepSeek is a prime SameAsk candidate.",
  ],
  qwen: [
    "Qwen Chat is strong for long context and free exploration of big docs/code.",
    "Need an entire codebase in context on a free tier? Qwen is a serious contender.",
    "Open-friendly long-context chat — still run consistency before locking a workflow.",
  ],
  kimi: [
    "Kimi’s free chat is generous for long research dumps. Good student/researcher default to test.",
    "Long documents + free tier: Kimi belongs on the shortlist.",
    "Compare Kimi against Claude on your longest PDF-style prompt.",
  ],
  llama: [
    "Llama via Groq/OpenRouter is the speed/open path. Great for fast iteration tests.",
    "Want open weights with low latency? Llama on Groq-class inference is the move.",
    "Open + fast: include Llama in your reliability board, especially when cost matters.",
  ],
};

export function demoAnswer(modelId: ModelId, runIndex: number): string {
  const variants = BANK[modelId];
  return variants[runIndex % variants.length];
}

export function demoLatency(modelId: ModelId, runIndex: number): number {
  const base: Record<ModelId, number> = {
    chatgpt: 900,
    claude: 1100,
    gemini: 800,
    grok: 700,
    deepseek: 650,
    qwen: 720,
    kimi: 780,
    llama: 420,
  };
  return base[modelId] + runIndex * 40 + (modelId.length * 17) % 120;
}
