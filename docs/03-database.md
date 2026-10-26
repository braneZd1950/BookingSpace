# Database Design

> Living reference. Align with Mongoose models under `server/src/models/`. Snapshot: [16-current-status.md](16-current-status.md).

## Collections

### Core MVP

- `users`
- `tenants`
- `tenantUsers`
- `services`
- `membershipPlans`
- `memberships`
- `payments`
- `bookings`

### Shipped beyond original MVP

- `onlineWorkouts`
- `pushSubscriptions`
- `consentEvents`
- `usageEvents`
- `staffNotifications`

### Spec only (not implemented)

- `waitlistEntries` — roadmap later
- Separate `sitePages` collection — **not used**; site lives in `tenants.siteSettings`

## User

```text
_id
name
email
passwordHash
phone
role
passwordResetTokenHash      (select: false)
passwordResetExpires       (select: false)
notificationPrefs          (email + push toggles)
privacyConsent             { accepted, version, acceptedAt, withdrawnAt, source }
createdAt
updatedAt
```

Roles: `CUSTOMER`, `BUSINESS_OWNER`, `STAFF`, `ADMIN`.

Platform admin access: `role === ADMIN` **or** email listed in `ADMIN_EMAILS`.

A user has one permanent `_id`. Do not create a new user every month.

## Tenant

```text
_id
name
slug
niche                         # powerplate | fitness | pilates | yoga | playroom | generic
ownerId
logoUrl
heroImageUrl
description
phone
email
address
timezone
theme                         # colors, font, radius, buttonStyle
siteSettings                  # template, layout, paletteId, visibleSections, gallery, socialLinks, seo
bookingSettings               # capacityModel PER_SLOT|CONCURRENT, workingHours, blockedPeriods
billing                       # plan, status TRIAL|PAID|…, dates, notes
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
role                          # BUSINESS_OWNER | STAFF | CUSTOMER
status                        # e.g. ACTIVE | INVITED | SUSPENDED
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
cancellationWindowMinutes     # when set, drives cancel/session restore window
createdAt
updatedAt
```

Example: Power Plate, duration 30, slot interval 15, capacity 6.

## MembershipPlan

```text
_id
tenantId
name
description
price
validityDays
sessionsIncluded              # null = unlimited
allowedServiceIds
active
createdAt
updatedAt
```

## Membership

```text
_id
tenantId
userId
membershipPlanId
paymentId
code                          # e.g. MEM-2026-000125
validFrom
validUntil
sessionsIncluded
sessionsUsed
status                        # ACTIVE | EXPIRED | CANCELLED | SUSPENDED
createdAt
updatedAt
```

## Payment

Physical ledger. Payment is an accounting record; membership is the right to use services.

```text
_id
tenantId
userId
membershipId
amount
currency
method                        # CASH | CARD_TERMINAL | BANK_TRANSFER | ONLINE
status
paidAt
note
createdBy
createdAt
```

## Booking

```text
_id
tenantId
serviceId
userId
membershipId
staffId                       # optional trainer; required when tenant has trainers
date
startTime
endTime
status                        # CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
source                        # CUSTOMER | STAFF
createdAt
updatedAt
cancelledAt
completedAt
```

## OnlineWorkout

```text
_id
tenantId
title
description
videoUrl / media fields
price / access rules
active
createdAt
updatedAt
```

## PushSubscription

```text
_id
userId
endpoint
keys
createdAt
```

## ConsentEvent

Audit trail for privacy consent accept / withdraw.

## UsageEvent

Platform / studio analytics events.

## StaffNotification

Queued staff notifications (email / push helpers).

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
