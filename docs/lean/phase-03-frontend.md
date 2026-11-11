# Faza 3 — Član rezervira sam

**Stanje:** gotovo  
**Hipoteza:** Član s aktivnom članarinom sam rezervira i otkazuje.  
**Backend:** isti booking API + privola — [backend-status.md](backend-status.md)

---

## Cilj

`/s/:slug/termini` — self-book / otkaz uz ACTIVE membership i privolu.

## U opsegu (shipped)

| Područje | Ponašanje |
| --- | --- |
| Member shell | `/s/:slug` početna + termini |
| Book / cancel | Isti serveri kao owner |
| Privola | Banner / gate prije bookinga |

## Izvan faze

DNS subdomena · Online flag · Blagajna

## Mjeri / uči

Postotak rezervacija koje član napravi sam vs vlasnik.

## Done

- [x] Self-book s aktivnom članarinom  
- [x] Otkaz u roku  
- [x] Bez članarine / privole → jasna blokada  
