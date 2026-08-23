# Help Colombia — Cursor Development Plan

This folder is the source of truth for building **Help Colombia** iteratively with Cursor.

Help Colombia is a one-page public disaster-aid information site centered around five questions:

1. What happened?
2. Who needs help?
3. Who is helping?
4. Where is the aid going?
5. How can I help?

The product should prioritize **clarity, trust, provenance, safety, and fast access to verified aid information**.

## Getting started

```bash
cd app
npm install
npm run dev
```

Useful scripts:

```bash
npm run lint
npm run typecheck
npm run build
```

Copy `.env.example` to `.env.local` when environment variables are needed (Milestone 3+).

## Read order

Cursor agents should read these files in this order before implementation:

1. `agent-rules.md`
2. `design-plan.md`
3. `architecture.md`
4. `security-and-data.md`
5. `milestones.md`

## Current product direction

- Framework: **Next.js + TypeScript**
- Routing: **App Router**
- Styling: **Tailwind CSS + shadcn/ui**
- Typography: **Inter** (400 / 500 / 600 / 700)
- Data: **Supabase Postgres**
- Geospatial support: **PostGIS**
- Map: **MapLibre GL JS**
- Deployment: **Vercel**
- Data ingestion: scheduled server-side jobs
- Design source of truth: `websiteDraft.png` (desktop dashboard mockup)
- MVP scope: one primary disaster event, one one-page dashboard, verified donation destinations, and a limited set of trusted public data sources.

## Non-goals for the first MVP

Do **not** build these initially:

- multi-disaster support UI
- user accounts
- crowdsourced reporting
- direct donation processing
- AI-generated public claims without source attribution
- complex admin CMS
- multilingual support
- mobile app
- real-time websocket architecture
- generalized humanitarian platform abstractions

The initial goal is a trustworthy, polished, narrowly scoped site that works well for the current Colombia earthquake use case.

## Implementation philosophy

Build vertically.

Each milestone should produce something usable and reviewable before moving on.

Avoid creating large amounts of speculative infrastructure. Prefer a simple implementation that satisfies the current milestone and can be extended later.

Every milestone in `milestones.md` includes:

- objective
- deliverables
- acceptance criteria
- non-goals
- Cursor prompt

Cursor should complete **one milestone at a time**.
