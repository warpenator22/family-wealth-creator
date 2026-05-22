import { useEffect, useMemo, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { formatGBP } from '../lib/finance';
import { valueForHolding } from '../lib/market/holdingValue';
import { formatPct, formatUsd, isUsableQuote } from '../lib/market/finnhub';
import { useMarketIntel } from '../hooks/useMarketIntel';
import { DailyRitual } from './DailyRitual';
import { UserSwitcher } from './UserSwitcher';

export function Dashboard() {
  const {
    state,
    activeMember,
    getDailyNote,
    setDailyNote,
    markRitual,
    recordActivity,
    getAccountLabel,
  } = useHousehold();
  const { quotes, marketNews, holdingNews, loading, error, lastRefresh, refresh } =
    useMarketIntel();
  const [note, setNote] = useState(getDailyNote);

  useEffect(() => {
    setNote(getDailyNote());
  }, [activeMember.id, getDailyNote]);

  const portfolioStats = useMemo(() => {
    let costGbp = 0;
    let valueGbp = 0;
    let dayChangeGbp = 0;

    for (const h of state.holdings) {
      const q = quotes.get(h.symbol.toUpperCase());
      const v = valueForHolding(h.shares, h.costGbp, q);
      costGbp += v.costGbp;
      valueGbp += v.valueGbp;
      dayChangeGbp += v.dayChangeGbp;
    }

    return {
      costGbp,
      valueGbp,
      dayChangeGbp,
      gainGbp: valueGbp - costGbp,
    };
  }, [state.holdings, quotes]);

  const saveNote = () => setDailyNote(note);

  const handleRefresh = async () => {
    await refresh();
    markRitual('refresh');
    recordActivity();
  };

  return (
    <div className="dashboard">
      <DailyRitual />
      <div className="dash-toolbar">
        <UserSwitcher />
        <div className="dash-actions">
          <span className="last-refresh">
            {lastRefresh
              ? `Updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
              : 'Not refreshed'}
          </span>
          <button type="button" className="btn-primary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh market'}
          </button>
        </div>
      </div>

      {!state.finnhubApiKey.trim() && (
        <div className="alert-banner">
          <strong>Connect live market data</strong> — add a free{' '}
          <a href="https://finnhub.io/register" target="_blank" rel="noreferrer">
            Finnhub API key
          </a>{' '}
          in Settings (60 calls/min, enough for daily use).
        </div>
      )}

      {error && <div className="alert-banner alert-error">{error}</div>}

      <div className="dash-stats">
        <div className="stat-card">
          <span className="stat-label">Household holdings</span>
          <span className="stat-value">{formatGBP(portfolioStats.valueGbp, true)}</span>
          <span className="stat-sub">
            Cost {formatGBP(portfolioStats.costGbp, true)}
            {portfolioStats.gainGbp !== 0 && (
              <>
                {' '}
                · P/L{' '}
                <span className={portfolioStats.gainGbp >= 0 ? 'up' : 'down'}>
                  {formatGBP(portfolioStats.gainGbp, true)}
                </span>
              </>
            )}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Today&apos;s move (holdings)</span>
          <span
            className={`stat-value ${portfolioStats.dayChangeGbp >= 0 ? 'up' : 'down'}`}
          >
            {formatGBP(portfolioStats.dayChangeGbp)}
          </span>
          <span className="stat-sub">All Warp household accounts</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Watching</span>
          <span className="stat-value">{state.watchlist.length}</span>
          <span className="stat-sub">
            Auto-refresh every {state.autoRefreshMinutes} min
          </span>
        </div>
      </div>

      <section className="dash-section">
        <h2>Today&apos;s Warp family note</h2>
        <p className="section-hint">
          Logged as <strong>{activeMember.name}</strong> — household data is shared with cloud
          sync enabled.
        </p>
        <textarea
          className="daily-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="Decisions, trades placed, questions for tonight…"
          rows={3}
        />
      </section>

      <section className="dash-section">
        <h2>Your holdings</h2>
        {state.holdings.length === 0 ? (
          <p className="empty-hint">
            No holdings yet — add your MSFT / GOOGL trades in the Holdings tab.
          </p>
        ) : (
          <div className="quote-grid">
            {state.holdings.map((h) => {
              const q = quotes.get(h.symbol.toUpperCase());
              const acct = state.accounts.find((a) => a.id === h.accountId);
              const isCrypto = acct?.kind === 'crypto';
              const v = valueForHolding(h.shares, h.costGbp, q);
              const qtyLabel = isCrypto ? 'units' : 'shares';

              return (
                <div key={h.id} className={`quote-card ${isCrypto ? 'crypto-holding' : ''}`}>
                  <div className="quote-card-top">
                    <span className="quote-sym">{h.symbol}</span>
                    <span className="quote-account">{getAccountLabel(h.accountId)}</span>
                  </div>
                  <span className="quote-price">
                    {isUsableQuote(q) ? formatUsd(q.price) : 'No live price'}
                  </span>
                  {isUsableQuote(q) && (
                    <span className={`quote-chg ${q.change >= 0 ? 'up' : 'down'}`}>
                      {formatUsd(q.change)} ({formatPct(q.changePercent)}) today
                    </span>
                  )}
                  <span className="quote-meta">
                    {h.shares} {qtyLabel} · cost {formatGBP(v.costGbp)}
                    {v.hasLivePrice && (
                      <>
                        {' '}
                        · value {formatGBP(v.valueGbp)}
                        <span className={v.gainGbp >= 0 ? ' up' : ' down'}>
                          {' '}
                          · P/L {formatGBP(v.gainGbp)} ({v.gainPct >= 0 ? '+' : ''}
                          {v.gainPct.toFixed(1)}%)
                        </span>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2>Watchlist</h2>
        <div className="quote-grid compact">
          {state.watchlist.map((sym) => {
            const q = quotes.get(sym);
            return (
              <div key={sym} className="quote-card compact">
                <span className="quote-sym">{sym}</span>
                <span className="quote-price">
                  {isUsableQuote(q) ? formatUsd(q.price) : '—'}
                </span>
                {isUsableQuote(q) && (
                  <span className={`quote-chg ${q.change >= 0 ? 'up' : 'down'}`}>
                    {formatPct(q.changePercent)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="news-columns">
        <section className="dash-section">
          <h2>Market headlines</h2>
          <ul className="news-list">
            {marketNews.length === 0 && !loading && (
              <li className="news-empty">Refresh to load headlines.</li>
            )}
            {marketNews.map((n) => (
              <li key={n.id}>
                <a href={n.url} target="_blank" rel="noreferrer">
                  {n.headline}
                </a>
                <span className="news-meta">
                  {n.source} · {new Date(n.datetime * 1000).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="dash-section">
          <h2>Holding intel</h2>
          <ul className="news-list">
            {holdingNews.length === 0 && !loading && (
              <li className="news-empty">News for your top holding appears here.</li>
            )}
            {holdingNews.map((n) => (
              <li key={n.id}>
                <a href={n.url} target="_blank" rel="noreferrer">
                  {n.headline}
                </a>
                <span className="news-meta">{n.source}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

