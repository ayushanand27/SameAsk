export type ViewMode = "simple" | "technical";

export const VIEW_STORAGE_KEY = "sameask.view.v1";

export function isViewMode(value: unknown): value is ViewMode {
  return value === "simple" || value === "technical";
}
