# Faza 2 — Pravi booking (vlasnik)

**Stanje:** gotovo  
**Hipoteza:** Vlasnik će rezervirati i otkazivati u app-u umjesto WhatsAppa.  
**Backend:** booking + availability — [backend-status.md](backend-status.md)

---

## Cilj

Vlasnik na Termini / Kalendaru kreira i otkazuje rezervacije uz kapacitet i članarinu.

## U opsegu (shipped)

| Područje | Ponašanje |
| --- | --- |
| Termini | Odabir dana, slot, član, kreiranje |
| Kapacitet | Prikaz X/Y, blokada kad je puno |
| Otkaz | S povratom termina u roku |
| Trener | `staffId` kad studio ima trenere |

## Izvan faze

Self-book člana → faza 3 · Waitlist · Stripe

## Mjeri / uči

Koliko rezervacija nastaje u app-u vs vanjskim kanalima.

## Done

- [x] Owner create / cancel  
- [x] Kapacitet se poštuje  
- [x] Članarina se troši / vraća ispravno  
