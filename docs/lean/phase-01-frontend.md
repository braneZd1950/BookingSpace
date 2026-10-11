# Phase 1 — Frontend: One studio, one day

**Status:** now  
**Hypothesis:** The owner will manage members and working hours in the app instead of a notebook.  
**Backend:** do not change. Call existing tenant + membership endpoints only.

## Goal

Ship an operational cockpit for one pilot studio: sign in, set hours/contact, manage members, glance at schedule.

## In scope (frontend) — minimal slice (current)

| Area | Routes / files | Behavior |
| --- | --- | --- |
| Auth | `/login`, `/register` | Owner registers or logs in → `/stranica` |
| Shell | `/stranica`, `StudioLayout.jsx` | Nav: Početna only |
| Home | `/stranica`, `StudioHome` | Page title text: **Početna** only |

Website customization, Termini, Kalendar, Članovi, Plan, Postavke UI are **removed from routes** until we add them back one screen at a time.

## Out of scope (this phase)

- Owner-created bookings / capacity writes
- Customer self-booking
- SEO, social networks, section checkboxes, palette/layout editor
- Subdomain display or settings
- Forced `/postavljanje` website guide
- Any `server/` changes

## Measure

One real studio enters members here for a full week (not Excel / paper only).

## Learn

If they do not enter members, the problem is value of membership tracking — not landing-page design.

## Done when (minimal slice)

- [x] Owner can register / log in and land on `/stranica`
- [x] Home shows only the word **Početna**
- [x] No website customization / extra studio routes mounted
- [x] No new backend code

Next screens to re-add one by one: Postavke → Članovi → Termini.

## Notes for Cursor

Prefer small UI fixes in `client/`. Reuse `tenantApi` / `membershipApi`. Do not reintroduce website settings removed for lean MVP.
