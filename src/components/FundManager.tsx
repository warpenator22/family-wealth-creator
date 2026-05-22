import { useEffect, useMemo, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { accountsForFundManager } from '../lib/household/accounts';
import { allocate, formatMoney, sumAllocated } from '../lib/fundManager/allocate';
import {
  MODEL_PORTFOLIOS,
  US_CITIZEN_CONSTRAINTS,
  getModelById,
} from '../lib/fundManager/modelPortfolios';

export function FundManager() {
  const { state } = useHousehold();
  const fundAccounts = useMemo(
    () => accountsForFundManager(state.accounts),
    [state.accounts]
  );

  const [accountId, setAccountId] = useState(fundAccounts[0]?.id ?? '');
  const [modelId, setModelId] = useState('growth-aggressive');
  const [pot, setPot] = useState(50_000);
  const [showConstraints, setShowConstraints] = useState(true);

  const account = fundAccounts.find((a) => a.id === accountId);

  useEffect(() => {
    if (!fundAccounts.some((a) => a.id === accountId) && fundAccounts[0]) {
      setAccountId(fundAccounts[0].id);
      setModelId(fundAccounts[0].suggestedModelId ?? 'growth-aggressive');
      setPot(fundAccounts[0].defaultPot ?? 0);
    }
  }, [fundAccounts, accountId]);

  const onAccountChange = (id: string) => {
    const acc = fundAccounts.find((a) => a.id === id);
    if (!acc) return;
    setAccountId(id);
    setModelId(acc.suggestedModelId ?? 'growth-aggressive');
    setPot(acc.defaultPot ?? 0);
  };

  const rows = useMemo(() => {
    if (!account) return [];
    return allocate(modelId, pot, account.channel);
  }, [modelId, pot, account]);

  const model = getModelById(modelId);
  const allocated = sumAllocated(rows);
  const drift = pot - allocated;

  const cryptoAccounts = state.accounts.filter((a) => a.channel === 'crypto');

  return (
    <section className="fund-manager">
      <div className="section-heading">
        <h2>Fund manager</h2>
        <p>
          Mirror best-in-class passive portfolios. UK accounts use UCITS ETFs; US
          brokerage uses individual equities (no US mutual funds).
        </p>
      </div>

      {cryptoAccounts.length > 0 && (
        <div className="alert-banner">
          <strong>Crypto accounts</strong> ({cryptoAccounts.map((a) => a.label).join(', ')})
          — track balances in <strong>Holdings</strong> only; no ETF model here.
        </div>
      )}

      {fundAccounts.length === 0 ? (
        <p className="empty-hint">Add a non-crypto account in the Accounts tab first.</p>
      ) : (
        <>
          <div className="fm-toolbar">
            <label>
              Account
              <select
                value={accountId}
                onChange={(e) => onAccountChange(e.target.value)}
              >
                {fundAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.currency})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Model portfolio
              <select value={modelId} onChange={(e) => setModelId(e.target.value)}>
                {MODEL_PORTFOLIOS.filter((m) => {
                  if (account?.channel === 'us') return true;
                  return m.id !== 'us-sp500-core' || m.uk.length > 0;
                }).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pot to deploy ({account?.currency ?? 'GBP'})
              <input
                type="number"
                value={pot}
                onChange={(e) => setPot(Number(e.target.value) || 0)}
                step={account?.currency === 'USD' ? 1000 : 500}
              />
            </label>
          </div>

          {model && account && (
            <>
              <div className="fm-model-card">
                <div className="fm-model-header">
                  <div>
                    <h3>{model.name}</h3>
                    <p className="fm-mirrors">Mirrors: {model.mirrors}</p>
                  </div>
                  <div className="fm-badges">
                    <span className={`risk-badge risk-${model.riskLevel}`}>
                      {model.riskLevel} risk
                    </span>
                    <span className="horizon-badge">{model.horizonYears} yr</span>
                  </div>
                </div>
                <p className="fm-desc">{model.description}</p>
                <ul className="fm-notes">
                  {model.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              <div className="fm-channel-banner">
                {account.channel === 'uk' ? (
                  <>
                    <strong>UK implementation</strong> — UCITS ETFs on LSE (ISA / SIPP / GIA
                    eligible). Use accumulating share classes where available.
                  </>
                ) : (
                  <>
                    <strong>US implementation</strong> — individual common stocks only.
                    Basket approximates index weights; extend with more names over time.
                  </>
                )}
              </div>

              <div className="fm-table-wrap">
                <table className="fm-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Instrument</th>
                      <th>Weight</th>
                      <th>Buy ({account.currency})</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={`${row.ticker}-${row.name}`}
                        className={row.ticker === '—' ? 'row-note' : ''}
                      >
                        <td className="col-ticker">{row.ticker}</td>
                        <td>{row.name}</td>
                        <td className="col-num">{row.weight.toFixed(1)}%</td>
                        <td className="col-num">
                          {formatMoney(row.amount, account.currency)}
                        </td>
                        <td className="col-meta">{row.meta ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>
                        <strong>Total</strong>
                      </td>
                      <td className="col-num">
                        <strong>{formatMoney(allocated, account.currency)}</strong>
                      </td>
                      <td className="col-meta">
                        {Math.abs(drift) > 1
                          ? `Rounding ${formatMoney(drift, account.currency)}`
                          : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <div className="fm-checklist">
        <h3>Execution checklist</h3>
        <ol>
          <li>Confirm account type and remaining annual allowance (ISA £20k, SIPP £60k).</li>
          <li>Place limit or market orders per row; prefer LSE open for UK ETFs.</li>
          <li>
            {account?.channel === 'us'
              ? 'Avoid adding US mutual funds or US ETFs — stick to the stock list.'
              : 'Use accumulating (Acc) share classes to defer UK dividend tax in GIA.'}
          </li>
          <li>Rebalance when any line drifts more than 5% from target weight.</li>
          <li>Log trades in Holdings the same day you execute.</li>
        </ol>
      </div>

      <div className="fm-constraints">
        <button
          type="button"
          className="constraints-toggle"
          onClick={() => setShowConstraints((v) => !v)}
        >
          {showConstraints ? '▼' : '▶'} US/UK citizen investing constraints
        </button>
        {showConstraints && (
          <ul>
            {US_CITIZEN_CONSTRAINTS.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="fm-models-grid">
        <h3>All model portfolios</h3>
        <div className="model-cards">
          {MODEL_PORTFOLIOS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`model-pick ${modelId === m.id ? 'active' : ''}`}
              onClick={() => setModelId(m.id)}
            >
              <span className="model-pick-name">{m.name}</span>
              <span className="model-pick-mirror">{m.mirrors}</span>
              <span className="model-pick-meta">
                {m.uk.length} UK · {m.us.filter((u) => u.ticker !== '—').length} US stocks
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
