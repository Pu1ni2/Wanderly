import type { Itinerary } from "@/lib/types";
import { BudgetMeter } from "./BudgetMeter";
import { CriticBadge } from "./CriticBadge";

interface Props {
  itinerary: Itinerary;
  budgetUSD?: number;
  attempts: number;
  verified: boolean;
  spokenSummary?: string;
}

export function ItineraryView({ itinerary, budgetUSD, attempts, verified, spokenSummary }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-semibold tracking-tight">{itinerary.destination}</h2>
          <CriticBadge attempts={attempts} verified={verified} />
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">{itinerary.summary}</p>
        <BudgetMeter spentUSD={itinerary.estimatedCostUSD} budgetUSD={budgetUSD} />
        {itinerary.costBreakdown && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            {Object.entries(itinerary.costBreakdown).map(([k, v]) => (
              <span key={k}><span className="capitalize">{k}</span>: <span className="font-medium text-neutral-700 dark:text-neutral-300">${Number(v).toLocaleString()}</span></span>
            ))}
          </div>
        )}
        {spokenSummary && <ListenButton text={spokenSummary} />}
      </div>

      <div className="p-5 grid gap-3 sm:grid-cols-2">
        {itinerary.days.map((d) => (
          <div key={d.day} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/60 dark:bg-neutral-900/40">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-semibold">{d.day}</span>
              <h3 className="font-medium">{d.title ?? `Day ${d.day}`}</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              {d.items.map((it, i) => <li key={i} className="leading-relaxed">{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {(itinerary.notes?.length || itinerary.sources?.length) && (
        <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 space-y-1">
          {itinerary.notes?.length ? <div><span className="font-medium text-neutral-600 dark:text-neutral-400">Notes:</span> {itinerary.notes.join(" · ")}</div> : null}
          {itinerary.sources?.length ? <div><span className="font-medium text-neutral-600 dark:text-neutral-400">Sources:</span> {itinerary.sources.join(", ")}</div> : null}
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
      <button onClick={play} className="text-xs px-2.5 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">
        ▶ Listen
      </button>
      <span className="text-[10px] text-neutral-500">AI-generated voice</span>
    </div>
  );
}
