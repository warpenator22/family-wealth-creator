import { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { INVEST_ACCOUNTS } from '../lib/fundManager/allocate';
import { UserSwitcher } from './UserSwitcher';

export function HoldingsEditor() {
  const { state, activeMember, addHolding, removeHolding, addToWatchlist } = useHousehold();
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [costGbp, setCostGbp] = useState('');
  const [accountId, setAccountId] = useState('kids-isa');
  const [notes, setNotes] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    addHolding({
      memberId: activeMember.id,
      accountId,
      symbol: sym,
      shares: Number(shares) || 0,
      costGbp: Number(costGbp) || 0,
      currency: 'USD',
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
        <p>Log trades on Interactive Investors — shared across the household.</p>
      </div>
      <UserSwitcher />

      <form className="holding-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Ticker
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MSFT"
              required
            />
          </label>
          <label>
            Shares
            <input
              type="number"
              step="any"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="4"
              required
            />
          </label>
          <label>
            Cost (£)
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
              {INVEST_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
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
            placeholder="ii limit order, day-one starter…"
          />
        </label>
        <button type="submit" className="btn-primary">
          Add holding as {activeMember.name}
        </button>
      </form>

      <table className="fm-table holdings-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Account</th>
            <th>Shares</th>
            <th>Cost</th>
            <th>Logged by</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {state.holdings.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-hint">
                Example: MSFT · 4 shares · £1,200 · Kids&apos; ISA
              </td>
            </tr>
          )}
          {state.holdings.map((h) => {
            const member = state.members.find((m) => m.id === h.memberId);
            const account = INVEST_ACCOUNTS.find((a) => a.id === h.accountId);
            return (
              <tr key={h.id}>
                <td className="col-ticker">{h.symbol}</td>
                <td>{account?.label ?? h.accountId}</td>
                <td className="col-num">{h.shares}</td>
                <td className="col-num">£{h.costGbp.toLocaleString()}</td>
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
