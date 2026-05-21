import { todayKey } from './storage';

export interface RitualItem {
  id: string;
  label: string;
  hint: string;
}

/** Warp family daily commitment — ~3 minutes each */
export const DAILY_RITUAL_ITEMS: RitualItem[] = [
  {
    id: 'refresh',
    label: 'Refresh market data',
    hint: 'Tap “Refresh market” — auto-ticks when done',
  },
  {
    id: 'note',
    label: 'Update Warp family note',
    hint: 'Auto-ticks when you save a note today',
  },
  {
    id: 'holdings',
    label: 'Holdings match brokers',
    hint: 'Self-report only — tick after ii / Schwab matches Holdings',
  },
  {
    id: 'review',
    label: '2-minute goal check',
    hint: 'Glance at goals & watchlist — no broker login needed',
  },
];

const CORE_RITUAL_IDS = ['refresh', 'note'] as const;

export function isRitualDayComplete(
  dayCompletions: Record<string, boolean> | undefined
): boolean {
  if (!dayCompletions) return false;
  return CORE_RITUAL_IDS.every((id) => dayCompletions[id]);
}

export function ritualProgress(
  dayCompletions: Record<string, boolean> | undefined
): { done: number; total: number } {
  const total = DAILY_RITUAL_ITEMS.length;
  if (!dayCompletions) return { done: 0, total };
  const done = DAILY_RITUAL_ITEMS.filter((r) => dayCompletions[r.id]).length;
  return { done, total };
}

/** Consecutive days (including today) with refresh + note complete */
export function computeStreak(
  completionsByDate: Record<string, Record<string, boolean>>
): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (!isRitualDayComplete(completionsByDate[key])) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Last 7 calendar days for activity dots */
export function lastSevenDays(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - i);
    days.push(copy.toISOString().slice(0, 10));
  }
  return days;
}

export function formatLastActive(iso: string | undefined): string {
  if (!iso) return 'Not yet';
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export { todayKey };
