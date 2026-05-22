export type AccountKind =
  | 'isa'
  | 'sipp'
  | 'gia'
  | 'brokerage'
  | 'crypto'
  | 'pension'
  | 'cash'
  | 'other';

export type AccountChannel = 'uk' | 'us' | 'crypto';

export interface HouseholdAccount {
  id: string;
  label: string;
  kind: AccountKind;
  currency: 'GBP' | 'USD';
  channel: AccountChannel;
  platform?: string;
  /** Fund manager model suggestion */
  suggestedModelId?: string;
  /** Planning default for fund manager pot size */
  defaultPot?: number;
  notes?: string;
}

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  isa: 'ISA',
  sipp: 'SIPP / pension wrapper',
  gia: 'GIA / taxable brokerage',
  brokerage: 'Brokerage',
  crypto: 'Crypto',
  pension: 'Pension',
  cash: 'Cash / savings',
  other: 'Other',
};

export const DEFAULT_ACCOUNTS: HouseholdAccount[] = [
  {
    id: 'kids-isa',
    label: "Kids' ISA",
    kind: 'isa',
    currency: 'GBP',
    channel: 'uk',
    platform: 'Interactive Investors',
    suggestedModelId: 'growth-aggressive',
    defaultPot: 20_000,
  },
  {
    id: 'personal-isa',
    label: 'Your ISA',
    kind: 'isa',
    currency: 'GBP',
    channel: 'uk',
    platform: 'Interactive Investors',
    suggestedModelId: 'growth-aggressive',
    defaultPot: 50_000,
  },
  {
    id: 'personal-sipp',
    label: 'Your SIPP',
    kind: 'sipp',
    currency: 'GBP',
    channel: 'uk',
    suggestedModelId: 'sipp-accumulation',
    defaultPot: 0,
  },
  {
    id: 'uk-gia',
    label: 'UK GIA',
    kind: 'gia',
    currency: 'GBP',
    channel: 'uk',
    suggestedModelId: 'growth-aggressive',
    defaultPot: 100_000,
  },
  {
    id: 'us-brokerage',
    label: 'US brokerage',
    kind: 'brokerage',
    currency: 'USD',
    channel: 'us',
    platform: 'Schwab',
    suggestedModelId: 'us-sp500-core',
    defaultPot: 500_000,
  },
  {
    id: 'crypto',
    label: 'Crypto',
    kind: 'crypto',
    currency: 'GBP',
    channel: 'crypto',
    platform: 'e.g. Coinbase, Ledger',
    defaultPot: 0,
  },
  {
    id: 'pension',
    label: 'Pension',
    kind: 'pension',
    currency: 'GBP',
    channel: 'uk',
    suggestedModelId: 'sipp-accumulation',
    defaultPot: 0,
  },
];

export function channelForKind(
  kind: AccountKind,
  currency: 'GBP' | 'USD'
): AccountChannel {
  if (kind === 'crypto') return 'crypto';
  if (kind === 'brokerage' && currency === 'USD') return 'us';
  return 'uk';
}

export function slugId(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return `acct-${base}-${Date.now().toString(36).slice(-4)}`;
}

export function getAccountLabel(
  accounts: HouseholdAccount[],
  accountId: string
): string {
  return accounts.find((a) => a.id === accountId)?.label ?? accountId;
}

export function accountsForFundManager(
  accounts: HouseholdAccount[]
): HouseholdAccount[] {
  return accounts.filter((a) => a.channel !== 'crypto');
}
