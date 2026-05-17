import type { UkLine, UsLine } from './modelPortfolios';
import { getModelById } from './modelPortfolios';

export type InvestAccountId =
  | 'kids-isa'
  | 'personal-isa'
  | 'personal-sipp'
  | 'uk-gia'
  | 'us-brokerage';

export interface InvestAccount {
  id: InvestAccountId;
  label: string;
  channel: 'uk' | 'us';
  currency: 'GBP' | 'USD';
  defaultPot: number;
  suggestedModelId: string;
}

export const INVEST_ACCOUNTS: InvestAccount[] = [
  {
    id: 'kids-isa',
    label: "Kids' ISA",
    channel: 'uk',
    currency: 'GBP',
    defaultPot: 20_000,
    suggestedModelId: 'growth-aggressive',
  },
  {
    id: 'personal-isa',
    label: 'Your ISA',
    channel: 'uk',
    currency: 'GBP',
    defaultPot: 50_000,
    suggestedModelId: 'growth-aggressive',
  },
  {
    id: 'personal-sipp',
    label: 'Your SIPP',
    channel: 'uk',
    currency: 'GBP',
    defaultPot: 0,
    suggestedModelId: 'sipp-accumulation',
  },
  {
    id: 'uk-gia',
    label: 'UK GIA (ISA overflow)',
    channel: 'uk',
    currency: 'GBP',
    defaultPot: 100_000,
    suggestedModelId: 'growth-aggressive',
  },
  {
    id: 'us-brokerage',
    label: 'US brokerage (~$500k)',
    channel: 'us',
    currency: 'USD',
    defaultPot: 500_000,
    suggestedModelId: 'us-sp500-core',
  },
];

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
  channel: 'uk' | 'us'
): AllocationRow[] {
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
