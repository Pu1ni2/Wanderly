export interface CurrencyInput {
  amount: number;
  from: string;
  to: string;
}

export interface CurrencyResult {
  amount: number;
  from: string;
  to: string;
  converted: number;
  rate: number;
  source: string;
}

const FAKE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155,
  QAR: 3.64,
  AED: 3.67,
  INR: 83,
  CAD: 1.36,
  AUD: 1.51,
};

function mock(input: CurrencyInput): CurrencyResult {
  const fromR = FAKE_RATES[input.from.toUpperCase()] ?? 1;
  const toR = FAKE_RATES[input.to.toUpperCase()] ?? 1;
  const rate = toR / fromR;
  return {
    amount: input.amount,
    from: input.from.toUpperCase(),
    to: input.to.toUpperCase(),
    converted: Math.round(input.amount * rate * 100) / 100,
    rate,
    source: "mock://currency",
  };
}

export async function currency(input: CurrencyInput): Promise<CurrencyResult> {
  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=${input.from.toUpperCase()}&symbols=${input.to.toUpperCase()}`;
    const data = await fetch(url).then(r => r.json());
    const rate = data?.rates?.[input.to.toUpperCase()];
    if (typeof rate !== "number") return mock(input);
    return {
      amount: input.amount,
      from: input.from.toUpperCase(),
      to: input.to.toUpperCase(),
      converted: Math.round(input.amount * rate * 100) / 100,
      rate,
      source: "frankfurter.dev",
    };
  } catch {
    return mock(input);
  }
}
