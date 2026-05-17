import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FundManager } from './components/FundManager';
import { HoldingsEditor } from './components/HoldingsEditor';
import { NetWorthOverview } from './components/NetWorthOverview';
import { PortfolioCard } from './components/PortfolioCard';
import { Settings } from './components/Settings';
import { DEFAULT_PLANS } from './lib/portfolios';
import './App.css';

export type AppView = 'dashboard' | 'planner' | 'fund-manager' | 'holdings' | 'settings';

function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [sippMonthlyIncome, setSippMonthlyIncome] = useState(3_000);
  const [sippWithdrawalRate, setSippWithdrawalRate] = useState(4);
  const [yearsToRetirement, setYearsToRetirement] = useState(22);

  const plans = DEFAULT_PLANS.map((p) =>
    p.id === 'personal-sipp' ? { ...p, years: yearsToRetirement } : p
  );

  const navItems: { id: AppView; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'planner', label: 'Wealth planner' },
    { id: 'fund-manager', label: 'Fund manager' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <p className="eyebrow">Family Wealth Creator</p>
          <h1>Family investment HQ</h1>
          <p className="lede">
            Daily market intel, shared holdings, and long-term plans for your household.
          </p>
        </div>
        <nav className="app-nav" aria-label="Main">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'nav-active' : ''}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'dashboard' && <Dashboard />}
      {view === 'holdings' && <HoldingsEditor />}
      {view === 'fund-manager' && <FundManager />}
      {view === 'settings' && <Settings />}
      {view === 'planner' && (
        <>
          <section className="summary-strip">
            <div className="summary-card">
              <span className="summary-label">Kids&apos; ISA</span>
              <span className="summary-value">£20k → £100k</span>
              <span className="summary-horizon">5 years</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Your ISA</span>
              <span className="summary-value">£50k → £300k</span>
              <span className="summary-horizon">5 years</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Your SIPP</span>
              <span className="summary-value">~£3k/mo income</span>
              <span className="summary-horizon">At retirement</span>
            </div>
          </section>

          <NetWorthOverview />

          <section className="sipp-controls">
            <h2>SIPP income assumptions</h2>
            <div className="sipp-inputs">
              <label>
                Target monthly income (gross)
                <input
                  type="number"
                  value={sippMonthlyIncome}
                  onChange={(e) => setSippMonthlyIncome(Number(e.target.value) || 0)}
                  step={100}
                />
              </label>
              <label>
                Safe withdrawal rate (%)
                <input
                  type="number"
                  value={sippWithdrawalRate}
                  onChange={(e) => setSippWithdrawalRate(Number(e.target.value) || 4)}
                  step={0.25}
                  min={2.5}
                  max={6}
                />
              </label>
              <label>
                Years to retirement
                <input
                  type="number"
                  value={yearsToRetirement}
                  onChange={(e) => setYearsToRetirement(Number(e.target.value) || 1)}
                  min={1}
                  max={40}
                />
              </label>
            </div>
          </section>

          <main className="portfolios">
            {plans.map((plan) => (
              <PortfolioCard
                key={plan.id}
                plan={plan}
                sippMonthlyIncome={sippMonthlyIncome}
                sippWithdrawalRate={sippWithdrawalRate}
              />
            ))}
          </main>
        </>
      )}

      <footer className="disclaimer">
        <p>
          Planning tool only — not regulated advice. Market data via Finnhub. US citizens
          report worldwide income; verify tax treatment with a professional.
        </p>
      </footer>
    </div>
  );
}

export default App;
