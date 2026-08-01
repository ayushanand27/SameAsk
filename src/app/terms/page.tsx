import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for SameAsk — BYOK AI selection and answer-similarity testing.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
        Legal
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[var(--ink)]">
        Terms of use
      </h1>
      <p className="mt-4 text-sm text-[var(--muted)]">Last updated: July 12, 2026</p>

      <section className="mt-8 space-y-4 text-[var(--muted)]">
        <p>
          SameAsk is a free tool that helps you shortlist AI products by need and
          measure <strong className="text-[var(--ink)]">answer similarity</strong>{" "}
          across repeated runs. It is not a substitute for professional advice,
          model vendor SLAs, or formal evaluation labs.
        </p>
        <p>
          <strong className="text-[var(--ink)]">Your keys, your spend.</strong>{" "}
          Live tests use API keys you provide. You are responsible for provider
          billing, rate limits, and complying with each provider&apos;s terms.
        </p>
        <p>
          <strong className="text-[var(--ink)]">No warranty.</strong> Scores are
          directional estimates for a specific prompt and settings. Similarity is
          not quality, safety, or factual accuracy. Demo mode uses canned
          answers.
        </p>
        <p>
          <strong className="text-[var(--ink)]">Acceptable use.</strong> Do not
          use SameAsk to attack systems, harvest credentials, generate illegal
          content, or overwhelm third-party APIs beyond fair use.
        </p>
        <p>
          Third-party model names and trademarks belong to their owners. SameAsk
          is independent and not affiliated with OpenAI, Anthropic, Google, xAI,
          or other labs unless explicitly stated.
        </p>
      </section>

      <p className="mt-12 flex flex-wrap gap-4">
        <Link href="/" className="text-[var(--signal)] hover:underline">
          ← Back to SameAsk
        </Link>
        <Link href="/privacy" className="text-[var(--signal)] hover:underline">
          Privacy
        </Link>
        <Link href="/methodology" className="text-[var(--signal)] hover:underline">
          Methodology
        </Link>
      </p>
    </main>
  );
}
