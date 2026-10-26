# Phase 1 — Frontend: One studio, one day

**Status:** done (implemented in product)  
**Hypothesis:** The owner will manage members and working hours in the app instead of a notebook.  
**Backend:** existing tenant + membership APIs (server may evolve — see [backend-status](backend-status.md)).

## Goal

Ship an operational cockpit for one pilot studio: sign in, set hours/contact, manage members, glance at schedule.

## In scope (as shipped)

| Area | Routes / files | Behavior |
| --- | --- | --- |
| Auth | `/login`, `/register`, password reset | Owner registers or logs in → `/stranica` |
| Shell | `/stranica`, `StudioLayout.jsx` | Termini, Kalendar, Članovi, Analitika, Postavke, Online |
| Home | `/stranica`, `StudioHome` | Site preview / studio home |
| Members | `/stranica/clanovi` | Add, suspend, renew |
| Settings | `/stranica/postavke` | Profile, hours, notifications |

## Out of scope (this phase — historical)

- Owner-created bookings / capacity writes → Phase 2  
- Customer self-booking → Phase 3  
- Forced `/postavljanje` after every login  

## Measure

One real studio enters members here for a full week (not Excel / paper only).

## Learn

If they do not enter members, the problem is value of membership tracking — not landing-page design.

## Done when

- [x] Owner can register / log in and land on `/stranica`
- [x] Owner can set contact + working hours
- [x] Owner can add / suspend / renew members
- [x] Owner can see Termini / Kalendar

## Notes for Cursor

Prefer small UI fixes in `client/`. Reuse `tenantApi` / `membershipApi`. See [../16-current-status.md](../16-current-status.md) for the live surface.
