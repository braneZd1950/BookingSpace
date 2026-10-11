# Architecture Decision Record

> Delivery order is lean phases: [lean/README.md](lean/README.md). Backend is frozen for current frontend work: [lean/backend-status.md](lean/backend-status.md).

## Decision 1 — Shared database

Use a shared MongoDB with `tenantId` for the MVP.

Reason: it is simpler, cheaper, easier to maintain, and sufficient isolation when authorization is correct.

## Decision 2 — One permanent user ID

A customer has one BookingSpace account. Memberships are separate records.

Reason: historical memberships, multiple businesses, and easy account reuse.

## Decision 3 — Separate Payment and Membership

Payment answers: did money get recorded?

Membership answers: does this customer have the right to use these services?

Reason: this allows physical payments now and online payments later.

## Decision 4 — Personalized tenant website (amended for lean)

**Long-term:** a tenant may get a simple public page and later a subdomain.

**Lean amendment:** do not ship subdomain settings, SEO/social editors, or a website wizard before Phases 2–3 prove the booking loop. Phase 4 ships a fixed template under an app route first.

Reason: validated learning on memberships/bookings beats vanity site configuration.

## Decision 5 — Capacity-based booking

A service has duration, interval, and capacity.

Reason: this is required for Power Plate and group fitness use cases.

## Decision 6 — Modular monolith

Do not use microservices in the MVP.

Reason: lower complexity and faster iteration.

## Decision 7 — No online payment in MVP

Physical payment is supported.

Reason: the pilot business may collect payment at the center. This lets the booking system be validated without payment gateway complexity.

## Decision 8 — Cross-tenant discovery

Users can discover other businesses, but booking authorization is tenant-specific.

Reason: this creates a future network effect without requiring a marketplace in the MVP.

Lean note: discovery UI is post-pilot — not Phases 1–5.

## Decision 10 — Sports first; playroom / wellness prepared only

Ship and validate sports venues (memberships + capacity bookings) before changing the booking model for playrooms and wellness.

Reason: those niches often need appointment booking **without** membership. Document requirements in [15-niches-playroom-wellness.md](15-niches-playroom-wellness.md); implement only after the sports loop proves usage.

## Decision 11 — Membership gate is niche-configurable later

Today many services use `membershipRequired`. Later, playroom/wellness services may set that to false so guests can book slots.

Reason: one engine, different commercial models — without forcing gym membership onto every partner.

## Decision 9 — Frontend-first lean phases

Ship and measure owner operations (Phase 1) and booking UI (Phase 2+) before expanding backend or public-site product.

Reason: Build–Measure–Learn; avoid changing two layers at once.
