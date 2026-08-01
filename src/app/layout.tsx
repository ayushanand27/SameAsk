import type { Metadata } from "next";
import { Space_Grotesk, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sameask.vercel.app"),
  title: {
    default: "SameAsk — Right AI. Right time.",
    template: "%s · SameAsk",
  },
  description:
    "Need-based AI tool shortlists plus live answer-similarity testing across ChatGPT, Claude, Gemini, and more. BYOK. Transparent methodology.",
  keywords: [
    "AI comparison",
    "LLM consistency",
    "answer similarity",
    "ChatGPT vs Claude",
    "AI tool finder",
    "OpenRouter",
  ],
  openGraph: {
    title: "SameAsk — Right AI. Right time.",
    description:
      "Match AI tools to your job, then measure answer similarity on your prompt — not leaderboard vibes.",
    type: "website",
    url: "https://sameask.vercel.app",
    siteName: "SameAsk",
  },
  twitter: {
    card: "summary_large_image",
    title: "SameAsk — Right AI. Right time.",
    description:
      "Need → shortlist → answer similarity on your prompt. Free · BYOK.",
  },
  alternates: {
    canonical: "https://sameask.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SameAsk",
  url: "https://sameask.vercel.app",
  description:
    "Need-based AI shortlists and live answer-similarity testing across major chat models.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
