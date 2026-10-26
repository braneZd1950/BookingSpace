# Phase 5 — Frontend: Payments and plans

**Status:** next (partial — plans/renew shipped; dedicated till UI missing)  
**Hypothesis:** Recording cash/card in the studio keeps session counts accurate.  
**Backend:** prefer existing membership-plan and payment endpoints; list gaps in [backend-status](backend-status.md).

## Goal

Owner UI for membership plans, recording a physical payment, and seeing sessions used after bookings.

## Already shipped

| Area | Behavior |
| --- | --- |
| Plans via members | Auto-create / renew membership when adding a member |
| Usage | Remaining sessions shown; consume/restore on book/cancel |
| Payments API | `POST/GET /tenants/:id/payments` |

## Still in scope (this phase)

| Area | Behavior |
| --- | --- |
| Physical payment UI | Record cash / card / transfer explicitly → activates or extends membership |
| Payment history | Owner can see till-style list for the studio |

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

- [ ] Owner can record a physical payment in the UI (method + amount → membership)
- [x] Remaining sessions update after member bookings
- [ ] No Stripe work

