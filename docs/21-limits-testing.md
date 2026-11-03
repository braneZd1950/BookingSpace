# Limits testing (security + load)

Heavy boundary suite — **not** part of everyday `npm test`.

```bash
npm run test:limits
```

## What it hammers

| Area | Checks |
| --- | --- |
| Authz / IDOR | Unauthenticated API, cross-tenant PATCH, cancel someone else's booking, foreign tenant bookings list |
| JWT | Wrong secret, bumped `tokenVersion`, logout revoke |
| Privacy | Member `/tenants/mine` without OIB |
| Uploads | `/uploads/.../video/...` closed |
| Headers | Helmet basics on `/api/health` |
| Payload | JSON over 1 MB rejected |
| Rate limit | Login flood → HTTP 429 |
| Load | 80× health, 40× public tenant, mixed discover storm (p95 budgets) |
| Capacity race | 8 concurrent books on capacity=1 → exactly one `201`, no 5xx |
| SPA | If `client/dist` exists, `/` HTML under 2s |

This suite previously exposed an overbooking race under concurrent load; create-booking now re-checks capacity after insert and rolls back the loser (works even when Mongo transactions fall back on standalone / memory server).

## Notes

- Uses in-memory Mongo (safe for local / CI).
- Auth flood runs **last** so it does not starve earlier registrations.
- Latency budgets are for local Node; CI runners may be slower — adjust thresholds only with evidence.
- For live production smoke (not this suite): `npm run smoke`.

## Related

- [19-security-maintenance.md](19-security-maintenance.md)
- [20-production-launch.md](20-production-launch.md)
