import { isUsableQuote, type Quote } from './finnhub';

/** 1 USD ≈ GBP (household roll-ups) */
export const FX_USD_TO_GBP = 0.79;

export function toGbp(amount: number, currency: 'GBP' | 'USD'): number {
  if (!Number.isFinite(amount)) return 0;
  return currency === 'USD' ? amount * FX_USD_TO_GBP : amount;
}

export interface HoldingValue {
  /** Always GBP — used for household totals */
  costGbp: number;
  valueGbp: number;
  gainGbp: number;
  gainPct: number;
  dayChangeGbp: number;
  hasLivePrice: boolean;
  /** Amounts in the holding's own currency for display */
  costNative: number;
  valueNative: number;
  gainNative: number;
  currency: 'GBP' | 'USD';
}

export function valueForHolding(
  shares: number,
  /** Total cost in the holding's `currency` (stored as costGbp in JSON for history) */
  cost: number,
  currency: 'GBP' | 'USD',
  quote: Quote | undefined
): HoldingValue {
  const costNative = Number.isFinite(cost) ? cost : 0;
  const costGbp = toGbp(costNative, currency);

  if (!isUsableQuote(quote) || shares <= 0) {
    return {
      costGbp,
      valueGbp: costGbp,
      gainGbp: 0,
      gainPct: 0,
      dayChangeGbp: 0,
      hasLivePrice: false,
      costNative,
      valueNative: costNative,
      gainNative: 0,
      currency,
    };
  }

  const valueNative = shares * quote.price;
  const valueGbp = toGbp(valueNative, currency);
  const gainNative = valueNative - costNative;
  const gainGbp = valueGbp - costGbp;
  const gainPct = costNative > 0 ? (gainNative / costNative) * 100 : 0;
  const dayChangeGbp = toGbp(shares * quote.change, currency);

  return {
    costGbp,
    valueGbp,
    gainGbp,
    gainPct,
    dayChangeGbp,
    hasLivePrice: true,
    costNative,
    valueNative,
    gainNative,
    currency,
  };
}
