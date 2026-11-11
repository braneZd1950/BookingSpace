# Faza 1 — Jedan studio, jedan dan

**Stanje:** gotovo  
**Hipoteza:** Vlasnik će voditi članove i sate u app-u umjesto bilježnice.  
**Backend:** postojeći tenant + membership API — [backend-status.md](backend-status.md)

---

## Cilj

Operativni kokpit: prijava, sati/kontakt, članovi, pogled na raspored.

## U opsegu (shipped)

| Područje | Rute | Ponašanje |
| --- | --- | --- |
| Auth | `/login`, `/register` | → `/stranica` |
| Shell | `/stranica` | Termini, Kalendar, Članovi, Analitika, Postavke |
| Članovi | `/stranica/clanovi` | Dodaj, suspend, obnovi |
| Postavke | `/stranica/postavke` | Profil, sati, obavijesti |

## Izvan faze (povijesno)

Booking vlasnika → faza 2 · Self-book → faza 3 · forsirani wizard svaki login → ne

## Mjeri / uči

Jedan pravi studio unosi članove tjedan dana.  
Ako ne unosi — problem je vrijednost praćenja članarina, ne landing dizajn.

## Done

- [x] Login → `/stranica`  
- [x] Kontakt + radno vrijeme  
- [x] Članovi add/suspend/renew  
- [x] Termini / Kalendar vidljivi  
