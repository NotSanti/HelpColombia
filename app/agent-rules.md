# Help Colombia — Cursor Agent Rules

These rules apply to all AI-assisted development.

---

# 0. Autonomous milestone workflow

Default flow:

```text
You → Product requirements → Agent plans → Agent implements → Agent verifies → Agent continues
```

When working through `milestones.md`:

1. Read the active milestone and required docs (see §1).
2. Plan briefly, then implement **one milestone at a time**.
3. Verify before moving on:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test` (and `npm run build` when the milestone touches routing, build config, or production behavior)
4. When verification passes and the milestone deliverables are met:
   - **Commit** the milestone work with a clear message (one milestone per commit when practical).
   - **Push** to the remote branch to keep git history organized.
   - **Continue immediately** to the next milestone without asking the user to proceed.

Do **not** stop merely to ask whether you should continue.

Only pause for user input when genuinely necessary, for example:

- missing secrets, credentials, or third-party approval (e.g. ReliefWeb app name)
- an irreversible or security-sensitive decision not covered by the docs
- acceptance criteria cannot be met after reasonable attempts
- the requested behavior conflicts with `security-and-data.md`
- deployment or production promotion (Milestone 11 explicitly forbids auto-deploy)

Between milestones, a short completion note is enough; do not wait for approval before starting the next milestone.

---

# 1. Read before editing

Before performing a milestone:

1. Read this file.
2. Read the relevant section of `milestones.md`.
3. Read `architecture.md`.
4. Read `security-and-data.md` if touching data, links, API routes, authentication, ingestion, or Supabase.
5. Inspect the existing repository before proposing changes.

Do not assume the repository still matches the original plan.

---

# 2. Work incrementally

Implement **one milestone at a time** — never batch multiple future milestones into a single change set unless explicitly asked.

After a milestone passes verification, **automatically start the next milestone** (see §0).

A milestone should end with:

```text
working implementation
typecheck passing
lint passing
relevant tests passing
git commit + push for that milestone
brief completion summary
known limitations (if any)
then continue to the next milestone
```

---

# 3. Do not rewrite working code without reason

Prefer surgical changes.

Do not:

- restructure unrelated folders
- rename large parts of the codebase
- replace working dependencies
- introduce new architectural patterns casually

Explain major architectural changes before implementing them.

---

# 4. Avoid premature abstraction

Do not create:

```text
generic disaster engine
generic CMS
plugin system
repository/service/controller layers everywhere
complex event bus
microservices
```

unless a real milestone requires them.

Prefer readable concrete code.

---

# 5. TypeScript

Rules:

```text
strict mode
no `any` without justification
explicit external API validation
shared domain types only where useful
```

Avoid giant universal type files.

Keep types near their domain.

---

# 6. Data validation

All external API payloads must be treated as untrusted.

Use Zod or equivalent.

Pipeline:

```text
fetch
→ parse
→ validate
→ normalize
→ persist
```

Do not pass raw external objects throughout UI code.

---

# 7. Server-first Next.js

Default to Server Components.

Only use `"use client"` when browser APIs or interaction require it.

Do not turn entire route trees into client components for convenience.

---

# 8. UI

Use existing components before creating duplicates.

Prefer shadcn primitives.

Match the design source of truth.

Do not redesign the application while implementing it.

Responsive layout is required.

Do not hard-code the entire desktop screenshot as one image.

Only the approved map reference may initially be rasterized during visual scaffolding.

---

# 9. Map

Keep map implementation isolated.

Do not mix MapLibre imperative logic into dashboard cards.

Preferred boundary:

```text
ColombiaMap
← typed data props
→ interaction callbacks
```

---

# 10. Donation safety

Read `security-and-data.md`.

Never implement an arbitrary redirect URL.

Never auto-ingest donation links into active state.

Never bypass verification logic for convenience.

If requested behavior violates the donation security model, stop and explain.

---

# 11. Database changes

Use migrations.

Do not manually modify production tables.

Every schema change should:

- have a migration
- update generated types if applicable
- preserve existing data where possible

---

# 12. Testing strategy

Testing is pragmatic.

Required:

### Unit
Security-sensitive pure functions.

### Integration
Donation redirect route.
Source adapters.
Normalization logic.

### Browser
Critical public flows.

Do not create large test suites for simple presentational components.

---

# 13. Accessibility

Every interactive element must be keyboard usable.

Map information must have a non-map equivalent.

Buttons and links must use semantic elements.

Do not use clickable `<div>` elements.

---

# 14. Comments

Prefer readable code.

Comments should explain:

```text
why
security constraint
upstream API oddity
non-obvious behavior
```

Do not narrate obvious code.

---

# 15. Dependencies

Before adding a dependency:

1. explain what it solves
2. verify no existing dependency solves it
3. prefer stable well-maintained packages

Do not install libraries for tiny utilities.

---

# 16. Completion report

After each milestone **before continuing**, produce a brief report:

```markdown
## Completed
- Milestone N — …

## Files changed
- …

## Verification
- npm run lint ✓
- npm run typecheck ✓
- npm test ✓
- npm run build ✓ (when applicable)

## Known limitations
- …

## Next
- Starting Milestone N+1 …
```

Then **commit, push, and continue** to the next milestone without waiting for user confirmation (see §0).

Do not ask “Should I continue to the next milestone?”

---

# 17. Git

**One milestone per commit** when practical. Keep commits narrowly scoped and descriptive.

After each verified milestone:

```text
git add <relevant files>
git commit -m "feat(mN): …"
git push
```

Suggested branch naming:

```text
feat/m1-dashboard-shell
feat/m3-supabase-foundation
feat/m4-donation-redirects
…
```

Do **not** commit secrets (`.env.local`, service-role keys, etc.).

Prefer one milestone per branch/PR when using pull requests.

---

# 18. Source of truth

When documents conflict:

```text
security-and-data.md
→ architecture.md
→ milestone instructions
→ design-plan.md
```

Security rules always win.
