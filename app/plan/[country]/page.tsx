import { notFound } from "next/navigation";
import { themes, themeFor } from "@/lib/theme";
import { JapanScene } from "@/components/themed/JapanScene";
import { CountryClient } from "./CountryClient";

type Params = { country: string };

const META: Record<string, { kanji: string; romaji: string; subtitle: string; placeholder: string; defaultDestination: string }> = {
  japan: {
    kanji: "日本",
    romaji: "Nihon",
    subtitle: "Build a trip across Tokyo, Kyoto, and beyond — verified before you see it.",
    placeholder: 'Try: "Plan a 4-day trip to Tokyo for 2 people, $2500, with vegetarian food and onsen."',
    defaultDestination: "Japan",
  },
};

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const key = country.toLowerCase();
  if (!themes[key]) notFound();
  const theme = themeFor(key);
  const meta = META[key];

  if (key === "japan") {
    return (
      <JapanScene kanji={meta.kanji} romaji={meta.romaji} subtitle={meta.subtitle}>
        <CountryClient theme={theme} placeholder={meta.placeholder} defaultDestination={meta.defaultDestination} />
      </JapanScene>
    );
  }

  return (
    <div className="min-h-screen washi">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className={`text-5xl ${theme.fontDisplayClass}`}>{country}</h1>
        <CountryClient theme={theme} placeholder={meta?.placeholder} defaultDestination={meta?.defaultDestination ?? country} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(themes).map((country) => ({ country }));
}
