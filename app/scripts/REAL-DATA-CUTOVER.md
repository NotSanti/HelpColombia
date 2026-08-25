# Real-data cleanup + first UNGRD import

## Context

Your published Supabase row still used the **demo slug** `colombia-earthquake-2025-08-17`, but live seismic ingest had drifted to a **M4.1** aftershock while **seed** metrics/updates (312+ deaths, fake UNICEF blurbs) remained.

The real emergency to present is the **M7.4 San José del Palmar, Chocó earthquake on 10 Aug 2026**, with UNGRD national balances reported in the following days.

## 1. Cleanup (Supabase SQL editor)

Run:

`scripts/cleanup-seed-demo-data.sql`

This will:

- rewrite disaster name/summary/epicenter to the 10 Aug 2026 mainshock
- delete all `impact_metrics` for that disaster (seed + demo imports)
- delete seed `updates` (`seed-*`)
- clear numeric region seed tallies

## 2. Import UNGRD metrics

File: `scripts/examples/ungrd-metrics-import-2026-08-10.json`

Figures are taken from **UNGRD balances as reported by major outlets on 22–24 Aug 2026** (329 deaths; ~4,592 injured; ~324,157 affected). **Re-check the UNGRD portal bulletin** before importing — numbers move daily.

### Via admin UI

1. Set `ADMIN_SECRET` and sign in at `/admin`
2. Open **Metrics**
3. Paste the JSON and import

### Via API

```bash
curl -X POST "http://localhost:3000/api/admin/metrics/import" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d @scripts/examples/ungrd-metrics-import-2026-08-10.json
```

## 3. Optional: stabilize the map on the mainshock

In Vercel / `.env.local`, pin the SGC event id for the **10 Aug M7.4** (look up on SGC):

```bash
SEISMIC_PRIMARY_EVENT_ID=<SGC-event-id-for-2026-08-10>
```

Otherwise the seismic cron may keep overwriting magnitude/epicenter with the latest M4.x aftershock.

## 4. After import

- Reload `/` — key figures should show 329 / 4,592 / 324,157 (resolver picks latest UNGRD by trust tier)
- Live updates will stay empty until `RELIEFWEB_APP_NAME` is set
- Add department-level metrics later (same import schema with `"department": "Chocó"`) only when UNGRD publishes them
