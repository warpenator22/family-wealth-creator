import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  allSymbols: string[];
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

  const addHolding = useCallback((holding: Omit<Holding, 'id'>) => {
    setState((s) => ({
      ...s,
      holdings: [
        ...s.holdings,
        { ...holding, id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    }));
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

  const setDailyNote = useCallback(
    (note: string) => {
      const date = todayKey();
      setState((s) => ({
        ...s,
        dailyNotes: {
          ...s.dailyNotes,
          [date]: {
            ...(s.dailyNotes[date] ?? {}),
            [s.activeMemberId]: note,
          },
        },
      }));
    },
    []
  );

  const getDailyNote = useCallback(
    (date = todayKey()) => {
      return state.dailyNotes[date]?.[state.activeMemberId] ?? '';
    },
    [state.dailyNotes, state.activeMemberId]
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
      allSymbols,
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
      allSymbols,
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
