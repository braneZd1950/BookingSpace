# Render Environment — što staviti i gdje

**Gdje:** Render → tvoj Web Service (Opcija A) → **Environment**  
Sve ključeve stavi na **isti** servis. Ne commitaj `.env` / `.env.production`.

Nakon izmjene bilo kojeg `VITE_*`: **Manual Deploy → Clear build cache & deploy**.

Predložak: [`.env.production.example`](../.env.production.example) · koraci: [20-production-launch.md](20-production-launch.md)

---

## Obavezno

| Key | Vrijednost / napomena |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `4001` (ili Render default — OK ako app čita `PORT`) |
| `SERVE_CLIENT` | `true` |
| `MONGO_URI` | Atlas **prod** connection string |
| `JWT_SECRET` | ≥ 32 znakova (`npm --prefix server run generate:jwt-secret`) |
| `EXPORT_SEAL_SECRET` | druga jaka tajna, **≠** `JWT_SECRET` |
| `JWT_EXPIRES_IN` | npr. `24h` |
| `CLIENT_ORIGIN` | `https://VAS-SERVIS.onrender.com` |
| `VITE_API_URL` | `https://VAS-SERVIS.onrender.com/api` |
| `VITE_APP_MODE` | `production` |
| `ADMIN_EMAIL_BOOTSTRAP` | `false` |
| `ADMIN_EMAILS` | prazno u produkciji (admin = DB role) |

### SMTP (obavezno za invite / reset / mail)

| Key | Primjer |
| --- | --- |
| `EMAIL_FROM` | `anyminutes <noreply@vasa-domena.hr>` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` / `SMTP_PASS` | iz Brevo / SMTP panela |

---

## Preporučeno

| Key | Zašto |
| --- | --- |
| `CLOUDINARY_*` | upload medija |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push |
| `SENTRY_DSN` | **API** (Node project u Sentryju) |
| `VITE_SENTRY_DSN` | **SPA** (React project u Sentryju) — peče se u buildu |

Lokalno već imaš dva različita DSN-a (API vs React) — na Render stavi **iste** kao u lokalnom `.env` (ili nove prod projecte).

---

## Opcionalno

| Key | Zašto |
| --- | --- |
| `GOOGLE_CLIENT_ID` | server verifikacija Google ID tokena |
| `VITE_GOOGLE_CLIENT_ID` | gumb na frontendu (isti client ID) |
| `CLIENT_ORIGINS` | dodatni HTTPS origin(i), zarezom |
| `VITE_SHOW_HOME_PARTNERS` | `false` u produkciji osim ako želiš |

---

## Ne stavljati na Render

`EMAIL_API_KEY`, `GOOGLE_CLIENT_SECRET`, `STRIPE_*`, `ANDROID_APP_*`, `API_ORIGIN`, `APP_ORIGIN`, localhost URL-ovi.

---

## Build / Start (Render Web Service)

| Polje | Vrijednost |
| --- | --- |
| Root Directory | *prazno* |
| Build Command | `npm run build:render` |
| Start Command | `npm start --prefix server` |

---

## Nakon deploya

1. `GET https://VAS/api/health` → `{"ok":true}`
2. `GET https://VAS/` → SPA HTML
3. `npm --prefix server run mail:check` (s istim SMTP)
4. Jednom: registriraj admin mail → `node server/scripts/promote-super-admin.js admin@…`
5. Smoke:

```powershell
$env:SMOKE_API="https://VAS.onrender.com/api"
$env:SMOKE_WEB="https://VAS.onrender.com"
$env:SMOKE_ADMIN_EMAIL="admin@…"
$env:SMOKE_ADMIN_PASS="…"
npm run smoke
```
