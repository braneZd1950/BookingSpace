# Booking Engine Specification

This is the most important technical component of the MVP.

## Core parameters

Each service can define:

- `durationMinutes`
- `slotIntervalMinutes`
- `capacity`
- cancellation window
- membership requirement

Example:

```text
Duration: 30 minutes
Interval: 15 minutes
Capacity: 6
Cancellation window: 15 minutes
```

Generated starts: 18:00, 18:15, 18:30, 18:45.

## Critical capacity decision

There are two possible business models.

### Model A — capacity per start slot

An 18:00 session has 6 seats and a separate 18:15 session has another 6 seats, even if durations overlap.

Use this only when the business explicitly confirms it has enough physical capacity, staff, and equipment for concurrent sessions.

### Model B — concurrent resource capacity

Each booking occupies a resource from start to end.

Example: 18:00–18:30 uses 1 capacity unit. 18:15–18:45 overlaps it and therefore consumes capacity at 18:15–18:30.

This is safer and more generic.

For the MVP, implement a configurable capacity model, but start with Model A only if the pilot business confirms that interpretation. See the question in the [Power Plate example](14-example-powerplate.md).

## Availability

A slot is bookable when:

1. The service is active.
2. The tenant is active.
3. The date is within business hours.
4. The current time is before the booking start.
5. The customer has the required active membership.
6. The membership has remaining sessions.
7. The slot has capacity.
8. The customer does not already have a conflicting booking.

## Capacity example

Capacity is 6. Bookings at 18:00 are 4/6, so `available = 2`.

UI: `18:00 — 4/6`. When the slot is `6/6`, show `POPUNJENO`.

## Cancellation

Each service can have `cancellationWindowMinutes`. Example: 15 minutes.

For an 18:00 booking, cancellation is allowed until 17:45. After 17:45 the customer cannot cancel online. Staff can have permission to override this rule.

## Membership consumption

Do not blindly increment sessions when a booking is created.

Recommended MVP logic:

- `CONFIRMED` — the reservation holds one session entitlement
- `CANCELLED` within the allowed window — the entitlement is restored
- `COMPLETED` — the session remains consumed
- `NO_SHOW` — configurable; default is to consume one session

To avoid double counting, implement a clear session ledger or an atomic counter update.

For a simple MVP, maintain `sessionsIncluded` and `sessionsUsed`, and update them in one transaction where possible.

## Double booking protection

Booking creation must be atomic. The backend must re-check membership, capacity, and conflicting bookings immediately before creating the booking.

Never trust availability previously displayed in the browser.

## Future waitlist

When a slot is full, offer `JOIN WAITLIST`. On cancellation:

1. Find the earliest waitlist entry.
2. Notify the customer.
3. Optionally reserve temporarily.
4. Expire the offer after a configured time.

Waitlist can be phase 1.5.
