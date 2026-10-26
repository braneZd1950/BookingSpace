# Phase 2 — Frontend: Real booking (owner)

**Status:** done (implemented in product)  
**Hypothesis:** The owner will fill sessions and see who is coming without WhatsApp / phone.  
**Backend:** booking / session / service APIs in use; document new gaps in [backend-status](backend-status.md).

## Goal

Close the owner booking loop in the UI: create or pick a session, book a member, cancel and free capacity.

## In scope (frontend)

| Area | Likely routes | Behavior |
| --- | --- | --- |
| Services / sessions | under `/stranica/termini` (or sub-routes) | Show capacity, duration, interval from existing data |
| Owner book | Termini detail / modal | Pick member → create booking |
| Cancel | Same surfaces | Cancel → capacity returns in UI |
| Today view | Početna or Termini | Who is booked today |

## Out of scope

- Customer self-serve booking (Phase 3)
- Public marketing site polish (Phase 4)
- Payment recording UI (Phase 5)
- Backend redesign of the booking engine

## Measure

≥ 10 real bookings in one week at the pilot studio.

## Learn

If bookings stay on WhatsApp, the loop is not closed — do not add website chrome.

## Done when

- [x] Owner can create a booking for an existing member from the UI
- [x] Occupancy updates after book / cancel
- [x] Happy path works (gaps listed in [backend-status](backend-status.md) when needed)

## Frontend checklist (when starting this phase)

1. Inventory existing client APIs for bookings/sessions/services.
2. Wire Termini from read-only → actionable.
3. Keep copy in Croatian; keep settings lean (no website editor).
