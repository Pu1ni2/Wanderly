import { JapanScene } from "@/components/themed/JapanScene";
import { CountryScene } from "@/components/themed/CountryScene";
import { CountryClient } from "./CountryClient";
import { themeFor } from "@/lib/theme";
import { COUNTRIES, countryForSlug } from "@/lib/countries";

type Params = { country: string };

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const slug = country.toLowerCase();
  const meta = countryForSlug(slug);

  // Japan keeps its bespoke scene; everywhere else uses the shared CountryScene.
  if (slug === "japan") {
    const theme = themeFor("japan");
    return (
      <JapanScene
        kanji="日本"
        romaji="Nihon"
        subtitle="Build a trip across Tokyo, Kyoto, and beyond — verified before you see it."
      >
        <CountryClient
          theme={theme}
          placeholder='Try: "Plan a 4-day trip to Tokyo for 2 people, $2500, with vegetarian food and onsen."'
          defaultDestination="Japan"
          capital="Tokyo"
        />
      </JapanScene>
    );
  }

  const accent = meta.accent;
  const theme = {
    ...themeFor(undefined),
    accent: accent ?? "#bd0029",
  };

  return (
    <CountryScene country={meta}>
      <CountryClient
        theme={theme}
        placeholder={`Try: "Plan a 5-day trip to ${meta.name} for 2 people, $2500, local food and culture."`}
        defaultDestination={meta.name}
        capital={meta.capital}
      />
    </CountryScene>
  );
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}
