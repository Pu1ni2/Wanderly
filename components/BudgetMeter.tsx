interface Props {
  spentUSD: number;
  budgetUSD?: number;
}

export function BudgetMeter({ spentUSD, budgetUSD }: Props) {
  if (!budgetUSD) {
    return (
      <div className="text-sm text-[color:var(--ink-soft)]">
        Estimated cost:{" "}
        <span className="font-semibold text-[color:var(--ink)]">${spentUSD.toLocaleString()}</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((spentUSD / budgetUSD) * 100));
  const over = spentUSD > budgetUSD;
  const barColor = over ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wide text-[color:var(--ink-faint)]">Budget</span>
        <span className="text-sm tabular-nums">
          <span className={`font-semibold ${over ? "text-red-600" : "text-[color:var(--ink)]"}`}>
            ${spentUSD.toLocaleString()}
          </span>
          <span className="text-[color:var(--ink-faint)]"> / ${budgetUSD.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[color:var(--bg)] overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
