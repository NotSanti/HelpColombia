# Help Colombia — Launch Readiness Report

Generated as part of Milestone 11 (production hardening). **Do not deploy automatically.**

## Security

| Check | Status | Notes |
| --- | --- | --- |
| Content-Security-Policy | Done | `next.config.ts` — self-hosted scripts, MapLibre worker/blob, Supabase + demotiles fonts |
| Frame protection | Done | `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'` |
| HSTS | Done | Enabled via security headers (Vercel terminates TLS) |
| Service-role server-only | Done | `SUPABASE_SERVICE_ROLE_KEY` never `NEXT_PUBLIC_`; validated in `lib/env/production.ts` |
| Cron routes protected | Done | Bearer `CRON_SECRET` on all `/api/cron/*` routes |
| Donation redirect validation | Done | 63 tests incl. destination + health-check suites |
| Donation health monitoring | Done | SSRF-safe probes; auto-disable on redirect mismatch; never auto-verify |
| Inline theme script removed | Done | Moved to `/public/theme-init.js` for stricter CSP |

## Reliability

| Check | Status | Notes |
| --- | --- | --- |
| Error boundary | Done | `app/error.tsx` with retry |
| Fixture / degraded modes | Done | `dataMode` + `DataFreshnessBanner` when Supabase unavailable |
| Upstream ingest failure | Done | Cron jobs leave existing DB rows untouched on fetch errors |
| Production env validation | Done | `instrumentation.ts` asserts required env in production |

## Accessibility

| Check | Status | Notes |
| --- | --- | --- |
| Skip link | Done | `#main-content` in root layout |
| Keyboard navigation | Done | Regional cards, nav, donate CTAs use semantic controls |
| Map alternative | Done | Screen-reader region list + regional panel table |
| Focus visible | Done | Tailwind `focus-visible:ring-*` on interactive elements |
| Semantic headings | Done | Panel titles use heading hierarchy within cards |

## Performance

| Check | Status | Notes |
| --- | --- | --- |
| MapLibre lazy-loaded | Done | `dynamic()` import in `DashboardShell` |
| GeoJSON out of bundle | Done | Served from `/public/map/*` |
| Client component scope | Done | Map/theme/shell only; page is a Server Component |

## Verification (2026-08-24)

```text
npm run lint        ✓
npm run typecheck   ✓
npm test            ✓ (63 tests)
npm run build       ✓
npm audit --omit=dev ✓ (0 vulnerabilities)
```

## Production verification (2026-08-24)

**URL:** https://help-colombia-ten.vercel.app  
**Deployment:** `dpl_Dw433SFNWrHAjLu9L8ErJ8ScTn6e` (READY, production)

| Check | Result |
| --- | --- |
| Live Supabase reads | ✓ Dashboard shows live IFRC/seismic data (no fixture banner) |
| Donation redirect | ✓ `/out/colombian-red-cross` → `https://www.cruzrojacolombiana.org/` (302) |
| Cron auth + ingest | ✓ seismic, funding, IFRC, donation-health return `ok: true` |
| ReliefWeb cron | Skipped until `RELIEFWEB_APP_NAME` approved (returns 200 + `skipped`) |
| Security headers | ✓ CSP, HSTS, X-Frame-Options present on responses |

**Donation health (after cron):**

| Organization | Status | Notes |
| --- | --- | --- |
| colombian-red-cross | healthy | enabled |
| direct-relief | healthy | enabled |
| wfp | healthy | enabled |
| unicef | unhealthy | HTTP 403 from upstream (likely bot blocking); still enabled — review manually |

**Note:** Runtime errors in Vercel logs before env vars were set (`dpl_Bh7cUP5ve86aMruaXquYuizhkd12`) are resolved on the current deployment.

## Known limitations before launch

1. **ReliefWeb live ingest** blocked until `RELIEFWEB_APP_NAME` is approved.
2. **Playwright smoke tests** not configured — add `@playwright/test` before CI browser gate.
3. **Admin tools** (Milestone 12) not built — manual Supabase/service-role ops for verification review.
4. **CSP `style-src 'unsafe-inline'`** still required for MapLibre/Tailwind runtime styles.

## Pre-launch checklist

- [x] Set production env vars on Vercel
- [x] Enable Vercel Cron for `/api/cron/*` routes (daily schedules in `vercel.json`)
- [ ] Confirm ReliefWeb app name approval (blocked — seeded DB updates used meanwhile)
- [x] Review `donation_destinations.needs_review` after health cron (none flagged; UNICEF 403 noted above)
- [x] Manual smoke test: donate CTA → `/out/{slug}` → verified HTTPS redirect
- [ ] Promote deployment manually when satisfied (production URL is live at help-colombia-ten.vercel.app)
