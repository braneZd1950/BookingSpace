# Production launch checklist

Go-live guide for anyminutes (web + API + native).  
Local development on localhost stays on `.env` + `npm run dev` — this doc is for **real traffic**.

Related: [17-render-deploy.md](17-render-deploy.md) · [19-security-maintenance.md](19-security-maintenance.md)

---

## 1. Two environments (do not mix)

| | Local (dev) | Production |
| --- | --- | --- |
| Env file | `.env` from `.env.example` | Render Environment / `.env.production` from `.env.production.example` |
| `NODE_ENV` | `development` | `production` |
| Data | local / Atlas **dev** DB + optional `seed:demo` | Atlas **prod** DB — **never** `seed:demo` |
| API | `http://localhost:4001` | HTTPS public URL |
| Web | Vite `:5173` | Built SPA (`client/dist`) served by Express or Static Site |
| Native | `EXPO_PUBLIC_API_URL=http://LAN:4001/api` | HTTPS API URL via EAS secrets |

---

## 2. Pre-flight (repo)

```bash
# Full automated suite
npm run test:all

# Validate production env values (copy template first)
cp .env.production.example .env.production
# edit secrets…
node scripts/check-production-env.js --file .env.production --force

# Optional: production SPA build locally
npm run build:prod
```

Root scripts:

| Script | Purpose |
| --- | --- |
| `npm run test:all` | server + client + mobile + native typecheck |
| `npm run check:prod` | soft check (skips unless prod / `--force`) |
| `npm run build:prod` | same as `build:render` (server ci + client production build) |
| `npm run smoke` | live smoke vs running API (+ optional preview UI) |
| `npm run test:limits` | security boundaries + load / capacity race ([21-limits-testing.md](21-limits-testing.md)) |

---

## 3. Render (recommended: one URL)

Follow **Opcija A** in [17-render-deploy.md](17-render-deploy.md).

| Field | Value |
| --- | --- |
| Root Directory | *(empty — repo root)* |
| Build | `npm run build:render` |
| Start | `npm start --prefix server` |

Minimum Environment keys — see `.env.production.example`.

**Must set before build:** `VITE_API_URL` (full `https://…/api`).  
After changing Vite vars: **Clear build cache & deploy**.

Startup refuses weak/misconfigured production secrets (`productionGuard`).

---

## 4. First admin & mail

```bash
# Against production MONGO_URI only, once:
node server/scripts/promote-super-admin.js admin@vasa-domena.hr
```

Confirm SMTP with:

```bash
npm --prefix server run mail:check
```

Without SMTP: invites / password reset / booking mail will not reach users.

---

## 5. Go-live verification

1. `GET /api/health` → `{"ok":true}`
2. `GET /` → SPA HTML (not JSON `NOT_FOUND`)
3. `GET /fonts/DejaVuSans.ttf` → 200
4. Register a **real** owner (not seed), create studio, service, membership, booking, cancel
5. Member login lands on `/s/:slug`, not owner shell
6. Admin `/analitika` with promoted `ADMIN` — PDF without „TEST” strip
7. CORS: only your HTTPS origins
8. Optional smoke against deployed API:

```bash
$env:SMOKE_API="https://VAS-SERVIS.onrender.com/api"
$env:SMOKE_WEB="https://VAS-SERVIS.onrender.com"
npm run smoke
```

---

## 6. Native (Expo)

Local phone testing keeps LAN IP. Store / production builds:

1. Set EAS secret `EXPO_PUBLIC_API_URL=https://VAS-SERVIS.onrender.com/api`
2. `eas build --profile production`
3. Never ship `127.0.0.1` / LAN in a store binary

Details: [18-native-mobile.md](18-native-mobile.md)

---

## 7. Hard no’s in production

- `npm --prefix server run seed:demo`
- `ADMIN_EMAIL_BOOTSTRAP=true`
- `JWT_SECRET` / `EXPORT_SEAL_SECRET` placeholders or identical values
- `CLIENT_ORIGIN=http://localhost:…`
- `VITE_API_URL` pointing at localhost inside the client build
- Committing `.env`, `.env.production`, or real secrets

---

## 8. After launch (ops)

- Rotate secrets if leaked; logout bumps `tokenVersion`
- Prefer Cloudinary for media
- Watch Render logs for `[mail]` / `[security]` warnings
- Keep CI green on `main` before deploy
