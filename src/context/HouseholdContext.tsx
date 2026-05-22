import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  channelForKind,
  getAccountLabel,
  slugId,
  type AccountKind,
  type HouseholdAccount,
} from '../lib/household/accounts';
import { computeStreak } from '../lib/household/dailyRitual';
import { loadHousehold, saveHousehold, todayKey } from '../lib/household/storage';
import type { Holding, HouseholdMember, HouseholdState } from '../lib/household/types';

interface HouseholdContextValue {
  state: HouseholdState;
  activeMember: HouseholdMember;
  setActiveMember: (id: string) => void;
  updateMemberName: (id: string, name: string) => void;
  setFinnhubKey: (key: string) => void;
  setAutoRefresh: (minutes: number) => void;
  addHolding: (holding: Omit<Holding, 'id'>) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, patch: Partial<Holding>) => void;
  setWatchlist: (symbols: string[]) => void;
  addToWatchlist: (symbol: string) => void;
  setDailyNote: (note: string) => void;
  getDailyNote: (date?: string) => string;
  toggleRitual: (ritualId: string, done?: boolean) => void;
  markRitual: (ritualId: string) => void;
  recordActivity: (memberId?: string) => void;
  getTodayRituals: () => Record<string, boolean>;
  ritualStreak: number;
  allSymbols: string[];
  addAccount: (input: {
    label: string;
    kind: AccountKind;
    currency: 'GBP' | 'USD';
    platform?: string;
    notes?: string;
  }) => void;
  updateAccount: (id: string, patch: Partial<HouseholdAccount>) => void;
  removeAccount: (id: string) => boolean;
  getAccountLabel: (accountId: string) => string;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HouseholdState>(() => loadHousehold());

  useEffect(() => {
    saveHousehold(state);
  }, [state]);

  const activeMember =
    state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];

  const setActiveMember = useCallback((id: string) => {
    setState((s) => ({ ...s, activeMemberId: id }));
  }, []);

  const updateMemberName = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === id ? { ...m, name } : m)),
    }));
  }, []);

  const setFinnhubKey = useCallback((key: string) => {
    setState((s) => ({ ...s, finnhubApiKey: key }));
  }, []);

  const setAutoRefresh = useCallback((minutes: number) => {
    setState((s) => ({ ...s, autoRefreshMinutes: minutes }));
  }, []);

  const markRitualInternal = (
    prev: HouseholdState,
    ritualId: string,
    done: boolean,
    date = todayKey()
  ): HouseholdState => ({
    ...prev,
    ritualCompletions: {
      ...prev.ritualCompletions,
      [date]: {
        ...(prev.ritualCompletions[date] ?? {}),
        [ritualId]: done,
      },
    },
  });

  const recordActivity = useCallback((memberId?: string) => {
    const id = memberId ?? '';
    setState((s) => {
      const mid = id || s.activeMemberId;
      return {
        ...s,
        memberLastActive: {
          ...s.memberLastActive,
          [mid]: new Date().toISOString(),
        },
      };
    });
  }, []);

  const markRitual = useCallback((ritualId: string) => {
    setState((s) => markRitualInternal(s, ritualId, true));
  }, []);

  const toggleRitual = useCallback((ritualId: string, done?: boolean) => {
    setState((s) => {
      const date = todayKey();
      const current = s.ritualCompletions[date]?.[ritualId] ?? false;
      return markRitualInternal(s, ritualId, done ?? !current);
    });
    recordActivity();
  }, [recordActivity]);

  const addAccount = useCallback(
    (input: {
      label: string;
      kind: AccountKind;
      currency: 'GBP' | 'USD';
      platform?: string;
      notes?: string;
    }) => {
      const label = input.label.trim();
      if (!label) return;
      const account: HouseholdAccount = {
        id: slugId(label),
        label,
        kind: input.kind,
        currency: input.currency,
        channel: channelForKind(input.kind, input.currency),
        platform: input.platform?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        suggestedModelId:
          input.kind === 'sipp' || input.kind === 'pension'
            ? 'sipp-accumulation'
            : input.kind === 'brokerage' && input.currency === 'USD'
              ? 'us-sp500-core'
              : input.kind === 'isa' || input.kind === 'gia'
                ? 'growth-aggressive'
                : undefined,
        defaultPot: 0,
      };
      setState((s) => ({
        ...s,
        accounts: [...s.accounts, account],
      }));
      recordActivity();
    },
    [recordActivity]
  );

  const updateAccount = useCallback((id: string, patch: Partial<HouseholdAccount>) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patch };
        if (patch.kind || patch.currency) {
          next.channel = channelForKind(next.kind, next.currency);
        }
        return next;
      }),
    }));
  }, []);

  const removeAccount = useCallback((id: string): boolean => {
    let removed = false;
    setState((s) => {
      if (s.holdings.some((h) => h.accountId === id)) return s;
      removed = true;
      return { ...s, accounts: s.accounts.filter((a) => a.id !== id) };
    });
    return removed;
  }, []);

  const resolveAccountLabel = useCallback(
    (accountId: string) => getAccountLabel(state.accounts, accountId),
    [state.accounts]
  );

  const addHolding = useCallback((holding: Omit<Holding, 'id'>) => {
    setState((s) => {
      let next: HouseholdState = {
        ...s,
        holdings: [
          ...s.holdings,
          { ...holding, id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
        ],
        memberLastActive: {
          ...s.memberLastActive,
          [holding.memberId]: new Date().toISOString(),
        },
      };
      next = markRitualInternal(next, 'holdings', true);
      return next;
    });
  }, []);

  const removeHolding = useCallback((id: string) => {
    setState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== id) }));
  }, []);

  const updateHolding = useCallback((id: string, patch: Partial<Holding>) => {
    setState((s) => ({
      ...s,
      holdings: s.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const setWatchlist = useCallback((symbols: string[]) => {
    setState((s) => ({
      ...s,
      watchlist: [...new Set(symbols.map((x) => x.toUpperCase()))],
    }));
  }, []);

  const addToWatchlist = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    setState((s) => ({
      ...s,
      watchlist: s.watchlist.includes(sym) ? s.watchlist : [...s.watchlist, sym],
    }));
  }, []);

  const setDailyNote = useCallback((note: string) => {
    const date = todayKey();
    setState((s) => {
      let next: HouseholdState = {
        ...s,
        dailyNotes: {
          ...s.dailyNotes,
          [date]: {
            ...(s.dailyNotes[date] ?? {}),
            [s.activeMemberId]: note,
          },
        },
        memberLastActive: {
          ...s.memberLastActive,
          [s.activeMemberId]: new Date().toISOString(),
        },
      };
      if (note.trim()) {
        next = markRitualInternal(next, 'note', true);
      }
      return next;
    });
  }, []);

  const getDailyNote = useCallback(
    (date = todayKey()) => {
      return state.dailyNotes[date]?.[state.activeMemberId] ?? '';
    },
    [state.dailyNotes, state.activeMemberId]
  );

  const getTodayRituals = useCallback(() => {
    return state.ritualCompletions[todayKey()] ?? {};
  }, [state.ritualCompletions]);

  const ritualStreak = useMemo(
    () => computeStreak(state.ritualCompletions),
    [state.ritualCompletions]
  );

  const allSymbols = useMemo(() => {
    const fromHoldings = state.holdings.map((h) => h.symbol.toUpperCase());
    return [...new Set([...state.watchlist, ...fromHoldings])];
  }, [state.watchlist, state.holdings]);

  const value = useMemo(
    () => ({
      state,
      activeMember,
      setActiveMember,
      updateMemberName,
      setFinnhubKey,
      setAutoRefresh,
      addHolding,
      removeHolding,
      updateHolding,
      setWatchlist,
      addToWatchlist,
      setDailyNote,
      getDailyNote,
      toggleRitual,
      markRitual,
      recordActivity,
      getTodayRituals,
      ritualStreak,
      allSymbols,
      addAccount,
      updateAccount,
      removeAccount,
      getAccountLabel: resolveAccountLabel,
    }),
    [
      state,
      activeMember,
      setActiveMember,
      updateMemberName,
      setFinnhubKey,
      setAutoRefresh,
      addHolding,
      removeHolding,
      updateHolding,
      setWatchlist,
      addToWatchlist,
      setDailyNote,
      getDailyNote,
      toggleRitual,
      markRitual,
      recordActivity,
      getTodayRituals,
      ritualStreak,
      allSymbols,
      addAccount,
      updateAccount,
      removeAccount,
      resolveAccountLabel,
    ]
  );

  return (
    <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
