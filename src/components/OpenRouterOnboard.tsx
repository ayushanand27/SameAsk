"use client";

type Props = {
  openrouterKey: string;
  onOpenrouterChange: (value: string) => void;
  onContinue: () => void;
  onFreeFriendlyPreset: () => void;
};

export function OpenRouterOnboard({
  openrouterKey,
  onOpenrouterChange,
  onContinue,
  onFreeFriendlyPreset,
}: Props) {
  const ready = openrouterKey.trim().length > 8;

  return (
    <div className="border border-[var(--signal)]/35 bg-[linear-gradient(160deg,#12201b_0%,#0b1210_60%)] p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--signal)]">
        Fastest path to Live
      </p>
      <h3 className="mt-2 font-display text-2xl text-[var(--ink)]">
        One free OpenRouter key covers most models
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        No account on SameAsk. Paste a key once — it stays in this browser.
        Free OpenRouter limits are tight, so start with 2–3 models and 3 runs.
      </p>

      <ol className="mt-5 space-y-4">
        <li className="flex gap-3">
          <span className="font-mono text-xs text-[var(--signal)]">1</span>
          <div className="flex-1">
            <p className="text-sm text-[var(--ink)]">Get a free key</p>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block bg-[var(--signal)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:brightness-110"
            >
              Open OpenRouter keys →
            </a>
            <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
              Sign up → Create key → copy. Card not required for free models.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-[var(--signal)]">2</span>
          <div className="flex-1">
            <label className="block text-sm text-[var(--ink)]">
              Paste key here
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => onOpenrouterChange(e.target.value)}
                className="mt-2 w-full border border-[var(--line)] bg-black/30 px-3 py-2.5 font-mono text-xs text-[var(--ink)] outline-none focus:border-[var(--signal)]"
                placeholder="sk-or-v1-…"
                autoComplete="off"
              />
            </label>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-[var(--signal)]">3</span>
          <div className="flex-1">
            <p className="text-sm text-[var(--ink)]">Use a free-friendly preset</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Selects cheaper/open models + 3 runs so free credits last longer.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onFreeFriendlyPreset}
                className="border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--signal)]"
              >
                Apply free-friendly preset
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={onContinue}
                className="bg-[var(--ink)] px-3 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-40"
              >
                {ready ? "Key saved — continue" : "Paste key to continue"}
              </button>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}
