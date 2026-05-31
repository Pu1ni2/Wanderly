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
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(180deg, #fbf6e9 0%, #f6ecd6 100%)" }}>
      {/* paper grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{
        backgroundImage:
          "radial-gradient(rgba(28,27,31,0.06) 1px, transparent 1px), radial-gradient(rgba(189,0,41,0.025) 1px, transparent 1px)",
        backgroundSize: "26px 26px, 9px 9px",
        backgroundPosition: "0 0, 13px 13px",
      }} />

      {/* warm sun disc */}
      <div className="pointer-events-none absolute -top-40 -right-28 h-[36rem] w-[36rem] rounded-full" style={{
        background: "radial-gradient(closest-side, rgba(189,0,41,0.18), rgba(189,0,41,0.04) 55%, transparent 70%)",
        filter: "blur(4px)",
      }} aria-hidden />

      {/* faint torii */}
      <ToriiSilhouette />

      <SakuraPetals count={14} />

      <Nav />

      {/* Editorial hero */}
      <header className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-12 sm:pt-16 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="grid grid-cols-1 lg:grid-cols-[auto_1fr] items-end gap-6 lg:gap-12"
        >
          <div className="flex items-end gap-5">
            <div className="font-jp font-bold text-[9rem] sm:text-[12rem] leading-[0.86] tracking-[-0.04em]" style={{ color: "var(--accent)" }}>
              {kanji}
            </div>
            {romaji && (
              <div className="pb-4">
                <div className="text-[10px] tracking-[0.4em] uppercase text-[color:var(--ink-faint)] mb-1">Chapter 01</div>
                <div className="text-[13px] tracking-[0.32em] uppercase text-[color:var(--ink-soft)]">{romaji}</div>
              </div>
            )}
          </div>

          <div className="lg:pb-6">
            <h1 className="font-display text-2xl sm:text-[28px] lg:text-[34px] tracking-tight leading-[1.15] text-[color:var(--ink)] max-w-2xl">
              {subtitle}
            </h1>
            <div className="mt-5 flex items-center gap-3 text-[12px] text-[color:var(--ink-faint)]">
              <span className="h-px w-12 bg-[color:var(--ink-faint)]/40" />
              <span>verified by a critic agent before you see it</span>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pb-24">
        {children}
      </main>
    </div>
  );
}

function Nav() {
  return (
    <header className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-7 flex items-center justify-between z-10">
      <a href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-[color:var(--ink)] flex items-center justify-center text-white font-display text-[15px] font-semibold">W</div>
        <span className="font-display text-[17px] tracking-tight">Wanderly</span>
      </a>
      <div className="flex items-center gap-5 text-[12px] tracking-tight text-[color:var(--ink-soft)]">
        <a href="/" className="hover:text-[color:var(--ink)] transition">← globe</a>
        <span className="text-[color:var(--ink-faint)] hidden sm:inline">日本 · Japan</span>
      </div>
    </header>
  );
}

function ToriiSilhouette() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 220"
      className="pointer-events-none absolute left-1/2 top-72 w-[34rem] -translate-x-1/2 opacity-[0.04]"
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
