# Backend status

## Rule (updated 2026-10-25)

The earlier “frozen server” lean rule is **lifted**. Phases 1–3 and several post-lean features already required server work (staff, push, consent, online, analytics, billing).

**Still prefer:**

1. Document the gap in the log below before coding.  
2. Change the smallest surface that unblocks the active product goal.  
3. Keep [../07-api-spec.md](../07-api-spec.md) and [../03-database.md](../03-database.md) in sync when you add endpoints or collections.  
4. Add or extend a server test when you change booking, membership, staff, or billing behaviour.

Snapshot of what the API already covers: [../16-current-status.md](../16-current-status.md).

## What the frontend may use (existing)

| Domain | Typical client usage | Notes |
| --- | --- | --- |
| Auth | register, login, logout, me, profile, password, forgot/reset | Email via Brevo SMTP |
| Tenants | create, mine, public by slug, patch, site, images | `siteSettings` embedded on tenant |
| Services / availability | CRUD + slot generation | Capacity models `PER_SLOT` / `CONCURRENT` |
| Bookings | create, my, tenant list, cancel, complete, no-show | Optional `staffId` |
| Memberships / plans | list, create, suspend, my | Codes `MEM-YYYY-######` |
| Payments | list, record physical | UI till flow still thin |
| Customers | list, detail | |
| Staff | list, create, suspend | Trainers on public + booking |
| Online | catalog, CRUD, upload | FE gated by `ONLINE_ENABLED` |
| Push | VAPID key, subscribe / unsubscribe | Web Push |
| Consent | `POST /consent` | Privacy audit trail |
| Analytics / platform | events + `/analytics/platform/*` | `ADMIN` or `ADMIN_EMAILS` |

## API gap log

| Date | Phase / area | Needed for | Gap | Decision |
| --- | --- | --- | --- | --- |
| 2026-10-09 | Owner kalendar | Imena članova + mjesec rezervacija | `GET /tenants/:id/bookings` nije vraćao user/service niti `dateFrom`/`dateTo` | implement — populate + raspon datuma |
| 2026-10-10 | Owner postavke | Izmjena profila i lozinke | Nije bilo `PATCH /auth/me` ni `PATCH /auth/password` | implement — profil + lozinka |
| 2026-10-10 | Member UI | Redirect na studio slug | `GET /memberships/my` nije vraćao tenant slug | implement — populate tenant |
| 2026-10-10 | Member UI | Moje rezervacije | `GET /bookings/my` bez naziva usluge | implement — populate service |
| 2026-10-10 | Member site | Vlasnikova stranica na `/s/:slug` | layout/paletteId nisu bili u `siteSettings` | implement — layout + paletteId |
| 2026-10-25 | Audit | Doc hygiene | Specs behind code (API, DB, lean freeze) | docs refresh — see `16-current-status` |
| — | Phase 5 | Till UI | FE may need richer payment list filters / receipts | document before expanding API |
| — | Later | Waitlist | No model/API | defer until roadmap |
| — | Later | Hostname tenancy | No host→tenant middleware | defer; slug routes are source of truth |

## Backend reference docs

| Doc | Topic |
| --- | --- |
| [`../02-architecture.md`](../02-architecture.md) | Stack, tenancy |
| [`../03-database.md`](../03-database.md) | Collections |
| [`../04-booking-engine.md`](../04-booking-engine.md) | Slots / capacity |
| [`../05-memberships-physical-payments.md`](../05-memberships-physical-payments.md) | Memberships |
| [`../07-api-spec.md`](../07-api-spec.md) | REST map |
| [`../10-security-rules.md`](../10-security-rules.md) | Auth / isolation |
| [`../16-current-status.md`](../16-current-status.md) | Shipped vs deferred |

## Tests

Under `server/test/` (Node test runner + `mongodb-memory-server`):

- `mvp-flow.test.js` — business, membership, booking, cancel  
- `studio-ops.test.js` — member invite, trainer, staff booking, suspend  
- `platform-billing.test.js` — trial / mark paid / warn-invoice  

Run: `npm test` or `npm run test:ci` from repo root.
