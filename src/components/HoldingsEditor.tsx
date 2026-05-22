import { useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { formatGBP } from '../lib/finance';
import { valueForHolding } from '../lib/market/holdingValue';
import { formatPct, formatUsd } from '../lib/market/finnhub';
import { useMarketIntel } from '../hooks/useMarketIntel';
import { UserSwitcher } from './UserSwitcher';

export function HoldingsEditor() {
  const { state, activeMember, addHolding, removeHolding, addToWatchlist, getAccountLabel } =
    useHousehold();
  const { quotes } = useMarketIntel();
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [costGbp, setCostGbp] = useState('');
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!state.accounts.some((a) => a.id === accountId) && state.accounts[0]) {
      setAccountId(state.accounts[0].id);
    }
  }, [state.accounts, accountId]);

  const selectedAccount = state.accounts.find((a) => a.id === accountId);
  const isCrypto = selectedAccount?.kind === 'crypto';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    if (!sym || !accountId) return;
    addHolding({
      memberId: activeMember.id,
      accountId,
      symbol: sym,
      shares: Number(shares) || 0,
      costGbp: Number(costGbp) || 0,
      currency: selectedAccount?.currency === 'USD' ? 'USD' : 'GBP',
      boughtAt: new Date().toISOString().slice(0, 10),
      notes: notes || undefined,
    });
    addToWatchlist(sym);
    setSymbol('');
    setShares('');
    setCostGbp('');
    setNotes('');
  };

  return (
    <section className="holdings-editor">
      <div className="section-heading">
        <h2>Holdings</h2>
        <p>
          Self-report what you own — pick an account, then log ticker, quantity, and cost.
          No link to Schwab, ii, or exchanges.
        </p>
      </div>
      <UserSwitcher />

      {state.accounts.length === 0 ? (
        <p className="empty-hint">
          Add accounts first (Crypto, Pension, etc.) in the <strong>Accounts</strong> tab.
        </p>
      ) : (
        <form className="holding-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              {isCrypto ? 'Asset' : 'Ticker'}
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder={isCrypto ? 'BTC' : 'MSFT'}
                required
              />
            </label>
            <label>
              {isCrypto ? 'Amount' : 'Shares'}
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder={isCrypto ? '0.5' : '4'}
                required
              />
            </label>
            <label>
              Cost ({selectedAccount?.currency === 'USD' ? '$' : '£'})
              <input
                type="number"
                value={costGbp}
                onChange={(e) => setCostGbp(e.target.value)}
                placeholder="1200"
                required
              />
            </label>
            <label>
              Account
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.kind})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Manual entry, wallet address…"
            />
          </label>
          <button type="submit" className="btn-primary">
            Add holding as {activeMember.name}
          </button>
        </form>
      )}

      <table className="fm-table holdings-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Account</th>
            <th>Qty</th>
            <th>Cost</th>
            <th>Live</th>
            <th>Value / P/L</th>
            <th>Logged by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {state.holdings.length === 0 && (
            <tr>
              <td colSpan={8} className="empty-hint">
                Example: BTC · 0.5 · £20,000 · Crypto — or MSFT · 4 · £1,200 · Your ISA (Kids Fund)
              </td>
            </tr>
          )}
          {state.holdings.map((h) => {
            const member = state.members.find((m) => m.id === h.memberId);
            const q = quotes.get(h.symbol.toUpperCase());
            const v = valueForHolding(h.shares, h.costGbp, q);
            return (
              <tr key={h.id}>
                <td className="col-ticker">{h.symbol}</td>
                <td>{getAccountLabel(h.accountId)}</td>
                <td className="col-num">{h.shares}</td>
                <td className="col-num">
                  {h.currency === 'USD' ? '$' : '£'}
                  {h.costGbp.toLocaleString()}
                </td>
                <td className="col-num">
                  {q ? (
                    <>
                      {formatUsd(q.price)}
                      <span className={`holdings-chg ${q.change >= 0 ? 'up' : 'down'}`}>
                        {formatPct(q.changePercent)}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="col-num">
                  {v.hasLivePrice ? (
                    <span className={v.gainGbp >= 0 ? 'up' : 'down'}>
                      {formatGBP(v.valueGbp)}
                      <span className="holdings-pl">
                        {formatGBP(v.gainGbp)} ({v.gainPct >= 0 ? '+' : ''}
                        {v.gainPct.toFixed(1)}%)
                      </span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{member?.name ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => removeHolding(h.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
