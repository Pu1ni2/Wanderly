export interface WeatherInput {
  city: string;
  startDate?: string;
  endDate?: string;
}

export interface WeatherResult {
  city: string;
  summary: string;
  forecast: Array<{ date: string; tempHighC: number; tempLowC: number; condition: string }>;
  source: string;
}

const MOCK: WeatherResult = {
  city: "(mock)",
  summary: "Warm and mostly sunny, occasional clouds. Highs around 28°C, lows around 19°C.",
  forecast: [
    { date: "day-1", tempHighC: 28, tempLowC: 19, condition: "Sunny" },
    { date: "day-2", tempHighC: 27, tempLowC: 20, condition: "Partly cloudy" },
    { date: "day-3", tempHighC: 29, tempLowC: 21, condition: "Sunny" },
    { date: "day-4", tempHighC: 26, tempLowC: 18, condition: "Light clouds" },
  ],
  source: "mock://weather",
};

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorms";
  return "Unknown";
}

export async function weather(input: WeatherInput): Promise<WeatherResult> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=1`;
    const geo = await fetch(geoUrl).then(r => r.json());
    const place = geo?.results?.[0];
    if (!place) return { ...MOCK, city: input.city };

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=7&timezone=auto`;
    const fc = await fetch(forecastUrl).then(r => r.json());
    const daily = fc?.daily;
    if (!daily) return { ...MOCK, city: input.city };

    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      tempHighC: Math.round(daily.temperature_2m_max[i]),
      tempLowC: Math.round(daily.temperature_2m_min[i]),
      condition: describeWeatherCode(daily.weathercode[i]),
    }));

    const avgHigh = Math.round(forecast.reduce((s: number, d: { tempHighC: number }) => s + d.tempHighC, 0) / forecast.length);
    const avgLow = Math.round(forecast.reduce((s: number, d: { tempLowC: number }) => s + d.tempLowC, 0) / forecast.length);

    return {
      city: input.city,
      summary: `Average highs around ${avgHigh}°C, lows around ${avgLow}°C. Mostly ${forecast[0].condition.toLowerCase()} in the days ahead.`,
      forecast,
      source: "open-meteo.com",
    };
  } catch {
    return { ...MOCK, city: input.city };
  }
}
