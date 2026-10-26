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
| Mobile | `client-mobile` PWA shell; reuses `client/src` |
| Backend | Node.js, Express, REST, JWT, Mongoose |
| Database | MongoDB Atlas, shared DB + `tenantId` |
| CI | GitHub Actions — server tests + client/mobile builds |

## Run locally

```bash
npm run dev          # web :5173 + API
npm run dev:mobile   # mobile :5174 + API
npm test             # server tests
```

| Service | URL |
| --- | --- |
| Web | `http://localhost:5173` |
| Mobile | `http://localhost:5174` |
| API | `http://localhost:4001/api` (default; see `server/.env.example`) |

Copy env from `.env.example` and `server/.env.example`. Prefer secrets in `server/.env`.

## Documentation

### Start here

| Document | What it covers |
| --- | --- |
| [Current status](docs/16-current-status.md) | What is shipped vs deferred |
| [Lean phases](docs/lean/README.md) | Learning phases + remaining work |
| [Backend status](docs/lean/backend-status.md) | Server change policy + gap log |
| [API spec](docs/07-api-spec.md) | REST map |
| [Frontend routes](docs/08-routes-frontend.md) | Live routes |
| [Cursor instructions](docs/11-cursor-instructions.md) | How to implement in this repo |
| [Roadmap](docs/12-roadmap.md) | After current gaps |
| [Render deploy](docs/17-render-deploy.md) | Jedan URL (SPA+API) ili odvojeni FE/API na Renderu |

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
| [MVP build plan](docs/09-mvp-build-plan.md) | Acceptance |
| [Decisions](docs/13-decisions.md) | ADR |
| [Power Plate example](docs/14-example-powerplate.md) | Pilot scenario |
| [Niches](docs/15-niches-playroom-wellness.md) | Playroom / wellness prep |
