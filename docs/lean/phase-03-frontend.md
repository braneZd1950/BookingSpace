# Phase 3 — Frontend: Member books alone

**Status:** in progress  
**Hypothesis:** A member will book if they see free slots and remaining sessions.  
**Backend:** frozen unless a documented API gap blocks the UI.

## Goal

Customer account can list open slots, book, and cancel within rules — without staff typing every booking.

## In scope (frontend)

| Area | Behavior |
| --- | --- |
| Customer login | Reuse `/login` for `CUSTOMER` role |
| Slot list | Free times + capacity for the member’s studio |
| Book / cancel | Member actions; show membership remaining |
| Empty / blocked states | Clear “membership required” / “full” copy |

## Out of scope

- Cross-tenant marketplace discovery
- Fancy public marketing site (Phase 4)
- Online payments

## Measure

Share of bookings created by the member (not owner) > 40%.

## Learn

If members do not book, simplify the path first — do not add a marketing page.

## Done when

- [x] Member can see availability and book/cancel in the UI (`/s/:slug`, `/s/:slug/termini`)
- [ ] Owner still sees the same bookings in Termini / Kalendar
- [x] No backend work unless listed as a blocker in [backend-status](backend-status.md)
