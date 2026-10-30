# Render — povezivanje frontenda i API-ja

## Zašto `https://bookingspaceapp.onrender.com` vraća `NOT_FOUND`

Taj URL trenutno pokreće **samo Express API**.  
`GET /` nije API ruta → `{"message":"Not found","code":"NOT_FOUND"}`.

API je živ: `https://bookingspaceapp.onrender.com/api/health` → `{"ok":true}`.

Imate dva načina da vidi aplikaciju.

---

## Opcija A (preporučeno za jedan URL) — isti servis serviše FE + API

Jedan Web Service: `https://bookingspaceapp.onrender.com` prikazuje React, a `/api` ostaje backend.

### Render → Web Service postavke

| Polje | Vrijednost |
| --- | --- |
| **Root Directory** | *prazno* (root repoja, ne `server`) |
| **Build Command** | vidi dolje |
| **Start Command** | `npm start --prefix server` |

**Build Command** (jedna od ovih):

```bash
npm run build:render
```

ili eksplicitno:

```bash
npm ci --prefix server && npm ci --prefix client --include=dev && npm run build --prefix client
```

`--include=dev` je obavezno: na Renderu je `NODE_ENV=production`, pa obični `npm ci` **ne instalira** `vite` (devDependency) → `vite: not found`.

### Environment (isti servis)

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas URI |
| `JWT_SECRET` | tajni string |
| `CLIENT_ORIGIN` | `https://bookingspaceapp.onrender.com` |
| `VITE_API_URL` | `https://bookingspaceapp.onrender.com/api` |
| `SERVE_CLIENT` | `true` (opcionalno; default `auto` serviše ako postoji `client/dist`) |

Ostalo (SMTP, VAPID, Cloudinary, `ADMIN_EMAILS`) po potrebi.

**Važno:** `VITE_API_URL` mora biti postavljen **prije builda**. Nakon izmjene: **Clear build cache & deploy**.

Kad je build uspio, root URL više ne vraća JSON `NOT_FOUND`, nego HTML aplikacije.

---

## Opcija B — dva servisa (API + Static Site)

### 1) API (postojeći Web Service)

- Root Directory: `server`
- Start: `npm start`
- `CLIENT_ORIGIN=https://VAŠ-FRONTEND.onrender.com`

### 2) Frontend (novi Static Site)

- Root Directory: `client`
- Build: `npm install && npm run build`
- Publish: `dist`
- `VITE_API_URL=https://bookingspaceapp.onrender.com/api`
- Clear build cache & deploy

Aplikaciju otvarate na **frontend** URL-u, ne na API URL-u.

---

## Brza dijagnostika

| Što otvorite | Očekivano |
| --- | --- |
| `/api/health` | `{"ok":true}` |
| `/` (samo API, bez SPA) | `NOT_FOUND` JSON |
| `/` (nakon Opcije A) | React aplikacija |
| Network tab na FE | zahtjevi na `…/api/…`, ne `localhost:4001` |

## Tipične greške

| Simptom | Fix |
| --- | --- |
| Root = `NOT_FOUND` JSON | Nema `client/dist` u deployu — Opcija A build ili Opcija B Static Site |
| FE zove `localhost:4001` | `VITE_API_URL` + clear cache redeploy |
| CORS | `CLIENT_ORIGIN` = točan frontend origin |
| Spori prvi request | Render free sleep — pričekajte 30–60 s |
| PDF prazan / bez fontova | Provjeri da su `client/public/fonts/*.ttf` u repou i da build kopira u `dist/fonts/` |

---

## Lokalno vs produkcija (pravi korisnici)

| | Lokalni razvoj | Render (produkcija) |
| --- | --- | --- |
| Podaci | `npm --prefix server run seed:demo` (Ana/Ivan demo) | Pravi studiji i članovi — **ne** seed:demo |
| Otkrij mock | Samo u Vite DEV | Isključen u produkcijskom buildu |
| Demo tipke na /login | Samo DEV | Sakrivene |
| Izvoz arhive | PDF + Excel + CSV; pečat integriteta (HMAC) | Isto; chip „službena arhiva” |
| Super admin | `promote-super-admin.js` na lokalnoj bazi | Isti script na produkcijskoj bazi **jednom** |

### Checklist prije testiranja s pravim korisnicima

1. Render Environment: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `VITE_API_URL` (puni HTTPS URL), SMTP / Cloudinary / VAPID po potrebi.
2. Build: `npm run build:render` (ili Render Build Command iz Opcije A).
3. Nakon deploya: `/api/health` → `ok`, `/` → SPA, `/fonts/DejaVuSans.ttf` → 200.
4. Kreiraj / promoviraj admina: `node server/scripts/promote-super-admin.js admin@…` (prema produkcijskom `MONGO_URI`).
5. Prijavi se na `/login` → `/admin` / `/analitika` — PDF gumb treba preuzeti **službeni** dokument (bez „TEST” trake).
6. Registriraj test studio kao pravi vlasnik (ne demo seed) i prođi rezervaciju člana.
7. **Nikad** ne pokreći `seed:demo` na produkcijskoj bazi (script to odbija ako je `NODE_ENV=production`).

### Lokalni test PDF-a i demo podataka

```bash
npm run dev
npm --prefix server run seed:demo   # samo lokalni Mongo
# Admin → Preuzmite PDF → datoteka anyminutes-TEST-….pdf
```

Isti predložak i layout koristi produkcija; razlikuju se samo oznaka okruženja i izvor podataka (API).
