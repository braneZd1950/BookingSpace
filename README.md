# BookingSpace

BookingSpace is a multi-tenant SaaS platform for online booking, capacity management, memberships, and simple personalized business websites.

One platform:

- `bookingspace.hr` — public platform
- `app.bookingspace.hr` — authenticated dashboard
- `api.bookingspace.hr` — REST API
- `<tenant>.bookingspace.hr` — personalized business website and booking page

Examples: `powerfit.bookingspace.hr`, `studioana.bookingspace.hr`, `igraonica-zadar.bookingspace.hr`.

## MVP objective

Prove that a real business can:

1. Register.
2. Create its business profile.
3. Choose a niche and template.
4. Configure services and schedules.
5. Publish a personalized website.
6. Register customers.
7. Record memberships paid physically in the center.
8. Let members book available capacity.
9. Manage cancellations.
10. See bookings and remaining sessions.

The first pilot focuses on fitness, Power Plate, and Pilates, because the capacity and interval problem is concrete.

## MVP principle

Do not build a Zoyya clone.

Build a smaller, easier-to-configure booking engine with:

- capacity-based bookings
- flexible slot intervals
- memberships and session packages
- personalized tenant websites
- one user account across the platform
- tenant-specific access rights

## Out of scope for MVP

Online payments, mobile apps, marketplace commissions, advanced CRM, loyalty, AI, complex accounting, SMS, custom domains, white-label, and advanced analytics.

## Success criteria

The MVP is successful when 5–10 real businesses test it and at least one business receives real customer bookings through it.

The primary metric is **real completed bookings**, not registrations.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, RTK Query, SCSS |
| Backend | Node.js, Express, REST, JWT, Mongoose |
| Database | MongoDB Atlas, one shared database with `tenantId` |
| Architecture | Modular monolith |
| Images | Cloudinary (URLs and public IDs only) |
| Hosting | Render or equivalent |

## Documentation

| Document | What it covers |
| --- | --- |
| [Product vision](docs/01-product-vision.md) | Problem, solution, niches, user types |
| [Architecture](docs/02-architecture.md) | Stack, multi-tenancy, domains, request flow, timezones |
| [Database](docs/03-database.md) | Collections, fields, indexes, isolation |
| [Booking engine](docs/04-booking-engine.md) | Slots, capacity models, availability, cancellation, sessions |
| [Memberships and payments](docs/05-memberships-physical-payments.md) | Physical payment flow and membership rules |
| [Tenant website](docs/06-tenant-website.md) | Subdomain sites, templates, theme, SEO |
| [API specification](docs/07-api-spec.md) | REST endpoints and authorization |
| [Routes and frontend](docs/08-routes-frontend.md) | Public, customer, and dashboard UX |
| [MVP build plan](docs/09-mvp-build-plan.md) | Phases 1–10 and the acceptance test |
| [Security rules](docs/10-security-rules.md) | Auth, tenant isolation, privacy, uploads, GDPR |
| [Cursor instructions](docs/11-cursor-instructions.md) | How to implement features in this repo |
| [Roadmap](docs/12-roadmap.md) | What comes after the pilot |
| [Decisions](docs/13-decisions.md) | Architecture decision record |
| [Power Plate example](docs/14-example-powerplate.md) | Worked pilot scenario |

Start implementation from [Phase 1 in the build plan](docs/09-mvp-build-plan.md). Before locking the capacity algorithm, answer the pilot question in the [Power Plate example](docs/14-example-powerplate.md).

## Status

This repository currently holds the MVP specification. Application code follows the phased plan above.
