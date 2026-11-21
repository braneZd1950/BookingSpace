# Blizari

Multi-tenant SaaS za rezervacije termina, kapacitet, članarine i jednostavnu javnu stranicu studija — web + native (Expo).

*(Repo / npm / Expo slug mogu još zvati `bookingspace` / `anyminutes` — u UI-u je brand **Blizari**. Android package: `hr.anyminutes.app`.)*

---

## Status (demo / pilot)

Osnovni booking loop (vlasnik + član) je **gotov** na webu i mobitelu, uz trenere, PWA/push, privolu, platform admin, occupancy kalendar, member settings i EAS preview APK.

| Područje | Stanje |
| --- | --- |
| Auth, studiji, usluge, radno vrijeme | Gotovo |
| Vlasnik — Termini / Kalendar / Članovi / Usluge | Gotovo |
| Član — self-book, kalendar, postavke | Gotovo |
| Site wizard + preview + Discover | Gotovo (pravi DNS kasnije) |
| Staff / treneri, Web Push, privola | Gotovo |
| Platform admin `/analitika` | Gotovo |
| Native mobile (Expo) M1–M3 | Gotovo (pilot) |
| Online treninzi | U kodu, **UI flag off** |
| Blagajna / fizička naplata UI | **Nije u demu** (API postoji) |
| Stripe / waitlist / subdomena | Nije krenulo |

Detaljno: **[docs/16-current-status.md](docs/16-current-status.md)**  
Cijeli indeks (HR): **[docs/README.md](docs/README.md)**  
Test matrica: **[docs/23-e2e-deep-security.md](docs/23-e2e-deep-security.md)**

---

## Stack

| Sloj | Izbor |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, RTK Query, SCSS |
| Mobile | Expo / React Native |
| Backend | Node.js, Express, REST, JWT, Mongoose |
| Baza | MongoDB Atlas, shared DB + `tenantId` |
| CI | GitHub Actions — testovi, web build, Playwright e2e |

---

## Lokalno

```bash
cp .env.example .env   # jedan .env za API + Vite (samo VITE_* ide u browser)
npm run dev            # web :5173 + API
npm test
```

| Servis | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:4001/api |

---

## Testiranje (pilot)

```bash
npm test
npm run test:security
npm run test:e2e:deep
npm run test:mobile:all
npm run test:limits
# Maestro (uređaj + APK + mreža):
npm run test:mobile:e2e
```

---

## Produkcija

| Korak | Dokument / naredba |
| --- | --- |
| Korak po korak | **[docs/20-production-launch.md](docs/20-production-launch.md)** |
| Env na Renderu | **[docs/22-render-env-checklist.md](docs/22-render-env-checklist.md)** |
| Predložak | `.env.production.example` |
| Provjera tajni | `node scripts/check-production-env.js --file .env.production --force` |
| Build | `npm run build:prod` |
| Deploy | [docs/17-render-deploy.md](docs/17-render-deploy.md) |
| Smoke | `SMOKE_API=https://…/api npm run smoke` |
| Limits | `npm run test:limits` → [docs/21](docs/21-limits-testing.md) |
| Zabranjeno na prod DB | `seed:demo` |

---

## Dokumentacija

Sve je na **hrvatskom**, grupirano po ulozi: **[docs/README.md](docs/README.md)**

| Dokument | Zašto |
| --- | --- |
| [docs/README.md](docs/README.md) | Indeks — počni ovdje |
| [Status](docs/16-current-status.md) | Što je shipped (demo/pilot) |
| [Go-live](docs/20-production-launch.md) | Prva produkcija |
| [Env checklist](docs/22-render-env-checklist.md) | Render Environment |
| [Test matrica](docs/23-e2e-deep-security.md) | Unit / e2e / security / Maestro |
| [Lean faze](docs/lean/README.md) | Faze 1–5 |
| [API](docs/07-api-spec.md) | REST mapa |
| [Rute](docs/08-routes-frontend.md) | Frontend rute |
| [Mobile docs](mobile/docs/README.md) | React Native / Expo |

---

## Lean faze

| Faza | Fokus | Stanje |
| --- | --- | --- |
| 1 | Članovi, postavke, raspored | **Gotovo** |
| 2 | Booking (vlasnik) | **Gotovo** |
| 3 | Self-book (član) | **Gotovo** |
| 4 | Javna stranica / wizard | **Uglavnom** |
| 5 | Blagajna UI | **Van dema** |

Detalji: [docs/lean/README.md](docs/lean/README.md)
