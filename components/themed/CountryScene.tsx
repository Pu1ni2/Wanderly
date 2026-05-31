"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { CountryMeta } from "@/lib/countries";

interface Props {
  country: CountryMeta;
  children: ReactNode;
}

export function CountryScene({ country, children }: Props) {
  const accent = country.accent ?? "#bd0029";
  const showsNative = country.nativeName && country.nativeName !== country.name;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(180deg, #fbf6e9 0%, #f6ecd6 100%)" }}>
      {/* paper grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.4]" style={{
        backgroundImage:
          "radial-gradient(rgba(28,27,31,0.06) 1px, transparent 1px), radial-gradient(rgba(189,0,41,0.025) 1px, transparent 1px)",
        backgroundSize: "26px 26px, 9px 9px",
        backgroundPosition: "0 0, 13px 13px",
      }} />

      {/* warm accent disc */}
      <div className="pointer-events-none absolute -top-40 -right-28 h-[36rem] w-[36rem] rounded-full" style={{
        background: `radial-gradient(closest-side, ${hexToRgba(accent, 0.18)}, ${hexToRgba(accent, 0.04)} 55%, transparent 70%)`,
        filter: "blur(4px)",
      }} aria-hidden />

      <Nav country={country} />

      {/* Editorial hero */}
      <header className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 sm:pt-14 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          className="grid grid-cols-1 lg:grid-cols-[auto_1fr] items-end gap-6 lg:gap-12"
        >
          <div className="flex items-end gap-5">
            <div className="font-display font-semibold text-[6.5rem] sm:text-[8.5rem] lg:text-[9rem] leading-[0.86] tracking-[-0.045em] text-stone-900">
              {country.name}
            </div>
            {country.flag && (
              <div className="pb-5 text-5xl select-none" aria-hidden>{country.flag}</div>
            )}
          </div>

          <div className="lg:pb-6">
            <div className="text-[10px] tracking-[0.4em] uppercase text-stone-500 mb-2">Chapter 02 · Anywhere</div>
            {showsNative && (
              <div className="font-display italic text-[18px] mb-2 text-stone-700">{country.nativeName}</div>
            )}
            <h1 className="font-display text-2xl sm:text-[26px] lg:text-[30px] tracking-tight leading-[1.18] text-stone-900 max-w-2xl">
              Plan a trip across <span style={{ color: accent }}>{country.name}</span> — verified before you see it.
            </h1>
            <div className="mt-4 flex items-center gap-3 text-[12px] text-stone-500">
              <span className="h-px w-12 bg-stone-300" />
              <span>13 specialists working in parallel · 1 critic checking their work</span>
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

function Nav({ country }: { country: CountryMeta }) {
  return (
    <header className="relative max-w-[1240px] mx-auto px-6 sm:px-8 pt-7 flex items-center justify-between z-10">
      <a href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-display text-[15px] font-semibold">W</div>
        <span className="font-display text-[17px] tracking-tight text-stone-900">Wanderly</span>
      </a>
      <div className="flex items-center gap-5 text-[12px] tracking-tight text-stone-600">
        <a href="/" className="hover:text-stone-900 transition">← globe</a>
        <span className="text-stone-500 hidden sm:inline">{country.name}{country.capital ? ` · ${country.capital}` : ""}</span>
      </div>
    </header>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
