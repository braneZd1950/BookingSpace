# Lean launch — documentation by phase

BookingSpace follows **Build → Measure → Learn**. Work is split into five launch phases. **Current work is frontend only.** Do not change the backend until Phase 1 metrics are proven and Phase 2 explicitly needs an API change.

## How to use these docs

| If you are… | Read |
| --- | --- |
| Starting any frontend task | This file + the active phase doc |
| Changing routes / owner UI | [phase-01](phase-01-frontend.md) or later phase that owns the screen |
| Touching booking UI | [phase-02](phase-02-frontend.md) |
| Adding customer self-serve | [phase-03](phase-03-frontend.md) |
| Building the public studio site | [phase-04](phase-04-frontend.md) — **not now** |
| Payments UI | [phase-05](phase-05-frontend.md) — **not now** |
| Tempted to edit `server/` | [backend-status](backend-status.md) |

## Phase map

| Phase | Title | Status | Frontend focus | Backend |
| --- | --- | --- | --- | --- |
| 1 | One studio, one day | **Now** | Login, settings, members, read-only schedule | Frozen — use existing APIs |
| 2 | Real booking (owner) | Next | Create slots, book, cancel | Frozen unless gap blocks UI |
| 3 | Member books alone | Later | Customer login + book/cancel | Frozen unless gap blocks UI |
| 4 | Public studio page | Later | Fixed template site + CTA | Frozen |
| 5 | Payments & plans | Later | Plans, cash entry, session burn | Frozen |

## What we deliberately skip until later

- Subdomains / custom domains
- SEO fields, social links, section toggles
- Owner gallery CMS (Phase 4 — after booking loop works)
- Color / layout wizard before first booking
- Stripe / online payments
- Marketplace / cross-studio discovery
- Playroom / wellness booking models (prep only: [../15-niches-playroom-wellness.md](../15-niches-playroom-wellness.md)) — **sports venues first**

## Source of truth in the app

The same phases are shown in the owner UI at `/stranica/plan` (`client/src/pages/owner/launchPhases.js`). Keep docs and that file aligned when a phase status changes.

## Related reference docs (not phase-scoped)

Older specs remain under `docs/` (`01`–`15`). Prefer lean phase docs for *what to build now*. Treat backend specs (`02`–`07`, `10`) as read-only background until [backend-status](backend-status.md) says otherwise. Niche expansion prep: [../15-niches-playroom-wellness.md](../15-niches-playroom-wellness.md).
