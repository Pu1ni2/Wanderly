"use client";
import { motion } from "framer-motion";
import type { Itinerary } from "@/lib/types";
import { BudgetMeter } from "./BudgetMeter";
import { CriticBadge } from "./CriticBadge";

interface Props {
  itinerary: Itinerary;
  budgetUSD?: number;
  attempts: number;
  verified: boolean;
  spokenSummary?: string;
  accent?: string;
  displayFontClass?: string;
}

export function ItineraryView({ itinerary, budgetUSD, attempts, verified, spokenSummary, accent = "#bd0029", displayFontClass = "font-display" }: Props) {
  return (
    <div
      className="rounded-3xl border bg-white overflow-hidden"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
    >
      <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className={`text-2xl sm:text-3xl tracking-tight ${displayFontClass}`}>{itinerary.destination}</h2>
          <CriticBadge attempts={attempts} verified={verified} />
        </div>
        <p className="text-[15px] text-[color:var(--ink-soft)] mb-5 leading-relaxed">{itinerary.summary}</p>
        <BudgetMeter spentUSD={itinerary.estimatedCostUSD} budgetUSD={budgetUSD} />
        {itinerary.costBreakdown && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--ink-faint)]">
            {Object.entries(itinerary.costBreakdown).map(([k, v]) => (
              <span key={k}>
                <span className="capitalize">{k}</span>:{" "}
                <span className="font-medium text-[color:var(--ink)]">${Number(v).toLocaleString()}</span>
              </span>
            ))}
          </div>
        )}
        {spokenSummary && <ListenButton text={spokenSummary} />}
      </div>

      <div className="p-6 grid gap-4 sm:grid-cols-2">
        {itinerary.days.map((d, i) => (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="rounded-2xl border p-5 bg-[color:var(--bg)]"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-baseline gap-2 mb-3">
              <span
                className="inline-flex items-center justify-center h-7 w-7 rounded-full text-white text-xs font-semibold"
                style={{ backgroundColor: accent }}
              >
                {d.day}
              </span>
              <h3 className={`font-medium text-lg ${displayFontClass}`}>{d.title ?? `Day ${d.day}`}</h3>
            </div>
            <ul className="space-y-1.5 text-[14px] text-[color:var(--ink-soft)]">
              {d.items.map((it, j) => <li key={j} className="leading-relaxed">{it}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>

      {(itinerary.notes?.length || itinerary.sources?.length) && (
        <div className="px-6 py-4 border-t text-xs text-[color:var(--ink-faint)] space-y-1" style={{ borderColor: "var(--border)" }}>
          {itinerary.notes?.length ? <div><span className="font-medium text-[color:var(--ink-soft)]">Notes:</span> {itinerary.notes.join(" · ")}</div> : null}
          {itinerary.sources?.length ? <div><span className="font-medium text-[color:var(--ink-soft)]">Sources:</span> {itinerary.sources.join(", ")}</div> : null}
        </div>
      )}
    </div>
  );
}

function ListenButton({ text }: { text: string }) {
  async function play() {
    const btn = document.activeElement as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      const resp = await fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        onClick={play}
        className="text-xs px-3 py-1.5 rounded-full bg-[color:var(--bg)] border hover:bg-white transition"
        style={{ borderColor: "var(--border)" }}
      >
        ▶ Listen
      </button>
      <span className="text-[10px] text-[color:var(--ink-faint)]">AI-generated voice</span>
    </div>
  );
}
