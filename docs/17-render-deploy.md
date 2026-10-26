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
