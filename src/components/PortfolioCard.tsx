import { useMemo, useState } from 'react';
import type { PortfolioPlan } from '../lib/portfolios';
import {
  formatGBP,
  formatPercent,
  futureValue,
  incomeFromPot,
  potForIncome,
  projectSipp,
  requiredContribution,
  requiredReturn,
} from '../lib/finance';

interface Props {
  plan: PortfolioPlan;
  sippMonthlyIncome?: number;
  sippWithdrawalRate?: number;
}

export function PortfolioCard({
  plan,
  sippMonthlyIncome = 3_000,
  sippWithdrawalRate = 4,
}: Props) {
  const [principal, setPrincipal] = useState(plan.principal);
  const [target, setTarget] = useState(plan.target);
  const [years, setYears] = useState(plan.years);
  const [contribution, setContribution] = useState(plan.annualContribution);
  const [assumedReturn, setAssumedReturn] = useState(plan.assumedReturn);

  const isSipp = plan.wrapper === 'sipp';

  const projected = useMemo(() => {
    if (isSipp) {
      return projectSipp(principal, contribution / 12, assumedReturn, years);
    }
    return futureValue(principal, contribution, assumedReturn, years);
  }, [principal, contribution, assumedReturn, years, isSipp]);

  const neededReturn = useMemo(
    () => requiredReturn(principal, contribution, isSipp ? potForIncome(sippMonthlyIncome, sippWithdrawalRate) : target, years),
    [principal, contribution, target, years, isSipp, sippMonthlyIncome, sippWithdrawalRate]
  );

  const neededContribution = useMemo(
    () =>
      requiredContribution(
        principal,
        isSipp ? potForIncome(sippMonthlyIncome, sippWithdrawalRate) : target,
        assumedReturn,
        years
      ),
    [principal, target, assumedReturn, years, isSipp, sippMonthlyIncome, sippWithdrawalRate]
  );

  const sippPotNeeded = potForIncome(sippMonthlyIncome, sippWithdrawalRate);
  const sippProjectedIncome = incomeFromPot(projected, sippWithdrawalRate);
  const effectiveTarget = isSipp ? sippPotNeeded : target;
  const gap = effectiveTarget - projected;
  const onTrack = projected >= effectiveTarget * 0.98;

  return (
    <article className={`portfolio-card wrapper-${plan.wrapper} plan-${plan.id}`}>
      <header className="card-header">
        <span className="wrapper-badge">{plan.wrapper.toUpperCase()}</span>
        <div>
          <h2>{plan.title}</h2>
          <p className="subtitle">{plan.subtitle}</p>
        </div>
      </header>

      <div className="inputs-grid">
        <label>
          Current pot
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
            step={1000}
          />
        </label>
        <label>
          {isSipp ? 'Pot needed (income goal)' : 'Target'}
          <input
            type="number"
            value={isSipp ? sippPotNeeded : target}
            onChange={(e) => !isSipp && setTarget(Number(e.target.value) || 0)}
            step={1000}
            readOnly={isSipp}
          />
        </label>
        <label>
          Years
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value) || 1)}
            min={1}
            max={40}
          />
        </label>
        <label>
          {isSipp ? 'Monthly contribution' : 'Annual contribution'}
          <input
            type="number"
            value={isSipp ? contribution / 12 : contribution}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setContribution(isSipp ? v * 12 : v);
            }}
            step={isSipp ? 100 : 500}
          />
        </label>
        <label>
          Assumed return (%/yr)
          <input
            type="number"
            value={assumedReturn}
            onChange={(e) => setAssumedReturn(Number(e.target.value) || 0)}
            step={0.5}
            min={0}
            max={15}
          />
        </label>
        <label className="allowance-hint">
          Annual allowance
          <span>{formatGBP(plan.annualAllowance)}</span>
        </label>
      </div>

      <div className="projection-panel">
        <div className="projection-main">
          <span className="label">Projected value</span>
          <span className={`value ${onTrack ? 'on-track' : 'short'}`}>
            {formatGBP(projected)}
          </span>
        </div>
        {!isSipp && (
          <div className="projection-meta">
            <span>Target {formatGBP(effectiveTarget)}</span>
            <span className={gap > 0 ? 'gap-negative' : 'gap-positive'}>
              {gap > 0 ? `Short by ${formatGBP(gap)}` : `Ahead by ${formatGBP(-gap)}`}
            </span>
          </div>
        )}
        {isSipp && (
          <div className="projection-meta">
            <span>
              Pot needed for £{sippMonthlyIncome.toLocaleString('en-GB')}/mo @{' '}
              {sippWithdrawalRate}%
            </span>
            <span>Projected income: {formatGBP(sippProjectedIncome)}/mo</span>
          </div>
        )}
      </div>

      <div className="requirements">
        <div>
          <span className="req-label">Return needed to hit target</span>
          <span className="req-value">
            {neededReturn === null ? 'Not achievable' : formatPercent(neededReturn)}
          </span>
        </div>
        <div>
          <span className="req-label">Contribution needed at {assumedReturn}%</span>
          <span className="req-value">
            {neededContribution === null
              ? '—'
              : `${formatGBP(neededContribution)}/yr`}
          </span>
        </div>
        {contribution > plan.annualAllowance && (
          <p className="warning">
            Exceeds {formatGBP(plan.annualAllowance)} allowance — use GIA or spread
            across wrappers.
          </p>
        )}
      </div>

      <section className="holdings">
        <h3>Suggested allocation</h3>
        <ul className="holdings-list">
          {plan.holdings.map((h) => (
            <li key={h.ticker}>
              <div className="holding-row">
                <span className="ticker">{h.ticker}</span>
                <span className="weight">{h.weight}%</span>
              </div>
              <span className="holding-name">{h.name}</span>
              <span className="holding-rationale">{h.rationale}</span>
            </li>
          ))}
        </ul>
      </section>

      <ul className="notes">
        {plan.notes.map((note, i) => (
          <li key={i}>{note}</li>
        ))}
      </ul>
    </article>
  );
}
