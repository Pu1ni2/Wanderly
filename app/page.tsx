"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Destination, EarthGlobeHandle } from "@/components/landing/EarthGlobe";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { CountryPicker } from "@/components/landing/CountryPicker";
import { COUNTRIES } from "@/lib/countries";

const EarthGlobe = dynamic(
  () => import("@/components/landing/EarthGlobe").then((m) => m.EarthGlobe as unknown as React.ComponentType<Record<string, unknown>>),
  { ssr: false, loading: () => <GlobeSkeleton /> }
);

const DESTINATIONS: Destination[] = COUNTRIES.filter((c) => c.lat != null && c.lng != null).map((c) => ({
  id: c.slug,
  label: `${c.flag ?? "🌍"} ${c.name}${c.capital ? " · " + c.capital : ""}`,
  lat: c.lat as number,
  lng: c.lng as number,
  active: c.slug === "japan",
}));

export default function Landing() {
  const router = useRouter();
  const globeRef = useRef<EarthGlobeHandle | null>(null);

  async function goToCountry(dest: Destination) {
    try { await globeRef.current?.flyTo(dest); } catch {}
    router.push(`/plan/${dest.id}`);
  }

  function goToSlug(slug: string) {
    router.push(`/plan/${slug}`);
  }

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: "linear-gradient(180deg, #fbf6e9 0%, #f7efde 60%, #f4ecdc 100%)" }}>
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35]" style={{
        backgroundImage:
          "radial-gradient(rgba(28,27,31,0.06) 1px, transparent 1px), radial-gradient(rgba(189,0,41,0.025) 1px, transparent 1px)",
        backgroundSize: "26px 26px, 9px 9px",
        backgroundPosition: "0 0, 13px 13px",
      }} />

      <Nav />

      <main className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 sm:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-10 items-center">
          {/* Left: editorial hero */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-stone-500 mb-6"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-700 pulse-dot" />
              Wanderly — a team of specialists
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.05 }}
              className="font-display text-[64px] sm:text-[88px] lg:text-[104px] leading-[0.95] tracking-[-0.035em] text-stone-900"
            >
              Travel
              <br />
              that <em className="italic" style={{ color: "var(--accent)" }}>holds up</em>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.18 }}
              className="mt-7 max-w-md text-[17px] leading-[1.55] text-stone-600"
            >
              Wanderly plans your trip with a team of AI specialists working in parallel. A critic
              verifies every claim against live data — and quietly fixes anything that doesn’t.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.28 }}
              className="mt-9 space-y-4"
            >
              <CountryPicker onSelect={goToSlug} />
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => router.push("/plan/japan")}
                  className="group inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 rounded-full bg-stone-900 text-white text-[14px] font-medium tracking-tight hover:opacity-95 transition"
                  style={{ boxShadow: "0 16px 40px -16px rgba(28,27,31,0.45)" }}
                >
                  Try the Japan showcase
                  <span className="inline-block transition-transform group-hover:translate-x-0.5 text-[15px]">→</span>
                </button>
                <span className="text-xs text-stone-500 tracking-tight">or just speak to the concierge below</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-md"
            >
              <Stat number="13" label="specialists" />
              <Stat number="<60s" label="end-to-end" />
              <Stat number="2x" label="critic retries" />
            </motion.div>
          </div>

          {/* Right: globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="relative aspect-square w-full max-w-[560px] mx-auto"
          >
            {/* Soft red halo behind the globe */}
            <div className="absolute inset-[8%] rounded-full pointer-events-none"
                 style={{ background: "radial-gradient(closest-side, rgba(189,0,41,0.18), rgba(189,0,41,0.04) 60%, transparent 70%)", filter: "blur(8px)" }} />
            <EarthGlobe destinations={DESTINATIONS} onSelect={goToCountry} height={560} />
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
                 style={{ background: "linear-gradient(to top, rgba(244,236,220,0.95), transparent)" }} />
          </motion.div>
        </div>

        {/* Bottom row: small editorial tiles */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7 }}
          className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <Tile chapter="01" title="Plans" body="Planner agent calls flights, hotels, weather, food, transport — in parallel." />
          <Tile chapter="02" title="Verifies" body="Critic re-checks every claim against live sources and the budget you set." />
          <Tile chapter="03" title="Self-corrects" body="When something doesn’t hold up, the team revises before you see it." />
        </motion.div>
      </main>

      <footer className="relative py-12 mt-12 text-center text-[11px] tracking-[0.22em] uppercase text-stone-500">
        plan · verify · self-correct
      </footer>

      <VoicePanel variant="slim" defaultDestination="Japan" />
    </div>
  );
}

function Nav() {
  return (
    <header className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-7 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-display text-[15px] font-semibold">W</div>
        <span className="font-display text-[17px] tracking-tight">Wanderly</span>
      </a>
      <div className="hidden sm:flex items-center gap-6 text-[12px] tracking-tight text-stone-600">
        <a href="#how" className="hover:text-stone-900 transition">How it works</a>
        <a href="/plan/japan" className="hover:text-stone-900 transition">Try Japan</a>
        <span className="text-stone-500">v0.1 · hackathon</span>
      </div>
    </header>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl tracking-tight text-stone-900">{number}</div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{label}</div>
    </div>
  );
}

function Tile({ chapter, title, body }: { chapter: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur p-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-[15px] text-red-700">{chapter}</span>
        <span className="text-[14px] font-medium tracking-tight">{title}</span>
      </div>
      <div className="text-[13px] leading-relaxed text-stone-600">{body}</div>
    </div>
  );
}

function GlobeSkeleton() {
  return (
    <div className="w-full aspect-square max-w-[560px] mx-auto flex items-center justify-center text-stone-500 text-sm">
      Loading globe…
    </div>
  );
}
