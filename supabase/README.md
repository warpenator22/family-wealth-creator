# Cloud sync setup (Supabase)

Warp HQ can sync holdings, accounts, and settings across all your devices.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. Note **Project URL** and **anon public** key (Settings → API).

## 2. Create the table

In Supabase → **SQL Editor**, paste and run the contents of [`schema.sql`](./schema.sql).

## 3. Configure Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (anon key) |

Redeploy the site.

## 4. Link phones (Richard & Erica)

On **each** device:

1. Open **Settings → Cloud sync**.
2. Choose a shared **family sync phrase** (8+ characters) — e.g. a passphrase only you two know.
3. Tap **Enable cloud sync** on the device that already has the holdings first, then the same phrase on the other phone.

The phrase is hashed before upload; the plain text is never stored in the cloud.

## Security note

Anyone with the anon key and your sync phrase could read/write that household row. The row id is a SHA-256 hash (not guessable). Do not share the phrase or post the anon key publicly.
