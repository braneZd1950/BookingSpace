# Security and Data Rules

> Still binding. Frontend must not weaken these rules. Backend changes stay frozen: [lean/backend-status.md](lean/backend-status.md).

## Authentication

- Hash passwords with a strong password hashing algorithm.
- Use secure JWT or session practices.
- Rate-limit authentication endpoints.
- Never log passwords or tokens.

## Tenant isolation

Every tenant-owned document must contain `tenantId`.

The server must derive the allowed tenant from authenticated context.

Incorrect: `PATCH /services/:id` with body `{ tenantId: "some-other-tenant" }` and trusting it.

Correct:

```text
JWT user
  -> authorized tenant
  -> service tenantId must match
```

## Customer privacy

Customers should only see their own bookings, memberships, and payments where appropriate.

Business staff can see customers belonging to their tenant. A customer must never access another customer's personal data.

## Booking security

The server must recalculate availability before creating a booking.

Never trust frontend `available`, frontend capacity, frontend membership status, or frontend price.

## Price security

When staff creates a payment or membership, validate the plan and price server-side.

If a historical price needs to be preserved, store the actual paid amount in the payment or membership record.

## Audit fields

Important mutations should have `createdAt`, `updatedAt`, and `createdBy` where appropriate.

A future version can include a full audit log.

## Upload security

For images:

- validate MIME type
- validate size
- restrict formats
- use Cloudinary transformations
- never trust filename extensions alone

## GDPR basics

The MVP should provide a privacy policy, terms, an account deletion process, reasonable data retention, and export or deletion capability as requirements mature.

Do not collect data that the booking flow does not need.
