# Lean faze — učenje po koracima

Indeks: [../README.md](../README.md) · Status: [../16-current-status.md](../16-current-status.md)

**Build → Measure → Learn.** Faze 1–4 su u proizvodu (demo/pilot).  
**Faza 5 (blagajna UI) nije dio ovog dema** — API postoji, UI čeka nakon potvrđenog booking pilota.

Backend **nije zamrznut** — vidi [backend-status.md](backend-status.md). Preferiraj najmanju promjenu.

---

## Kako koristiti

| Ako… | Čitaj |
| --- | --- |
| Što je već gotovo | [../16-current-status.md](../16-current-status.md) |
| Blagajna / naplata (kasnije) | [phase-05-frontend.md](phase-05-frontend.md) |
| Booking UI | [phase-02](phase-02-frontend.md) / [phase-03](phase-03-frontend.md) |
| Javna stranica | [phase-04-frontend.md](phase-04-frontend.md) |
| Diram `server/` | [backend-status.md](backend-status.md) + [../07-api-spec.md](../07-api-spec.md) |

---

## Mapa faza

| Faza | Naslov | Stanje |
| --- | --- | --- |
| 1 | Jedan studio, jedan dan | **Gotovo** |
| 2 | Booking (vlasnik) | **Gotovo** |
| 3 | Član rezervira sam | **Gotovo** |
| 4 | Javna stranica | **Uglavnom** (DNS kasnije) |
| 5 | Naplata i paketi (blagajna UI) | **Van dema** — nakon pilota |

Detalji: `phase-01` … `phase-05` u ovom folderu.

---

## Namjerno kasnije

Blagajna UI, Stripe, subdomena, waitlist, marketplace, Online UI, igraonica/wellness modeli.

U app-u: `client/src/pages/owner/launchPhases.js` prati statuse. Ruta `/stranica/plan` trenutno nije montirana (flag).
