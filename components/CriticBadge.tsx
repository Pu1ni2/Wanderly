interface Props {
  attempts: number;
  verified: boolean;
}

export function CriticBadge({ attempts, verified }: Props) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Unverified
      </span>
    );
  }
  const label = attempts <= 1 ? "Verified" : `Verified · re-planned ${attempts - 1}x`;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {label}
    </span>
  );
}
