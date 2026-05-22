import { DEFAULT_ACCOUNTS, type HouseholdAccount } from './accounts';

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
  accounts: HouseholdAccount[];
  holdings: Holding[];
  watchlist: string[];
  /** ISO date (YYYY-MM-DD) -> memberId -> note */
  dailyNotes: Record<string, Record<string, string>>;
  /** ISO date -> ritual id -> completed */
  ritualCompletions: Record<string, Record<string, boolean>>;
  /** memberId -> ISO timestamp last meaningful action */
  memberLastActive: Record<string, string>;
  /** SHA-256 hex of family sync passphrase — links devices to one cloud row */
  syncKey?: string;
  /** Bumped on each local edit; compared with cloud for merge */
  syncRevision?: number;
  /** ISO timestamp of last successful cloud sync */
  lastCloudSyncAt?: string;
}

export const DEFAULT_MEMBERS: HouseholdMember[] = [
  { id: 'member-1', name: 'Richard', color: '#6b9fd4' },
  { id: 'member-2', name: 'Erica', color: '#3d9b6e' },
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
    accounts: [...DEFAULT_ACCOUNTS],
    holdings: [],
    watchlist: DEFAULT_WATCHLIST,
    dailyNotes: {},
    ritualCompletions: {},
    memberLastActive: {},
  };
}
