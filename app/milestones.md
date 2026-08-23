# Help Colombia — Iterative MVP Milestones & Cursor Prompts

Complete these sequentially.

Do not skip ahead unless explicitly instructed.

---

# Milestone 0 — Project Foundation

## Objective

Create a clean Next.js project foundation with the agreed tooling.

## Deliverables

- Next.js
- TypeScript strict mode
- App Router
- Tailwind
- shadcn/ui initialized
- ESLint
- Prettier if desired
- `.env.example`
- base folders
- initial README
- no database yet
- no external APIs yet

## Acceptance criteria

```text
npm run dev
npm run build
npm run lint
```

all work.

## Cursor prompt

```text
Read:
- agent-rules.md
- architecture.md
- design-plan.md

Implement Milestone 0 only.

Set up the Help Colombia Next.js project foundation using:
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui

Create only the folder structure that is immediately useful. Do not create placeholder implementations for future data adapters or database tables.

Add:
- .env.example
- reasonable lint/typecheck scripts
- basic app metadata
- a minimal page confirming the application runs

Do not implement:
- Supabase
- MapLibre
- APIs
- donation routes
- external data ingestion

At completion run build, lint, and typecheck and report results.
```

---

# Milestone 1 — Static Dashboard Shell

## Objective

Implement the approved design using static mock data.

This milestone establishes layout and component structure.

## Deliverables

- header
- background map reference asset
- left panels
- right panels
- live updates
- regional cards
- footer
- responsive mobile layout
- mock data in a local fixture

The map can temporarily be a static raster background matching the design.

## Acceptance criteria

- closely matches approved desktop design
- usable on mobile
- panels are real DOM elements
- map is separate background layer
- no screenshot of full UI
- no API calls

## Cursor prompt

```text
Read:
- agent-rules.md
- design-plan.md

Implement Milestone 1 only.

Recreate the approved Help Colombia one-page dashboard from the design source of truth.

Use static typed mock data.

Important:
- the map is the background canvas, not a center card
- all dashboard panels are real React components rendered above it
- do not flatten the UI into an image
- use the approved Help Colombia SVG logo
- use CSS variables/design tokens for the dark navy palette
- create a responsive mobile layout

Create sensible components such as:
Header
LiveUpdateCard
WhatHappenedCard
KeyFiguresCard
HelpCard
FundingCard
LiveUpdatesCard
RegionalImpactPanel

Do not add Supabase or external APIs yet.

At completion:
- run lint
- run typecheck
- run build
- summarize visual deviations from the design
```

---

# Milestone 2 — Interactive Map Prototype

## Objective

Replace the static map with MapLibre while preserving the approved visual composition.

## Deliverables

- MapLibre installed
- Colombia-centered base map
- GeoJSON region layer
- region severity fill
- epicenter marker
- hover/focus tooltip
- regional card → map selection
- keyboard-accessible non-map alternative

Use local mock GeoJSON initially.

## Acceptance criteria

Hover/select:

```text
Chocó
Risaralda
Antioquia
Valle del Cauca
Cauca
```

produces meaningful feedback.

Dashboard panels remain layered over map.

## Cursor prompt

```text
Read:
- agent-rules.md
- design-plan.md
- architecture.md

Implement Milestone 2 only.

Replace the static map background with MapLibre GL JS.

Requirements:
- isolate MapLibre in a client component
- keep the rest of the dashboard server-renderable
- use local mock GeoJSON
- render severity-based region fills
- render epicenter
- add hover/click/focus region details
- clicking a regional impact card should focus/select that region on the map
- preserve the visual composition where panels float above the map
- provide a non-map accessible representation of the same information

Do not add Supabase.
Do not fetch external disaster APIs.

Avoid coupling dashboard cards directly to MapLibre APIs. Use props/callbacks/state at a clean boundary.

Run build, lint, and typecheck.
```

---

# Milestone 3 — Supabase Foundation

## Objective

Introduce persistent application data.

## Deliverables

Supabase connection and migrations for:

```text
disaster_events
sources
impact_metrics
regions
organizations
donation_destinations
updates
```

Also:

- RLS
- typed server client
- seed data
- generated DB types if workflow supports it

## Acceptance criteria

Static fixture data is replaced with seeded database reads where appropriate.

No external ingestion yet.

## Cursor prompt

```text
Read:
- agent-rules.md
- architecture.md
- security-and-data.md

Implement Milestone 3 only.

Add Supabase.

Create migrations for:
- disaster_events
- sources
- impact_metrics
- regions
- organizations
- donation_destinations
- updates

Use append-only impact metrics.

Implement Row Level Security.

Public access should be read-only for published public data.

The browser must never receive the Supabase service-role key.

Seed enough data to render the current dashboard.

Replace local mock dashboard data with server-side Supabase reads where reasonable.

Do not implement external ingestion.
Do not implement the donation redirect yet.

Run migrations locally/dev, typecheck, lint, build, and report RLS assumptions.
```

---

# Milestone 4 — Secure Donation Redirects

## Objective

Implement the security-sensitive donation CTA flow.

## Deliverables

Route:

```text
/out/[organizationId]
```

Validation:

- verified record
- enabled
- HTTPS
- exact hostname
- no credentials
- safe redirect

Tests required.

## Acceptance criteria

These must fail:

```text
unknown organization
unverified destination
disabled destination
http destination
hostname mismatch
malformed URL
```

## Cursor prompt

```text
Read security-and-data.md in full before making changes.

Implement Milestone 4 only.

Create the secure outbound donation redirect route:

/out/[organizationId]

The frontend must never supply a destination URL.

Server flow:
1. resolve organization/destination from Supabase
2. require verification_status = verified
3. require is_enabled = true
4. parse destination with URL
5. require HTTPS
6. reject username/password
7. validate hostname with exact equality against approved_hostname
8. redirect

Create unit/integration tests covering:
- valid destination
- missing organization
- disabled destination
- unverified destination
- malformed URL
- http URL
- hostname mismatch

Update donation CTAs to use internal redirect routes.

Do not build automatic URL checking yet.

Do not loosen validation to make tests pass.
```

---

# Milestone 5 — ReliefWeb Updates Integration

## Objective

Make the updates feed automatic.

## Deliverables

- ReliefWeb adapter
- Zod validation
- normalization
- scheduled ingestion endpoint
- deduplication
- updates rendered from DB

## Acceptance criteria

Failure of ReliefWeb does not break public site.

## Cursor prompt

```text
Read:
- agent-rules.md
- architecture.md
- security-and-data.md

Implement Milestone 5 only.

Add ReliefWeb as the first external humanitarian source.

Build:
lib/sources/reliefweb.ts

Requirements:
- server-side only
- validate upstream responses with Zod
- normalize into the updates table
- deduplicate using stable external identifiers
- retain source URL, published_at, retrieved_at
- do not expose raw HTML
- cron endpoint must require CRON_SECRET
- upstream failure must not delete or overwrite existing good data

Update the Live Updates panel to use the database.

Do not integrate other sources yet.
```

---

# Milestone 6 — Seismic Data

## Objective

Automate “What happened?” earthquake data.

## Sources

Start with one source:

- SGC preferred for Colombian primary data

Optionally add GDACS later.

## Deliverables

- seismic adapter
- earthquake event normalization
- aftershock records or summary
- update main disaster metadata

## Cursor prompt

```text
Implement Milestone 6 only.

Add one primary seismic data adapter for the Colombia earthquake, preferably SGC.

Do not integrate multiple seismic providers yet.

Requirements:
- server-side adapter
- validation
- normalized event model
- preserve upstream source URL/time
- scheduled ingestion
- do not overwrite valid data with malformed responses
- update What Happened using database data
- update epicenter position on the map from stored event coordinates

Keep the source adapter isolated from React components.
```

---

# Milestone 7 — Official Impact Metrics

## Objective

Move Key Figures and region cards from seeded values toward trusted live metrics.

## Important

Official Colombian figures may not be consistently available as a clean API.

This milestone must support manual/structured ingestion without unsafe scraping.

## Deliverables

- impact metric resolver
- source priority
- historical metric storage
- current metric query
- freshness labels

## Cursor prompt

```text
Implement Milestone 7 only.

Build the impact metric domain layer.

Requirements:
- impact_metrics remain append-only
- create functions to resolve the current display value by:
  metric type
  geography
  trust/source priority
  reported timestamp
- never average conflicting values
- return provenance alongside the selected metric
- expose last updated/source in UI
- gracefully handle missing metrics

Do not build aggressive web scraping.

Provide a safe manual seed/import path for official UNGRD metrics if no stable API is available.

Add tests for conflicting-source resolution.
```

---

# Milestone 8 — Funding / OCHA FTS

## Objective

Automate “Where is the aid going?”

## Deliverables

- `funding_flows`
- FTS source adapter
- normalization
- aggregate queries
- funding UI wired to data

## Cursor prompt

```text
Implement Milestone 8 only.

Add OCHA FTS funding ingestion.

Create funding_flows migration if not already present.

Normalize:
- donor
- recipient
- amount_usd
- status
- sector
- source URL
- reported/retrieved time

The UI should calculate:
- pledged
- committed
- received
- sector totals

Do not fabricate missing funding status.

If upstream semantics differ from our labels, preserve upstream values and add an explicit mapping layer.

Add adapter/normalization tests.
```

---

# Milestone 9 — Organization Response / IFRC

## Objective

Improve “Who is helping?”

## Deliverables

Integrate IFRC GO for Red Cross operational response.

Potential fields:

- appeal
- target population
- people reached
- operational updates
- activities

## Cursor prompt

```text
Implement Milestone 9 only.

Add IFRC GO as a humanitarian operations source.

Keep raw IFRC data separate from normalized public organization summaries.

Only expose metrics that can be clearly mapped and sourced.

Do not use AI to infer numerical impact.

Update organization details and/or aid activity display using sourced data.

Preserve provenance for every public numeric claim.
```

---

# Milestone 10 — Donation Link Health Monitoring

## Objective

Monitor verified destinations without allowing automatic trust changes.

## Deliverables

- scheduled health checker
- redirect-chain validation
- SSRF protections
- disable-on-unexpected-change policy
- audit fields

## Critical rule

The checker may automatically DISABLE a destination.

It may never automatically VERIFY a new destination.

## Cursor prompt

```text
Read security-and-data.md.

Implement Milestone 10 only.

Build server-side health monitoring for already verified donation destinations.

Requirements:
- HTTPS only
- resolve DNS safely
- reject private/loopback/link-local destinations
- do not automatically follow redirects blindly
- validate each redirect hostname against expected allowlist
- strict timeouts
- redirect limit
- response size limit
- record last_checked_at and health status

If an unexpected redirect or host change occurs:
- disable the donation CTA
- mark for review

The system must never automatically verify a new URL or hostname.

Add security-focused tests.
```

---

# Milestone 11 — Production Hardening

## Objective

Prepare launch.

## Deliverables

- CSP
- security headers
- accessibility pass
- performance pass
- error states
- source freshness
- production env validation
- dependency audit
- browser testing

## Cursor prompt

```text
Implement Milestone 11 only.

Perform production hardening.

Security:
- Content Security Policy
- frame protections
- safe external link handling
- confirm service-role secrets are server-only
- confirm cron routes are protected
- confirm donation redirect tests

Accessibility:
- keyboard navigation
- focus-visible
- map alternative
- contrast
- semantic headings

Reliability:
- stale data indicators
- upstream failure behavior
- error boundaries where justified

Performance:
- lazy-load MapLibre
- optimize images/assets
- inspect bundle size
- avoid unnecessary client components

Run:
- lint
- typecheck
- unit/integration tests
- production build
- Playwright smoke tests if configured

Produce a launch-readiness report and do not automatically deploy.
```

---

# Milestone 12 — Optional Post-MVP Admin Tools

Do not implement before launch unless clearly needed.

Potential scope:

```text
admin login
donation destination verification
manual official metric entry
organization editing
audit trail
source status monitoring
```

This should be designed after the public MVP architecture is proven.
