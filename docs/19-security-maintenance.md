# Security maintenance (web)

Operational checklist for keeping anyminutes secure without heavy process.
Binding product rules stay in [10-security-rules.md](10-security-rules.md).

## What we protect

| Layer | Threat focus |
| --- | --- |
| API (`server/`) | Tenant isolation, authz, uploads, rate limits |
| Web (`client/`) | XSS → stolen JWT, admin UI gates (server still decides) |

Server is the source of truth. UI role checks are convenience only.

## Hardened controls (current)

1. **Role-scoped `/tenants/mine`** — `CUSTOMER` never receives `oib` or full internal `bookingSettings` (blocked periods, etc.). Owners/staff get the full DTO.
2. **Local online videos** — `/uploads/.../video/...` is not world-readable. Playback goes through `GET /api/tenants/:tenantId/online/:workoutId/media` with Bearer auth or a short-lived `?m=` media token.
3. **JWT revocation** — `User.tokenVersion` is embedded in the access token. Logout, password change, and password reset bump the version so old tokens fail.
4. **`ADMIN_EMAILS` bootstrap** — Outside production (or when `ADMIN_EMAIL_BOOTSTRAP=true`) emails in the list can act as platform admin. In production, leave bootstrap off and use `User.role = ADMIN` / `PLATFORM_STAFF` (see promote script).
5. **Helmet** — baseline security headers (CSP off while SPA is same-origin; CORP `cross-origin` for mobile image loads).
6. **Booking create rate limit** — 60 / 15 min per authenticated user.
7. **Upload magic bytes** — images/videos checked beyond client `mimetype`.
8. **Platform staff invites** — temporary passwords are emailed, not returned in JSON.

## Environment checklist (production)

Copy from [`.env.example`](../.env.example). Minimum:

| Variable | Rule |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random; never commit |
| `JWT_EXPIRES_IN` | Prefer `12h`–`24h` (default `24h`) |
| `ADMIN_EMAILS` | Prefer empty in prod |
| `ADMIN_EMAIL_BOOTSTRAP` | `false` or unset in prod |
| `EXPORT_SEAL_SECRET` | Set separately from `JWT_SECRET` |
| `CLIENT_ORIGIN` / `CLIENT_ORIGINS` | Exact HTTPS origins only |
| `CLOUDINARY_*` | Strongly preferred for images/video in prod |
| SMTP / VAPID | Real credentials; no secrets in `VITE_*` |

Promote a super admin:

```bash
node server/scripts/promote-super-admin.js admin@your-domain.hr
```

Never run `npm --prefix server run seed:demo` against production data.

## Auth & sessions

| Client | Token storage | Notes |
| --- | --- | --- |
| Web | `localStorage` (`bookingspace.token`) | XSS can steal tokens — keep dependencies patched; avoid `dangerouslySetInnerHTML` with user HTML |

Logout must call `POST /api/auth/logout` (revokes JWT). After password change, clients should store the new `token` from the response when present.

**Future hardening (planned, not blocking):** HttpOnly Secure cookies + CSRF for web; refresh-token rotation.

## Tenant isolation (do not regress)

When adding an endpoint:

1. Derive tenant from auth + resource document — never trust body `tenantId` alone for writes.
2. Use `requireMember` / `requireTenantRole` with the smallest role set.
3. Customers see only own bookings/memberships; staff only their tenant.
4. Prefer `403 → 404` on cross-tenant reads to reduce enumeration (existing pattern on services/plans).

Regression coverage: `server/test/member-owner-shell.test.js`, `server/test/security-hardening.test.js`, `server/test/studio-ops.test.js`.

## Public surface (intentional)

These are expected to be reachable without a login:

- `GET /api/health`
- Public tenant profile by slug (no OIB)
- Public availability slots
- Public studio media under `/uploads/:tenantId/*` **except** `/video/`
- Online catalog metadata (video URL only when unlocked)

If you add a new public route, document it here and add a rate limit when it is write-heavy or expensive.

## Release gate

Before deploy:

```bash
npm run test:all
```

Optionally:

```bash
npm --prefix server audit
npm --prefix client audit
npm --prefix mobile audit
```

## Incident quick actions

1. **Stolen JWT** — bump `tokenVersion` (logout or password reset) or rotate `JWT_SECRET` (logs everyone out).
2. **Leaked ADMIN_EMAILS address** — remove from env, set `ADMIN_EMAIL_BOOTSTRAP=false`, promote a real `ADMIN` in DB, rotate JWT if needed.
3. **Suspicious uploads** — disable local uploads (require Cloudinary), wipe `uploads/`, rotate secrets.
4. **Platform staff credential leak** — force password reset / revoke tokens for that user.

## Related docs

- [10-security-rules.md](10-security-rules.md) — product security rules
- [20-production-launch.md](20-production-launch.md) — go-live checklist
- [17-render-deploy.md](17-render-deploy.md) — production env on Render
- [07-api-spec.md](07-api-spec.md) — REST map
