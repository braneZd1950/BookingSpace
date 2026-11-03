# Frontend routes

> Source of truth: `client/src/app/App.jsx` (web) and `mobile/app/` (Expo Router). Snapshot: [16-current-status.md](16-current-status.md).

## Public platform (web)

| Route | Page |
| --- | --- |
| `/` | B2B home (anyminutes) |
| `/login` | Login |
| `/register` | Business signup |
| `/preuzmi` | Direct Android app download (APK from site) |
| `/zaboravljena-lozinka` | Forgot password |
| `/nova-lozinka` | Reset password |
| `/postavljanje` | Studio setup wizard (template, layout, colors) |
| `/privatnost`, `/uvjeti`, `/kolacici`, `/kontakt`, `/povratna-informacija` | Legal / contact |
| `/odrzavanje` | Maintenance |
| `*` | 404 |

Maintenance for the whole app: `VITE_MAINTENANCE=true`.  
Crash / unexpected UI error: React `ErrorBoundary` → `ErrorPage` (also `/greska`).  
Native: `EXPO_PUBLIC_MAINTENANCE=true`, Expo Router `+not-found`, `AppErrorBoundary`.

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

Mobile shell **omits** these routes.

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

## Native Expo (`mobile/`)

File-based Expo Router (not React Router). Owner shell `/(app)`, member `/(member)/[slug]`, auth `/(auth)/login`.  
Full route map and build notes: [18-native-mobile.md](18-native-mobile.md).

## Later / deferred

| Idea | Notes |
| --- | --- |
| Real DNS `{slug}.booking.hr` | Display/copy only today |
| Full till / physical-payment UI | Phase 5 (prep route mounted) |

## Explicitly not building as a product now

- Tenant hostname routing as the primary public URL  
- Cross-tenant discovery marketplace  
- Stripe checkout UI  
