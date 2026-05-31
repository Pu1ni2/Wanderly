import { notFound } from "next/navigation";
import { themes, themeFor } from "@/lib/theme";
import { PlanningExperience } from "@/components/plan/PlanningExperience";
import Link from "next/link";

type Params = { country: string };

const TITLES: Record<string, { display: string; sub: string; placeholder: string; defaultDestination: string }> = {
  japan: {
    display: "日本",
    sub: "Plan a Japan itinerary, verified.",
    placeholder: 'Try: "Plan a 4-day trip to Tokyo for 2 people, $2500, with vegetarian food and onsen."',
    defaultDestination: "Japan",
  },
};

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const key = country.toLowerCase();
  if (!themes[key]) notFound();
  const theme = themeFor(key);
  const meta = TITLES[key];

  return (
    <div className="min-h-screen washi">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[color:var(--ink)] flex items-center justify-center text-white font-display font-semibold">W</div>
            <span className="font-display text-lg tracking-tight">Wanderly</span>
          </Link>
          <Link href="/" className="text-xs text-[color:var(--ink-faint)] hover:text-[color:var(--ink)] transition">← back to globe</Link>
        </header>

        <div className="mb-8">
          <div className={`text-7xl sm:text-8xl ${theme.fontDisplayClass} leading-none mb-3`} style={{ color: theme.accent }}>
            {meta.display}
          </div>
          <p className="text-[color:var(--ink-soft)] text-lg max-w-xl">{meta.sub}</p>
        </div>

        <PlanningExperience
          theme={theme}
          defaultPlaceholder={meta.placeholder}
          initialDestination={meta.defaultDestination}
        />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(themes).map((country) => ({ country }));
}
