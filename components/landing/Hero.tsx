"use client";
import { motion } from "framer-motion";

interface Props {
  onPickJapan: () => void;
}

export function Hero({ onPickJapan }: Props) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-faint)] mb-5"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] pulse-dot" />
        a team of specialists, working in parallel
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
        className="font-display text-5xl sm:text-6xl tracking-[-0.02em] leading-[1.05] mb-4"
      >
        Plan a trip that <em className="italic text-[color:var(--accent)]">holds up</em>.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
        className="text-[17px] text-[color:var(--ink-soft)] leading-relaxed mb-8"
      >
        Wanderly orchestrates a team of AI agents — they plan, verify against live data, and
        self-correct before you ever see the itinerary.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.18 }}
        className="flex items-center justify-center gap-3"
      >
        <button
          onClick={onPickJapan}
          className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[color:var(--ink)] text-white text-sm font-medium hover:opacity-90 transition"
        >
          Plan a trip to Japan
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
        <span className="text-xs text-[color:var(--ink-faint)]">or click any marker on the globe</span>
      </motion.div>
    </div>
  );
}
