import type { Quote } from './finnhub';

const BASE = 'https://api.coingecko.com/api/v3';

/** Ticker → CoinGecko coin id (https://api.coingecko.com/api/v3/coins/list) */
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  MATIC: 'polygon-ecosystem-token',
  POL: 'polygon-ecosystem-token',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  SHIB: 'shiba-inu',
  TRX: 'tron',
  BNB: 'binancecoin',
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Batch USD quotes for tickers Finnhub did not resolve (no API key required). */
export async function fetchCoinGeckoQuotes(
  tickers: string[]
): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const idByTicker = new Map<string, string>();
  for (const t of unique) {
    const id = COIN_IDS[t];
    if (id) idByTicker.set(t, id);
  }
  if (idByTicker.size === 0) return out;

  const ids = [...new Set(idByTicker.values())].join(',');
  const url =
    `${BASE}/simple/price?ids=${encodeURIComponent(ids)}` +
    '&vs_currencies=usd&include_24hr_change=true';

  let res = await fetch(url);
  if (res.status === 429) {
    await sleep(1200);
    res = await fetch(url);
  }
  if (!res.ok) return out;

  const data = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;

  for (const [ticker, coinId] of idByTicker) {
    const row = data[coinId];
    if (row?.usd == null) continue;
    const price = row.usd;
    const changePercent = row.usd_24h_change ?? 0;
    const prevClose = price / (1 + changePercent / 100);
    const change = price - prevClose;
    out.set(ticker, {
      symbol: ticker,
      price,
      change,
      changePercent,
      high: price,
      low: price,
      prevClose,
      updatedAt: Date.now(),
    });
  }
  return out;
}
