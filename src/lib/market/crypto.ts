import type { Quote } from './finnhub';
import { fetchQuote } from './finnhub';

const BASE = 'https://finnhub.io/api/v1';

/** User ticker → Finnhub crypto pair symbols (tried in order) */
const PAIR_CANDIDATES: Record<string, string[]> = {
  BTC: ['BINANCE:BTCUSDT', 'COINBASE:BTC-USD'],
  ETH: ['BINANCE:ETHUSDT', 'COINBASE:ETH-USD'],
  SOL: ['BINANCE:SOLUSDT', 'COINBASE:SOL-USD'],
  XRP: ['BINANCE:XRPUSDT'],
  ADA: ['BINANCE:ADAUSDT', 'COINBASE:ADA-USD', 'KRAKEN:ADAUSD'],
  DOGE: ['BINANCE:DOGEUSDT'],
  DOT: ['BINANCE:DOTUSDT'],
  AVAX: ['BINANCE:AVAXUSDT'],
  LINK: ['BINANCE:LINKUSDT', 'COINBASE:LINK-USD', 'KRAKEN:LINKUSD'],
  UNI: ['BINANCE:UNIUSDT', 'COINBASE:UNI-USD', 'KRAKEN:UNIUSD'],
  POL: ['BINANCE:POLUSDT', 'BINANCE:MATICUSDT', 'COINBASE:POL-USD'],
  MATIC: ['BINANCE:POLUSDT', 'BINANCE:MATICUSDT', 'COINBASE:MATIC-USD'],
  LTC: ['BINANCE:LTCUSDT'],
  BCH: ['BINANCE:BCHUSDT'],
  USDT: ['BINANCE:USDCUSDT'],
  USDC: ['BINANCE:USDCUSDT'],
};

const TICKER_ALIASES: Record<string, string> = {
  MATIC: 'POL',
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function candidatesFor(ticker: string): string[] {
  const base = ticker.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const canonical = TICKER_ALIASES[base] ?? base;
  const fromMap = PAIR_CANDIDATES[canonical] ?? PAIR_CANDIDATES[base];
  if (fromMap) return fromMap;
  return [
    `BINANCE:${canonical}USDT`,
    `BINANCE:${base}USDT`,
    `COINBASE:${canonical}-USD`,
    `KRAKEN:${canonical}USD`,
  ];
}

async function quoteFromCandles(
  pairSymbol: string,
  apiKey: string,
  displayTicker: string
): Promise<Quote> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 86400 * 14;
  const res = await fetch(
    `${BASE}/crypto/candle?symbol=${encodeURIComponent(pairSymbol)}&resolution=D&from=${from}&to=${now}&token=${apiKey}`
  );
  if (res.status === 429) {
    await sleep(1100);
    throw new Error('RATE_LIMIT');
  }
  if (!res.ok) throw new Error(`Crypto candle failed for ${pairSymbol}`);
  const data = await res.json();
  if (data.error) throw new Error(String(data.error));
  if (data.s !== 'ok' || !data.c?.length) {
    throw new Error(`No candle data for ${pairSymbol}`);
  }
  const closes = data.c as number[];
  const price = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2] ?? price;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol: displayTicker,
    price,
    change,
    changePercent,
    high: data.h?.[data.h.length - 1] ?? price,
    low: data.l?.[data.l.length - 1] ?? price,
    prevClose,
    updatedAt: Date.now(),
  };
}

/** Live USD price for a crypto ticker (BTC, ETH, …) */
export async function fetchCryptoQuote(
  ticker: string,
  apiKey: string
): Promise<Quote> {
  const display = ticker.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let rateLimited = false;

  for (const pair of candidatesFor(display)) {
    try {
      return await quoteFromCandles(pair, apiKey, display);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMIT') rateLimited = true;
      try {
        const q = await fetchQuote(pair, apiKey);
        return { ...q, symbol: display };
      } catch {
        /* try next pair */
      }
    }
  }

  if (rateLimited) throw new Error('RATE_LIMIT');
  throw new Error(`No live price for ${display}`);
}

const CRYPTO_FETCH_GAP_MS = 350;

/** Fetch crypto quotes one at a time to stay under Finnhub free-tier limits. */
export async function fetchCryptoQuotesThrottled(
  tickers: string[],
  apiKey: string
): Promise<Map<string, Quote>> {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const results = new Map<string, Quote>();

  for (let i = 0; i < unique.length; i++) {
    const sym = unique[i];
    try {
      const q = await fetchCryptoQuote(sym, apiKey);
      results.set(sym, q);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMIT' && i < unique.length) {
        await sleep(1200);
        i -= 1;
        continue;
      }
    }
    if (i < unique.length - 1) await sleep(CRYPTO_FETCH_GAP_MS);
  }
  return results;
}
