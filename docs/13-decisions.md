# Architecture Decision Record

> Delivery / status: [lean/README.md](lean/README.md), [16-current-status.md](16-current-status.md). Backend policy: [lean/backend-status.md](lean/backend-status.md).

## Decision 1 — Shared database

Use a shared MongoDB with `tenantId` for the MVP.

Reason: simpler, cheaper, easier to maintain; sufficient isolation when authorization is correct.

## Decision 2 — One permanent user ID

A customer has one account. Memberships are separate records.

Reason: historical memberships, multiple businesses, and easy account reuse.

## Decision 3 — Separate Payment and Membership

Payment answers: did money get recorded?

Membership answers: does this customer have the right to use these services?

Reason: physical payments now and online payments later.

## Decision 4 — Personalized tenant website (amended)

**Long-term:** a tenant may get a simple public page and later a subdomain.

**Amendment:** setup wizard + preview ship under app routes (`/postavljanje`, SiteFrame). Real DNS / custom domains stay deferred. Slug-based `/s/:slug` is the public booking entry.

Reason: validated booking loop first; hostname product later.

## Decision 5 — Capacity-based booking

A service has duration, interval, and capacity.

Reason: required for Power Plate and group fitness.

## Decision 6 — Modular monolith

Do not use microservices in the MVP.

Reason: lower complexity and faster iteration.

## Decision 7 — No online payment in MVP

Physical payment is supported (API + membership create). Dedicated till UI is Phase 5.

Reason: validate booking without payment gateway complexity.

## Decision 8 — Cross-tenant discovery

Users may later discover other businesses; booking authorization stays tenant-specific.

Lean note: discovery UI is post-pilot.

## Decision 9 — Frontend-first lean phases (amended 2026-10-25)

Ship and measure owner operations and booking UI before expanding vanity site product.

**Amendment:** after Phases 1–3 shipped, the strict “backend frozen” rule is lifted. Still prefer documenting gaps and changing one concern at a time. See [lean/backend-status.md](lean/backend-status.md).

## Decision 10 — Sports first; playroom / wellness prepared only

Ship and validate sports venues before changing the booking model for playrooms and wellness.

Prep: [15-niches-playroom-wellness.md](15-niches-playroom-wellness.md).

## Decision 11 — Membership gate is niche-configurable later

Today many services use `membershipRequired`. Later, playroom/wellness services may set that to false.

## Decision 12 — Product brand anyminutes

UI, PWA, and legal contact use **anyminutes**. Repo / npm package / some env domain names may still say BookingSpace until a rename pass.

Reason: brand can ship in the product without a disruptive monorepo rename.

## Decision 13 — Mobile as shared-source PWA shell

`client-mobile` reuses `client/src` via Vite alias instead of a separate React Native app for MVP.

Reason: one booking UI, installable on phones, lower maintenance.

## Decision 14 — Online workouts behind a feature flag

API and pages exist; `ONLINE_ENABLED` stays false until product turn-on.

Reason: avoid half-live catalog for pilot studios that do not need it yet.
