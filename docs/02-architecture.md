# Technical Architecture

> **Lean:** delivery order is [lean/README.md](lean/README.md). **Do not change `server/`** during current frontend work — [lean/backend-status.md](lean/backend-status.md).

## Stack

### Frontend

- React
- Vite
- React Router
- Redux Toolkit
- RTK Query
- SCSS

### Backend

- Node.js
- Express
- REST API
- JWT authentication
- Mongoose

### Database

- MongoDB Atlas

### Infrastructure

- Render or equivalent hosting
- Cloudinary for images
- Email provider later
- Stripe or another payment provider later

## Architecture style

Use a modular monolith. Do not use microservices for the MVP.

## Multi-tenancy

Use one shared MongoDB database with `tenantId` on tenant-owned documents.

Do not create a physical database for every small business in the MVP.

A potential future enterprise option is a dedicated database, dedicated infrastructure, and a custom domain.

## Domain routing

A request to `powerfit.bookingspace.hr` resolves the hostname to the tenant slug `powerfit`.

The frontend loads tenant configuration from the API. The backend resolves tenant context from the authenticated user's role and the requested hostname or tenant.

Never trust a client-supplied `tenantId` for authorization.

## Application domains

- `bookingspace.hr`
- `app.bookingspace.hr`
- `api.bookingspace.hr`
- `*.bookingspace.hr`

## Request flow

Public tenant page:

`hostname -> tenant resolver -> tenant config -> theme/content -> services -> availability`

Authenticated dashboard:

`JWT -> user -> tenant membership/role -> authorized tenant`

Booking:

`user -> tenant -> service -> membership -> availability -> booking`

## Security rules

- Validate JWT on protected endpoints.
- Resolve tenant context server-side.
- Check ownership and role on every tenant mutation.
- Never allow a customer to modify another customer's booking.
- Never allow a business owner to access another tenant's customers.
- Validate all dates and times server-side.
- Use database constraints and indexes to reduce duplicate bookings.
- Store password hashes, never plaintext passwords.

See also [Security and data rules](10-security-rules.md).

## Time handling

For the MVP, store booking date and time with an explicit tenant timezone.

Default for Croatian tenants: `Europe/Zagreb`.

Do not rely on the browser's timezone for business scheduling.
