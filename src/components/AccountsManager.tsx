import { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import {
  ACCOUNT_KIND_LABELS,
  type AccountKind,
} from '../lib/household/accounts';

const KINDS = Object.keys(ACCOUNT_KIND_LABELS) as AccountKind[];

export function AccountsManager() {
  const { state, addAccount, updateAccount, removeAccount } = useHousehold();
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<AccountKind>('crypto');
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const holdingsByAccount = (accountId: string) =>
    state.holdings.filter((h) => h.accountId === accountId).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!label.trim()) {
      setError('Enter an account name.');
      return;
    }
    addAccount({ label, kind, currency, platform, notes });
    setLabel('');
    setPlatform('');
    setNotes('');
  };

  const handleRemove = (id: string) => {
    setError('');
    const ok = removeAccount(id);
    if (!ok) {
      setError('Remove holdings in this account first, then delete the account.');
    }
  };

  return (
    <section className="accounts-manager">
      <div className="section-heading">
        <h2>Accounts</h2>
        <p>
          Add every place you hold wealth — ISAs, pension, crypto, Schwab, etc. Then log
          holdings against each account (self-reported, no broker login).
        </p>
      </div>

      <form className="account-add-form" onSubmit={submit}>
        <h3>Add account</h3>
        <div className="form-grid">
          <label>
            Account name
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Coinbase, Workplace pension"
              required
            />
          </label>
          <label>
            Type
            <select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {ACCOUNT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Currency
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'GBP' | 'USD')}
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
          <label>
            Platform (optional)
            <input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Kraken, Aviva, ii…"
            />
          </label>
        </div>
        <label>
          Notes (optional)
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cold wallet, old employer scheme…"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary">
          Add account
        </button>
      </form>

      <div className="accounts-list-wrap">
        <h3>Your accounts ({state.accounts.length})</h3>
        <ul className="accounts-list">
          {state.accounts.map((a) => {
            const holdingCount = holdingsByAccount(a.id);
            return (
              <li key={a.id} className={`account-card kind-${a.kind}`}>
                <div className="account-card-head">
                  <div>
                    <span className="account-name">{a.label}</span>
                    <span className="account-kind-badge">
                      {ACCOUNT_KIND_LABELS[a.kind]}
                    </span>
                  </div>
                  <span className="account-currency">{a.currency}</span>
                </div>
                {a.platform && (
                  <span className="account-platform">{a.platform}</span>
                )}
                <span className="account-meta">
                  {holdingCount} holding{holdingCount === 1 ? '' : 's'} ·{' '}
                  {a.channel === 'crypto'
                    ? 'Track in Holdings (manual)'
                    : a.channel === 'us'
                      ? 'US stocks in Fund manager'
                      : 'UK ETFs in Fund manager'}
                </span>
                {a.notes && <span className="account-notes">{a.notes}</span>}
                <div className="account-card-actions">
                  <label className="inline-edit">
                    Rename
                    <input
                      value={a.label}
                      onChange={(e) =>
                        updateAccount(a.id, { label: e.target.value })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleRemove(a.id)}
                    disabled={holdingCount > 0}
                    title={
                      holdingCount > 0
                        ? 'Remove holdings first'
                        : 'Delete account'
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
