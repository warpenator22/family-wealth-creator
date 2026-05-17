import { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';

export function Settings() {
  const {
    state,
    setFinnhubKey,
    setAutoRefresh,
    updateMemberName,
    setWatchlist,
  } = useHousehold();
  const [key, setKey] = useState(state.finnhubApiKey);
  const [watchlistText, setWatchlistText] = useState(state.watchlist.join(', '));

  const saveKey = () => setFinnhubKey(key.trim());
  const saveWatchlist = () => {
    setWatchlist(
      watchlistText
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    );
  };

  return (
    <section className="settings-panel">
      <div className="section-heading">
        <h2>Settings</h2>
        <p>Shared on this device — both you and your partner use the same household data.</p>
      </div>

      <div className="settings-block">
        <h3>Live market data (Finnhub)</h3>
        <p className="settings-hint">
          Free tier: 60 API calls/min — enough for quotes + news every few minutes. Keys stay
          in your browser only.
        </p>
        <label>
          API key
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste from finnhub.io/dashboard"
            autoComplete="off"
          />
        </label>
        <button type="button" className="btn-primary" onClick={saveKey}>
          Save API key
        </button>
        {state.finnhubApiKey && (
          <span className="saved-badge">Key saved locally</span>
        )}
      </div>

      <div className="settings-block">
        <h3>Auto-refresh</h3>
        <label>
          Refresh quotes every (minutes)
          <input
            type="number"
            min={1}
            max={60}
            value={state.autoRefreshMinutes}
            onChange={(e) => setAutoRefresh(Number(e.target.value) || 5)}
          />
        </label>
      </div>

      <div className="settings-block">
        <h3>Household members</h3>
        {state.members.map((m) => (
          <label key={m.id}>
            Display name
            <input
              value={m.name}
              onChange={(e) => updateMemberName(m.id, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="settings-block">
        <h3>Watchlist symbols</h3>
        <label>
          Comma-separated tickers
          <textarea
            value={watchlistText}
            onChange={(e) => setWatchlistText(e.target.value)}
            rows={2}
          />
        </label>
        <button type="button" className="btn-primary" onClick={saveWatchlist}>
          Save watchlist
        </button>
      </div>

      <div className="settings-block">
        <h3>Daily use</h3>
        <ul className="settings-tips">
          <li>Open the <strong>Dashboard</strong> each morning — refresh market data.</li>
          <li>Log trades in <strong>Holdings</strong> the same day you execute on ii.</li>
          <li>Use the family note for decisions you both need to see.</li>
          <li>Bookmark this app on both phones (Add to Home Screen).</li>
        </ul>
      </div>
    </section>
  );
}

