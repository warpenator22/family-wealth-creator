import { DEFAULT_ACCOUNTS, type HouseholdAccount } from './accounts';
import {
  createDefaultState,
  type HouseholdMember,
  type HouseholdState,
} from './types';

const STORAGE_KEY = 'fwc-household-v1';
const BACKUP_KEY = 'fwc-household-v1-backup';

function normalizeMembers(members: HouseholdMember[] | undefined): HouseholdMember[] {
  const defaults = createDefaultState().members;
  if (!members?.length) return defaults;

  return defaults.map((def) => {
    const saved = members.find((m) => m.id === def.id);
    if (!saved) return def;
    if (saved.id === 'member-2' && saved.name === 'Partner') {
      return { ...saved, name: 'Erica' };
    }
    if (saved.id === 'member-1' && saved.name === 'You') {
      return { ...saved, name: 'Richard' };
    }
    return saved;
  });
}

function normalizeAccounts(saved: HouseholdAccount[] | undefined): HouseholdAccount[] {
  if (!saved?.length) return [...DEFAULT_ACCOUNTS];

  const byId = new Map<string, HouseholdAccount>();
  for (const def of DEFAULT_ACCOUNTS) {
    const match = saved.find((a) => a.id === def.id);
    const merged = match ? { ...def, ...match, id: def.id } : def;
    if (def.id === 'kids-isa' && match?.label === "Kids' ISA") {
      merged.label = def.label;
      merged.allocationChannel = def.allocationChannel;
      merged.suggestedModelId = def.suggestedModelId;
      merged.notes = def.notes;
    }
    byId.set(def.id, merged);
  }
  for (const a of saved) {
    if (!byId.has(a.id)) byId.set(a.id, a);
  }
  return Array.from(byId.values());
}

/** Merge saved JSON with defaults without dropping holdings or other arrays */
export function mergeHouseholdState(parsed: Partial<HouseholdState>): HouseholdState {
  const defaults = createDefaultState();
  return {
    ...defaults,
    ...parsed,
    version: 1,
    members: normalizeMembers(parsed.members),
    accounts: normalizeAccounts(parsed.accounts),
    holdings: Array.isArray(parsed.holdings) ? parsed.holdings : defaults.holdings,
    watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : defaults.watchlist,
    dailyNotes:
      parsed.dailyNotes && typeof parsed.dailyNotes === 'object'
        ? parsed.dailyNotes
        : defaults.dailyNotes,
    ritualCompletions:
      parsed.ritualCompletions && typeof parsed.ritualCompletions === 'object'
        ? parsed.ritualCompletions
        : defaults.ritualCompletions,
    memberLastActive:
      parsed.memberLastActive && typeof parsed.memberLastActive === 'object'
        ? parsed.memberLastActive
        : defaults.memberLastActive,
    finnhubApiKey:
      typeof parsed.finnhubApiKey === 'string'
        ? parsed.finnhubApiKey
        : defaults.finnhubApiKey,
    activeMemberId:
      typeof parsed.activeMemberId === 'string'
        ? parsed.activeMemberId
        : defaults.activeMemberId,
    autoRefreshMinutes:
      typeof parsed.autoRefreshMinutes === 'number'
        ? parsed.autoRefreshMinutes
        : defaults.autoRefreshMinutes,
    syncKey: typeof parsed.syncKey === 'string' ? parsed.syncKey : defaults.syncKey,
    syncRevision:
      typeof parsed.syncRevision === 'number' ? parsed.syncRevision : defaults.syncRevision,
    lastCloudSyncAt:
      typeof parsed.lastCloudSyncAt === 'string'
        ? parsed.lastCloudSyncAt
        : defaults.lastCloudSyncAt,
  };
}

export function loadHousehold(): HouseholdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<HouseholdState>;
    return mergeHouseholdState(parsed);
  } catch {
    return tryLoadBackup() ?? createDefaultState();
  }
}

function tryLoadBackup(): HouseholdState | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    return mergeHouseholdState(JSON.parse(raw) as Partial<HouseholdState>);
  } catch {
    return null;
  }
}

export function saveHousehold(state: HouseholdState): void {
  const json = JSON.stringify(state);
  try {
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev) localStorage.setItem(BACKUP_KEY, prev);
  } catch {
    /* quota — still try main save */
  }
  localStorage.setItem(STORAGE_KEY, json);
}

export function exportHouseholdJson(state: HouseholdState): string {
  return JSON.stringify(state, null, 2);
}

export function importHouseholdJson(raw: string): HouseholdState {
  const parsed = JSON.parse(raw) as Partial<HouseholdState>;
  const merged = mergeHouseholdState(parsed);
  saveHousehold(merged);
  return merged;
}

export function getHouseholdBackup(): HouseholdState | null {
  return tryLoadBackup();
}

export function restoreHouseholdFromBackup(): HouseholdState | null {
  const backup = tryLoadBackup();
  if (!backup) return null;
  saveHousehold(backup);
  return backup;
}

export function householdStorageSummary(state: HouseholdState): {
  holdingCount: number;
  hasBackup: boolean;
  backupHoldingCount: number;
} {
  const backup = tryLoadBackup();
  return {
    holdingCount: state.holdings.length,
    hasBackup: backup !== null,
    backupHoldingCount: backup?.holdings.length ?? 0,
  };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
