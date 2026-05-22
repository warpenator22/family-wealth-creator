import { fetchCoinGeckoQuotes } from './coingecko';
import { fetchCryptoQuote, fetchCryptoQuotesThrottled } from './crypto';

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  prevClose: number;
  updatedAt: number;
}

export interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
}

const BASE = 'https://finnhub.io/api/v1';

function requireKey(apiKey: string): void {
  if (!apiKey.trim()) throw new Error('FINNHUB_KEY_MISSING');
}

export async function fetchQuote(symbol: string, apiKey: string): Promise<Quote> {
  requireKey(apiKey);
  const res = await fetch(
    `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Quote failed for ${symbol}`);
  const data = await res.json();
  if (data.c === 0 && data.pc === 0) {
    throw new Error(`No data for ${symbol}`);
  }
  const price = data.c as number;
  const prevClose = data.pc as number;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol,
    price,
    change,
    changePercent,
    high: data.h,
    low: data.l,
    prevClose,
    updatedAt: Date.now(),
  };
}

export async function fetchQuotes(
  symbols: string[],
  apiKey: string,
  cryptoTickers: Set<string> = new Set()
): Promise<Map<string, Quote>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const results = new Map<string, Quote>();

  const cryptoList = unique.filter((s) => cryptoTickers.has(s));
  const stockList = unique.filter((s) => !cryptoTickers.has(s));

  const cryptoMap = await fetchCryptoQuotesThrottled(cryptoList, apiKey);
  for (const [sym, q] of cryptoMap) results.set(sym, q);

  const missingCrypto = cryptoList.filter((s) => !results.has(s));
  if (missingCrypto.length > 0) {
    const fallback = await fetchCoinGeckoQuotes(missingCrypto);
    for (const [sym, q] of fallback) results.set(sym, q);
  }

  await Promise.all(
    stockList.map(async (sym) => {
      try {
        const q = await fetchQuote(sym, apiKey);
        results.set(sym, q);
      } catch {
        try {
          const q = await fetchCryptoQuote(sym, apiKey);
          results.set(sym, q);
        } catch {
          /* skip */
        }
      }
    })
  );

  const maybeCrypto = stockList.filter((s) => !results.has(s));
  if (maybeCrypto.length > 0) {
    const fallback = await fetchCoinGeckoQuotes(maybeCrypto);
    for (const [sym, q] of fallback) results.set(sym, q);
  }

  return results;
}

/** Symbols held in crypto accounts */
export function cryptoTickersFromHoldings(
  holdings: { symbol: string; accountId: string }[],
  accountKindById: Map<string, string>
): Set<string> {
  const set = new Set<string>();
  for (const h of holdings) {
    if (accountKindById.get(h.accountId) === 'crypto') {
      set.add(h.symbol.toUpperCase());
    }
  }
  return set;
}

export async function fetchMarketNews(apiKey: string, limit = 12): Promise<NewsItem[]> {
  requireKey(apiKey);
  const res = await fetch(`${BASE}/news?category=general&token=${apiKey}`);
  if (!res.ok) throw new Error('News fetch failed');
  const data = (await res.json()) as NewsItem[];
  return data.slice(0, limit);
}

export async function fetchCompanyNews(
  symbol: string,
  apiKey: string,
  limit = 5
): Promise<NewsItem[]> {
  requireKey(apiKey);
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const res = await fetch(
    `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as NewsItem[];
  return data.slice(0, limit);
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
