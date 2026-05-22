import { useHousehold } from '../context/HouseholdContext';

export function CloudSyncBadge() {
  const { state, cloudSyncStatus, cloudSyncConfigured, cloudSyncError } =
    useHousehold();

  if (!cloudSyncConfigured) {
    return (
      <span className="sync-badge sync-off" title="Cloud sync not configured on server">
        Local only
      </span>
    );
  }

  if (!state.syncKey) {
    return (
      <span className="sync-badge sync-off" title="Set a family sync phrase in Settings">
        Not linked
      </span>
    );
  }

  const labels: Record<string, string> = {
    off: 'Local only',
    idle: 'Cloud linked',
    syncing: 'Syncing…',
    ok: 'Synced',
    error: 'Sync error',
  };

  return (
    <span
      className={`sync-badge sync-${cloudSyncStatus}`}
      title={
        cloudSyncError ??
        (state.lastCloudSyncAt
          ? `Last sync ${new Date(state.lastCloudSyncAt).toLocaleString()}`
          : 'Household data syncs across devices')
      }
    >
      {labels[cloudSyncStatus] ?? 'Sync'}
    </span>
  );
}
