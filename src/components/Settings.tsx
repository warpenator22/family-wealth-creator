import { useRef, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import {
  exportHouseholdJson,
  getHouseholdBackup,
  householdStorageSummary,
  importHouseholdJson,
  restoreHouseholdFromBackup,
} from '../lib/household/storage';

export function Settings() {
  const {
    state,
    setFinnhubKey,
    setAutoRefresh,
    updateMemberName,
    setWatchlist,
    replaceState,
  } = useHousehold();
  const [key, setKey] = useState(state.finnhubApiKey);
  const [watchlistText, setWatchlistText] = useState(state.watchlist.join(', '));
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const storage = householdStorageSummary(state);
  const backup = getHouseholdBackup();

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
        <p>
          Saved in <strong>this browser only</strong> (not on a server). The same URL on another
          phone, private browsing, or after clearing site data starts empty.
        </p>
      </div>

      <div className="settings-block settings-data">
        <h3>Household data on this device</h3>
        <p className="settings-hint">
          <strong>{storage.holdingCount}</strong> holding
          {storage.holdingCount === 1 ? '' : 's'} saved locally
          {storage.hasBackup && (
            <>
              {' '}
              · automatic backup has <strong>{storage.backupHoldingCount}</strong>
            </>
          )}
          .
        </p>
        {dataMessage && <p className="settings-data-msg">{dataMessage}</p>}
        <div className="settings-data-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const blob = new Blob([exportHouseholdJson(state)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `warp-hq-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setDataMessage('Downloaded backup file.');
            }}
          >
            Export backup
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => importRef.current?.click()}
          >
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const merged = importHouseholdJson(text);
                replaceState(merged);
                setDataMessage(`Imported ${merged.holdings.length} holdings from file.`);
              } catch {
                setDataMessage('Import failed — check the JSON file.');
              }
              e.target.value = '';
            }}
          />
          {storage.hasBackup && storage.holdingCount < storage.backupHoldingCount && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const restored = restoreHouseholdFromBackup();
                if (restored) {
                  replaceState(restored);
                  setDataMessage(
                    `Restored backup with ${restored.holdings.length} holdings.`
                  );
                } else {
                  setDataMessage('No backup available on this device.');
                }
              }}
            >
              Restore automatic backup
            </button>
          )}
        </div>
        {backup && storage.holdingCount === 0 && storage.backupHoldingCount > 0 && (
          <p className="settings-hint settings-recover-hint">
            Holdings look empty but a backup exists on this device — try{' '}
            <strong>Restore automatic backup</strong>.
          </p>
        )}
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
        <h3>Warp household members</h3>
        <p className="settings-hint">
          Names are saved in this browser only. Erica must open the app on her phone and
          check this section too — or she will still see old labels until she does.
        </p>
        {state.members.map((m) => (
          <label key={m.id}>
            {m.id === 'member-1' ? 'Richard' : 'Erica'} (display name)
            <input
              value={m.name}
              onChange={(e) => updateMemberName(m.id, e.target.value)}
              aria-label={m.id === 'member-1' ? 'Richard display name' : 'Erica display name'}
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
          <li>Complete the <strong>Daily commitment</strong> checklist on the Dashboard.</li>
          <li>Log trades in <strong>Holdings</strong> the same day you execute on ii.</li>
          <li>Use the Warp family note for decisions you both need to see.</li>
          <li>Bookmark this app on both phones (Add to Home Screen).</li>
        </ul>
      </div>
    </section>
  );
}

