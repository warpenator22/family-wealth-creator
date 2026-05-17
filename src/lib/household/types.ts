export interface HouseholdMember {
  id: string;
  name: string;
  color: string;
}

export interface Holding {
  id: string;
  memberId: string;
  accountId: string;
  symbol: string;
  name?: string;
  shares: number;
  costGbp: number;
  currency: 'GBP' | 'USD';
  boughtAt: string;
  notes?: string;
}

export interface HouseholdState {
  version: 1;
  members: HouseholdMember[];
  activeMemberId: string;
  finnhubApiKey: string;
  autoRefreshMinutes: number;
  holdings: Holding[];
  watchlist: string[];
  /** ISO date (YYYY-MM-DD) -> memberId -> note */
  dailyNotes: Record<string, Record<string, string>>;
}

export const DEFAULT_MEMBERS: HouseholdMember[] = [
  { id: 'member-1', name: 'You', color: '#6b9fd4' },
  { id: 'member-2', name: 'Partner', color: '#3d9b6e' },
];

export const DEFAULT_WATCHLIST = [
  'MSFT',
  'GOOGL',
  'NVDA',
  'AAPL',
  'AMZN',
  'META',
  'BRK.B',
  'LLY',
];

export function createDefaultState(): HouseholdState {
  return {
    version: 1,
    members: DEFAULT_MEMBERS,
    activeMemberId: 'member-1',
    finnhubApiKey: import.meta.env.VITE_FINNHUB_API_KEY ?? '',
    autoRefreshMinutes: 5,
    holdings: [],
    watchlist: DEFAULT_WATCHLIST,
    dailyNotes: {},
  };
}
