"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CTAS,
  HOW_IT_WORKS,
  PRODUCT,
  pick,
} from "@/lib/copy";
import { MarketBrowser, NeedFinder } from "@/components/NeedFinder";
import { LiveWorkbench } from "@/components/LiveWorkbench";
import { FeedbackChat } from "@/components/FeedbackChat";
import {
  ViewModeProvider,
  ViewModeToggle,
  useViewMode,
} from "@/components/ViewModeContext";

type Tab = "find" | "market" | "live";

export function SameAskApp() {
  return (
    <ViewModeProvider>
      <SameAskAppInner />
    </ViewModeProvider>
  );
}

function SameAskAppInner() {
  const { mode } = useViewMode();
  const [tab, setTab] = useState<Tab>("find");

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(61,255,200,0.16),transparent_65%)] blur-2xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:gap-4 sm:px-8">
        <div>
          <div className="font-display text-2xl tracking-tight text-[var(--ink)]">
            {PRODUCT.name}
          </div>
          <p className="font-mono text-[11px] text-[var(--muted)]">
            {pick(mode, PRODUCT.tagline)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ViewModeToggle />
          <nav className="flex flex-wrap gap-1 border border-[var(--line)] p-1">
            {(
              [
                ["find", "Find"],
                ["market", "Market"],
                ["live", "Live test"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 text-sm transition ${
                  tab === id
                    ? "bg-[var(--signal)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8">
        {tab === "find" && (
          <>
            <section className="hero-enter mb-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-[var(--signal)]">
                  {pick(mode, PRODUCT.heroEyebrow)}
                </p>
                <h1 className="font-display text-[clamp(2.6rem,6.5vw,5rem)] leading-[0.94] tracking-[-0.03em] text-[var(--ink)]">
                  SameAsk
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
                  {pick(mode, PRODUCT.oneLiner)}
                </p>
                {mode === "technical" && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                    {PRODUCT.problem.technical}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("need-finder")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-[var(--signal)] px-5 py-3 font-medium text-[var(--bg)] transition hover:brightness-110"
                  >
                    {CTAS.findMyAi}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("live")}
                    className="border border-[var(--line)] px-5 py-3 text-[var(--ink)] transition hover:border-[var(--signal)]"
                  >
                    {pick(mode, CTAS.liveTest)}
                  </button>
                </div>
              </div>

              <div className="border border-[var(--line)] bg-[linear-gradient(160deg,#15201c_0%,#0b1210_55%,#101820_100%)] p-5 sm:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--signal)]">
                  How it works
                </p>
                <ol className="mt-5 space-y-5">
                  {HOW_IT_WORKS.map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="font-mono text-xs text-[var(--signal)]">
                        {item.step}
                      </span>
                      <div>
                        <div className="text-sm text-[var(--ink)]">
                          {pick(mode, item.title)}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {pick(mode, item.body)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <div id="need-finder">
              <NeedFinder onLiveTest={() => setTab("live")} />
            </div>
          </>
        )}

        {tab === "market" && <MarketBrowser />}

        {tab === "live" && <LiveWorkbench />}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-[var(--line)] px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-[var(--muted)]">
            {pick(mode, PRODUCT.footer)}
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-[var(--muted)]">
            <Link href="/methodology" className="hover:text-[var(--signal)]">
              Methodology
            </Link>
            <Link href="/privacy" className="hover:text-[var(--signal)]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--signal)]">
              Terms
            </Link>
            <a
              href="https://github.com/ayushanand27/SameAsk"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--signal)]"
            >
              GitHub
            </a>
            <span>{pick(mode, PRODUCT.footerMeta)}</span>
          </div>
        </div>
      </footer>

      <FeedbackChat />
    </div>
  );
}
