# MVP Development Plan

## Phase 1 — Foundation

Build the monorepo structure, React/Vite, Express, MongoDB, environment configuration, error handling, API structure, and basic logging.

## Phase 2 — Authentication

Build registration, login, logout, JWT or session handling, protected routes, and roles.

Test customer, business owner, staff, and admin.

## Phase 3 — Multi-tenancy

Build tenant creation, slug generation, hostname resolver, tenant context, tenant authorization, and the tenant dashboard.

Test that Tenant A cannot access Tenant B data.

## Phase 4 — Personalized website

Build templates, logo, hero image, gallery, description, services, contact, theme, and publish/unpublish.

## Phase 5 — Services and schedules

Build service CRUD, duration, interval, capacity, working hours, and blocked periods.

## Phase 6 — Booking engine

Build availability calculation, capacity, booking creation, cancellation, conflict detection, and booking status.

This is the most important technical phase.

## Phase 7 — Memberships

Build membership plans, customer memberships, validity, session count, allowed services, and active/expired state.

## Phase 8 — Physical payments

Build staff payment entry, cash, card, and bank transfer, membership activation, and payment history.

No online gateway yet.

## Phase 9 — Customer experience

Build the customer account, memberships, bookings, cancellation, and cross-tenant discovery.

## Phase 10 — Pilot

Deploy with one real Power Plate or fitness business. Do not add features before observing real usage.

## MVP acceptance test

A business owner must be able to:

1. Register.
2. Create a business.
3. Choose Fitness or Power Plate.
4. Upload a logo and photos.
5. Create a service.
6. Configure a 30-minute duration.
7. Configure a 15-minute interval.
8. Configure capacity 6.
9. Configure cancellation of 15 minutes.
10. Publish the website.
11. Create or find a customer.
12. Record a physical membership payment.
13. Have the customer log in.
14. Have the customer see available sessions.
15. Have the customer book.
16. See capacity decrease.
17. Have the customer cancel within the allowed period.
18. See capacity return.
19. See the booking as the owner.
20. Confirm membership usage is correct.

## Success metrics

Track:

- number of businesses activated
- number of customers registered
- number of memberships created
- number of bookings
- completed bookings
- cancellations
- repeat bookings
- active businesses after 30 days

Primary MVP metric: **real completed bookings**, not registrations.
