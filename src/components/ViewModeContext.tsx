"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isViewMode,
  VIEW_STORAGE_KEY,
  type ViewMode,
} from "@/lib/viewMode";

type ViewModeContextValue = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  ready: boolean;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("simple");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEW_STORAGE_KEY);
      if (isViewMode(raw)) setModeState(raw);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setMode = useCallback((next: ViewMode) => {
    setModeState(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, ready }),
    [mode, setMode, ready],
  );

  return (
    <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
  );
}

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return ctx;
}

export function ViewModeToggle() {
  const { mode, setMode } = useViewMode();

  return (
    <div
      className="flex items-center gap-1 border border-[var(--line)] p-1"
      role="group"
      aria-label="View mode"
    >
      {(
        [
          ["simple", "Simple"],
          ["technical", "Technical"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setMode(id)}
          aria-pressed={mode === id}
          className={`px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
            mode === id
              ? "bg-[var(--ink)] text-[var(--bg)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
