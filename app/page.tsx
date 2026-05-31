"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hero } from "@/components/landing/Hero";
import type { Destination, EarthGlobeHandle } from "@/components/landing/EarthGlobe";

const EarthGlobe = dynamic(
  () => import("@/components/landing/EarthGlobe").then((m) => m.EarthGlobe as unknown as React.ComponentType<Record<string, unknown>>),
  { ssr: false, loading: () => <GlobeFallback /> }
);

const DESTINATIONS: Destination[] = [
  { id: "japan",   label: "Japan — Tokyo",   lat: 35.6762, lng: 139.6503, color: "#bd0029" },
  { id: "italy",   label: "Italy — Rome (soon)",     lat: 41.9028, lng: 12.4964, color: "#94a3b8" },
  { id: "iceland", label: "Iceland — Reykjavík (soon)", lat: 64.1466, lng: -21.9426, color: "#94a3b8" },
  { id: "morocco", label: "Morocco — Marrakech (soon)", lat: 31.6295, lng: -7.9811, color: "#94a3b8" },
  { id: "thailand",label: "Thailand — Bangkok (soon)", lat: 13.7563, lng: 100.5018, color: "#94a3b8" },
];

export default function Landing() {
  const router = useRouter();
  const globeRef = useRef<EarthGlobeHandle | null>(null);

  async function goToCountry(dest: Destination) {
    if (globeRef.current) {
      await globeRef.current.flyTo(dest);
    }
    if (dest.id !== "japan") {
      // Future: route to other countries. For now, fall back to Japan.
      router.push(`/plan/japan`);
      return;
    }
    router.push(`/plan/${dest.id}`);
  }

  return (
    <div className="min-h-screen washi relative overflow-hidden">
      <Nav />

      <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-10">
        <Hero onPickJapan={() => goToCountry(DESTINATIONS[0])} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        className="relative max-w-6xl mx-auto px-4 pb-20"
      >
        <div className="relative rounded-[2rem] border bg-gradient-to-b from-white to-[color:var(--bg)] overflow-hidden" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <EarthGlobe destinations={DESTINATIONS} onSelect={goToCountry} height={560} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/70 to-transparent" />
          <div className="absolute left-6 bottom-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-faint)]">
            Day 1: <span className="text-[color:var(--ink-soft)]">Japan only · more cities soon</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Tile title="Plans" body="A planner agent calls flight, hotel, weather, and food specialists in parallel." />
          <Tile title="Verifies" body="A critic re-checks every claim against live data and the budget you set." />
          <Tile title="Self-corrects" body="When something doesn’t hold up, the team revises automatically." />
        </div>
      </motion.div>

      <footer className="py-10 text-center text-xs text-[color:var(--ink-faint)]">
        Built for a multi-agent hackathon · plan, verify, self-correct
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <header className="relative max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[color:var(--ink)] flex items-center justify-center text-white font-display font-semibold">W</div>
        <span className="font-display text-lg tracking-tight">Wanderly</span>
      </div>
      <div className="text-xs text-[color:var(--ink-faint)]">a multi-agent travel concierge</div>
    </header>
  );
}

function Tile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
      <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent)] mb-1.5">{title}</div>
      <div className="text-[color:var(--ink-soft)] leading-relaxed">{body}</div>
    </div>
  );
}

function GlobeFallback() {
  return (
    <div className="w-full" style={{ height: 560 }}>
      <div className="h-full w-full flex items-center justify-center text-[color:var(--ink-faint)] text-sm">
        Loading globe…
      </div>
    </div>
  );
}
