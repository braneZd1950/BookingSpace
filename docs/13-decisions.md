# Architecture Decision Record

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

## Decision 4 — Personalized tenant website

Every tenant gets a subdomain and a template-driven website.

Reason: the business gets value beyond a calendar.

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
