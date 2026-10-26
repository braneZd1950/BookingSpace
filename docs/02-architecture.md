# Technical Architecture

> Delivery / status: [lean/README.md](lean/README.md), [16-current-status.md](16-current-status.md). Server change policy: [lean/backend-status.md](lean/backend-status.md).

## Stack

### Frontend

- React + Vite
- React Router
- Redux Toolkit + RTK Query
- SCSS
- PWA (manifest + service worker) on web and `client-mobile`

### Backend

- Node.js + Express (modular monolith under `server/src/modules/`)
- REST API + JWT
- Mongoose / MongoDB
- Brevo SMTP for transactional email
- Web Push (VAPID)
- Cloudinary for images (local `uploads/` fallback)

### Database

- MongoDB Atlas — shared DB + `tenantId`

### Infrastructure

- Render or equivalent hosting
- GitHub Actions CI (server tests + client/mobile builds)
- Stripe later (env placeholders only)

## Architecture style

Modular monolith. Do not use microservices for the MVP.

## Multi-tenancy

One shared MongoDB database with `tenantId` on tenant-owned documents.

Public access today is **slug-based** (`/s/:slug` + `GET /tenants/:slug/public`), not hostname resolution. A future option is `powerfit.bookingspace.hr` → slug `powerfit`.

Never trust a client-supplied `tenantId` for authorization.

## Application domains (planned / branded)

Historical / infra names may still say BookingSpace; product UI brand is **anyminutes**.

- Platform marketing / app origin (local `:5173`, mobile `:5174`)
- API (local default `:4001`)
- Future: `*.bookingspace.hr` or product domain equivalents

## Request flow

Public tenant page:

`slug → GET /tenants/:slug/public → theme/content → services → availability`

Authenticated dashboard:

`JWT → user → TenantUser role → authorized tenant`

Booking:

`user → tenant → service → membership → availability → booking` (+ optional `staffId`)

## Security rules

- Validate JWT on protected endpoints.
- Resolve tenant context server-side via `TenantUser` / role checks.
- Check ownership and role on every tenant mutation.
- Platform admin: `ADMIN` role or `ADMIN_EMAILS`.
- Privacy consent recorded before booking flows that need it.

## Mobile

`client-mobile` is a thin Vite app that aliases `@client` → `../client/src`. Shared pages and APIs; mobile-specific layouts and PWA assets only.
