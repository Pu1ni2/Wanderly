interface Props {
  spentUSD: number;
  budgetUSD?: number;
}

export function BudgetMeter({ spentUSD, budgetUSD }: Props) {
  if (!budgetUSD) {
    return (
      <div className="text-sm text-neutral-500">Estimated cost: <span className="font-semibold text-neutral-800 dark:text-neutral-200">${spentUSD.toLocaleString()}</span></div>
    );
  }
  const pct = Math.min(100, Math.round((spentUSD / budgetUSD) * 100));
  const over = spentUSD > budgetUSD;
  const barColor = over ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Budget</span>
        <span className="text-sm tabular-nums">
          <span className={`font-semibold ${over ? "text-red-600" : "text-neutral-800 dark:text-neutral-100"}`}>${spentUSD.toLocaleString()}</span>
          <span className="text-neutral-500"> / ${budgetUSD.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
