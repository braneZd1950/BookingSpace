# Faza M4 — Push i privola

**Stanje:** planirano (nakon M3)  
**Hipoteza:** Bez privole i obavijesti app nije spremna za prave korisnike.  
**Web privola:** banner + `POST /consent`

---

## Cilj

1. Privola prije bookinga (isti semantički model kao web).  
2. Push obavijesti na uređaj (Expo Notifications).  

## U opsegu

| Korak | Što napraviti |
| --- | --- |
| 1 | Consent ekran / gate prije `POST /bookings` |
| 2 | `POST /consent` + lokalni flag (SecureStore/local) |
| 3 | Traži dozvolu za notifikacije |
| 4 | Registriraj Expo push token |
| 5 | **Backend gap:** spremi native token + pošalji (ako VAPID nije dovoljan) |
| 6 | Postavke: uključi/isključi push |

## Važno

Web Push (VAPID) ≠ Expo push.  
Prije koda zapiši rupu u [../../../docs/lean/backend-status.md](../../../docs/lean/backend-status.md).

## Izvan opsega

Bogati email predlošci · SMS

## Mjeri

Testna rezervacija → push stigne na telefon u < 1 min (kad server podrži).

## Done kad

- [ ] Bez privole nema booka  
- [ ] Privola se pamti (ne smara nakon svake odjave ako je accept — uskladi s web ponašanjem)  
- [ ] Push dozvola + token registracija  
- [ ] Bar jedan tip obavijesti radi end-to-end  
