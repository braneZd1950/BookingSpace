# Database Design

> Read-only reference while backend is frozen: [lean/backend-status.md](lean/backend-status.md).

## Collections

MVP collections:

- `users`
- `tenants`
- `tenantUsers`
- `services`
- `membershipPlans`
- `memberships`
- `payments`
- `bookings`
- `waitlistEntries` (optional, phase 1.5)
- `sitePages` / `siteSettings`

## User

```text
_id
name
email
passwordHash
phone
role
createdAt
updatedAt
```

Roles: `CUSTOMER`, `BUSINESS_OWNER`, `STAFF`, `ADMIN`.

A user has one permanent `_id`. Do not create a new user every month.

## Tenant

```text
_id
name
slug
niche
ownerId
logoUrl
heroImageUrl
description
phone
email
address
timezone
theme
siteSettings
bookingSettings
active
createdAt
updatedAt
```

## TenantUser

Associates a user with a business. One user can work with multiple businesses.

```text
_id
tenantId
userId
role
status
createdAt
```

## Service

```text
_id
tenantId
name
description
durationMinutes
slotIntervalMinutes
capacity
price
active
membershipRequired
createdAt
updatedAt
```

Example: Power Plate, duration 30, slot interval 15, capacity 6.

## MembershipPlan

A reusable product definition.

```text
_id
tenantId
name
description
price
validityDays
sessionsIncluded
allowedServiceIds
active
createdAt
updatedAt
```

Examples: 12 treninga / 30 dana, 20 treninga / 60 dana, unlimited / 30 dana.

## Membership

A customer's actual purchased or assigned membership.

```text
_id
tenantId
userId
membershipPlanId
paymentId
validFrom
validUntil
sessionsIncluded
sessionsUsed
status
createdAt
updatedAt
```

Statuses: `ACTIVE`, `EXPIRED`, `CANCELLED`, `SUSPENDED`.

Membership ID is unique and historical, for example `MEM-2026-000125`. The user's permanent ID does not change.

## Payment

Supports physical payments from day one. Payment is an accounting record. Membership represents the customer's right to use services.

```text
_id
tenantId
userId
membershipId
amount
currency
method
status
paidAt
note
createdBy
createdAt
```

Methods: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`, `ONLINE`.

The MVP primarily needs `CASH` and `CARD_TERMINAL`.

## Booking

```text
_id
tenantId
serviceId
userId
membershipId
date
startTime
endTime
status
source
createdAt
updatedAt
cancelledAt
completedAt
```

Statuses: `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.

Sources: `CUSTOMER`, `STAFF`.

## Indexes

```text
Tenant.slug unique
User.email unique
Service(tenantId, active)
Membership(tenantId, userId, status)
Booking(tenantId, date, startTime, serviceId, status)
TenantUser(tenantId, userId) unique
```

## Data isolation

Every tenant-owned collection must contain `tenantId`. All queries must filter by authorized tenant context.
