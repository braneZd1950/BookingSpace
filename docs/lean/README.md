# Lean launch — documentation by phase

anyminutes follows **Build → Measure → Learn**. The five launch phases remain the learning narrative. **Phases 1–3 are implemented in the product**; Phase 4 is mostly done (wizard + preview); Phase 5 (physical payments UI) is the main remaining lean gap.

Backend is **no longer frozen** — see [backend-status.md](backend-status.md). Prefer documenting API gaps before expanding the server; ship the smallest change that unblocks learning.

Product snapshot: [../16-current-status.md](../16-current-status.md).

## How to use these docs

| If you are… | Read |
| --- | --- |
| Checking what is already shipped | [../16-current-status.md](../16-current-status.md) |
| Working on payments / till UI | [phase-05](phase-05-frontend.md) |
| Touching booking UI | [phase-02](phase-02-frontend.md) / [phase-03](phase-03-frontend.md) |
| Public studio page | [phase-04](phase-04-frontend.md) |
| Changing `server/` | [backend-status](backend-status.md) + [../07-api-spec.md](../07-api-spec.md) |

## Phase map

| Phase | Title | Status | Notes |
| --- | --- | --- | --- |
| 1 | One studio, one day | **Done** | Auth, settings, members, schedule |
| 2 | Real booking (owner) | **Done** | Termini create / cancel |
| 3 | Member books alone | **Done** | `/s/:slug/termini` |
| 4 | Public studio page | **Mostly done** | Wizard + SiteFrame; real DNS later |
| 5 | Payments & plans | **Next** | Plans/renew exist; dedicated cash/card entry UI missing |

## What we deliberately skip until later

- Subdomains / custom domains as a product
- Waitlist
- Stripe / online payments
- Marketplace / cross-studio discovery
- Online workouts in the live UI (`ONLINE_ENABLED` stays false until product says go)
- Playroom / wellness booking models (prep: [../15-niches-playroom-wellness.md](../15-niches-playroom-wellness.md)) — **sports venues first**

## In-app phase list

`client/src/pages/owner/launchPhases.js` mirrors these statuses. The `/stranica/plan` route is **not mounted** — keep the JS file aligned with this README when statuses change; remount the page only if product wants it visible again.

## Related reference docs

Full specs under `docs/` (`01`–`16`). Prefer [../16-current-status.md](../16-current-status.md) and this folder for *what to build next*; treat `02`–`07`, `10` as living contracts (updated with the code).
