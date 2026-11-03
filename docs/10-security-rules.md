# Security and Data Rules

> Still binding. Frontend must not weaken these rules. When changing the API, keep isolation checks intact — [lean/backend-status.md](lean/backend-status.md).
>
> Day-to-day ops checklist: **[19-security-maintenance.md](19-security-maintenance.md)**.

## Authentication

- Hash passwords with a strong password hashing algorithm (bcrypt, 12 rounds).
- JWT access tokens include `sub` + `tokenVersion`; bump version on logout / password change / reset.
- Rate-limit authentication endpoints and booking creation.
- Never log passwords or tokens.
- Never return temporary passwords in API JSON — deliver by email only.
- Prefer short JWT lifetimes in production (`JWT_EXPIRES_IN`, default `24h`).

## Platform admin

- Production: only `User.role` of `ADMIN` or `PLATFORM_STAFF`.
- `ADMIN_EMAILS` is a **non-production bootstrap** (or explicit `ADMIN_EMAIL_BOOTSTRAP=true`). Do not rely on it in prod.
- Super admin for staff management: promote with `server/scripts/promote-super-admin.js`.

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

`GET /tenants/mine` must be **role-scoped**: customers must not receive OIB or full internal booking/admin config.

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

For images and videos:

- validate MIME type **and** magic bytes
- validate size
- restrict formats
- use Cloudinary in production when possible
- never trust filename extensions alone
- never serve membership/paid video files as public static assets — use authenticated / signed media routes

## GDPR basics

The MVP should provide a privacy policy, terms, an account deletion process, reasonable data retention, and export or deletion capability as requirements mature.

Do not collect data that the booking flow does not need.
