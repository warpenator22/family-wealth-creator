import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchCompanyNews,
  fetchMarketNews,
  fetchQuotes,
  type NewsItem,
  type Quote,
} from '../lib/market/finnhub';
import { useHousehold } from '../context/HouseholdContext';

export interface MarketIntel {
  quotes: Map<string, Quote>;
  marketNews: NewsItem[];
  holdingNews: NewsItem[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  refresh: () => Promise<void>;
}

export function useMarketIntel(): MarketIntel {
  const { state, allSymbols } = useHousehold();
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [holdingNews, setHoldingNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortRef = useRef(false);

  const refresh = useCallback(async () => {
    const key = state.finnhubApiKey.trim();
    if (!key) {
      setError('Add a Finnhub API key in Settings to load live market data.');
      return;
    }
    if (allSymbols.length === 0) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const [quoteMap, generalNews] = await Promise.all([
        fetchQuotes(allSymbols, key),
        fetchMarketNews(key, 10),
      ]);

      if (abortRef.current) return;

      const topHolding =
        state.holdings[0]?.symbol ?? allSymbols.find((s) => !['VWRP', 'VUSA'].includes(s)) ?? 'MSFT';
      const company = await fetchCompanyNews(topHolding, key, 6);

      if (abortRef.current) return;

      setQuotes(quoteMap);
      setMarketNews(generalNews);
      setHoldingNews(company);
      setLastRefresh(new Date());
    } catch (e) {
      if (!abortRef.current) {
        setError(e instanceof Error ? e.message : 'Market data unavailable');
      }
    } finally {
      if (!abortRef.current) setLoading(false);
    }
  }, [state.finnhubApiKey, allSymbols, state.holdings]);

  useEffect(() => {
    refresh();
    return () => {
      abortRef.current = true;
    };
  }, [refresh]);

  useEffect(() => {
    const mins = state.autoRefreshMinutes;
    if (mins <= 0 || !state.finnhubApiKey.trim()) return;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, mins * 60 * 1000);

    return () => clearInterval(id);
  }, [state.autoRefreshMinutes, state.finnhubApiKey, refresh]);

  return {
    quotes,
    marketNews,
    holdingNews,
    loading,
    error,
    lastRefresh,
    refresh,
  };
}
