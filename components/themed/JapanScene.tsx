"use client";
import { motion } from "framer-motion";
import { SakuraPetals } from "./SakuraPetals";
import type { ReactNode } from "react";

interface Props {
  kanji: string;
  romaji?: string;
  subtitle: string;
  children: ReactNode;
}

export function JapanScene({ kanji, romaji, subtitle, children }: Props) {
  return (
    <div className="relative min-h-screen washi overflow-hidden">
      {/* sun disc */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full" style={{
        background: "radial-gradient(closest-side, rgba(189,0,41,0.16), rgba(189,0,41,0.02) 70%, transparent)",
        filter: "blur(2px)",
      }} aria-hidden />

      {/* torii silhouette far right */}
      <ToriiSilhouette />

      {/* falling sakura */}
      <SakuraPetals count={16} />

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[color:var(--ink)] flex items-center justify-center text-white font-display font-semibold">W</div>
            <span className="font-display text-lg tracking-tight">Wanderly</span>
          </a>
          <a href="/" className="text-xs text-[color:var(--ink-faint)] hover:text-[color:var(--ink)] transition">← back to globe</a>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-10 flex items-end gap-6"
        >
          <div className="font-jp text-[7rem] sm:text-[9rem] leading-[0.9] tracking-tight" style={{ color: "var(--accent)" }}>
            {kanji}
          </div>
          <div className="pb-3">
            {romaji && (
              <div className="text-sm tracking-[0.32em] uppercase text-[color:var(--ink-faint)] mb-1">{romaji}</div>
            )}
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-[color:var(--ink)] max-w-md leading-snug">
              {subtitle}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function ToriiSilhouette() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 220"
      className="pointer-events-none absolute right-4 sm:right-10 top-28 w-44 sm:w-60 opacity-[0.07]"
      style={{ color: "var(--ink)" }}
    >
      <g fill="currentColor">
        <rect x="36" y="60" width="168" height="14" rx="2" />
        <rect x="44" y="78" width="152" height="6" />
        <rect x="58" y="84" width="12" height="120" />
        <rect x="170" y="84" width="12" height="120" />
        <path d="M28 56 Q 120 26 212 56 L 212 60 L 28 60 Z" />
      </g>
    </svg>
  );
}
