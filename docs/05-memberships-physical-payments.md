# Memberships and Physical Payments

> Members UI: [Phase 1](lean/phase-01-frontend.md). Payments UI: [Phase 5](lean/phase-05-frontend.md). Backend frozen: [lean/backend-status.md](lean/backend-status.md).

## Goal

A customer may pay physically at the fitness center while still using BookingSpace for online reservations.

No online payment gateway is required for the MVP.

## Customer identity

The customer has one permanent BookingSpace user, for example `U12345`. Do not create a new user every month.

## Membership identity

Each purchased membership gets its own ID, for example `MEM-2026-000125`.

```text
User: Ivan Horvat
User ID: U12345

Membership: MEM-2026-000125
Plan: 12 treninga
Valid: 01.09.2026 – 30.09.2026
Used: 5
Remaining: 7
```

Next month the membership might be `MEM-2026-000180`. The user remains `U12345`.

## Physical payment flow

1. The customer arrives at the center.
2. Staff searches for the customer by name, email, or phone.
3. If the customer does not exist, staff creates or invites the account.
4. Staff selects a membership plan.
5. Staff records the payment.
6. The system creates the membership.
7. The membership becomes `ACTIVE`.
8. The customer can immediately book eligible services.

## Payment method

MVP methods: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`.

Online payment is optional future functionality.

## Staff dashboard

### Customers

Search, active membership, remaining sessions, and membership expiry.

### New payment

Fields: customer, plan, amount, method, date, note.

### Activate membership

The system automatically creates the payment and the membership.

## Membership access rule

A customer can book when:

```text
membership.status === ACTIVE
AND today <= validUntil
AND sessionsRemaining > 0
AND serviceId is allowed by membership
```

## Example

Membership: Power Plate, 12 sessions, 01.09–30.09.

- Customer books 18:00. Remaining goes from 12 to 11.
- Customer cancels before the cancellation deadline. Remaining goes from 11 to 12.
- Customer completes the training. Remaining stays at 11.
- Customer is `NO_SHOW`. Default remaining goes from 11 to 10.

No-show consumption should be configurable later.

## Membership types

### Fixed sessions

12 sessions / 30 days.

### Unlimited

Unlimited sessions / 30 days.

### Service-specific

A membership can allow only selected services. Example: Power Plate and Group Training, but not Personal Training.
