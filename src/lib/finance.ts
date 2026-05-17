/** Future value with annual contributions at year-end */
export function futureValue(
  principal: number,
  annualContribution: number,
  annualReturn: number,
  years: number
): number {
  if (years <= 0) return principal;
  const r = annualReturn / 100;
  if (r === 0) return principal + annualContribution * years;
  const growth = Math.pow(1 + r, years);
  return principal * growth + annualContribution * ((growth - 1) / r);
}

/** Solve annual return (%) needed to reach target — binary search */
export function requiredReturn(
  principal: number,
  annualContribution: number,
  target: number,
  years: number
): number | null {
  if (futureValue(principal, annualContribution, 0, years) >= target) return 0;
  let lo = 0;
  let hi = 50;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (futureValue(principal, annualContribution, mid, years) >= target) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  if (futureValue(principal, annualContribution, hi, years) < target * 0.999) {
    return null;
  }
  return Math.round(hi * 10) / 10;
}

/** Annual contribution needed at a given return (%) */
export function requiredContribution(
  principal: number,
  target: number,
  annualReturn: number,
  years: number
): number | null {
  const r = annualReturn / 100;
  const growth = Math.pow(1 + r, years);
  const fromPrincipal = principal * growth;
  const shortfall = target - fromPrincipal;
  if (shortfall <= 0) return 0;
  if (years <= 0) return null;
  if (r === 0) return shortfall / years;
  const factor = (growth - 1) / r;
  if (factor <= 0) return null;
  return Math.ceil(shortfall / factor);
}

/** SIPP pot needed for monthly income at withdrawal rate (%) */
export function potForIncome(
  monthlyIncome: number,
  withdrawalRatePercent: number
): number {
  const annual = monthlyIncome * 12;
  return annual / (withdrawalRatePercent / 100);
}

/** Project SIPP growth to retirement */
export function projectSipp(
  currentPot: number,
  monthlyContribution: number,
  annualReturn: number,
  yearsToRetirement: number
): number {
  const annual = monthlyContribution * 12;
  return futureValue(currentPot, annual, annualReturn, yearsToRetirement);
}

/** Monthly income from pot at withdrawal rate */
export function incomeFromPot(
  pot: number,
  withdrawalRatePercent: number
): number {
  return (pot * (withdrawalRatePercent / 100)) / 12;
}

export function formatGBP(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000) {
    return `£${(n / 1_000_000).toFixed(2)}m`;
  }
  if (compact && Math.abs(n) >= 10_000) {
    return `£${(n / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}
