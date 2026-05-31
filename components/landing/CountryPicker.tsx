"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES, slugifyCountry, type CountryMeta } from "@/lib/countries";

interface Props {
  onSelect: (countryOrSlug: string) => void;
  placeholder?: string;
}

export function CountryPicker({ onSelect, placeholder = "Search any country — Iceland, Vietnam, Ghana…" }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!q.trim()) return COUNTRIES.slice(0, 8);
    const needle = q.toLowerCase();
    const scored = COUNTRIES.map((c) => {
      const hay = `${c.name} ${c.nativeName ?? ""} ${c.capital ?? ""}`.toLowerCase();
      let score = 0;
      if (c.name.toLowerCase().startsWith(needle)) score += 10;
      if (hay.startsWith(needle)) score += 8;
      if (hay.includes(needle)) score += 3;
      return { c, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    return scored.map((x) => x.c);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(c?: CountryMeta) {
    const slug = c ? c.slug : slugifyCountry(q);
    if (!slug) return;
    onSelect(slug);
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 px-4 py-3 rounded-full border bg-white" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
        <SearchIcon className="h-4 w-4 text-stone-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(results.length - 1, i + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
            else if (e.key === "Enter") {
              e.preventDefault();
              if (results.length > 0) pick(results[activeIdx]);
              else if (q.trim()) pick();
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-stone-400 text-stone-900"
        />
        {q && (
          <button onClick={() => pick()} className="text-[11px] uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900 px-2 py-1 rounded-full">
            ↵
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (results.length > 0 || q.trim()) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border bg-white overflow-hidden"
            style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            {results.map((c, i) => (
              <button
                key={c.slug}
                onClick={() => pick(c)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition ${i === activeIdx ? "bg-stone-50" : "bg-white"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg" aria-hidden>{c.flag ?? "🌍"}</span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-stone-900 truncate">{c.name}</div>
                    {c.capital && <div className="text-[11px] text-stone-500 truncate">{c.capital}</div>}
                  </div>
                </div>
                <span className="text-stone-300 text-sm">→</span>
              </button>
            ))}
            {q.trim() && !results.some((r) => r.name.toLowerCase() === q.toLowerCase()) && (
              <button
                onClick={() => pick()}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-white hover:bg-stone-50 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden>🌍</span>
                  <div className="text-[13px] text-stone-700">
                    Plan a trip to <span className="font-medium text-stone-900">{q}</span>
                  </div>
                </div>
                <span className="text-stone-300 text-sm">↵</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}
