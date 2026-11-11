# Backend status

Indeks: [../README.md](../README.md) · API: [../07-api-spec.md](../07-api-spec.md) · Status: [../16-current-status.md](../16-current-status.md)

---

## Pravilo

Staro „zamrznuti server” lean pravilo je **ukinuto**. Faze 1–3 i kasnije featurei već su dirali API.

**I dalje preferiraj:**

1. Zapiši rupu u log ispod prije koda  
2. Najmanja površina koja odblokira cilj  
3. Ažuriraj API / DB docs kad dodaš endpoint ili kolekciju  
4. Dodaj/proširi server test za booking, članarine, staff, billing  

---

## Što frontend već koristi

| Domen | Tipično | Napomena |
| --- | --- | --- |
| Auth | register, login, me, lozinka… | Brevo SMTP |
| Tenants | create, mine, public, site, images | `siteSettings` na tenant |
| Services / availability | CRUD + slotovi | `PER_SLOT` / `CONCURRENT` |
| Bookings | create, my, lista, cancel… | opcionalni `staffId` |
| Memberships / plans | lista, create, suspend | kodovi `MEM-…` |
| Payments | lista, zapis | blagajna UI tanka |
| Staff | lista, invite, suspend | treneri |
| Online | katalog, CRUD | FE flag |
| Push / Consent | VAPID, subscribe, consent | |
| Analytics | platform + studio | ADMIN |

---

## Log rupa (API)

| Datum | Područje | Rupa | Odluka |
| --- | --- | --- | --- |
| 2026-10-09 | Kalendar | Bookings bez imena / raspona | implementirano |
| 2026-10-10 | Postavke | Nema PATCH me/password | implementirano |
| 2026-10-10 | Member | memberships/my bez slug-a | implementirano |
| 2026-10-10 | Member | bookings/my bez naziva usluge | implementirano |
| 2026-10-10 | Site | layout/paletteId | implementirano |
| 2026-10-25 | Docs | Spec zaostajao | refresh statusa |
| — | Faza 5 | Filteri / računi uplata | dokumentiraj prije širenja |
| — | Kasnije | Waitlist, hostname | odgođeno |

---

## Testovi

U `server/test/`:

- `mvp-flow.test.js` — studio, članarina, booking, otkaz  
- `studio-ops.test.js` — invite, trener, staff booking  
- `platform-billing.test.js` — trial / paid / warn  

```bash
npm test
npm run test:ci
```
