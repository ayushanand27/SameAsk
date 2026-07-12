"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/catalog";
import {
  filterMarket,
  recommend,
  summaryForNeeds,
  type NeedAnswers,
} from "@/lib/needs";

const JOBS: { id: NeedAnswers["job"]; label: string; hint: string }[] = [
  { id: "chat", label: "Chat / write / research", hint: "Daily driver LLMs" },
  { id: "coding", label: "Coding / IDE agents", hint: "Editors & agents" },
  { id: "image", label: "Image generation", hint: "Stills & design" },
  { id: "video", label: "Video generation", hint: "Clips & avatars" },
  { id: "data", label: "Excel / data / BI", hint: "Sheets & charts" },
  { id: "notes", label: "Notes / teaching", hint: "Docs & study" },
  { id: "unsure", label: "Not sure yet", hint: "We'll start broad" },
];

export function NeedFinder({ onLiveTest }: { onLiveTest?: () => void }) {
  const [needs, setNeeds] = useState<NeedAnswers>({
    job: "chat",
    budget: "free",
    priority: "reliability",
    context: "builder",
  });
  const [submitted, setSubmitted] = useState(false);

  const picks = useMemo(
    () => (submitted ? recommend(needs, 8) : []),
    [needs, submitted],
  );

  return (
    <section className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
          Need finder
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          What should you use right now?
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Four answers. A ranked shortlist. Clear next steps — so you pick the
          right AI for this job, not last week&apos;s hype winner.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Field label="1 · Job">
          <div className="flex flex-wrap gap-2">
            {JOBS.map((j) => (
              <Chip
                key={j.id}
                active={needs.job === j.id}
                onClick={() => {
                  setNeeds((n) => ({ ...n, job: j.id }));
                  setSubmitted(false);
                }}
                title={j.hint}
              >
                {j.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="2 · Budget">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["free", "Free only"],
                ["cheap", "Cheap / BYOK"],
                ["ok-paid", "OK to pay"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                active={needs.budget === id}
                onClick={() => {
                  setNeeds((n) => ({ ...n, budget: id }));
                  setSubmitted(false);
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="3 · Priority">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["reliability", "Reliability"],
                ["quality", "Peak quality"],
                ["speed", "Speed"],
                ["cost", "Lowest cost"],
                ["privacy", "Privacy"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                active={needs.priority === id}
                onClick={() => {
                  setNeeds((n) => ({ ...n, priority: id }));
                  setSubmitted(false);
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="4 · You are">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["student", "Student"],
                ["builder", "Builder / dev"],
                ["creator", "Creator"],
                ["analyst", "Analyst"],
                ["team", "Team / work"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                active={needs.context === id}
                onClick={() => {
                  setNeeds((n) => ({ ...n, context: id }));
                  setSubmitted(false);
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="bg-[var(--signal)] px-6 py-3 font-medium text-[var(--bg)] transition hover:brightness-110"
        >
          Show my shortlist
        </button>
        {submitted && (
          <p className="max-w-xl font-mono text-xs text-[var(--muted)]">
            {summaryForNeeds(needs)}
          </p>
        )}
      </div>

      {submitted && (
        <div className="space-y-4 results-enter">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-xs text-[var(--muted)]">
              Top {picks.length} fits · curated scores · prove chat picks in Live
              test
            </p>
            {onLiveTest && (
              <button
                type="button"
                onClick={onLiveTest}
                className="font-mono text-xs text-[var(--signal)] hover:underline"
              >
                Skip to Live test →
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {picks.map((p, i) => (
              <article
                key={p.tool.id}
                className={`border bg-[var(--panel)] p-4 sm:p-5 ${
                  i === 0
                    ? "border-[var(--signal)]/50 shadow-[0_0_0_1px_rgba(61,255,200,0.12)]"
                    : "border-[var(--line)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[var(--muted)]">
                        #{i + 1}
                      </span>
                      {i === 0 && (
                        <span className="border border-[var(--signal)]/40 bg-[var(--signal)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--signal)]">
                          Best start
                        </span>
                      )}
                      <h3 className="text-lg text-[var(--ink)]">{p.tool.name}</h3>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                      {p.tool.vendor} · {p.tool.category} · {p.tool.pricing}
                      {p.tool.freeTier ? " · free path" : ""} · reliability{" "}
                      {p.tool.reliability}/5
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl text-[var(--signal)]">
                      {p.fit}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      fit
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full bg-black/40">
                  <div
                    className="h-full bg-[var(--signal)] transition-all duration-500"
                    style={{ width: `${p.fit}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-[var(--ink)]/90">{p.tool.notes}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <span className="text-[var(--ink)]">When:</span> {p.whenToUse}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  <span className="text-[var(--ink)]">Next:</span> {p.nextStep}
                </p>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.reasons.map((r) => (
                    <li
                      key={r}
                      className="border border-[var(--line)] px-2 py-1 font-mono text-[11px] text-[var(--muted)]"
                    >
                      {r}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-4">
                  <a
                    href={p.tool.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--signal)] underline-offset-2 hover:underline"
                  >
                    Open {p.tool.name} →
                  </a>
                  {p.tool.liveTestable && onLiveTest && (
                    <button
                      type="button"
                      onClick={onLiveTest}
                      className="text-sm text-[var(--ink)] underline-offset-2 hover:underline"
                    >
                      Prove reliability here
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--line)] pt-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Market coverage
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="border border-[var(--line)] p-3 transition hover:border-[var(--signal)]/30"
            >
              <div className="text-sm text-[var(--ink)]">{c.label}</div>
              <div className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                {c.blurb}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketBrowser() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [q, setQ] = useState("");

  const tools = useMemo(
    () => filterMarket({ category, freeOnly, liveOnly, q }),
    [category, freeOnly, liveOnly, q],
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
          Market map
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-[var(--ink)]">
          Browse the stack people actually open
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Chat, coding, image, video, data, notes, aggregators. Filter free paths
          or live-testable models. Stars are curated — your prompt is the real
          exam.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Claude, Kling, NotebookLM, Cursor…"
          className="flex-1 border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--signal)]"
        />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="accent-[var(--signal)]"
            />
            Free path
          </label>
          <label className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={liveOnly}
              onChange={(e) => setLiveOnly(e.target.checked)}
              className="accent-[var(--signal)]"
            />
            Live-testable
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <p className="font-mono text-xs text-[var(--muted)]">
        {tools.length} tool{tools.length === 1 ? "" : "s"}
      </p>

      {tools.length === 0 ? (
        <p className="border border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          Nothing matched. Clear filters or try another keyword.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tools.map((t) => (
            <article
              key={t.id}
              className="group border border-[var(--line)] bg-[var(--panel)] p-4 transition hover:border-[var(--signal)]/35"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[var(--ink)] group-hover:text-white">
                    {t.name}
                  </h3>
                  <p className="font-mono text-[11px] text-[var(--muted)]">
                    {t.vendor} · {t.category} · {t.pricing}
                    {t.liveTestable ? " · live-testable" : ""}
                  </p>
                </div>
                <div
                  className="font-mono text-xs text-[var(--signal)]"
                  title={`Curated reliability ${t.reliability}/5`}
                >
                  {"●".repeat(t.reliability)}
                  <span className="text-[var(--muted)]">
                    {"○".repeat(5 - t.reliability)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{t.notes}</p>
              <p className="mt-2 text-xs text-[var(--ink)]/80">
                Best for: {t.bestFor.join(", ")}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Not for: {t.notFor.join(", ")}
              </p>
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-[var(--signal)] hover:underline"
              >
                Visit →
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`border px-3 py-1.5 text-sm transition ${
        active
          ? "border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--ink)]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--signal)]/40"
      }`}
    >
      {children}
    </button>
  );
}
