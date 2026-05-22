# Warp family investment HQ

UK investment portfolio planner for ISAs and SIPPs — built for the Warp household.

## Your pre-loaded plan

| Wrapper | Starting pot | Goal | Horizon |
|---------|--------------|------|---------|
| Your ISA (Kids Fund) | £20,000 | ~£100,000 | 5 years |
| Your ISA (Personal) | £50,000 | ~£300,000 | 5 years |
| Personal SIPP | £0 (inactive) | ~£3,000/mo income | Retirement |

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build

```bash
npm run build
```

## Sync across phones

Holdings and accounts can sync via **Supabase** so Richard and Erica see the same data. Setup: [`supabase/README.md`](./supabase/README.md).

In the app: **Settings → Cloud sync** → shared family phrase on each device.
