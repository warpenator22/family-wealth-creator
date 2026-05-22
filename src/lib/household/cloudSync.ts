import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mergeHouseholdState } from './storage';
import type { HouseholdState } from './types';

const TABLE = 'household_snapshots';

export interface CloudSnapshot {
  revision: number;
  updatedAt: string;
  state: HouseholdState;
}

let supabase: SupabaseClient | null = null;

export function isCloudSyncAvailable(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

function getClient(): SupabaseClient {
  if (!isCloudSyncAvailable()) {
    throw new Error('CLOUD_SYNC_NOT_CONFIGURED');
  }
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!.trim(),
      import.meta.env.VITE_SUPABASE_ANON_KEY!.trim()
    );
  }
  return supabase;
}

/** Row id in Supabase — derived from family passphrase (never store plaintext in cloud). */
export async function deriveSyncKey(passphrase: string): Promise<string> {
  const normalized = passphrase.normalize('NFKC').trim();
  if (normalized.length < 8) {
    throw new Error('PASSPHRASE_TOO_SHORT');
  }
  const bytes = new TextEncoder().encode(normalized);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function pullHousehold(syncKey: string): Promise<CloudSnapshot | null> {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('payload, revision, updated_at')
    .eq('id', syncKey)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    revision: Number(data.revision),
    updatedAt: data.updated_at as string,
    state: mergeHouseholdState(data.payload as Partial<HouseholdState>),
  };
}

export async function pushHousehold(
  syncKey: string,
  state: HouseholdState,
  revision: number
): Promise<CloudSnapshot> {
  const row = {
    id: syncKey,
    payload: state,
    revision,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getClient()
    .from(TABLE)
    .upsert(row, { onConflict: 'id' })
    .select('payload, revision, updated_at')
    .single();

  if (error) throw new Error(error.message);

  return {
    revision: Number(data.revision),
    updatedAt: data.updated_at as string,
    state: mergeHouseholdState(data.payload as Partial<HouseholdState>),
  };
}

export function withSyncMeta(
  state: HouseholdState,
  syncKey: string,
  revision: number,
  cloudUpdatedAt?: string
): HouseholdState {
  return {
    ...state,
    syncKey,
    syncRevision: revision,
    lastCloudSyncAt: cloudUpdatedAt ?? new Date().toISOString(),
  };
}

export function bumpRevision(state: HouseholdState): HouseholdState {
  return {
    ...state,
    syncRevision: (state.syncRevision ?? 0) + 1,
  };
}
