# Help Colombia — Security & Data Integrity

This file contains non-negotiable requirements.

The site deals with disaster relief and donation links.

Security failures can redirect users toward fraudulent payment destinations.

---

# 1. Donation security boundary

The frontend must NEVER control an arbitrary donation URL.

Safe:

```text
/out/red-cross-colombia
```

Unsafe:

```text
/out?url=https://example.com
```

Unsafe:

```tsx
<a href={apiResponse.donationUrl}>
```

Production flow:

```text
CTA
→ internal organization identifier
→ server route
→ lookup verified destination
→ server-side validation
→ redirect
```

---

# 2. Destination validation

Before redirect:

```text
record exists
verification_status = verified
is_enabled = true
protocol = https
hostname exactly matches approved hostname
no username/password in URL
no unexpected port
```

Hostname comparison must be exact.

Never use:

```ts
hostname.includes(...)
hostname.startsWith(...)
```

for trust decisions.

---

# 3. Donation URLs are never auto-published

External APIs, AI, web scraping, imported data, and user input may discover a possible donation URL.

They must never automatically convert it to an active CTA.

Required state transition:

```text
discovered
→ pending
→ human verification
→ verified
→ enabled
```

Changing the URL resets verification.

---

# 4. Redirect chain monitoring

Future link health checks must inspect redirects.

A verified destination redirecting to an unknown host should disable the CTA until reviewed.

---

# 5. SSRF protection

Any server-side URL checker must:

- HTTPS only
- reject localhost
- reject loopback
- reject private IP space
- reject link-local networks
- resolve DNS safely
- validate every redirect
- limit redirect count
- enforce timeout
- limit response size

---

# 6. XSS

React text rendering is preferred.

Never use:

```tsx
dangerouslySetInnerHTML
```

for external humanitarian content.

Do not render raw upstream HTML.

If rich text is required later:

- sanitize
- allowlist tags
- sanitize URLs separately

---

# 7. Content Security Policy

Introduce CSP before production launch.

Target policy concept:

```text
default-src 'self'
script-src 'self'
object-src 'none'
base-uri 'none'
frame-ancestors 'none'
```

Expand only for required vendors.

Avoid:

```text
unsafe-eval
unsafe-inline
```

where possible.

---

# 8. Supabase

Enable RLS.

Public users:

```text
SELECT public data only
```

Public clients must not be able to:

```text
INSERT donation destinations
UPDATE donation destinations
DELETE donation destinations
modify verification status
```

Service-role credentials are server-only.

---

# 9. Admin functionality

Do not build admin UI in early MVP.

When admin editing is introduced:

- authenticated admins
- MFA
- strict server authorization
- audit trail
- verification workflow
- ideally separate roles for editors and donation verifiers

---

# 10. Source integrity

Every public claim derived from external data must retain:

```text
source
source URL
published/reported time
retrieved time
```

Do not treat AI output as provenance.

---

# 11. LLM policy

AI may later assist with:

- translation
- classification
- summarization
- entity extraction
- deduplication

AI must NOT be the authoritative origin of:

```text
death counts
injury counts
funding values
donation URLs
locations
aid quantities
```

Every claim must resolve back to source material.

---

# 12. Conflicting metrics

Never average conflicting reports.

Store all observations.

Resolve display using source-priority policy.

---

# 13. Dependencies

Prefer maintained dependencies.

Do not add a package when:

- platform APIs are sufficient
- functionality is trivial
- package materially expands attack surface

Run:

```text
npm audit
```

before production launch.

Do not blindly auto-fix major dependency upgrades.

---

# 14. External links

For normal external source links:

```text
target="_blank"
rel="noopener noreferrer"
```

Donation CTA links should use the server-side redirect flow.

---

# 15. Secrets

Never commit:

```text
service role keys
API secrets
tokens
cron secrets
```

Maintain `.env.example`.

---

# 16. Security acceptance criteria

Before launch:

- donation redirects cannot accept arbitrary URLs
- unverified destinations cannot redirect
- verified domain validation is server-side
- Supabase donation tables are not client-writable
- no dangerous HTML rendering
- CSP exists
- dependency audit reviewed
- cron endpoints require authorization
- service credentials remain server-only
