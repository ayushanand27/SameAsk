import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology — SameAsk",
  description:
    "How SameAsk measures answer similarity across repeated model runs — and what it does not measure.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
        Transparency
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[var(--ink)]">
        Methodology
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        SameAsk helps people pick tools by need, then measures{" "}
        <strong className="text-[var(--ink)]">answer similarity</strong> across
        repeated runs of the same prompt. That is not a quality or IQ score.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl text-[var(--ink)]">What we measure</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
          <li>
            Same prompt, N runs (2–5), default temperature 0.3 for Live tests
          </li>
          <li>
            Pairwise similarity between every pair of successful answers
          </li>
          <li>
            Reported score = mean pairwise similarity; we also store min / max /
            stdev of pairs
          </li>
          <li>
            With OpenRouter or OpenAI keys:{" "}
            <code className="text-[var(--signal)]">text-embedding-3-small</code>{" "}
            cosine (70%) blended with paraphrase-aware lexical score (30%)
          </li>
          <li>
            Without embeddings: content-word Jaccard + bigrams + bag-of-words
            cosine
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl text-[var(--ink)]">What we do not measure</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
          <li>Factual correctness or hallucination rate</li>
          <li>Coding quality, helpfulness, or style preference</li>
          <li>Arena Elo / benchmark leaderboard rank</li>
          <li>
            “Best model overall” — only “closest answers on this prompt under
            these settings”
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl text-[var(--ink)]">Limits</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--muted)]">
          <li>3 runs is directional; 5 runs is stabler but still not a lab eval</li>
          <li>
            A mediocre answer repeated verbatim can outrank a better answer that
            rephrases
          </li>
          <li>Demo mode uses fixed canned variance to teach the idea</li>
          <li>Find-tab “fit” scores are curated matching — separate from Live</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl text-[var(--ink)]">Privacy</h2>
        <p className="text-[var(--muted)]">
          API keys stay in your browser localStorage and are sent only to the
          providers you choose for that request. SameAsk does not store keys on
          a server. See{" "}
          <Link href="/privacy" className="text-[var(--signal)] hover:underline">
            Privacy
          </Link>
          .
        </p>
      </section>

      <p className="mt-12">
        <Link href="/" className="text-[var(--signal)] hover:underline">
          ← Back to SameAsk
        </Link>
      </p>
    </main>
  );
}
