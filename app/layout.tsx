import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderly — your multi-agent travel concierge",
  description:
    "A team of AI specialists that plans, verifies, and self-corrects your trip. Talk to it. It listens, books nothing, and just hands you an itinerary that holds up.",
  applicationName: "Wanderly",
  keywords: ["travel planner", "AI travel", "multi-agent", "itinerary", "voice concierge"],
  openGraph: {
    title: "Wanderly — your multi-agent travel concierge",
    description: "Plan a trip that holds up. A team of AI agents plans, verifies, and self-corrects.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderly — your multi-agent travel concierge",
    description: "Plan a trip that holds up.",
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
      className={`${fraunces.variable} ${inter.variable} ${notoSerifJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
