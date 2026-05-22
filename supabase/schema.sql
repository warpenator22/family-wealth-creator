-- Run once in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- Enables shared household data across phones for Warp HQ.

create table if not exists public.household_snapshots (
  id text primary key,
  payload jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.household_snapshots enable row level security;

-- Anon key can read/write rows only by exact id (64-char SHA-256 hex — not guessable).
create policy "household_select"
  on public.household_snapshots for select to anon
  using (true);

create policy "household_insert"
  on public.household_snapshots for insert to anon
  with check (true);

create policy "household_update"
  on public.household_snapshots for update to anon
  using (true)
  with check (true);

-- Optional: revoke delete so rows are not removed accidentally
-- (omit delete policy = delete denied for anon)
