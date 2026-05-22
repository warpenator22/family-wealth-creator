import { formatGBP } from './finance';
import { UK_LIMITS } from './portfolios';

export interface AssetBucket {
  id: string;
  label: string;
  valueGbp: number;
  category: 'property' | 'us' | 'cash' | 'uk-invested';
  liquid: boolean;
  notes: string;
}

export interface WealthSnapshot {
  buckets: AssetBucket[];
  fxUsdGbp: number;
}

export const DEFAULT_FX_USD_GBP = 0.79;

export const DEFAULT_WEALTH: WealthSnapshot = {
  fxUsdGbp: DEFAULT_FX_USD_GBP,
  buckets: [
    {
      id: 'property',
      label: 'Primary residence',
      valueGbp: 1_400_000,
      category: 'property',
      liquid: false,
      notes: 'Illiquid — not available for ISA/SIPP contributions without downsizing or remortgaging.',
    },
    {
      id: 'us',
      label: 'US investments',
      valueGbp: 500_000 * DEFAULT_FX_USD_GBP,
      category: 'us',
      liquid: true,
      notes: 'Held in USD — consider UK tax on dividends/gains if UK resident; FX adds volatility.',
    },
    {
      id: 'cash-other',
      label: 'Cash & other (UK)',
      valueGbp: 200_000,
      category: 'cash',
      liquid: true,
      notes: 'Deploy strategically — see deployment ladder below.',
    },
    {
      id: 'uk-kids-isa',
      label: 'Your ISA (Kids Fund)',
      valueGbp: 20_000,
      category: 'uk-invested',
      liquid: true,
      notes: 'Your adult ISA — £20k/yr, earmarked for kids’ goal; PFIC-safe stocks only.',
    },
    {
      id: 'uk-isa',
      label: 'Your ISA (Personal)',
      valueGbp: 50_000,
      category: 'uk-invested',
      liquid: true,
      notes: 'Already in plan — max £20k/yr; use GIA for lump sums above allowance.',
    },
    {
      id: 'uk-sipp',
      label: 'Your SIPP',
      valueGbp: 0,
      category: 'uk-invested',
      liquid: false,
      notes: 'Pension wrapper — activate with lump sum and/or monthly contributions.',
    },
  ],
};

export function usdToGbp(usd: number, rate: number): number {
  return usd * rate;
}

export function sumByCategory(
  buckets: AssetBucket[],
  categories: AssetBucket['category'][]
): number {
  return buckets
    .filter((b) => categories.includes(b.category))
    .reduce((s, b) => s + b.valueGbp, 0);
}

export function totalNetWorth(buckets: AssetBucket[]): number {
  return buckets.reduce((s, b) => s + b.valueGbp, 0);
}

export function liquidTotal(buckets: AssetBucket[]): number {
  return buckets.filter((b) => b.liquid).reduce((s, b) => s + b.valueGbp, 0);
}

export interface DeploymentStep {
  priority: number;
  title: string;
  amountHint: string;
  detail: string;
}

export function deploymentLadder(
  cashOtherGbp: number,
  annualIsaRoomPerPerson: number = UK_LIMITS.isa,
  isaHolders: number = 2
): DeploymentStep[] {
  const emergencyTarget = Math.min(50_000, Math.round(cashOtherGbp * 0.25));
  const afterEmergency = Math.max(0, cashOtherGbp - emergencyTarget);
  const yearOneWrappers = annualIsaRoomPerPerson * isaHolders;

  return [
    {
      priority: 1,
      title: 'Emergency buffer',
      amountHint: formatGBP(emergencyTarget),
      detail:
        'Keep 6–12 months essential spending in easy access (Premium Bonds, easy-access savings). Not for equity goals.',
    },
    {
      priority: 2,
      title: 'Max tax wrappers (year 1)',
      amountHint: formatGBP(yearOneWrappers),
      detail: `${isaHolders} ISAs × ${formatGBP(annualIsaRoomPerPerson)} = ${formatGBP(yearOneWrappers)} this tax year (Kids Fund + Personal) — invest on day one if possible.`,
    },
    {
      priority: 3,
      title: 'Activate SIPP',
      amountHint: 'Lump sum + monthly',
      detail:
        'One-off contribution from remaining cash (tax relief boosts effective deposit). Set standing order for £1.5–2k/mo if affordable.',
    },
    {
      priority: 4,
      title: 'GIA for ISA overflow',
      amountHint: formatGBP(Math.max(0, afterEmergency - yearOneWrappers)),
      detail:
        `With ~${formatGBP(afterEmergency)} deployable after buffer, most cannot fit in ISAs immediately. General Investment Account — same funds as ISA, harvest losses annually.`,
    },
    {
      priority: 5,
      title: 'Leave US book diversified',
      amountHint: 'Keep core US pot',
      detail:
        'No need to repatriate all $500k. US holdings complement UK wrappers; rebalance if US weight exceeds your target (e.g. >40% of liquid net worth).',
    },
  ];
}

export { formatGBP };
