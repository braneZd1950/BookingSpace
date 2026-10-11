# MVP build plan (lean)

> **Active plan:** [lean launch by phase](lean/README.md)  
> **Backend:** [frozen](lean/backend-status.md) — frontend only for now.

This file replaces the old 10-phase engineering checklist as the *delivery* order. Historical engineering ideas remain useful as background, but **build order follows lean phases below**.

## Lean phases (frontend-first)

| Phase | Doc | Status |
| --- | --- | --- |
| 1. One studio, one day | [phase-01-frontend](lean/phase-01-frontend.md) | **Now** |
| 2. Real booking (owner) | [phase-02-frontend](lean/phase-02-frontend.md) | Next |
| 3. Member books alone | [phase-03-frontend](lean/phase-03-frontend.md) | Later |
| 4. Public studio page | [phase-04-frontend](lean/phase-04-frontend.md) | Later |
| 5. Payments and plans | [phase-05-frontend](lean/phase-05-frontend.md) | Later |

## Acceptance for market pilot (lean)

A pilot is ready to *learn* when:

1. Owner can register and open a studio.
2. Owner can set contact + working hours.
3. Owner can add / suspend / renew members.
4. Owner can see open days (Termini / Kalendar).
5. *(Phase 2)* Owner can book and cancel sessions in the app.
6. At least one real studio uses members (and later bookings) for a week.

Not required for first learning: subdomain, SEO, social links, template wizard, Stripe, marketplace.

## Deferred vs old checklist

The previous Phases 1–10 (foundation → pilot) mixed backend and website early. Mapping:

| Old idea | Lean home |
| --- | --- |
| Auth, tenant create | Phase 1 (done / polish FE) |
| Multi-tenancy / hostname resolver | Deferred — no subdomain product yet |
| Personalized website editor | Phase 4 |
| Services, schedules, booking engine UI | Phase 2 |
| Customer book experience | Phase 3 |
| Memberships + physical payments UI | Phase 1 (members) + Phase 5 (payments) |
| Full acceptance test (20 steps) | After Phase 3–5, not before Phase 1 learning |

## Success metrics (unchanged intent)

Primary metric remains **real completed bookings** — but they are a **Phase 2+** metric. Phase 1 metric is **real member records entered in-app**.
