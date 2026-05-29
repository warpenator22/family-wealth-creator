import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  bumpRevision,
  deriveSyncKey,
  isCloudSyncAvailable,
  pullHousehold,
  pushHousehold,
  withSyncMeta,
} from '../lib/household/cloudSync';
import { computeStreak } from '../lib/household/dailyRitual';
import { loadHousehold, saveHousehold, todayKey } from '../lib/household/storage';
import type { Holding, HouseholdMember, HouseholdState } from '../lib/household/types';

export type CloudSyncStatus = 'off' | 'idle' | 'syncing' | 'ok' | 'error';

interface HouseholdContextValue {
  state: HouseholdState;
  activeMember: HouseholdMember;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncConfigured: boolean;
  cloudSyncError: string | null;
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
  replaceState: (next: HouseholdState) => void;
  enableCloudSync: (passphrase: string) => Promise<void>;
  disableCloudSync: () => void;
  syncNow: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

const PUSH_DEBOUNCE_MS = 2_000;
const PULL_INTERVAL_MS = 90_000;

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HouseholdState>(() => loadHousehold());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(() =>
    state.syncKey && isCloudSyncAvailable() ? 'idle' : 'off'
  );
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const pullingRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSyncedRevisionRef = useRef<number | null>(null);

  const commitState = useCallback((fn: (s: HouseholdState) => HouseholdState) => {
    setState((s) => {
      const next = fn(s);
      return s.syncKey ? bumpRevision(next) : next;
    });
  }, []);

  useEffect(() => {
    saveHousehold(state);
  }, [state]);

  const applyRemote = useCallback((remote: HouseholdState, revision: number, updatedAt: string) => {
    pullingRef.current = true;
    const key = stateRef.current.syncKey;
    if (!key) {
      pullingRef.current = false;
      return;
    }
    setState(withSyncMeta(remote, key, revision, updatedAt));
    lastSyncedRevisionRef.current = revision;
    setCloudSyncStatus('ok');
    setCloudSyncError(null);
    queueMicrotask(() => {
      pullingRef.current = false;
    });
  }, []);

  const pullFromCloud = useCallback(async () => {
    const { syncKey } = stateRef.current;
    if (!syncKey || !isCloudSyncAvailable()) return;

    pullingRef.current = true;
    try {
      const remote = await pullHousehold(syncKey);
      if (
        remote &&
        remote.revision > (stateRef.current.syncRevision ?? 0)
      ) {
        applyRemote(remote.state, remote.revision, remote.updatedAt);
      } else {
        setCloudSyncStatus('ok');
      }
    } catch (e) {
      setCloudSyncStatus('error');
      setCloudSyncError(e instanceof Error ? e.message : 'Sync pull failed');
    } finally {
      pullingRef.current = false;
    }
  }, [applyRemote]);

  const pushToCloud = useCallback(async () => {
    const current = stateRef.current;
    if (!current.syncKey || !isCloudSyncAvailable()) return;

    setCloudSyncStatus('syncing');
    setCloudSyncError(null);
    try {
      const revision = current.syncRevision ?? 1;
      const result = await pushHousehold(current.syncKey, current, revision);
      lastSyncedRevisionRef.current = result.revision;
      setState((s) => ({
        ...s,
        lastCloudSyncAt: result.updatedAt,
        syncRevision: result.revision,
      }));
      setCloudSyncStatus('ok');
    } catch (e) {
      setCloudSyncStatus('error');
      setCloudSyncError(e instanceof Error ? e.message : 'Sync push failed');
    }
  }, []);

  useEffect(() => {
    if (!state.syncKey || !isCloudSyncAvailable()) {
      setCloudSyncStatus('off');
      return;
    }

    if (pullingRef.current) return;

    const rev = state.syncRevision ?? 0;
    if (rev === lastSyncedRevisionRef.current) return;

    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void pushToCloud();
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(pushTimerRef.current);
  }, [state, pushToCloud]);

  useEffect(() => {
    if (!state.syncKey || !isCloudSyncAvailable()) return;

    void pullFromCloud();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullFromCloud();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => void pullFromCloud(), PULL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [state.syncKey, pullFromCloud]);

  const syncNow = useCallback(async () => {
    await pullFromCloud();
    await pushToCloud();
  }, [pullFromCloud, pushToCloud]);

  const enableCloudSync = useCallback(async (passphrase: string) => {
    if (!isCloudSyncAvailable()) {
      throw new Error(
        'Cloud sync is not configured on this deployment. Add Supabase env vars in Vercel.'
      );
    }
    const syncKey = await deriveSyncKey(passphrase);
    const remote = await pullHousehold(syncKey);
    const local = stateRef.current;

    if (remote && remote.revision > (local.syncRevision ?? 0)) {
      pullingRef.current = true;
      setState(withSyncMeta(remote.state, syncKey, remote.revision, remote.updatedAt));
      lastSyncedRevisionRef.current = remote.revision;
      pullingRef.current = false;
    } else {
      let next = bumpRevision(
        withSyncMeta(
          local,
          syncKey,
          Math.max(local.syncRevision ?? 0, remote?.revision ?? 0, 1)
        )
      );
      const pushed = await pushHousehold(syncKey, next, next.syncRevision ?? 1);
      pullingRef.current = true;
      setState(withSyncMeta(next, syncKey, pushed.revision, pushed.updatedAt));
      lastSyncedRevisionRef.current = pushed.revision;
      pullingRef.current = false;
    }

    setCloudSyncStatus('ok');
    setCloudSyncError(null);
  }, []);

  const disableCloudSync = useCallback(() => {
    setState((s) => {
      const next = { ...s };
      delete next.syncKey;
      delete next.syncRevision;
      delete next.lastCloudSyncAt;
      return next;
    });
    setCloudSyncStatus('off');
    setCloudSyncError(null);
  }, []);

  const activeMember =
    state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];

  const setActiveMember = useCallback((id: string) => {
    setState((s) => ({ ...s, activeMemberId: id }));
  }, []);

  const updateMemberName = useCallback((id: string, name: string) => {
    commitState((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === id ? { ...m, name } : m)),
    }));
  }, [commitState]);

  const setFinnhubKey = useCallback((key: string) => {
    commitState((s) => ({ ...s, finnhubApiKey: key }));
  }, [commitState]);

  const setAutoRefresh = useCallback((minutes: number) => {
    commitState((s) => ({ ...s, autoRefreshMinutes: minutes }));
  }, [commitState]);

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
    commitState((s) => {
      const mid = id || s.activeMemberId;
      return {
        ...s,
        memberLastActive: {
          ...s.memberLastActive,
          [mid]: new Date().toISOString(),
        },
      };
    });
  }, [commitState]);

  const markRitual = useCallback(
    (ritualId: string) => {
      commitState((s) => markRitualInternal(s, ritualId, true));
    },
    [commitState]
  );

  const toggleRitual = useCallback(
    (ritualId: string, done?: boolean) => {
      commitState((s) => {
        const date = todayKey();
        const current = s.ritualCompletions[date]?.[ritualId] ?? false;
        return markRitualInternal(s, ritualId, done ?? !current);
      });
      recordActivity();
    },
    [commitState, recordActivity]
  );

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
      const channel = channelForKind(input.kind, input.currency);
      const account: HouseholdAccount = {
        id: slugId(label),
        label,
        kind: input.kind,
        currency: input.currency,
        channel,
        platform: input.platform?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        suggestedModelId:
          input.kind === 'sipp' || input.kind === 'pension'
            ? 'sipp-accumulation'
            : input.kind === 'brokerage' && input.currency === 'USD'
              ? 'us-sp500-core'
              : input.kind === 'isa' || input.kind === 'gia'
                ? 'isa-us-citizen-growth'
                : undefined,
        allocationChannel:
          input.kind === 'isa' || input.kind === 'gia' ? 'us' : undefined,
        defaultPot: 0,
        ownership: 'personal',
      };
      commitState((s) => ({
        ...s,
        accounts: [...s.accounts, account],
      }));
      recordActivity();
    },
    [commitState, recordActivity]
  );

  const updateAccount = useCallback(
    (id: string, patch: Partial<HouseholdAccount>) => {
      commitState((s) => ({
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
    },
    [commitState]
  );

  const removeAccount = useCallback(
    (id: string): boolean => {
      let removed = false;
      commitState((s) => {
        if (s.holdings.some((h) => h.accountId === id)) return s;
        removed = true;
        return { ...s, accounts: s.accounts.filter((a) => a.id !== id) };
      });
      return removed;
    },
    [commitState]
  );

  const resolveAccountLabel = useCallback(
    (accountId: string) => getAccountLabel(state.accounts, accountId),
    [state.accounts]
  );

  const replaceState = useCallback((next: HouseholdState) => {
    pullingRef.current = true;
    setState(next);
    queueMicrotask(() => {
      pullingRef.current = false;
    });
  }, []);

  const addHolding = useCallback(
    (holding: Omit<Holding, 'id'>) => {
      commitState((s) => {
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
    },
    [commitState]
  );

  const removeHolding = useCallback(
    (id: string) => {
      commitState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== id) }));
    },
    [commitState]
  );

  const updateHolding = useCallback(
    (id: string, patch: Partial<Holding>) => {
      commitState((s) => ({
        ...s,
        holdings: s.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      }));
    },
    [commitState]
  );

  const setWatchlist = useCallback(
    (symbols: string[]) => {
      commitState((s) => ({
        ...s,
        watchlist: [...new Set(symbols.map((x) => x.toUpperCase()))],
      }));
    },
    [commitState]
  );

  const addToWatchlist = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      commitState((s) => ({
        ...s,
        watchlist: s.watchlist.includes(sym) ? s.watchlist : [...s.watchlist, sym],
      }));
    },
    [commitState]
  );

  const setDailyNote = useCallback(
    (note: string) => {
      const date = todayKey();
      commitState((s) => {
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
    },
    [commitState]
  );

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

  const cloudSyncConfigured = isCloudSyncAvailable();

  const value = useMemo(
    () => ({
      state,
      activeMember,
      cloudSyncStatus,
      cloudSyncConfigured,
      cloudSyncError,
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
      replaceState,
      enableCloudSync,
      disableCloudSync,
      syncNow,
    }),
    [
      state,
      activeMember,
      cloudSyncStatus,
      cloudSyncConfigured,
      cloudSyncError,
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
      replaceState,
      enableCloudSync,
      disableCloudSync,
      syncNow,
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
