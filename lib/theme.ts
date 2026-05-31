export interface Theme {
  name: string;
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentSoft: string;
  border: string;
  fontDisplayClass: string;
  motif: "none" | "sakura";
  heroImage?: string;
}

export const baseTheme: Theme = {
  name: "base",
  bg: "#faf7f2",
  surface: "#ffffff",
  ink: "#1c1b1f",
  inkSoft: "#5b5963",
  accent: "#bd0029",
  accentSoft: "#f7d6e0",
  border: "rgba(28,27,31,0.08)",
  fontDisplayClass: "font-display",
  motif: "none",
};

export const themes: Record<string, Theme> = {
  japan: {
    ...baseTheme,
    name: "japan",
    accent: "#bd0029",
    accentSoft: "#f7d6e0",
    fontDisplayClass: "font-jp",
    motif: "sakura",
  },
};

export function themeFor(country: string | undefined): Theme {
  if (!country) return baseTheme;
  return themes[country.toLowerCase()] ?? baseTheme;
}
