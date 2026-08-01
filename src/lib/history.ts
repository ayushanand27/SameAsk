import type { CompareSnapshot } from "./export";

const HISTORY_KEY = "sameask.history.v1";
const MAX_ITEMS = 20;

export type HistoryItem = {
  id: string;
  savedAt: string;
  snapshot: CompareSnapshot;
};

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(snapshot: CompareSnapshot): HistoryItem[] {
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    snapshot,
  };
  const next = [item, ...loadHistory()].slice(0, MAX_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
