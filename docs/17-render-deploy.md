# Render — kako spojiti frontend i API

Indeks: [README.md](README.md) · Go-live: [20-production-launch.md](20-production-launch.md) · Env: [22-render-env-checklist.md](22-render-env-checklist.md)

---

## Problem koji često vidiš

Ako otvoriš root URL i dobiješ JSON `{"code":"NOT_FOUND"}`, servis pokreće **samo API**.  
`/api/health` može biti OK, a React još nije servirani.

**Rješenje:** Opcija A (jedan URL) ili Opcija B (odvojeni FE + API). Za pilot → **Opcija A**.

---

## Opcija A (preporučeno) — jedan Web Service

Jedan URL: React na `/`, API na `/api`.

| Polje | Vrijednost |
| --- | --- |
| Root Directory | *prazno* (root repoa) |
| Build Command | `npm run build:render` |
| Start Command | `npm start --prefix server` |

Alternativni build (ako treba eksplicitno):

```bash
npm ci --prefix server && npm ci --prefix client --include=dev && npm run build --prefix client
```

`--include=dev` je bitan: na Renderu je `NODE_ENV=production`, pa bez toga Vite (devDependency) nedostaje.

### Environment (isti servis)

Pun popis: [22-render-env-checklist.md](22-render-env-checklist.md) · predložak: `.env.production.example`

Minimalno: `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `EXPORT_SEAL_SECRET`, `CLIENT_ORIGIN`, `VITE_API_URL`, `VITE_APP_MODE`, `SERVE_CLIENT=true`, SMTP…

```text
CLIENT_ORIGIN=https://VAS-SERVIS.onrender.com
VITE_API_URL=https://VAS-SERVIS.onrender.com/api
```

`VITE_*` se peče u buildu → nakon izmjene: **Clear build cache & deploy**.

API u produkciji neće startati sa slabim tajnama / localhost originom.

---

## Opcija B — dva servisa

1. **API** (Web Service): Root `server`, `CLIENT_ORIGIN` = frontend URL  
2. **Frontend** (Static Site): Root `client`, Publish `dist`, `VITE_API_URL` = API `/api`

Korisnici otvaraju **frontend** URL, ne API URL.

---

## Brza dijagnostika

| Što otvoriš | Očekivano |
| --- | --- |
| `/api/health` | `{"ok":true}` |
| `/` samo API | `NOT_FOUND` JSON |
| `/` nakon Opcije A | React app |
| Network na FE | zahtjevi na `…/api/…`, ne `localhost` |

| Simptom | Fix |
| --- | --- |
| Root = NOT_FOUND | Nema `client/dist` — Opcija A build |
| FE zove localhost | `VITE_API_URL` + clear cache |
| CORS | `CLIENT_ORIGIN` točan HTTPS |
| Spori prvi request | Free tier sleep 30–60 s |
| PDF bez fontova | `client/public/fonts/*.ttf` u `dist/fonts/` |

---

## Lokalno vs produkcija

| | Lokalno | Produkcija |
| --- | --- | --- |
| Podaci | `seed:demo` OK | **Nikad** seed:demo |
| Demo tipke na loginu | samo DEV | skrivene |
| Admin | promote na lokalnoj bazi | promote **jednom** na prod bazi |

Checklist prije pravih korisnika: vidi [20-production-launch.md](20-production-launch.md).
