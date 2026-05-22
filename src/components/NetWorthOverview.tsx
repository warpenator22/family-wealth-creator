import { useMemo, useState } from 'react';
import {
  DEFAULT_WEALTH,
  deploymentLadder,
  liquidTotal,
  totalNetWorth,
  usdToGbp,
  type AssetBucket,
} from '../lib/wealth';
import { formatGBP } from '../lib/finance';

export function NetWorthOverview() {
  const [fxRate, setFxRate] = useState(DEFAULT_WEALTH.fxUsdGbp);
  const [usInvestmentsUsd, setUsInvestmentsUsd] = useState(500_000);
  const [propertyGbp, setPropertyGbp] = useState(1_400_000);
  const [cashOtherGbp, setCashOtherGbp] = useState(200_000);
  const ukIsaGbp = 50_000;
  const ukKidsIsaGbp = 20_000;
  const ukSippGbp = 0;

  const buckets: AssetBucket[] = useMemo(
    () => [
      {
        id: 'property',
        label: 'Primary residence',
        valueGbp: propertyGbp,
        category: 'property',
        liquid: false,
        notes: DEFAULT_WEALTH.buckets[0].notes,
      },
      {
        id: 'us',
        label: 'US investments',
        valueGbp: usdToGbp(usInvestmentsUsd, fxRate),
        category: 'us',
        liquid: true,
        notes: DEFAULT_WEALTH.buckets[1].notes,
      },
      {
        id: 'cash-other',
        label: 'Cash & other (UK)',
        valueGbp: cashOtherGbp,
        category: 'cash',
        liquid: true,
        notes: DEFAULT_WEALTH.buckets[2].notes,
      },
      {
        id: 'uk-kids-isa',
        label: 'Your ISA (Kids Fund)',
        valueGbp: ukKidsIsaGbp,
        category: 'uk-invested',
        liquid: true,
        notes: DEFAULT_WEALTH.buckets[3].notes,
      },
      {
        id: 'uk-isa',
        label: 'Your ISA',
        valueGbp: ukIsaGbp,
        category: 'uk-invested',
        liquid: true,
        notes: DEFAULT_WEALTH.buckets[4].notes,
      },
      {
        id: 'uk-sipp',
        label: 'Your SIPP',
        valueGbp: ukSippGbp,
        category: 'uk-invested',
        liquid: false,
        notes: DEFAULT_WEALTH.buckets[5].notes,
      },
    ],
    [
      propertyGbp,
      usInvestmentsUsd,
      fxRate,
      cashOtherGbp,
      ukIsaGbp,
      ukKidsIsaGbp,
      ukSippGbp,
    ]
  );

  const netWorth = totalNetWorth(buckets);
  const liquid = liquidTotal(buckets);
  const propertyPct = (propertyGbp / netWorth) * 100;
  const ukInvested = ukIsaGbp + ukKidsIsaGbp + ukSippGbp;
  const liquidExProperty = netWorth - propertyGbp;
  const steps = deploymentLadder(cashOtherGbp);

  return (
    <section className="net-worth-section">
      <div className="section-heading">
        <h2>Full balance sheet</h2>
        <p>
          How your US holdings, property, and £200k cash relate to the three UK goals.
        </p>
      </div>

      <div className="fx-bar">
        <label>
          USD → GBP rate
          <input
            type="number"
            value={fxRate}
            onChange={(e) => setFxRate(Number(e.target.value) || DEFAULT_WEALTH.fxUsdGbp)}
            step={0.01}
            min={0.5}
            max={1.2}
          />
        </label>
        <span className="fx-hint">
          $500k ≈ {formatGBP(usdToGbp(500_000, fxRate), true)} at this rate
        </span>
      </div>

      <div className="wealth-inputs">
        <label>
          US investments (USD)
          <input
            type="number"
            value={usInvestmentsUsd}
            onChange={(e) => setUsInvestmentsUsd(Number(e.target.value) || 0)}
            step={10000}
          />
        </label>
        <label>
          Property value (GBP)
          <input
            type="number"
            value={propertyGbp}
            onChange={(e) => setPropertyGbp(Number(e.target.value) || 0)}
            step={50000}
          />
        </label>
        <label>
          Cash & other (GBP)
          <input
            type="number"
            value={cashOtherGbp}
            onChange={(e) => setCashOtherGbp(Number(e.target.value) || 0)}
            step={5000}
          />
        </label>
      </div>

      <div className="net-worth-totals">
        <div className="total-card primary">
          <span className="total-label">Total net worth</span>
          <span className="total-value">{formatGBP(netWorth, true)}</span>
        </div>
        <div className="total-card">
          <span className="total-label">Liquid assets</span>
          <span className="total-value">{formatGBP(liquid, true)}</span>
          <span className="total-sub">
            {((liquid / netWorth) * 100).toFixed(0)}% of net worth
          </span>
        </div>
        <div className="total-card">
          <span className="total-label">UK tax wrappers (invested)</span>
          <span className="total-value">{formatGBP(ukInvested, true)}</span>
          <span className="total-sub">
            {((ukInvested / liquidExProperty) * 100).toFixed(0)}% of non-property wealth
          </span>
        </div>
        <div className="total-card accent">
          <span className="total-label">Property share</span>
          <span className="total-value">{propertyPct.toFixed(0)}%</span>
          <span className="total-sub">Illiquid — plan goals from investable assets</span>
        </div>
      </div>

      <div className="allocation-bar" role="img" aria-label="Asset mix chart">
        {buckets.map((b) => {
          const pct = (b.valueGbp / netWorth) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={b.id}
              className={`bar-segment cat-${b.category}`}
              style={{ width: `${pct}%` }}
              title={`${b.label}: ${formatGBP(b.valueGbp)}`}
            />
          );
        })}
      </div>

      <ul className="bucket-list">
        {buckets.map((b) => (
          <li key={b.id} className={`bucket-item cat-${b.category}`}>
            <div className="bucket-row">
              <span className="bucket-label">{b.label}</span>
              <span className="bucket-value">{formatGBP(b.valueGbp)}</span>
            </div>
            <span className="bucket-meta">
              {b.liquid ? 'Liquid' : 'Illiquid'} ·{' '}
              {((b.valueGbp / netWorth) * 100).toFixed(1)}% of net worth
            </span>
          </li>
        ))}
      </ul>

      <div className="insight-panel">
        <h3>What this means for your goals</h3>
        <ul className="insight-list">
          <li>
            <strong>£300k ISA in 5 years</strong> is far more reachable with{' '}
            {formatGBP(cashOtherGbp)} deployable cash plus GIA capacity — you are not limited
            to the £50k already in the ISA, but only {formatGBP(20_000)}/yr can go inside the
            wrapper.
          </li>
          <li>
            <strong>£100k Kids Fund ISA</strong> — your {formatGBP(20_000)}/yr adult allowance,
            PFIC-safe stocks (not UCITS); maxing at ~8% projects well past £100k in 5 years.
          </li>
          <li>
            <strong>SIPP £3k/mo income</strong> — a one-off {formatGBP(50_000)}–
            {formatGBP(100_000)} opening contribution from cash (with tax relief) materially
            shortens the path vs starting from zero.
          </li>
          <li>
            <strong>US $500k</strong> at {formatGBP(usdToGbp(usInvestmentsUsd, fxRate), true)}{' '}
            is your largest liquid block — treat as global equity ballast; UK wrappers handle
            UK-tax-efficient growth.
          </li>
          <li>
            <strong>House {formatGBP(propertyGbp, true)}</strong> — wealth on paper. For
            retirement income, investable portfolios matter more than property value unless
            you downsize or release equity later.
          </li>
        </ul>
      </div>

      <div className="deployment-panel">
        <h3>Suggested deployment for the £200k cash</h3>
        <ol className="deployment-list">
          {steps.map((step) => (
            <li key={step.priority}>
              <span className="step-num">{step.priority}</span>
              <div>
                <strong>{step.title}</strong>
                <span className="step-amount">{step.amountHint}</span>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
