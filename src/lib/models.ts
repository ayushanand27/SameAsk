export type ModelId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "grok"
  | "deepseek"
  | "qwen"
  | "kimi"
  | "llama";

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"
  | "openrouter";

export type ChatModel = {
  id: ModelId;
  name: string;
  vendor: string;
  ui: string;
  provider: ModelProvider;
  apiModel: string;
  openRouterId?: string;
  envKey: string;
  color: string;
};

/** Live-testable chat models (BYOK / OpenRouter / demo). */
export const CHAT_MODELS: ChatModel[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    ui: "chatgpt.com",
    provider: "openai",
    apiModel: "gpt-4.1-mini",
    openRouterId: "openai/gpt-4.1-mini",
    envKey: "OPENAI_API_KEY",
    color: "#10a37f",
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    ui: "claude.ai",
    provider: "anthropic",
    apiModel: "claude-sonnet-4-20250514",
    openRouterId: "anthropic/claude-sonnet-4",
    envKey: "ANTHROPIC_API_KEY",
    color: "#d97757",
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    ui: "gemini.google.com",
    provider: "google",
    apiModel: "gemini-2.0-flash",
    openRouterId: "google/gemini-2.0-flash-001",
    envKey: "GOOGLE_API_KEY",
    color: "#4285f4",
  },
  {
    id: "grok",
    name: "Grok",
    vendor: "xAI",
    ui: "x.com/i/grok",
    provider: "xai",
    apiModel: "grok-3-mini",
    openRouterId: "x-ai/grok-3-mini",
    envKey: "XAI_API_KEY",
    color: "#e8e8e8",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    vendor: "DeepSeek",
    ui: "chat.deepseek.com",
    provider: "deepseek",
    apiModel: "deepseek-chat",
    openRouterId: "deepseek/deepseek-chat",
    envKey: "DEEPSEEK_API_KEY",
    color: "#4d6bfe",
  },
  {
    id: "qwen",
    name: "Qwen",
    vendor: "Alibaba",
    ui: "chat.qwen.ai",
    provider: "openrouter",
    apiModel: "qwen/qwen3-32b",
    openRouterId: "qwen/qwen3-32b",
    envKey: "OPENROUTER_API_KEY",
    color: "#6a11cb",
  },
  {
    id: "kimi",
    name: "Kimi",
    vendor: "Moonshot",
    ui: "kimi.com",
    provider: "openrouter",
    apiModel: "moonshotai/kimi-k2",
    openRouterId: "moonshotai/kimi-k2",
    envKey: "OPENROUTER_API_KEY",
    color: "#1f6feb",
  },
  {
    id: "llama",
    name: "Llama (via Groq/OR)",
    vendor: "Meta",
    ui: "meta.ai / groq",
    provider: "openrouter",
    apiModel: "meta-llama/llama-3.3-70b-instruct",
    openRouterId: "meta-llama/llama-3.3-70b-instruct",
    envKey: "OPENROUTER_API_KEY",
    color: "#0668e1",
  },
];

export function getModel(id: ModelId): ChatModel {
  const model = CHAT_MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
}
