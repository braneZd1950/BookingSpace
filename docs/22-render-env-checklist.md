# Render Environment — checklist

Indeks: [README.md](README.md) · Go-live: [20-production-launch.md](20-production-launch.md)

**Gdje:** Render → Web Service (Opcija A) → **Environment**  
Sve na **isti** servis. Ne commitaj `.env` / `.env.production`.

Nakon izmjene bilo kojeg `VITE_*`: **Manual Deploy → Clear build cache & deploy**.

Predložak: [`.env.production.example`](../.env.production.example)

---

## Obavezno

| Key | Napomena |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `4001` ili Render default |
| `SERVE_CLIENT` | `true` |
| `MONGO_URI` | Atlas **prod** |
| `JWT_SECRET` | ≥ 32 znaka |
| `EXPORT_SEAL_SECRET` | druga tajna ≠ JWT |
| `JWT_EXPIRES_IN` | npr. `24h` |
| `CLIENT_ORIGIN` | `https://bookingspaceapp.onrender.com` |
| `VITE_API_URL` | `https://bookingspaceapp.onrender.com/api` |
| `VITE_APP_MODE` | `production` |
| `ADMIN_EMAIL_BOOTSTRAP` | `false` |
| `ADMIN_EMAILS` | prazno u produkciji |

### SMTP (obavezno za mail)

| Key | Primjer |
| --- | --- |
| `EMAIL_FROM` | `anyminutes <noreply@…>` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` / `SMTP_PASS` | iz panela |

---

## Preporučeno

| Key | Zašto |
| --- | --- |
| `CLOUDINARY_*` | mediji |
| `VAPID_*` + `VAPID_SUBJECT` | Web Push |
| `SENTRY_DSN` | API (Node project) |
| `VITE_SENTRY_DSN` | SPA (React project) — peče se u buildu |

---

## Opcionalno

`GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID`, `CLIENT_ORIGINS`, `VITE_SHOW_HOME_PARTNERS`

### Gumb „Preuzmite aplikaciju” (Home)

Trenutno **web distribucija** (bez storeova). U produkciji gumb vodi na `/mobile`.

| Key | Zašto |
| --- | --- |
| `VITE_MOBILE_WEB_URL` | (opcionalno) direktni Expo web host — CTA „Otvorite mobilnu aplikaciju” |
| `VITE_MOBILE_APP_URL` | (opcionalno) override Home gumba; default `/mobile` |

Nakon izmjene `VITE_*`: **Clear build cache & deploy**.

## Ne stavljati na Render

`EMAIL_API_KEY`, `GOOGLE_CLIENT_SECRET`, `STRIPE_*`, `ANDROID_APP_*`, `API_ORIGIN`, `APP_ORIGIN`, localhost URL-ovi.

---

## Build / Start

| Polje | Vrijednost |
| --- | --- |
| Root Directory | *prazno* |
| Build | `npm run build:render` |
| Start | `npm start --prefix server` |

## Nakon deploya

1. `GET …/api/health` → ok  
2. `GET …/` → SPA  
3. `npm --prefix server run mail:check`  
4. `node server/scripts/promote-super-admin.js admin@…` (jednom)  
5. Smoke:

```powershell
$env:SMOKE_API="https://bookingspaceapp.onrender.com/api"
$env:SMOKE_WEB="https://bookingspaceapp.onrender.com"
npm run smoke
```
