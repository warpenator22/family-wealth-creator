import type { UkLine, UsLine } from './modelPortfolios';
import { getModelById } from './modelPortfolios';

import type { AccountChannel } from '../household/accounts';

export interface AllocationRow {
  ticker: string;
  name: string;
  weight: number;
  amount: number;
  meta?: string;
}

export function allocate(
  modelId: string,
  pot: number,
  channel: AccountChannel
): AllocationRow[] {
  if (channel === 'crypto') return [];
  const model = getModelById(modelId);
  if (!model) return [];

  const lines: (UkLine | UsLine)[] = channel === 'uk' ? model.uk : model.us;
  const totalWeight = lines.reduce((s, l) => s + l.weight, 0);

  return lines
    .filter((l) => l.weight > 0)
    .map((line) => {
      const w = totalWeight > 0 ? (line.weight / totalWeight) * 100 : 0;
      const amount = Math.round((w / 100) * pot * 100) / 100;
      const meta =
        channel === 'uk'
          ? [
              (line as UkLine).exchange,
              (line as UkLine).accumulating ? 'Acc' : 'Dist',
              (line as UkLine).ocf ? `OCF ${(line as UkLine).ocf}` : '',
              (line as UkLine).isin ?? '',
            ]
              .filter(Boolean)
              .join(' · ')
          : [(line as UsLine).sector, (line as UsLine).note].filter(Boolean).join(' · ');

      return {
        ticker: line.ticker,
        name: line.name,
        weight: Math.round(w * 10) / 10,
        amount,
        meta: meta || undefined,
      };
    });
}

export function sumAllocated(rows: AllocationRow[]): number {
  return rows.reduce((s, r) => s + r.amount, 0);
}

export function formatMoney(amount: number, currency: 'GBP' | 'USD'): string {
  return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'USD' ? 0 : 0,
  }).format(amount);
}
