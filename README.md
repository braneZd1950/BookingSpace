# BookingSpace

Multi-tenant SaaS for studio bookings, capacity, memberships, and (later) a simple public studio page.

## Lean launch (active)

Work is split into frontend phases. **Do not change the backend** until a phase doc and [docs/lean/backend-status.md](docs/lean/backend-status.md) unlock it.

| Phase | Focus | Status | Doc |
| --- | --- | --- | --- |
| 1 | Members, settings, read schedule | **Now** | [phase-01](docs/lean/phase-01-frontend.md) |
| 2 | Owner booking loop | Next | [phase-02](docs/lean/phase-02-frontend.md) |
| 3 | Member self-book | Later | [phase-03](docs/lean/phase-03-frontend.md) |
| 4 | Public studio page | Later | [phase-04](docs/lean/phase-04-frontend.md) |
| 5 | Physical payments UI | Later | [phase-05](docs/lean/phase-05-frontend.md) |

Index: [docs/lean/README.md](docs/lean/README.md) · In-app: `/stranica/plan`

### Intentionally deferred

Subdomains, SEO/social editors, website section toggles, color/layout wizard before first booking, Stripe, marketplace.

## MVP learning goal

Prove one real studio will run **members** (Phase 1) and then **bookings** (Phase 2+) in the app instead of WhatsApp / Excel.

Primary long-term metric remains **real completed bookings**; Phase 1 metric is **members entered in-app for a week**.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, RTK Query, SCSS |
| Backend | Node.js, Express, REST, JWT, Mongoose (**frozen for current lean work**) |
| Database | MongoDB Atlas, shared DB + `tenantId` |

## Run locally

```bash
npm run dev
```

Client: `http://localhost:5173` · API: `http://localhost:4000`

## Documentation

### Delivery (prefer these)

| Document | What it covers |
| --- | --- |
| [Lean phases](docs/lean/README.md) | Phase map, frontend-first rules |
| [Phase 1 FE](docs/lean/phase-01-frontend.md) | Current build scope |
| [Backend status](docs/lean/backend-status.md) | Frozen server + gap log |
| [MVP build plan](docs/09-mvp-build-plan.md) | Lean acceptance |
| [Frontend routes](docs/08-routes-frontend.md) | Live routes by phase |
| [Cursor instructions](docs/11-cursor-instructions.md) | How to implement in this repo |
| [Roadmap](docs/12-roadmap.md) | After lean phases |

### Background / reference (read-only while backend is frozen)

| Document | What it covers |
| --- | --- |
| [Product vision](docs/01-product-vision.md) | Problem, users, principles |
| [Architecture](docs/02-architecture.md) | Stack, tenancy |
| [Database](docs/03-database.md) | Collections |
| [Booking engine](docs/04-booking-engine.md) | Slots, capacity |
| [Memberships / payments](docs/05-memberships-physical-payments.md) | Physical payment rules |
| [Tenant website](docs/06-tenant-website.md) | Phase 4+ vision (deferred) |
| [API spec](docs/07-api-spec.md) | REST map |
| [Security](docs/10-security-rules.md) | Auth, isolation |
| [Decisions](docs/13-decisions.md) | ADR including lean amendment |
| [Power Plate example](docs/14-example-powerplate.md) | Pilot scenario |

Start from [Phase 1 frontend](docs/lean/phase-01-frontend.md).
