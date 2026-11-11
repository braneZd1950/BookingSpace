# API i autentikacija (mobile)

Indeks: [README.md](README.md) · Potpuni REST: [../../docs/07-api-spec.md](../../docs/07-api-spec.md)

**Kod:** `mobile/src/api/` — `fetch` klijent prema istom Express API-ju (`import { login, getMe } from '../api'`).

Mobile **ne izmišlja** nove endpointе dok web ugovor ne pokrije potrebu. Ako fali nešto — zabilježi u [../../docs/lean/backend-status.md](../../docs/lean/backend-status.md).

---

## Base URL

| Okolina | Primjer |
| --- | --- |
| Emulator / Expo web | `http://localhost:4001/api` |
| Fizički telefon | `http://192.168.x.x:4001/api` |
| Produkcija | `https://VAS-SERVIS.onrender.com/api` |

Health: `GET /health` → `{ ok: true }`.

---

## Auth tok

```text
1. POST /auth/login { email, password }
2. Spremi access token (SecureStore)
3. Authorization: Bearer <token> na svaki zaštićeni poziv
4. GET /auth/me → user + platformAdmin?
5. POST /auth/logout + obriši token
```

Ostalo: `POST /auth/register`, `forgot-password`, `reset-password`, `PATCH /auth/me`, `PATCH /auth/password`.

`tokenVersion`: ako server vrati 401 nakon logout/promjene lozinke — obriši token i vrati na Login.

---

## Najvažniji pozivi po fazi

### M1 — shell

| Poziv | Zašto |
| --- | --- |
| `POST /auth/login` | ulaz |
| `GET /auth/me` | tko sam |
| `GET /tenants/mine` | vlasnikovi studiji |
| `GET /memberships/my` | članovi studiji + slug |

### M2 — član termini

| Poziv | Zašto |
| --- | --- |
| `GET /tenants/:slug/public` | studio + usluge |
| `GET …/services/:id/availability` | slotovi |
| `POST /bookings` | rezervacija |
| `GET /bookings/my` | moje |
| `PATCH /bookings/:id/cancel` | otkaz |
| `POST /consent` | privola |

### M3 — vlasnik

| Poziv | Zašto |
| --- | --- |
| `GET /tenants/:id/bookings` | kalendar / dan |
| `POST /bookings` | book za člana |
| `GET /tenants/:id/memberships` | članovi |
| `POST /tenants/:id/memberships` | dodaj / obnovi |
| `GET /tenants/:id/staff` | treneri (ako treba `staffId`) |

### M4 — push

| Poziv | Zašto |
| --- | --- |
| `GET /push/vapid-public-key` | web-push stil (web) |
| Native push | može zahtijevati **novi** server endpoint (FCM/APNs) — dokumentiraj prije implementacije |

Web Push (VAPID) ≠ Expo push 1:1. Za pravi native push planiraj malu backend dopunu u M4.

---

## Headeri

```http
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: application/json
```

---

## Pogreške

Koristi `code` / `message` iz API-ja. Tipično:

| Situacija | Ponašanje u UI |
| --- | --- |
| 401 | odjava → Login |
| kapacitet pun | poruka POPUNJENO |
| MEMBERSHIP_REQUIRED | uputi na članarinu / kontakt studija |
| nema privole | Consent ekran |

---

## Testiranje API-ja bez UI-ja

```bash
npm run smoke
npm run test:mobile-load
```

`test:mobile-load` simulira Expo-like promet prema API-ju.
