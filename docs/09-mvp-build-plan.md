# MVP build plan (lean)

> Phase map: [lean/README.md](lean/README.md)  
> Shipped snapshot: [16-current-status.md](16-current-status.md)  
> Backend policy: [lean/backend-status.md](lean/backend-status.md)

## Lean phases

| Phase | Doc | Status |
| --- | --- | --- |
| 1. One studio, one day | [phase-01-frontend](lean/phase-01-frontend.md) | **Done** |
| 2. Real booking (owner) | [phase-02-frontend](lean/phase-02-frontend.md) | **Done** |
| 3. Member books alone | [phase-03-frontend](lean/phase-03-frontend.md) | **Done** |
| 4. Public studio page | [phase-04-frontend](lean/phase-04-frontend.md) | **Mostly done** |
| 5. Payments and plans | [phase-05-frontend](lean/phase-05-frontend.md) | **Next** |

## Acceptance for market pilot

A pilot is ready to *learn* when:

1. Owner can register and open a studio. ✅  
2. Owner can set contact + working hours. ✅  
3. Owner can add / suspend / renew members. ✅  
4. Owner can see open days (Termini / Kalendar). ✅  
5. Owner can book and cancel sessions in the app. ✅  
6. Member can self-book / cancel. ✅  
7. At least one real studio uses members + bookings for a week. *(measure)*  
8. *(Phase 5)* Owner can record physical payments in a clear till UI. *(remaining)*

Not required for first learning: real subdomain DNS, Stripe, marketplace, Online workouts flag on.

## Deferred vs old checklist

| Old idea | Home now |
| --- | --- |
| Auth, tenant create | Done |
| Multi-tenancy / hostname resolver | Deferred — slug routes are live |
| Personalized website wizard | Mostly done (Phase 4) |
| Services, schedules, booking engine UI | Done (Phases 2–3) |
| Memberships + physical payments UI | Members done; till UI = Phase 5 |
| Trainers, push, consent, platform admin | Shipped (see status doc) |

## Success metrics

Primary metric remains **real completed bookings**. Phase 1 metric (members entered in-app) and Phase 2+ booking metrics apply to the pilot studio.
