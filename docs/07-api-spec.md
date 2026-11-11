# REST API — mapa

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md) · Backend: [lean/backend-status.md](lean/backend-status.md)

Živi ugovor s frontendom. Kad dodaš endpoint, ažuriraj ovaj file.

**Base (lokalno):** `http://localhost:4001/api`  
**Base (produkcija, Opcija A):** `https://VAS-SERVIS.onrender.com/api`  
**Health:** `GET /api/health`

---

## Auth — `/auth`

| Metoda | Put | Svrha |
| --- | --- | --- |
| POST | `/auth/register` | Registracija (rate limit) |
| POST | `/auth/login` | JWT |
| POST | `/auth/forgot-password` | Reset mail |
| POST | `/auth/reset-password` | Nova lozinka |
| POST | `/auth/logout` | Odjava |
| GET | `/auth/me` | Trenutni korisnik (+ `platformAdmin`) |
| PATCH | `/auth/me` | Profil / obavijesti |
| PATCH | `/auth/password` | Promjena lozinke |

## Studiji — `/tenants`

| Metoda | Put | Svrha |
| --- | --- | --- |
| POST | `/tenants` | Novi studio + owner |
| GET | `/tenants/mine` | Moji studiji |
| GET | `/tenants/:slug/public` | Javna konfiguracija |
| PATCH | `/tenants/:tenantId` | Profil / sati / billing |
| PATCH | `/tenants/:tenantId/site` | Tema, layout, SEO |
| POST | `/tenants/:tenantId/images` | Upload slika |
| DELETE | `/tenants/:tenantId/gallery` | Briši sliku galerije |

## Usluge i dostupnost

| Metoda | Put | Svrha |
| --- | --- | --- |
| GET/POST | `/tenants/:tenantId/services` | Lista / kreiranje |
| PATCH/DELETE | `/services/:serviceId` | Izmjena / deaktivacija |
| GET | `/tenants/:tenantId/services/:serviceId/availability` | Slotovi (`date`…) |

Svaki slot: `startTime`, `endTime`, `capacity`, `booked`, `available`, `status`.

## Rezervacije — `/bookings`

| Metoda | Put | Svrha |
| --- | --- | --- |
| POST | `/bookings` | Nova (kapacitet + članarina; `staffId` ako treba) |
| GET | `/bookings/my` | Moje |
| GET | `/tenants/:tenantId/bookings` | Kalendar studija |
| PATCH | `…/cancel` · `…/complete` · `…/no-show` | Status |

## Planovi, članarine, uplate

| Metoda | Put | Svrha |
| --- | --- | --- |
| GET/POST | `/tenants/:tenantId/membership-plans` | Planovi |
| PATCH | `/membership-plans/:id` | Izmjena plana |
| GET/POST | `/tenants/:tenantId/memberships` | Članarine |
| GET | `/memberships/my` | Moje (uključuje slug) |
| PATCH | `/memberships/:id/suspend` | Suspend |
| POST/GET | `/tenants/:tenantId/payments` | Fizičke uplate |

Metode uplate: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`, `ONLINE` (bez Stripe gatewaysa).

## Članovi i osoblje

| Metoda | Put | Svrha |
| --- | --- | --- |
| GET | `/tenants/:tenantId/customers` | Lista / detalj |
| GET/POST | `/tenants/:tenantId/staff` | Treneri |
| PATCH | `…/staff/:userId/suspend` | Suspend trenera |

## Online, push, privola

| Područje | Putovi | Napomena |
| --- | --- | --- |
| Online | `/tenants/:tenantId/online…` | FE: `ONLINE_ENABLED = false` |
| Push | `/push/vapid-public-key`, subscribe… | Web Push |
| Privola | `POST /consent` | Auth opcionalan |

## Analitika platforme — `/analytics`

Zahtijeva `ADMIN` (ili bootstrap email izvan produkcije).

Sažetak, studiji, korisnici, aktivnost, izvještaji, sustav, billing, warn/invoice, studio analitika.

---

## Pravilo autorizacije

Za svaki tenant endpoint: JWT korisnik + uloga u studiju + `tenantId` resursa moraju se slagati.

**Nikad** ne prihvaćaj `tenantId` iz bodyja kao dokaz ovlasti.

## Još nije u API-ju

| Ideja | Stanje |
| --- | --- |
| Waitlist | Samo roadmap |
| Hostname → tenant | Samo slug |
| Stripe checkout | Odgođeno |
