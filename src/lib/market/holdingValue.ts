import type { Quote } from './finnhub';

const FX_GBP_USD = 0.79;

export interface HoldingValue {
  costGbp: number;
  valueGbp: number;
  gainGbp: number;
  gainPct: number;
  dayChangeGbp: number;
  hasLivePrice: boolean;
}

export function valueForHolding(
  shares: number,
  costGbp: number,
  quote: Quote | undefined
): HoldingValue {
  const cost = costGbp;
  if (!quote || shares <= 0) {
    return {
      costGbp: cost,
      valueGbp: cost,
      gainGbp: 0,
      gainPct: 0,
      dayChangeGbp: 0,
      hasLivePrice: false,
    };
  }
  const valueGbp = shares * quote.price * FX_GBP_USD;
  const gainGbp = valueGbp - cost;
  const gainPct = cost > 0 ? (gainGbp / cost) * 100 : 0;
  const dayChangeGbp = shares * quote.change * FX_GBP_USD;
  return {
    costGbp: cost,
    valueGbp,
    gainGbp,
    gainPct,
    dayChangeGbp,
    hasLivePrice: true,
  };
}
