# REST API Specification

Base: `https://api.bookingspace.hr/api`

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a user |
| POST | `/auth/login` | Return a JWT or session |
| GET | `/auth/me` | Return the current user |

## Tenants

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tenants` | Create a business |
| GET | `/tenants/:slug/public` | Public tenant website configuration |
| PATCH | `/tenants/:tenantId` | Update a tenant |
| PATCH | `/tenants/:tenantId/site` | Update website content and theme |
| POST | `/tenants/:tenantId/images` | Upload an image |

## Services

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/services` | List services |
| POST | `/tenants/:tenantId/services` | Create a service |
| PATCH | `/services/:serviceId` | Update a service |
| DELETE | `/services/:serviceId` | Soft-delete or deactivate a service |

## Availability

`GET /tenants/:tenantId/services/:serviceId/availability`

Parameters: `date`, and an optional start/end range.

Each slot in the response includes `startTime`, `endTime`, `capacity`, `booked`, `available`, and `status`.

## Bookings

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/bookings` | Create a booking. The backend checks authorization and capacity. |
| GET | `/bookings/my` | The customer's bookings |
| GET | `/tenants/:tenantId/bookings` | Business bookings |
| PATCH | `/bookings/:bookingId/cancel` | Cancel a booking |
| PATCH | `/bookings/:bookingId/complete` | Mark completed |
| PATCH | `/bookings/:bookingId/no-show` | Mark no-show |

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
| POST | `/tenants/:tenantId/memberships` | Staff creates a membership after physical payment |
| GET | `/memberships/my` | The customer's memberships |
| PATCH | `/memberships/:id/suspend` | Suspend a membership |

## Payments

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/tenants/:tenantId/payments` | Record a physical payment |
| GET | `/tenants/:tenantId/payments` | List payments |

## Customers

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tenants/:tenantId/customers` | Customers associated with the tenant |
| GET | `/tenants/:tenantId/customers/:userId` | Customer detail |

## Authorization rule

For every tenant endpoint, the authenticated user, the tenant membership or role, and the resource `tenantId` must match.

Never accept a `tenantId` from the frontend as proof of authorization.
