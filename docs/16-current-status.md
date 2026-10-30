# Current status (audit 2026-10-29)

Product UI brand: **anyminutes**. Repo package / historical docs may still say BookingSpace.

This file is the snapshot of what is **actually shipped in code**. Lean phase docs below record learning goals; they are no longer a “backend frozen / Phase 1 only” gate.

## What’s live

| Area | Status | Notes |
| --- | --- | --- |
| Auth (register, login, JWT, profile, password change) | Done | Forgot / reset password + email |
| Multi-tenant studios (`tenantId`) | Done | Public by slug; no hostname resolver product yet |
| Owner studio shell `/stranica` | Done (pilot) | Početna, Termini, Kalendar, Članovi, Analitika, Postavke |
| Owner gallery / Online / Blagajna / Plan | Held | Flagged off in `studioFeatures.js` — not in pilot nav |
| Owner booking loop | Done | Create / cancel; capacity; optional trainer |
| Member self-book `/s/:slug` | Done | Book / cancel with ACTIVE membership |
| Members + plans (add / renew / suspend) | Done | Physical payment **ledger API** exists; dedicated cash-entry UI still thin (Phase 5 gap) |
| Site setup wizard `/postavljanje` | Done | Templates, layout, palette, preview; real DNS deferred |
| Staff / trainers | Done | Invite, list, suspend; required on book when trainers exist |
| Web Push + PWA (web + mobile shell) | Done | VAPID; `client-mobile` reuses `client/src` |
| Privacy consent | Done | Banner + `POST /consent` + gate before booking |
| Platform admin `/analitika` | Done (web) | Studios, users, activity, SaaS billing, reports, system |
| Admin arhivski izvoz | Done (web) | PDF + Excel + CSV; digitalni pečat integriteta (HMAC) preko `/analytics/platform/exports/seal` |
| SaaS billing fields + warn/invoice email | Done | Trial / paid / unpaid on tenant |
| Online workouts | Built, **flagged off** | `ONLINE_ENABLED = false` in `client/src/onlineFeature.js` |
| Server tests + GitHub CI | Done | `mvp-flow`, `studio-ops`, `platform-billing`; build client + mobile |

## Explicitly not done

| Item | Notes |
| --- | --- |
| Waitlist | Spec only (`waitlistEntries`) — no model/API |
| Hostname → tenant product | Slug routes only (`/s/:slug`); `{slug}.booking.hr` is display/copy |
| Dedicated physical-payment UI | Held for later; API `POST …/payments` exists |
| Online / gallery / launch plan UI | Held — `GALLERY_ENABLED` / `ONLINE_ENABLED` / `PAYMENTS_UI_ENABLED` / `LAUNCH_PLAN_ENABLED` = false |
| Stripe / online checkout | Not used |
| Socket.io realtime | Dependency present; unused in `server/src` |

## Apps & ports

| App | Path | Local |
| --- | --- | --- |
| Web | `client/` | `http://localhost:5173` |
| Mobile PWA shell | `client-mobile/` | `http://localhost:5174` (`npm run dev:mobile`) |
| API | `server/` | `http://localhost:4001` (default; override with `PORT`) |

## How to run / verify

```bash
npm run dev          # web + API
npm run dev:mobile   # mobile shell + API
npm test             # server tests
npm run test:ci      # CI-style server tests
npm run build:client
npm run build:mobile
```

Local secrets live in one gitignored file: repo-root `.env` (copy from `.env.example`). Vite only exposes `VITE_*`. Render uses its own Environment panel.

## Doc map after this audit

| Prefer for… | Doc |
| --- | --- |
| What is shipped today | This file |
| REST contract | [07-api-spec.md](07-api-spec.md) |
| Collections | [03-database.md](03-database.md) |
| Live FE routes | [08-routes-frontend.md](08-routes-frontend.md) |
| Remaining product sequence | [12-roadmap.md](12-roadmap.md) |
| Lean learning phases (historical + remaining) | [lean/README.md](lean/README.md) |
| Backend change policy | [lean/backend-status.md](lean/backend-status.md) |
