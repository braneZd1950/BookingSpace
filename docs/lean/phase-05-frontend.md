# Phase 5 — Frontend: Payments and plans

**Status:** later  
**Hypothesis:** Recording cash/card in the studio keeps session counts accurate.  
**Backend:** frozen by default. Prefer existing membership-plan and payment endpoints; list gaps only.

## Goal

Owner UI for membership plans, recording a physical payment, and seeing sessions used after bookings.

## In scope (frontend)

| Area | Behavior |
| --- | --- |
| Plans | Create/list plans (sessions included, validity) |
| Physical payment | Record cash / card / transfer → activates or extends membership |
| Usage | Show remaining sessions after bookings from Phases 2–3 |

## Out of scope

- Stripe / online checkout
- Automatic renewals / promo codes
- Full accounting export

Historical payment rules: [`../05-memberships-physical-payments.md`](../05-memberships-physical-payments.md).

## Measure

Active memberships in the app match the studio’s till / paper list.

## Learn

If numbers do not match, fix the booking–membership loop before adding gateways.

## Done when

- [ ] Owner can define a plan and record a physical payment in the UI
- [ ] Remaining sessions update after member bookings
- [ ] No Stripe work
