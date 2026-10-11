# Backend status — frozen for current lean work

## Rule

**Prefer not to modify `server/` during frontend-only phases.**  
Document gaps first; implement only when a listed gap blocks the active phase (see log below).

## Why

Lean Startup: change one layer at a time. Validating “owners enter members here” does not require new backend features. Backend churn delays learning.

## What frontend may use now (existing)

| Domain | Typical client usage | Notes |
| --- | --- | --- |
| Auth | register, login, JWT | Already wired |
| Tenants | create, patch profile/hours, my tenants | Settings Phase 1 |
| Memberships | list, create, suspend, plans | Members Phase 1 |
| Uploads / site | may exist | **Do not build UI for SEO/social/sections until Phase 4** |
| Bookings / sessions / services | may exist | Wire in Phase 2 UI; if missing fields, add a gap below — do not code server yet |

## API gap log (frontend-only notes)

Add rows when Phase 2+ UI is blocked. Do not implement until the phase is active and the gap is approved.

| Date | Phase | Needed for | Gap | Decision |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Owner kalendar | Imena članova + mjesec rezervacija | `GET /tenants/:id/bookings` nije vraćao user/service niti `dateFrom`/`dateTo` | implement — populate + raspon datuma |
| 2026-10-10 | Owner postavke | Izmjena profila i lozinke | Nije bilo `PATCH /auth/me` ni `PATCH /auth/password` | implement — profil + lozinka |
| 2026-10-10 | Member UI | Redirect na studio slug | `GET /memberships/my` nije vraćao tenant slug | implement — populate tenant |
| 2026-10-10 | Member UI | Moje rezervacije | `GET /bookings/my` bez naziva usluge | implement — populate service |
| 2026-10-10 | Member site | Vlasnikova stranica na `/s/:slug` | layout/paletteId nisu bili u `siteSettings` | implement — layout + paletteId |

## Backend reference docs (read-only)

| Doc | Topic |
| --- | --- |
| [`../02-architecture.md`](../02-architecture.md) | Stack, tenancy |
| [`../03-database.md`](../03-database.md) | Collections |
| [`../04-booking-engine.md`](../04-booking-engine.md) | Slots / capacity |
| [`../05-memberships-physical-payments.md`](../05-memberships-physical-payments.md) | Memberships |
| [`../07-api-spec.md`](../07-api-spec.md) | REST map |
| [`../10-security-rules.md`](../10-security-rules.md) | Auth / isolation |

## When backend may change again

1. Phase 1 measure is met (or consciously skipped with a written reason), and  
2. Phase 2 UI cannot complete against existing endpoints, and  
3. The gap is recorded in the table above with an explicit “implement” decision.
