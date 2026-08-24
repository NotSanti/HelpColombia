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

## Known limitations before launch

1. **ReliefWeb live ingest** blocked until `RELIEFWEB_APP_NAME` is approved.
2. **Playwright smoke tests** not configured — add `@playwright/test` before CI browser gate.
3. **Admin tools** (Milestone 12) not built — manual Supabase/service-role ops for verification review.
4. **CSP `style-src 'unsafe-inline'`** still required for MapLibre/Tailwind runtime styles.

## Pre-launch checklist

- [ ] Set production env vars on Vercel
- [ ] Enable Vercel Cron for `/api/cron/*` routes
- [ ] Confirm ReliefWeb app name approval
- [ ] Review `donation_destinations.needs_review` after health cron
- [ ] Manual smoke test: donate CTA → `/out/{slug}` → verified HTTPS redirect
- [ ] Promote deployment manually when satisfied
