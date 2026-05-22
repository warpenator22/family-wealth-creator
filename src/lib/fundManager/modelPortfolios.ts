/** Best-in-class reference portfolios with UK (UCITS) and US (single-stock) implementations */

export type ModelCategory = 'equity' | 'balanced' | 'retirement';

export interface UkLine {
  ticker: string;
  name: string;
  weight: number;
  isin?: string;
  exchange: string;
  accumulating: boolean;
  ocf?: string;
}

export interface UsLine {
  ticker: string;
  name: string;
  weight: number;
  sector?: string;
  note?: string;
}

export interface ModelPortfolio {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  mirrors: string;
  riskLevel: 'low' | 'medium' | 'high';
  horizonYears: string;
  linkedPlanId?: string;
  uk: UkLine[];
  us: UsLine[];
  notes: string[];
}

/** S&P 500 top constituents — approximate weights for stock-only US books */
const SP500_US: UsLine[] = [
  { ticker: 'NVDA', name: 'NVIDIA', weight: 7.0, sector: 'Technology' },
  { ticker: 'AAPL', name: 'Apple', weight: 6.5, sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft', weight: 6.2, sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon', weight: 3.8, sector: 'Consumer' },
  { ticker: 'META', name: 'Meta Platforms', weight: 2.6, sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Class A', weight: 2.2, sector: 'Technology' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B', weight: 1.8, sector: 'Financials' },
  { ticker: 'AVGO', name: 'Broadcom', weight: 1.7, sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla', weight: 1.5, sector: 'Consumer' },
  { ticker: 'JPM', name: 'JPMorgan Chase', weight: 1.4, sector: 'Financials' },
  { ticker: 'V', name: 'Visa', weight: 1.2, sector: 'Financials' },
  { ticker: 'LLY', name: 'Eli Lilly', weight: 1.1, sector: 'Healthcare' },
  { ticker: 'UNH', name: 'UnitedHealth', weight: 1.0, sector: 'Healthcare' },
  { ticker: 'XOM', name: 'Exxon Mobil', weight: 0.9, sector: 'Energy' },
  { ticker: 'MA', name: 'Mastercard', weight: 0.9, sector: 'Financials' },
  { ticker: 'COST', name: 'Costco', weight: 0.8, sector: 'Consumer' },
  { ticker: 'HD', name: 'Home Depot', weight: 0.8, sector: 'Consumer' },
  { ticker: 'PG', name: 'Procter & Gamble', weight: 0.7, sector: 'Consumer' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', weight: 0.7, sector: 'Healthcare' },
  { ticker: 'NFLX', name: 'Netflix', weight: 0.6, sector: 'Technology' },
];

const INTL_ADR_US: UsLine[] = [
  { ticker: 'ASML', name: 'ASML Holding (ADR)', weight: 25, sector: 'Technology' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor (ADR)', weight: 20, sector: 'Technology' },
  { ticker: 'NVO', name: 'Novo Nordisk (ADR)', weight: 15, sector: 'Healthcare' },
  { ticker: 'SAP', name: 'SAP (ADR)', weight: 12, sector: 'Technology' },
  { ticker: 'TM', name: 'Toyota (ADR)', weight: 10, sector: 'Consumer' },
  { ticker: 'UL', name: 'Unilever (ADR)', weight: 8, sector: 'Consumer' },
  { ticker: 'SNY', name: 'Sanofi (ADR)', weight: 10, sector: 'Healthcare' },
];

const EM_US: UsLine[] = [
  { ticker: 'BABA', name: 'Alibaba (ADR)', weight: 20, sector: 'Technology' },
  { ticker: 'PDD', name: 'PDD Holdings (ADR)', weight: 15, sector: 'Consumer' },
  { ticker: 'INFY', name: 'Infosys (ADR)', weight: 15, sector: 'Technology' },
  { ticker: 'VALE', name: 'Vale (ADR)', weight: 15, sector: 'Materials' },
  { ticker: 'MELI', name: 'MercadoLibre', weight: 15, sector: 'Consumer' },
  { ticker: 'IBN', name: 'ICICI Bank (ADR)', weight: 10, sector: 'Financials' },
  { ticker: 'SQM', name: 'Sociedad Química (ADR)', weight: 10, sector: 'Materials' },
];

function blendUs(lines: UsLine[], portfolioWeight: number): UsLine[] {
  const subtotal = lines.reduce((s, l) => s + l.weight, 0);
  return lines.map((l) => ({
    ...l,
    weight: Math.round((l.weight / subtotal) * portfolioWeight * 100) / 100,
  }));
}

function usGlobalMix(usEquityPct: number): UsLine[] {
  return [
    ...blendUs(SP500_US, usEquityPct * 0.55),
    ...blendUs(INTL_ADR_US, usEquityPct * 0.3),
    ...blendUs(EM_US, usEquityPct * 0.15),
  ];
}

const BOND_US_NOTE: UsLine = {
  ticker: '—',
  name: 'Hold bonds in UK wrappers (VAGP) or US Treasuries — avoid US bond funds',
  weight: 0,
  sector: 'Fixed income',
  note: 'PFIC-safe approach for US citizens',
};

export const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: 'global-all-cap',
    name: 'Global All-Cap Index',
    category: 'equity',
    description: 'Single-fund world equity — the Bogleheads default for UK wrappers.',
    mirrors: 'Vanguard FTSE Global All Cap / LifeStrategy 100 equity sleeve',
    riskLevel: 'high',
    horizonYears: '10+',
    uk: [
      {
        ticker: 'VWRP',
        name: 'Vanguard FTSE All-World UCITS ETF',
        weight: 100,
        isin: 'IE00BK5BQT80',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.22%',
      },
    ],
    us: usGlobalMix(100),
    notes: [
      'UK: One fund — lowest drag, easiest rebalance.',
      'US: ~25 individual names across US, ADR, and EM; top 20 US names ≈ 35% of S&P 500 weight.',
    ],
  },
  {
    id: 'isa-us-citizen-growth',
    name: 'ISA Growth (US-person, PFIC-safe)',
    category: 'equity',
    description:
      'Six-name global growth basket for UK ISAs when you are US citizens — no Irish UCITS.',
    mirrors: 'Global all-cap equity via US + ADR stocks (not VWRP)',
    riskLevel: 'high',
    horizonYears: '5–10',
    linkedPlanId: 'kids-isa',
    uk: [],
    us: [
      {
        ticker: 'MSFT',
        name: 'Microsoft',
        weight: 35,
        sector: 'Technology',
        note: 'Core quality compounder',
      },
      {
        ticker: 'GOOGL',
        name: 'Alphabet Class A',
        weight: 25,
        sector: 'Technology',
        note: 'Search / cloud growth',
      },
      {
        ticker: 'NVDA',
        name: 'NVIDIA',
        weight: 15,
        sector: 'Technology',
        note: 'Higher volatility — size to comfort',
      },
      {
        ticker: 'AVGO',
        name: 'Broadcom',
        weight: 10,
        sector: 'Technology',
        note: 'Semis + software cash flow',
      },
      {
        ticker: 'ASML',
        name: 'ASML Holding (ADR)',
        weight: 10,
        sector: 'Technology',
        note: 'Non-US developed markets exposure',
      },
      {
        ticker: 'COST',
        name: 'Costco',
        weight: 5,
        sector: 'Consumer',
        note: 'Defensive consumer ballast',
      },
    ],
    notes: [
      'Default for Your ISA (Kids Fund) and Your ISA (Personal) — US/UK dual citizens.',
      'Do not use VWRP, VUSA, WSML, EIMI, or other UCITS in these ISAs (PFIC reporting).',
      'On Interactive Investors: buy LSE-listed lines (often USD tickers, e.g. MSFT).',
      '£20,000 example: MSFT £7k · GOOGL £5k · NVDA £3k · AVGO £2k · ASML £2k · COST £1k.',
      'Max £20k/yr into this ISA; at ~8% plus annual top-ups, £100k in ~5 years is realistic.',
    ],
  },
  {
    id: 'growth-aggressive',
    name: 'Aggressive Growth (UCITS — UK-only taxpayers)',
    category: 'equity',
    description: 'UCITS ETF mix — only if you are not subject to US PFIC rules.',
    mirrors: 'MSCI ACWI + small-cap & EM factor tilts (Wealthfront aggressive-style)',
    riskLevel: 'high',
    horizonYears: '5–15',
    uk: [
      {
        ticker: 'VWRP',
        name: 'Vanguard FTSE All-World UCITS ETF',
        weight: 70,
        isin: 'IE00BK5BQT80',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.22%',
      },
      {
        ticker: 'WSML',
        name: 'iShares MSCI World Small Cap UCITS ETF',
        weight: 15,
        isin: 'IE00BF4RFH31',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.35%',
      },
      {
        ticker: 'EIMI',
        name: 'iShares Core MSCI EM IMI UCITS ETF',
        weight: 10,
        isin: 'IE00BKM4GZ66',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.18%',
      },
      {
        ticker: 'VAGP',
        name: 'Vanguard Global Aggregate Bond UCITS ETF',
        weight: 5,
        isin: 'IE00BG47KH54',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.10%',
      },
    ],
    us: [
      ...usGlobalMix(90),
      { ...BOND_US_NOTE, weight: 5 },
    ],
    notes: [
      'Not for US citizens — use “ISA Growth (US-person, PFIC-safe)” instead.',
      'US small-cap tilt is embedded in the global US mix; add WSML-equivalent only via UK UCITS.',
    ],
  },
  {
    id: 'sipp-accumulation',
    name: 'SIPP Accumulation',
    category: 'retirement',
    description: 'Long-horizon pension — global equity with bond foundation.',
    mirrors: 'Vanguard Target Retirement / typical passive workplace pension',
    riskLevel: 'medium',
    horizonYears: '15–30',
    linkedPlanId: 'personal-sipp',
    uk: [
      {
        ticker: 'VWRP',
        name: 'Vanguard FTSE All-World UCITS ETF',
        weight: 65,
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.22%',
      },
      {
        ticker: 'LGOV',
        name: 'L&G International Index Trust',
        weight: 15,
        exchange: 'Fund supermarket',
        accumulating: true,
        ocf: '0.13%',
      },
      {
        ticker: 'EIMI',
        name: 'iShares Core MSCI EM IMI UCITS ETF',
        weight: 10,
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.18%',
      },
      {
        ticker: 'VAGP',
        name: 'Vanguard Global Aggregate Bond UCITS ETF',
        weight: 10,
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.10%',
      },
    ],
    us: [...usGlobalMix(90), { ...BOND_US_NOTE, weight: 10 }],
    notes: ['Use when activating SIPP; shift 5–10% more to VAGP after age 50.'],
  },
  {
    id: 'balanced-80-20',
    name: 'Balanced 80/20',
    category: 'balanced',
    description: 'Vanguard LifeStrategy 80 analogue.',
    mirrors: 'Vanguard LifeStrategy 80% Equity',
    riskLevel: 'medium',
    horizonYears: '7+',
    uk: [
      {
        ticker: 'VWRP',
        name: 'Vanguard FTSE All-World UCITS ETF',
        weight: 80,
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.22%',
      },
      {
        ticker: 'VAGP',
        name: 'Vanguard Global Aggregate Bond UCITS ETF',
        weight: 20,
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.10%',
      },
    ],
    us: [...usGlobalMix(80), { ...BOND_US_NOTE, weight: 20 }],
    notes: ['Lower-volatility sleeve for UK GIA or de-risked SIPP later in life.'],
  },
  {
    id: 'us-sp500-core',
    name: 'US S&P 500 (Stock Basket)',
    category: 'equity',
    description: 'US large-cap focus for your ~$500k US brokerage.',
    mirrors: 'Vanguard S&P 500 UCITS (VUSA) / SPY',
    riskLevel: 'high',
    horizonYears: '10+',
    uk: [
      {
        ticker: 'VUSA',
        name: 'Vanguard S&P 500 UCITS ETF',
        weight: 100,
        isin: 'IE00B3XXRP09',
        exchange: 'LSE',
        accumulating: true,
        ocf: '0.07%',
      },
    ],
    us: blendUs(SP500_US, 100),
    notes: [
      'Basket covers ~35–40% of index by weight — extend with more S&P names over time.',
      'Do not use US mutual funds or US-domiciled ETFs (PFIC reporting for US citizens).',
    ],
  },
];

export function getModelById(id: string): ModelPortfolio | undefined {
  return MODEL_PORTFOLIOS.find((m) => m.id === id);
}

export const US_CITIZEN_CONSTRAINTS = [
  'Irish / UK UCITS ETFs (VWRP, VUSA, WSML, EIMI, VAGP): treated as PFICs — Form 8621; avoid in ISAs unless your CPA accepts the burden.',
  'US-domiciled mutual funds: avoid (PFIC risk and complex reporting).',
  'US-domiciled ETFs (e.g. VTI, SPY): usually not PFICs, but UK wrappers still do not shield US tax on worldwide income.',
  'Individual US (and ADR) equities: cleanest default for UK ISAs when you are US persons.',
  'Your ISA (Kids Fund) is in your name — US rules apply to you, not a Junior ISA.',
  'Report worldwide income to the IRS; consider Foreign Tax Credit for UK taxes paid.',
];
