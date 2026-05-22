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

/** PFIC-safe stocks for US citizens holding UK ISAs (Interactive Investors / LSE) */
export const PFIC_SAFE_ISA_HOLDINGS: Holding[] = [
  {
    name: 'Microsoft',
    ticker: 'MSFT',
    weight: 35,
    rationale: 'Core compounder — anchor the kids fund.',
  },
  {
    name: 'Alphabet Class A',
    ticker: 'GOOGL',
    weight: 25,
    rationale: 'Search, cloud, and AI optionality.',
  },
  {
    name: 'NVIDIA',
    ticker: 'NVDA',
    weight: 15,
    rationale: 'Growth tilt; trim if volatility is uncomfortable.',
  },
  {
    name: 'Broadcom',
    ticker: 'AVGO',
    weight: 10,
    rationale: 'Semiconductor + infrastructure software.',
  },
  {
    name: 'ASML Holding (ADR)',
    ticker: 'ASML',
    weight: 10,
    rationale: 'Developed-market ex-US exposure without UCITS.',
  },
  {
    name: 'Costco',
    ticker: 'COST',
    weight: 5,
    rationale: 'Defensive consumer stabiliser.',
  },
];

/** UCITS mix — UK-tax-only households (not for US persons) */
const growthHoldingsUcits: Holding[] = [
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
    title: 'Your ISA (Kids Fund)',
    subtitle:
      'Your adult Stocks & Shares ISA — £20k/yr allowance, earmarked for the kids’ £100k goal',
    wrapper: 'isa',
    principal: 20_000,
    target: 100_000,
    years: 5,
    annualAllowance: UK_LIMITS.isa,
    annualContribution: 20_000,
    assumedReturn: 8,
    holdings: PFIC_SAFE_ISA_HOLDINGS,
    notes: [
      'Not a Junior ISA — you own the wrapper; US tax rules apply to you as US citizens.',
      'Do not use VWRP or other UCITS here (PFIC). Use the six-stock PFIC-safe basket below.',
      'Deploy the current £20k in one session on ii; log each line in Holdings.',
      'At ~8% return + max £20k/yr, the pot projects well past £100k in 5 years.',
      'Erica can run a second ISA (Personal) with the same stock approach for parallel £20k/yr room.',
    ],
  },
  {
    id: 'personal-isa',
    title: 'Your ISA (Personal)',
    subtitle: 'Stocks & Shares ISA — tax-free growth toward £300k in 5 years',
    wrapper: 'isa',
    principal: 50_000,
    target: 300_000,
    years: 5,
    annualAllowance: UK_LIMITS.isa,
    annualContribution: 20_000,
    assumedReturn: 8,
    holdings: PFIC_SAFE_ISA_HOLDINGS,
    notes: [
      'Same PFIC-safe stock basket as the Kids Fund ISA (proportions scale with pot size).',
      'With ~£200k cash elsewhere, deploy via GIA for amounts above £20k/yr ISA limit.',
      'Max ISA (£20k/yr) + 8% on £50k start projects ≈ £185k in 5 years — GIA sidecar closes the £300k gap.',
      'Your US portfolio (~£395k) can stay invested; UK ISAs use individual equities, not UCITS.',
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
      'SIPP: confirm PFIC treatment of UCITS with your CPA before using VWRP inside the pension.',
    ],
  },
];

/** @deprecated UK-only UCITS mix — kept for reference */
export const UCITS_GROWTH_HOLDINGS = growthHoldingsUcits;
