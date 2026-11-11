# Lean faze — učenje po koracima

Indeks: [../README.md](../README.md) · Status: [../16-current-status.md](../16-current-status.md)

**Build → Measure → Learn.** Faze 1–4 su u proizvodu. Faza 5 (blagajna UI) je glavni preostali fokus.

Backend **nije zamrznut** — vidi [backend-status.md](backend-status.md). Preferiraj najmanju promjenu.

---

## Kako koristiti

| Ako… | Čitaj |
| --- | --- |
| Što je već gotovo | [../16-current-status.md](../16-current-status.md) |
| Blagajna / naplata | [phase-05-frontend.md](phase-05-frontend.md) |
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
| 5 | Naplata i paketi | **Sljedeće** |

Detalji: `phase-01` … `phase-05` u ovom folderu.

---

## Namjerno kasnije

Subdomena, waitlist, Stripe, marketplace, Online UI, igraonica/wellness modeli.

U app-u: `client/src/pages/owner/launchPhases.js` prati statuse. Ruta `/stranica/plan` trenutno nije montirana.
