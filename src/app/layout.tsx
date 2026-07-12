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
  title: "SameAsk — Right AI. Right time.",
  description:
    "Tell us the job. Get a shortlist across chat, coding, image, video, and data. Prove chat models stay consistent with your own API keys.",
  openGraph: {
    title: "SameAsk — Right AI. Right time.",
    description:
      "Need → shortlist → prove reliability. Stop drowning in AI tabs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SameAsk — Right AI. Right time.",
    description:
      "Need → shortlist → prove reliability. Stop drowning in AI tabs.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
