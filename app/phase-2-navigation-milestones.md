# Help Colombia — Phase 2: Information Architecture & Navigation

The initial MVP dashboard (Milestones 0–12) is complete. Phase 2 expands the one-page experience so navigation is functional and users can move from the high-level dashboard into deeper information without leaving the primary page.

The dashboard remains the visual centerpiece.

## Target structure

```text
/
├── #overview
│   └── Existing map dashboard
├── #updates
│   └── Expanded chronological updates
├── #needs
│   └── Regional humanitarian needs
├── #response
│   └── Organizations + response activity
├── #impact
│   └── Detailed impact + trends
├── #help
│   └── Verified ways to help
└── Footer
```

Do not create `/updates`, `/organizations`, `/impact`, etc. during this phase. Keep `/` as the primary experience.

---

# Milestone 13 — One-Page Navigation Architecture

## Objective

Turn the currently non-functional header navigation into accessible navigation between sections of the single-page application. Preserve the existing dashboard as `#overview`.

## Navigation

```text
Overview
Updates
Who Needs Help
Who Is Helping
Impact
How to Help
                         [DONATE NOW]
```

If horizontal space becomes problematic, `Who Needs Help` may become `Needs` and `Who Is Helping` may become `Response`, but prefer explicit wording where the design supports it.

## Targets

```text
Overview        → #overview
Updates         → #updates
Who Needs Help  → #needs
Who Is Helping  → #response
Impact          → #impact
How to Help     → #help
DONATE NOW      → #help
```

`DONATE NOW` must not automatically redirect to an external organization.

## Requirements

- semantic anchor navigation
- smooth scrolling
- appropriate `scroll-margin-top`
- keyboard accessibility
- visible focus states
- URL hash updates
- browser back/forward compatibility
- active section indication where practical
- `prefers-reduced-motion` support
- no new navigation library solely for this behavior

## Acceptance criteria

Direct navigation such as `/#impact` lands correctly. The sticky/fixed header does not obscure section headings. All navigation remains usable by keyboard.

## Cursor prompt

```text
Read:
- agent-rules.md
- design-plan.md
- architecture.md
- security-and-data.md

Implement Milestone 13 only.

The Help Colombia MVP is complete. We are extending the existing one-page architecture rather than creating separate routes.

First inspect the current Header/navigation implementation and existing dashboard sections.

Implement functional single-page navigation.

Target anchors:
#overview
#updates
#needs
#response
#impact
#help

Navigation should become:
Overview
Updates
Who Needs Help
Who Is Helping
Impact
How to Help

The existing Donate Now CTA should navigate to #help.

Requirements:
- use semantic anchors
- preserve URL hashes
- support browser back/forward
- account for sticky/fixed header
- smooth scroll when reduced motion is not requested
- respect prefers-reduced-motion
- maintain keyboard accessibility
- provide visible focus states
- avoid unnecessary JavaScript
- do not add a navigation library
- do not create separate Next.js routes

The existing dashboard should become #overview.

Where existing dashboard cards correspond to later sections, their View details, View all updates, See affected areas, etc. links should navigate to the appropriate expanded section.

Do not build expanded sections yet except for minimal anchor placeholders if technically necessary.

Run lint, typecheck, tests, and build.
Stop after Milestone 13.
```

---

# Milestone 14 — Expanded Updates

## Objective

Turn the dashboard's compact update summary into a useful chronological humanitarian update feed at `#updates`. The existing dashboard card remains a summary.

## Update model

Each update should support available fields such as:

- source
- organization
- published time
- title
- summary
- affected location
- category
- source URL

Potential categories include Emergency Response, Food, Water & Sanitation, Health, Shelter, Search & Rescue, Government, Funding, and General. Only use categories supported by current data.

## Requirements

- newest first
- clear source attribution
- original source link
- readable timestamps
- loading state
- empty state
- stale-data state
- source failure does not destroy the existing feed
- no raw upstream HTML
- no fabricated categories or locations

## Cursor prompt

```text
Implement Milestone 14 only.

Build the expanded #updates section beneath the overview dashboard.

Inspect the existing updates database/source implementation before changing anything.

The existing Live Updates dashboard card remains a compact summary. The new section should provide a chronological expanded feed using the same trusted underlying data.

Each update should display available:
- timestamp
- source
- title
- summary
- location
- category
- link to original source

Requirements:
- newest first
- clear provenance
- accessible external links
- loading/empty/stale states
- responsive layout
- do not duplicate data-fetching logic unnecessarily
- do not expose raw ReliefWeb HTML
- do not fabricate missing categories or locations

Update the dashboard View all updates CTA to navigate to #updates.

Do not implement other expanded sections.
Run verification and stop.
```

---

# Milestone 15 — Who Needs Help

## Objective

Create `#needs`, answering: **Where are the greatest humanitarian needs right now?**

## Regional information

For each affected region, show available:

- region name
- severity
- affected population
- deaths
- injuries
- displaced
- primary needs
- last updated
- sources

Do not fill missing values with estimates unless the source explicitly labels them as estimates.

## Map integration

Selecting a region should synchronize with the map where practical: focus/highlight the selected region and expose its details. On mobile, the content must remain useful without forcing users back to the map.

## Cursor prompt

```text
Implement Milestone 15 only.

Build the expanded #needs section.

This section answers: "Who needs help most?"

Use the existing regions and impact metric architecture.

For each affected region show available:
- severity
- affected population
- deaths
- injuries
- displaced population
- humanitarian needs
- last updated
- provenance/source

Do not fabricate missing metrics.

Integrate region selection with the existing MapLibre state through the clean map interaction boundary already established.

Selecting a region should focus/highlight it on the map when appropriate. The content must remain completely usable without interacting with the map.

Update existing See affected areas and regional View details actions to navigate/interact with #needs appropriately.

Do not build new external ingestion during this milestone.
Run verification and stop.
```

---

# Milestone 16 — Who Is Helping

## Objective

Create `#response`, answering: **Which organizations are responding, and what are they actually doing?**

This replaces the vague `Organizations` navigation concept with `Who Is Helping`.

## Content

For each organization show available:

- organization name
- organization type
- areas of response
- current activities
- locations served
- latest operational update
- source/provenance
- official website/source

This section is about response transparency, not fundraising. Donation CTAs should not dominate it.

Clearly distinguish static organization descriptions from sourced current operational activity.

## Cursor prompt

```text
Implement Milestone 16 only.

Create the #response section answering: "Who is helping?"

Use existing organizations, IFRC data, and trusted response information already present in the application.

The section should emphasize humanitarian activity rather than donations.

For each organization show available:
- organization name
- organization type
- areas of response
- current activities
- locations served
- latest operational update
- source/provenance
- official website/source

Do not invent operational claims.

Clearly distinguish:
1. static organization descriptions
2. sourced current response activities

Do not duplicate the How Can I Help donation section.

Update the navbar's Organizations concept to Who Is Helping / #response.
Run verification and stop.
```

---

# Milestone 17 — Expanded Impact

## Objective

Create `#impact`. The dashboard gives users current headline numbers; this section explains how impact is evolving.

## Suggested content

Current metrics:

- deaths
- injured
- affected
- displaced

Then use historical append-only `impact_metrics` for:

- impact over time
- impact by region
- source/freshness information

## Data visualization rule

Charts must not imply continuity or precision unsupported by source data. If reports are sporadic, plot actual observations rather than inventing intermediate values.

Accessible text/table equivalents must exist for charted information.

## Cursor prompt

```text
Implement Milestone 17 only.

Create the expanded #impact section.

Use historical append-only impact_metrics already stored by the application.

Show:
- current key figures
- historical observations where sufficient data exists
- impact by region
- source/freshness information

If implementing charts:
- use actual reported observations
- do not interpolate missing humanitarian figures unless explicitly justified
- do not imply precision that does not exist
- accessible text/table equivalents must exist

Prefer a lightweight chart implementation.

Before adding a new chart dependency, inspect existing dependencies and explain whether one is actually required.

The existing Key Figures dashboard card remains the summary.
Update relevant Impact navigation to #impact.
Run verification and stop.
```

---

# Milestone 18 — Expanded How Can I Help

## Objective

Make `#help` the definitive trusted action section. The small dashboard panel remains the quick-access version.

This section answers: **What can I safely do right now?**

## Structure

### Donate

For each verified organization show:

- organization
- response focus
- verified status
- official domain
- Donate safely CTA

### Trust explanation

Clearly state:

> Help Colombia does not collect or process donations. Donation links take you to verified official organization websites.

Provide a concise explanation of how donation destinations are verified.

### Other ways to help

May include safe actions such as:

- share verified information
- follow official updates
- avoid unverified fundraisers

Do not recommend shipping physical goods or volunteering unless a trusted organization explicitly requests it.

## Cursor prompt

```text
Read security-and-data.md in full.

Implement Milestone 18 only.

Build the expanded #help section.

This should become the primary destination for:
- How to Help navigation
- Donate Now CTA
- dashboard donation links

Use only donation_destinations that pass the existing verified server-side redirect architecture.

Do not expose raw destination URLs as CTA state.

For each organization show:
- organization
- response focus
- verified status
- official domain
- Donate safely CTA

Explain clearly:
"Help Colombia does not collect or process donations. Donation links take you to verified official organization websites."

Add a concise explanation of how donation destinations are verified.

Also include a small Other ways to help section, but only make claims that are safe and appropriate.

Do not suggest shipping physical donations or volunteering unless a trusted organization explicitly requests it.

Donate Now must navigate to #help, not directly to an external site.

Run security tests and normal verification.
Stop after Milestone 18.
```

---

# Milestone 19 — Cross-Section Interactions

## Objective

Make the one-page experience feel connected rather than like unrelated sections stacked vertically.

## CTA mapping

```text
View full timeline          → #updates
See affected areas          → #needs
View details [region]       → #needs + selected region
View all updates            → #updates
See more ways to help       → #help
See full funding details    → #impact or funding subsection
Who Is Helping nav          → #response
Donate Now                  → #help
```

## Active navigation

As the user scrolls, the corresponding navbar item may become active. Prefer `IntersectionObserver` over continuous scroll calculations. Avoid flicker at section boundaries.

## Cursor prompt

```text
Implement Milestone 19 only.

Audit every internal CTA and navigation element on the Help Colombia page.

Connect them into the completed one-page information architecture.

Expected targets:
Overview → #overview
Updates → #updates
Who Needs Help → #needs
Who Is Helping → #response
Impact → #impact
How to Help → #help
Donate Now → #help

Existing dashboard CTAs should navigate to their appropriate expanded sections.

Implement active navigation state as the user moves through sections.
Prefer IntersectionObserver.

Requirements:
- browser back/forward works
- hashes remain meaningful
- keyboard behavior works
- reduced-motion is respected
- sticky header does not obscure headings
- no scroll-jacking
- no custom fake scrollbar behavior

Do not add new product features.
Run Playwright tests for navigation behavior.
Stop after Milestone 19.
```

---

# Milestone 20 — One-Page Responsive & UX QA

## Objective

Perform full-page UX QA now that the application extends beyond the opening dashboard.

The initial dashboard must continue to feel like the main experience rather than simply the first generic section.

## Test widths

```text
1536 × 1024
1440 × 900
1280 × 800
1024 × 768
768 × 1024
430 × 932
390 × 844
```

## Inspect

- header behavior
- navigation overflow
- mobile navigation
- section spacing
- map performance
- anchor positioning
- typography
- overly long sections
- duplicate information
- CTA hierarchy
- footer
- keyboard/focus navigation

On mobile, the desktop navigation may collapse into a simple menu.

## Cursor prompt

```text
Implement Milestone 20 only.

Perform a complete responsive UX QA pass on the expanded one-page Help Colombia application.

Use Playwright MCP where available.

Test:
1536x1024
1440x900
1280x800
1024x768
768x1024
430x932
390x844

Inspect:
- dashboard
- navigation
- #updates
- #needs
- #response
- #impact
- #help
- footer

First produce a discrepancy report.
Then fix issues in small groups.

Requirements:
- preserve the approved desktop dashboard design
- mobile does not need to preserve desktop spatial composition
- avoid horizontal overflow
- navigation must remain usable
- all anchor destinations must account for header height
- avoid excessive repeated content
- maintain accessible touch target sizes
- preserve map usability without making it mandatory for understanding the data

Do not redesign the desktop dashboard.
Run the complete verification suite afterward.
```

---

# Phase Completion / Feature Freeze

After Milestone 20, stop adding feature work and enter launch validation.

Recommended progression:

```text
M0–M12  Core application
   ↓
M13     Navigation architecture
   ↓
M14     Expanded Updates
   ↓
M15     Who Needs Help
   ↓
M16     Who Is Helping
   ↓
M17     Expanded Impact
   ↓
M18     How Can I Help
   ↓
M19     Cross-section integration
   ↓
M20     Full responsive UX QA
   ↓
FEATURE FREEZE
   ↓
Repository/security audit
   ↓
Real-data verification
   ↓
Donation verification
   ↓
Failure testing
   ↓
Staging soak
   ↓
Observability
   ↓
SEO/sharing
   ↓
Production launch
```

## Architectural decision

Do not generalize into separate routes yet. The opening dashboard remains the high-level command center, while scrolling down provides progressively deeper answers to the five core questions.

Separate routes can be introduced later if individual sections become large enough to justify them.
