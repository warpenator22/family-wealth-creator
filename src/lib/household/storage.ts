import { createDefaultState, type HouseholdState } from './types';

const STORAGE_KEY = 'fwc-household-v1';

export function loadHousehold(): HouseholdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as HouseholdState;
    return { ...createDefaultState(), ...parsed, version: 1 };
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
