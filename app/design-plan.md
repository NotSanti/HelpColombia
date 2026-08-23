# Help Colombia — Product & Design Plan

## 1. Product goal

Help Colombia is a centralized aid-information dashboard for a major disaster in Colombia.

The site should answer five questions immediately:

### 1. What happened?
Provide verified disaster facts:

- earthquake magnitude
- epicenter
- date/time
- depth
- significant aftershocks
- current confirmed impact figures

### 2. Who needs help?
Show:

- affected departments and municipalities
- severity by region
- deaths
- injuries
- displacement
- affected population
- urgent needs by geography

### 3. Who is helping?
Show:

- Colombian government response
- Red Cross
- UN agencies
- reputable NGOs
- their current response activities

### 4. Where is the aid going?
Show:

- pledged funding
- committed funding
- received funding
- funding by sector
- humanitarian activities
- measurable aid delivery where reliable data exists

### 5. How can I help?
Provide safe links to reputable, manually verified donation channels.

The site does **not** process donations.

---

# 2. Core UX

## One-page dashboard

The desktop design is a single immersive dashboard.

The central map is not a normal content card.

The map acts as the **visual background/canvas** while information panels float above it.

Suggested visual layering:

```text
Page
├── Map Background
├── Header
├── Left information panels
├── Map controls
├── Right information panels
├── Live update overlay
├── Regional impact panel
└── Footer
```

## Desktop-first

Initial design target:

```text
1536 × 1024
```

The MVP should be fully responsive, but desktop is the primary visual target.

Responsive strategy:

### ≥ 1280px
Full dashboard composition with map visible behind floating panels.

### 768–1279px
Reduce panel widths and hide non-essential decorative elements.

### < 768px
Switch from spatial dashboard composition to a vertical content flow.

Map becomes a dedicated full-width region rather than maintaining overlapping desktop composition.

---

# 3. Visual system

## Palette

Approximate application colors:

```css
--background: #031C31;
--panel: #09263A;
--panel-alt: #08263A;
--panel-raised: #09283D;

--border: #315064;
--border-subtle: #173B51;

--text-primary: #F5F7FA;
--text-secondary: #B9C5CF;

--severity-severe: #EF3340;
--severity-high: #FF681D;
--severity-moderate: #FFB000;
--severity-low: #66B032;

--info: #169BFF;
```

These should eventually become CSS variables / design tokens.

## Typography

Primary typeface:

- **Inter** — weights **400 / 500 / 600 / 700**
- system fallback

**Metrics** (key figures, funding amounts, regional counts, and similar numeric displays) must use **tabular numbers** (`font-variant-numeric: tabular-nums`) so digits align and values do not shift width when updating.

Use relatively compact typography.

Avoid oversized marketing-site typography.

This is an information dashboard.

## Panels

Panels should use:

- dark translucent or near-translucent backgrounds
- subtle borders
- medium radius
- restrained shadows
- high text contrast

Avoid excessive glassmorphism blur that harms readability.

---

# 4. Primary page sections

## Header

Contains:

- Help Colombia logo
- Overview
- Updates
- Organizations
- Impact
- How to Help
- Donate Now CTA

Navigation anchors scroll to relevant content.

The CTA should navigate to the verified organizations/help section.

---

## Live Update

Purpose:

Give users immediate context.

Contains:

- live status
- disaster headline
- concise summary
- last updated timestamp
- data freshness indicator

This should be derived from trusted content rather than manually embedded long term.

---

## What Happened?

Contains:

- magnitude
- event date/time
- epicenter
- depth
- aftershocks
- timeline link / expansion

The first MVP may use mock/static data.

---

## Key Figures

Four primary metrics:

- deaths
- injured
- affected
- displaced

Every production metric must have:

- source
- reported timestamp
- retrieved timestamp
- provenance

Do not show unsourced public metrics.

---

## Map

Eventually built using MapLibre GL JS.

Map capabilities:

- Colombian boundaries
- affected region overlays
- severity scale
- event epicenter
- region markers
- hover tooltips
- neighboring geographic context
- optional topographic visual styling

### Region hover

Hovering a region should show:

```text
Region
Severity
Deaths
Affected
Current needs
Last updated
Source
```

Do not expose dozens of metrics in the tooltip.

---

## Impact Legend

Severity:

```text
Severe
High
Moderate
Low
```

Severity is an application-level concept and must have documented criteria before it becomes data-driven.

For MVP, severity may be stored manually.

---

## How Can I Help?

This is a high-trust area.

Each organization includes:

- logo/icon
- name
- summary
- focus areas
- verified status
- Donate CTA
- official domain

Examples:

- Colombian Red Cross
- UNICEF
- WFP
- Direct Relief

Do not display arbitrary donation URLs.

See `security-and-data.md`.

---

## Where Is The Aid Going?

Show aggregate funding:

- pledged
- committed
- received

Also:

- top funded sectors
- organizations
- funding flows

MVP may start with mock data before OCHA FTS integration.

---

## Live Updates

Chronological update cards.

Potential sources:

- ReliefWeb
- UN agencies
- IFRC
- official Colombian response
- humanitarian organizations

Each update must show:

- timestamp
- source
- title / short summary
- source link

Do not publish an LLM-generated statement as if it were a source.

---

## Who Needs Help Most?

Regional cards.

Each card contains:

- region name
- severity
- deaths
- affected population
- link/interaction to focus map

Clicking should:

1. highlight the region
2. move/focus the map
3. show regional details

---

# 5. Trust design

Trust should be visible but not performative.

Useful indicators:

```text
Official source
Humanitarian source
Verified donation destination
Updated 18 minutes ago
```

Avoid fake authority indicators.

Do not use a “verified” badge unless the application actually tracks verification.

---

# 6. Accessibility

Target WCAG AA.

Requirements:

- keyboard usable navigation
- keyboard usable map alternatives
- adequate contrast
- focus-visible states
- semantic headings
- no essential information only conveyed by color
- map data also accessible through region cards/list
- reduced-motion support
- descriptive external link labels

Map hover content must also be available via focus/click.

---

# 7. Loading and failure states

The site must not become blank when an upstream source fails.

For each major data section:

```text
fresh
stale
unavailable
```

If a source is unavailable:

- continue showing last known valid data
- display timestamp
- optionally display “Data update delayed”

Do not silently replace official data with a lower-trust source.

---

# 8. Performance

Goals:

- server-render core page content
- lazy-load MapLibre client bundle
- avoid loading all source APIs from browser
- compress raster assets
- minimize animation
- cache public data

Initial target:

- strong Lighthouse performance on desktop
- usable page before map initialization completes
