# Example Pilot — Power Plate

## Business

Example hostname: `powerfit.bookingspace.hr`.

## Service

Power Plate:

```text
Duration: 30 min
Interval: 15 min
Capacity: 6
Cancellation: 15 min
Membership required: yes
```

## Schedule

```text
17:00  4/6
17:15  6/6
17:30  3/6
17:45  5/6
18:00  6/6
18:15  2/6
```

## Customer

Ivan Horvat, user ID `U12345`.

## Physical payment

Ivan pays 120 EUR at the center. Staff records:

```text
Payment ID: PAY-2026-001
Method: CASH
Amount: 120 EUR
```

The system creates:

```text
Membership ID: MEM-2026-001
Plan: 12 training sessions
Valid: 01.09–30.09
Sessions: 12
```

## Booking

Ivan chooses 17:30. The backend checks:

- active membership
- allowed service
- remaining sessions
- capacity
- conflict
- cancellation policy

The booking is created.

## Dashboard

The owner sees today:

```text
17:00  4/6
17:15  6/6
17:30  4/6
17:45  5/6
18:00  6/6
18:15  2/6
```

## Important pilot question

Before finalizing the capacity algorithm, ask the studio:

> If a 30-minute training starts every 15 minutes, can the 18:00 and 18:15 groups physically train at the same time?

If yes, capacity is grouped by start slot (Model A).

If no, implement concurrent resource capacity (Model B).

This question must be answered before production booking logic is locked. See [Booking engine](04-booking-engine.md).
