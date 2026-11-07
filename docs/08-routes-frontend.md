# Frontend routes

> Source of truth: `client/src/app/App.jsx`. Snapshot: [16-current-status.md](16-current-status.md).

## Public platform (web)

| Route | Page |
| --- | --- |
| `/` | B2B home (anyminutes) |
| `/login` | Login |
| `/register` | Business signup |
| `/zaboravljena-lozinka` | Forgot password |
| `/nova-lozinka` | Reset password |
| `/postavljanje` | Studio setup wizard (template, layout, colors) |
| `/privatnost`, `/uvjeti`, `/kolacici`, `/kontakt`, `/povratna-informacija` | Legal / contact |
| `/odrzavanje` | Maintenance |
| `*` | 404 |

Maintenance for the whole app: `VITE_MAINTENANCE=true`.  
Crash / unexpected UI error: React `ErrorBoundary` → `ErrorPage` (also `/greska`).

## Platform admin (web only) — `/analitika`

Gated by `PlatformGate` (`platformAdmin` from `/auth/me`).

| Route | Page |
| --- | --- |
| `/analitika` | Summary |
| `/analitika/studiji` | Studios |
| `/analitika/korisnici` | Users |
| `/analitika/aktivnost` | Activity |
| `/analitika/placanja` | Partner SaaS billing |
| `/analitika/izvjestaji` | Reports |
| `/analitika/sustav` | System |

## Owner studio — `/stranica`

| Route | Nav | Page |
| --- | --- | --- |
| `/stranica` | Početna | Public site preview |
| `/stranica/termini` | Termini | Schedule / owner book & cancel |
| `/stranica/kalendar` | Kalendar | Month view |
| `/stranica/clanovi` | Članovi | Members + trainers |
| `/stranica/analitika` | Analitika | Studio analytics |
| `/stranica/postavke` | Postavke | Profile, hours, notifications |

Held (flags in `client/src/lib/studioFeatures.js`): galerija, online, placanja, plan.

## Member studio — `/s/:slug`

| Route | Nav | Page |
| --- | --- | --- |
| `/s/:slug` | Početna | Studio overview + membership |
| `/s/:slug/termini` | Termini | Member book / cancel |
| `/s/:slug/online` | Online | Catalog (flagged) |
| `/s/:slug/privatnost` | — | Privacy / consent |

## Later / deferred

| Idea | Notes |
| --- | --- |
| Real DNS `{slug}.booking.hr` | Display/copy only today |
| Full till / physical-payment UI | Phase 5 (prep route mounted) |

## Explicitly not building as a product now

- Tenant hostname routing as the primary public URL  
- Cross-tenant discovery marketplace  
- Stripe checkout UI  
