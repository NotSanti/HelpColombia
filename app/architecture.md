# Help Colombia — Technical Architecture

# 1. Stack

## Application

```text
Next.js
React
TypeScript
App Router
Tailwind CSS
shadcn/ui
```

## Backend/data

```text
Supabase
PostgreSQL
PostGIS
```

## Map

```text
MapLibre GL JS
```

## Hosting

```text
Vercel
```

## Scheduled ingestion

Start with:

```text
Vercel Cron
```

or Supabase scheduled functions if the infrastructure is already centered there.

Do not use both initially.

---

# 2. Application architecture

```text
External data sources
        │
        ▼
Server-side source adapters
        │
        ▼
Validation / normalization
        │
        ▼
Supabase/Postgres
        │
        ▼
Next.js server data access
        │
        ▼
Server Components
        │
        ├── static dashboard content
        └── client islands
              └── MapLibre interactions
```

The browser should **not** directly call humanitarian APIs.

Reasons:

- API keys
- rate limits
- consistent normalization
- caching
- provenance
- resilience
- security

---

# 3. Suggested project structure

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts
│   │   └── cron/
│   │       ├── reliefweb/
│   │       ├── seismic/
│   │       └── funding/
│   │
│   └── out/
│       └── [organizationId]/
│           └── route.ts
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardShell.tsx
│   │   ├── Header.tsx
│   │   ├── LiveUpdateCard.tsx
│   │   ├── WhatHappenedCard.tsx
│   │   ├── KeyFiguresCard.tsx
│   │   ├── HelpCard.tsx
│   │   ├── FundingCard.tsx
│   │   ├── LiveUpdatesCard.tsx
│   │   └── RegionalImpactPanel.tsx
│   │
│   ├── map/
│   │   ├── ColombiaMap.tsx
│   │   ├── RegionLayer.tsx
│   │   ├── EpicenterMarker.tsx
│   │   ├── ImpactLegend.tsx
│   │   └── RegionTooltip.tsx
│   │
│   ├── organizations/
│   └── ui/
│
├── lib/
│   ├── db/
│   ├── security/
│   │   └── donation-destination.ts
│   ├── sources/
│   │   ├── reliefweb.ts
│   │   ├── gdacs.ts
│   │   ├── sgc.ts
│   │   ├── ifrc.ts
│   │   ├── fts.ts
│   │   └── hdx.ts
│   ├── normalize/
│   ├── validation/
│   └── utils/
│
├── types/
└── config/
```

Do not create every file on day one.

This is the target direction.

---

# 4. Server vs client

Prefer Server Components.

Use client components only where browser behavior requires them.

Typical client components:

```text
ColombiaMap
Map controls
interactive region selection
mobile menu
small interactive tabs
```

Do not put `"use client"` on the page root.

Core dashboard content should render server-side.

---

# 5. Database model

Start minimal.

## disaster_events

```text
id
slug
name
event_type
status
occurred_at
latitude
longitude
magnitude
depth_km
created_at
updated_at
```

The first release may contain exactly one event.

---

## sources

```text
id
name
source_type
base_url
trust_tier
active
created_at
```

Example trust tiers:

```text
official
humanitarian
verified_media
other
```

---

## impact_metrics

Append-only historical measurements.

```text
id
disaster_id
metric_type
value
unit
department
municipality
source_id
source_url
reported_at
retrieved_at
created_at
```

Never overwrite history.

---

## regions

```text
id
disaster_id
name
department_code
severity
geometry
affected_count
deaths
injured
displaced
updated_at
```

PostGIS geometry may be added when map integration begins.

---

## organizations

```text
id
slug
name
short_description
website_url
logo_url
organization_type
active
created_at
updated_at
```

---

## donation_destinations

```text
id
organization_id
destination_url
approved_hostname
verification_status
verified_at
last_checked_at
is_enabled
created_at
updated_at
```

Verification state:

```text
pending
verified
disabled
rejected
```

---

## updates

```text
id
disaster_id
source_id
external_id
title
summary
source_url
published_at
retrieved_at
created_at
```

Unique:

```text
(source_id, external_id)
```

---

## funding_flows

Later:

```text
id
disaster_id
external_id
donor
recipient
amount_usd
status
sector
source_url
reported_at
retrieved_at
```

---

# 6. Data provenance

Every public data value should be traceable.

Store:

```text
source
source_url
reported_at
retrieved_at
```

Do not use a single mutable row such as:

```text
deaths = 312
```

Instead append historical records.

The current value can be resolved as:

```sql
latest trusted metric by metric type and geography
```

---

# 7. Source priority

Initial priority model:

```text
1. Colombian official authority
2. UN / humanitarian official source
3. Red Cross / recognized humanitarian organization
4. reputable media
```

When sources conflict:

- never average values
- choose according to trust policy
- expose provenance
- preserve conflicting measurements internally

---

# 8. Source adapters

Each adapter should expose normalized functions.

Example:

```ts
export interface SourceAdapter<T> {
  fetch(): Promise<T>;
}
```

Prefer explicit adapter functions rather than an over-generalized framework.

Example:

```ts
fetchReliefWebReports()
fetchLatestSeismicEvents()
fetchFundingFlows()
```

Validate upstream payloads with Zod before persisting them.

---

# 9. Caching

Use server-side caching.

Suggested approach:

```text
Next.js cache / revalidation
+
database persistence
```

The UI should never depend on a third-party API responding during a user request.

---

# 10. Map architecture

The production map should eventually use MapLibre.

Data flow:

```text
Supabase regions/GeoJSON
        │
        ▼
Next.js API/server fetch
        │
        ▼
ColombiaMap client component
        │
        ├── base map
        ├── impact fill layer
        ├── markers
        └── tooltips
```

Use public boundary data that can legally be redistributed.

Do not scrape map imagery.

---

# 11. Error handling

External source ingestion:

```text
fetch
→ validate
→ normalize
→ transactional insert
```

If validation fails:

- log failure
- do not replace good data
- retain previous public state

UI:

- display latest valid data
- show freshness timestamp

---

# 12. Observability

MVP:

```text
Vercel logs
Supabase logs
structured console logs
```

Later:

```text
Sentry
```

Do not add complex observability before ingestion exists.

---

# 13. Environment variables

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CRON_SECRET=

RELIEFWEB_APP_NAME=
```

Never expose service role credentials in client code.

Use `.env.example`.

---

# 14. API design

Avoid creating a large REST API.

Most data can be loaded directly in Server Components.

Use Route Handlers for:

- secure outbound donation redirects
- cron ingestion
- health checks
- explicit public JSON if needed by map client

---

# 15. Future evolution

Only when justified:

```text
admin dashboard
multi-disaster support
multi-language
LLM-assisted report extraction
user notification subscriptions
public API
```

Do not architect the MVP as if all of these are already required.
