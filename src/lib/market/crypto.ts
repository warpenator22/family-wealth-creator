import type { Quote } from './finnhub';
import { fetchQuote } from './finnhub';

const BASE = 'https://finnhub.io/api/v1';

/** User ticker → Finnhub crypto pair symbols (tried in order) */
const PAIR_CANDIDATES: Record<string, string[]> = {
  BTC: ['BINANCE:BTCUSDT', 'COINBASE:BTC-USD'],
  ETH: ['BINANCE:ETHUSDT', 'COINBASE:ETH-USD'],
  SOL: ['BINANCE:SOLUSDT'],
  XRP: ['BINANCE:XRPUSDT'],
  ADA: ['BINANCE:ADAUSDT'],
  DOGE: ['BINANCE:DOGEUSDT'],
  DOT: ['BINANCE:DOTUSDT'],
  AVAX: ['BINANCE:AVAXUSDT'],
  LINK: ['BINANCE:LINKUSDT'],
  MATIC: ['BINANCE:MATICUSDT'],
  LTC: ['BINANCE:LTCUSDT'],
  BCH: ['BINANCE:BCHUSDT'],
  USDT: ['BINANCE:USDCUSDT'],
  USDC: ['BINANCE:USDCUSDT'],
};

function candidatesFor(ticker: string): string[] {
  const base = ticker.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (PAIR_CANDIDATES[base]) return PAIR_CANDIDATES[base];
  return [`BINANCE:${base}USDT`, `COINBASE:${base}-USD`];
}

async function quoteFromCandles(
  pairSymbol: string,
  apiKey: string,
  displayTicker: string
): Promise<Quote> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 86400 * 5;
  const res = await fetch(
    `${BASE}/crypto/candle?symbol=${encodeURIComponent(pairSymbol)}&resolution=D&from=${from}&to=${now}&token=${apiKey}`
  );
  if (!res.ok) throw new Error(`Crypto candle failed for ${pairSymbol}`);
  const data = await res.json();
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
  const display = ticker.toUpperCase();
  for (const pair of candidatesFor(display)) {
    try {
      const q = await fetchQuote(pair, apiKey);
      return { ...q, symbol: display };
    } catch {
      try {
        return await quoteFromCandles(pair, apiKey, display);
      } catch {
        /* try next pair */
      }
    }
  }
  throw new Error(`No live price for ${display}`);
}
