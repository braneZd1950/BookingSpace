# Cursor Development Instructions

## General rule

Implement the MVP incrementally. Do not rewrite the entire project for every feature.

Before coding a feature:

1. Inspect the existing architecture.
2. Identify affected modules.
3. Propose the smallest implementation.
4. Implement it.
5. Run tests and the build.
6. Report changed files.

## Code principles

- Use clear naming.
- Keep controllers thin.
- Put business rules in services.
- Validate request data.
- Keep tenant authorization centralized.
- Avoid duplicated booking logic.
- Avoid premature abstractions.
- Prefer small reusable components.

## Backend structure

```text
server/src/
  config/
  middleware/
  models/
  routes/
  controllers/
  services/
  validators/
  utils/
  app.js
  server.js
```

## Frontend structure

```text
client/src/
  app/
  api/
  components/
  features/
    auth/
    tenant/
    services/
    booking/
    memberships/
    payments/
  layouts/
  pages/
  hooks/
  store/
  utils/
```

## Important business modules

| Concern | Location |
| --- | --- |
| Booking engine | `services/booking.service.js` |
| Membership logic | `services/membership.service.js` |
| Tenant resolution | `middleware/tenant.middleware.js` |
| Authorization | `middleware/auth.middleware.js` |

## Do not

- add Stripe before it is requested
- add a mobile app
- add microservices
- add AI
- create separate MongoDB databases for tenants
- expose `tenantId` as an authorization mechanism
- put business rules directly in React components
- trust frontend capacity calculations

## Task format

When asking Cursor to implement a feature, use:

```text
Goal:
[one clear goal]

Context:
[relevant module]

Requirements:
- ...

Acceptance criteria:
- ...

Do not:
- ...
```

## Example

```text
Goal:
Implement capacity-based availability for a service.

Context:
Service has durationMinutes, slotIntervalMinutes and capacity.

Requirements:
- Generate start times using slotIntervalMinutes.
- Calculate bookings.
- Return capacity, booked, and available.
- Respect the tenant timezone.
- Do not allow cross-tenant access.

Acceptance criteria:
- 18:00 with 4/6 returns available=2.
- 18:00 with 6/6 returns unavailable.
- The API never trusts a frontend tenantId.

Do not:
- implement online payments
- implement waitlist yet
```
