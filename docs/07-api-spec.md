# REST API Specification

> Living contract for the frontend. When you add endpoints, update this file and [lean/backend-status.md](lean/backend-status.md). Snapshot: [16-current-status.md](16-current-status.md).

Base: `https://api.bookingspace.hr/api` (local default: `http://localhost:4001/api`)

Health: `GET /api/health`

## Authentication — `/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a user (rate-limited) |
| POST | `/auth/login` | Return a JWT |
| POST | `/auth/forgot-password` | Start password reset email |
| POST | `/auth/reset-password` | Apply reset token |
| POST | `/auth/logout` | Logout (auth) |
| GET | `/auth/me` | Current user (+ `platformAdmin` when applicable) |
| PATCH | `/auth/me` | Profile / notification prefs |
| PATCH | `/auth/password` | Change password |

## Tenants — `/tenants`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tenants` | Create a business + owner `TenantUser` |
| GET | `/tenants/mine` | Actor’s tenants |
| GET | `/tenants/:slug/public` | Public site config (+ trainers) |
| PATCH | `/tenants/:tenantId` | Update profile / hours / billing-related fields |
| PATCH | `/tenants/:tenantId/site` | Theme, layout, SEO, gallery |
| POST | `/tenants/:tenantId/images` | Upload logo / hero / gallery (Cloudinary or local) |

## Services

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/services` | List services |
| POST | `/tenants/:tenantId/services` | Create a service |
| PATCH | `/services/:serviceId` | Update a service |
| DELETE | `/services/:serviceId` | Soft-delete or deactivate |

## Availability

`GET /tenants/:tenantId/services/:serviceId/availability`

Parameters: `date`, and an optional start/end range.

Each slot includes `startTime`, `endTime`, `capacity`, `booked`, `available`, and `status`.

## Bookings

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/bookings` | Create booking (capacity + membership; optional `staffId`) |
| GET | `/bookings/my` | Customer bookings |
| GET | `/tenants/:tenantId/bookings` | Studio calendar (`dateFrom` / `dateTo`) |
| PATCH | `/bookings/:bookingId/cancel` | Cancel (+ session restore in window) |
| PATCH | `/bookings/:bookingId/complete` | Mark completed |
| PATCH | `/bookings/:bookingId/no-show` | Mark no-show |

If the tenant has bookable staff, `staffId` is required on create.

## Membership plans

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/membership-plans` | List plans |
| POST | `/tenants/:tenantId/membership-plans` | Create a plan |
| PATCH | `/membership-plans/:id` | Update a plan |

## Memberships

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/memberships` | List tenant memberships |
| POST | `/tenants/:tenantId/memberships` | Create after physical payment |
| GET | `/memberships/my` | Customer memberships (includes tenant slug) |
| PATCH | `/memberships/:id/suspend` | Suspend a membership |

## Payments

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tenants/:tenantId/payments` | Record a physical payment |
| GET | `/tenants/:tenantId/payments` | List payments |

Methods: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`, `ONLINE` (enum; no Stripe gateway in MVP).

## Customers

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/customers` | Customers for the tenant |
| GET | `/tenants/:tenantId/customers/:userId` | Customer detail |

## Staff / trainers — `/tenants/:tenantId/staff`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/staff` | List bookable staff |
| POST | `/tenants/:tenantId/staff` | Owner invites / creates trainer |
| PATCH | `/tenants/:tenantId/staff/:userId/suspend` | Suspend staff link |

## Online workouts — `/tenants/:tenantId/online`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/online/catalog` | Member / public catalog (optional auth) |
| GET | `/tenants/:tenantId/online` | Staff list |
| POST | `/tenants/:tenantId/online/upload` | Video upload |
| POST | `/tenants/:tenantId/online` | Create workout |
| PATCH | `/tenants/:tenantId/online/:workoutId` | Update |
| DELETE | `/tenants/:tenantId/online/:workoutId` | Remove |

Frontend ships with `ONLINE_ENABLED = false` until product turns it on.

## Push — `/push`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/push/vapid-public-key` | Public VAPID key |
| GET | `/push/subscriptions` | Current user’s subscriptions |
| POST | `/push/subscribe` | Subscribe |
| POST | `/push/unsubscribe` | Unsubscribe |

## Consent — `/consent`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/consent` | Record privacy consent (optional auth) |

## Analytics / platform admin — `/analytics`

Platform routes require `role === ADMIN` or email in `ADMIN_EMAILS`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/analytics/events` | Track usage (rate-limited) |
| GET | `/analytics/platform` | Platform summary |
| GET | `/analytics/platform/studios` | Studios |
| GET | `/analytics/platform/users` | Users |
| GET | `/analytics/platform/activity` | Activity |
| GET | `/analytics/platform/reports` | Reports |
| GET | `/analytics/platform/system` | System health flags |
| GET | `/analytics/platform/billing` | SaaS billing list |
| PATCH | `/analytics/platform/billing/:tenantId` | Update tenant billing |
| POST | `/analytics/platform/billing/:tenantId/warn` | Warning email |
| POST | `/analytics/platform/billing/:tenantId/invoice` | Invoice email |
| GET | `/analytics/tenants/:tenantId` | Studio analytics |

## Authorization rule

For every tenant endpoint, the authenticated user, the tenant membership or role, and the resource `tenantId` must match.

Never accept a `tenantId` from the frontend as proof of authorization.

## Not implemented (documented elsewhere)

| Idea | Status |
| --- | --- |
| Waitlist endpoints | Spec / roadmap only |
| Hostname → tenant resolver | Slug-based public routes only |
| Stripe checkout | Deferred |
