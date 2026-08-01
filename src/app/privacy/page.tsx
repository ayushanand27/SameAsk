import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — SameAsk",
  description:
    "How SameAsk handles API keys, prompts, and browser storage.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--signal)]">
        Trust
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[var(--ink)]">
        Privacy
      </h1>

      <section className="mt-8 space-y-4 text-[var(--muted)]">
        <p>
          <strong className="text-[var(--ink)]">API keys</strong> you paste are
          stored only in your browser (
          <code className="text-[var(--signal)]">localStorage</code>
          ). They are sent from your browser/session to SameAsk&apos;s compare
          API for that request, then forwarded to OpenRouter or the provider you
          selected. We do not keep a server-side key vault.
        </p>
        <p>
          <strong className="text-[var(--ink)]">Prompts and answers</strong>{" "}
          processed in Live mode are sent to the model providers required for
          that run. Demo mode does not call external models.
        </p>
        <p>
          <strong className="text-[var(--ink)]">History</strong> (if you save
          results) stays in your browser only. Clearing site data removes keys
          and history.
        </p>
        <p>
          <strong className="text-[var(--ink)]">Hosting</strong> runs on Vercel.
          Standard hosting logs may exist for reliability; do not paste secrets
          into prompts.
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
