export type WrapperType = 'isa' | 'sipp';

export interface Holding {
  name: string;
  ticker: string;
  weight: number;
  rationale: string;
}

export interface PortfolioPlan {
  id: string;
  title: string;
  subtitle: string;
  wrapper: WrapperType;
  principal: number;
  target: number;
  years: number;
  annualAllowance: number;
  annualContribution: number;
  assumedReturn: number;
  holdings: Holding[];
  notes: string[];
}

export const UK_LIMITS = {
  isa: 20_000,
  sipp: 60_000,
} as const;

/** Growth-focused allocation for 5-year wealth-building goals */
const growthHoldings: Holding[] = [
  {
    name: 'Vanguard FTSE Global All Cap',
    ticker: 'VWRP',
    weight: 70,
    rationale: 'Core global equity exposure, accumulating.',
  },
  {
    name: 'iShares MSCI World Small Cap',
    ticker: 'WSML',
    weight: 15,
    rationale: 'Size premium tilt for higher long-run growth.',
  },
  {
    name: 'iShares Core MSCI EM IMI',
    ticker: 'EIMI',
    weight: 10,
    rationale: 'Emerging markets diversification.',
  },
  {
    name: 'Vanguard Global Bond Index',
    ticker: 'VAGP',
    weight: 5,
    rationale: 'Small stabiliser; keep low for 5-year growth horizon.',
  },
];

/** Long-horizon SIPP accumulation (pre-retirement) */
const sippAccumulationHoldings: Holding[] = [
  {
    name: 'Vanguard FTSE Global All Cap',
    ticker: 'VWRP',
    weight: 65,
    rationale: 'Core growth engine over decades.',
  },
  {
    name: 'Legal & General International Index',
    ticker: 'LGOV',
    weight: 15,
    rationale: 'Low-cost developed markets complement.',
  },
  {
    name: 'iShares Core MSCI EM IMI',
    ticker: 'EIMI',
    weight: 10,
    rationale: 'EM growth exposure while accumulating.',
  },
  {
    name: 'Vanguard Global Bond Index',
    ticker: 'VAGP',
    weight: 10,
    rationale: 'Gradual risk dampening as pot grows.',
  },
];

export const DEFAULT_PLANS: PortfolioPlan[] = [
  {
    id: 'kids-isa',
    title: "Kids' ISA",
    subtitle: 'Stocks & Shares ISA in their name — own £20k allowance per tax year',
    wrapper: 'isa',
    principal: 20_000,
    target: 100_000,
    years: 5,
    annualAllowance: UK_LIMITS.isa,
    annualContribution: 20_000,
    assumedReturn: 8,
    holdings: growthHoldings,
    notes: [
      'Full adult ISA rules: £20,000/year allowance (must be 18+ to hold an ISA in their own name).',
      'At ~8% return + max £20k/yr contributions, projected pot ≈ £145–150k in 5 years — above £100k target.',
      'To land near £100k with lower contributions: ~£12–14k/yr at 8%, or keep maxing and revise target upward.',
    ],
  },
  {
    id: 'personal-isa',
    title: 'Personal ISA',
    subtitle: 'Stocks & Shares ISA — tax-free growth & withdrawals',
    wrapper: 'isa',
    principal: 50_000,
    target: 300_000,
    years: 5,
    annualAllowance: UK_LIMITS.isa,
    annualContribution: 20_000,
    assumedReturn: 8,
    holdings: growthHoldings,
    notes: [
      'With ~£200k cash elsewhere, deploy via GIA for amounts above £20k/yr ISA limit.',
      'Max ISA (£20k/yr) + 8% on £50k start projects ≈ £185k in 5 years — GIA sidecar closes the £300k gap.',
      'Your US portfolio (~£395k) can stay invested; UK ISA/GIA targets UK-tax-efficient growth.',
    ],
  },
  {
    id: 'personal-sipp',
    title: 'Personal SIPP',
    subtitle: 'Pension — tax relief on contributions, access from age 57',
    wrapper: 'sipp',
    principal: 0,
    target: 900_000,
    years: 22,
    annualAllowance: UK_LIMITS.sipp,
    annualContribution: 24_000,
    assumedReturn: 7,
    holdings: sippAccumulationHoldings,
    notes: [
      '£3k/month income ≈ £36k/year. At 4% safe withdrawal, you need ~£900k pot.',
      'Consider £50–100k opening lump sum from the £200k cash — tax relief boosts the deposit.',
      '£2k/month gross (£24k/yr) + £75k start + 7% over 22 years can exceed £900k target.',
      'Higher-rate taxpayer: £24k gross contribution costs ~£14.4k net after 40% relief.',
    ],
  },
];
