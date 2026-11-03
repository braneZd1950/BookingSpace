# anyminutes

Multi-tenant SaaS for studio bookings, capacity, memberships, and a simple public studio page.  
*(Repo / npm package may still be named `bookingspace` — product brand in the UI is **anyminutes**.)*

## Current status

Core booking loop is **shipped** (owner + member), plus trainers, PWA/push, consent, platform admin, and partner billing.  
Full snapshot: **[docs/16-current-status.md](docs/16-current-status.md)**.

| Area | Status |
| --- | --- |
| Auth, tenants, services, availability | Done |
| Owner booking (`/stranica/termini`) | Done |
| Member self-book (`/s/:slug/termini`) | Done |
| Members / plans / renew | Done |
| Site wizard + preview | Done (real DNS later) |
| Staff / trainers | Done |
| Web Push + PWA (web + mobile) | Done |
| Platform admin `/analitika` | Done (web) |
| Online workouts | Built, **UI flag off** |
| Physical payments till UI | Thin — next lean focus |
| Waitlist / Stripe / subdomain product | Not started |

## Lean phases (learning order)

Phases 1–3 are **implemented in product**. Remaining learning focus is Phase 5 (payments UI) and turning on Online when ready. Details: [docs/lean/README.md](docs/lean/README.md).

| Phase | Focus | Status |
| --- | --- | --- |
| 1 | Members, settings, schedule | **Done** |
| 2 | Owner booking loop | **Done** |
| 3 | Member self-book | **Done** |
| 4 | Public studio page / wizard | **Mostly done** (DNS later) |
| 5 | Physical payments UI | **Next** |

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, RTK Query, SCSS |
| Mobile PWA | `client-mobile/` — Vite shell; reuses `client/src` |
| Native mobile | `mobile/` — Expo + TypeScript + Paper + NativeWind ([docs/18](docs/18-native-mobile.md)) |
| Backend | Node.js, Express, REST, JWT, Mongoose |
| Database | MongoDB Atlas, shared DB + `tenantId` |
| CI | GitHub Actions — server tests + client/mobile builds |

## Run locally

```bash
npm run dev            # web :5173 + API
npm run dev:mobile     # PWA shell :5174 + API
npm run start:native   # Expo native app (mobile/)
npm test               # server tests
```

| Service | URL / tool |
| --- | --- |
| Web | `http://localhost:5173` |
| Mobile PWA | `http://localhost:5174` |
| Native | Expo Go / emulator (`mobile/`) |
| API | `http://localhost:4001/api` |

Copy `.env.example` to `.env` in the repo root. That one file is used locally by the API and by Vite.

## Production / go-live

Localhost workflow stays the same (`npm run dev`). For real traffic:

| Step | Command / doc |
| --- | --- |
| Checklist | **[docs/20-production-launch.md](docs/20-production-launch.md)** |
| Env template | `.env.production.example` → Render Environment |
| Validate secrets | `node scripts/check-production-env.js --file .env.production --force` |
| Build | `npm run build:prod` (same as Render `build:render`) |
| Deploy | [docs/17-render-deploy.md](docs/17-render-deploy.md) · optional `render.yaml` |
| Smoke | `SMOKE_API=https://…/api npm run smoke` |
| Limits / stress | `npm run test:limits` ([docs/21](docs/21-limits-testing.md)) |
| Never on prod DB | `seed:demo` |

## Documentation

### Start here

| Document | What it covers |
| --- | --- |
| [Current status](docs/16-current-status.md) | What is shipped vs deferred |
| [Production launch](docs/20-production-launch.md) | Go-live checklist (web + API + native) |
| [Lean phases](docs/lean/README.md) | Learning phases + remaining work |
| [Backend status](docs/lean/backend-status.md) | Server change policy + gap log |
| [API spec](docs/07-api-spec.md) | REST map |
| [Frontend routes](docs/08-routes-frontend.md) | Live routes |
| [Cursor instructions](docs/11-cursor-instructions.md) | How to implement in this repo |
| [Roadmap](docs/12-roadmap.md) | After current gaps |
| [Render deploy](docs/17-render-deploy.md) | Jedan URL (SPA+API) ili odvojeni FE/API na Renderu |
| [Native mobile](docs/18-native-mobile.md) | Expo TypeScript app (`mobile/`) — Paper + NativeWind |

### Reference

| Document | What it covers |
| --- | --- |
| [Product vision](docs/01-product-vision.md) | Problem, users, principles |
| [Architecture](docs/02-architecture.md) | Stack, tenancy |
| [Database](docs/03-database.md) | Collections |
| [Booking engine](docs/04-booking-engine.md) | Slots, capacity |
| [Memberships / payments](docs/05-memberships-physical-payments.md) | Physical payment rules |
| [Tenant website](docs/06-tenant-website.md) | Public site vision |
| [Security](docs/10-security-rules.md) | Auth, isolation |
| [Security maintenance](docs/19-security-maintenance.md) | Ops checklist, hardening, incidents |
| [Limits testing](docs/21-limits-testing.md) | Security + load stress suite |
| [MVP build plan](docs/09-mvp-build-plan.md) | Acceptance |
| [Decisions](docs/13-decisions.md) | ADR |
| [Power Plate example](docs/14-example-powerplate.md) | Pilot scenario |
| [Niches](docs/15-niches-playroom-wellness.md) | Playroom / wellness prep |
