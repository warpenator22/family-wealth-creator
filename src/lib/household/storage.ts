import {
  createDefaultState,
  type HouseholdMember,
  type HouseholdState,
} from './types';

const STORAGE_KEY = 'fwc-household-v1';

function normalizeMembers(members: HouseholdMember[] | undefined): HouseholdMember[] {
  const defaults = createDefaultState().members;
  if (!members?.length) return defaults;

  return defaults.map((def) => {
    const saved = members.find((m) => m.id === def.id);
    if (!saved) return def;
    // One-time upgrade for older saves that still say Partner / You
    if (saved.id === 'member-2' && saved.name === 'Partner') {
      return { ...saved, name: 'Erica' };
    }
    if (saved.id === 'member-1' && saved.name === 'You') {
      return { ...saved, name: 'Richard' };
    }
    return saved;
  });
}

export function loadHousehold(): HouseholdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as HouseholdState;
    const defaults = createDefaultState();
    return {
      ...defaults,
      ...parsed,
      version: 1,
      members: normalizeMembers(parsed.members),
    };
  } catch {
    return createDefaultState();
  }
}

export function saveHousehold(state: HouseholdState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
