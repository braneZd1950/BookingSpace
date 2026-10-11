# Frontend routes (current + by phase)

> Delivery order: [lean/README.md](lean/README.md). Backend frozen: [lean/backend-status.md](lean/backend-status.md).

## Public platform (live)

| Route | Page | Phase |
| --- | --- | --- |
| `/` | B2B home: business signup + live slug preview | 1 |
| `/login` | Login | 1 |
| `/register` | Same business signup form | 1 |
| `/postavljanje` | Provider wizard: subdomain, template, layout, colors, content | 1 / 4 |
| `/privatnost`, `/uvjeti`, `/kolacici`, `/kontakt`, `/povratna-informacija` | Legal / contact | 1 |
| `/odrzavanje` | Maintenance status page | 1 |
| `*` (catch-all) | 404 | 1 |

Maintenance mode for the whole app: set `VITE_MAINTENANCE=true` in client env (all routes show održavanje).

## Owner studio (live) — `/stranica`

| Route | Nav label | Page |
| --- | --- | --- |
| `/stranica` | Stranica | Public site preview |
| `/stranica/termini` | Termini | Schedule / bookings |
| `/stranica/kalendar` | Kalendar | Month view |
| `/stranica/clanovi` | Članovi | Members |
| `/stranica/galerija` | Galerija | Photos |
| `/stranica/postavke` | Postavke | Name, contact, hours |

## Member studio (live) — `/s/:slug`

| Route | Nav label | Page |
| --- | --- | --- |
| `/s/:slug` | Početna | Studio overview + membership status |
| `/s/:slug/termini` | Termini | Member book / cancel (ACTIVE membership) |

## Later

| Route idea | Phase |
| --- | --- |
| Real DNS for `{slug}.booking.hr` | 4 |
| Payments / plans | 5 |

## Explicitly not building now

- `*.bookingspace.hr` tenant hostname product  
- `/dashboard/website` style full site editor  
- Cross-tenant discovery UI  

## UX principle (lean)

Keep the owner shell **operational**: members, hours, then bookings. Marketing website comes after the booking loop works.
