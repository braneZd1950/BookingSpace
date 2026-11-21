# Faza M4 — Push i privola

**Stanje:** van demo / pilot opsega (djelomično: prefs / legal u settings)  
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
| 2 | `POST /consent` + lokalni flag |
| 3 | Traži dozvolu za notifikacije |
| 4 | Registriraj Expo push token |
| 5 | **Backend gap:** spremi native token + pošalji (ako VAPID nije dovoljan) |
| 6 | Postavke: uključi/isključi push |

## Već u pilotu

- Member settings: ops/promo prefs, privacy/legal curtain  
- Web Push (VAPID) na webu — **nije** isto što Expo push  

## Važno

Web Push (VAPID) ≠ Expo push.  
Prije koda zapiši rupu u [../../../docs/lean/backend-status.md](../../../docs/lean/backend-status.md).

## Izvan opsega

Bogati email predlošci · SMS · blagajna

## Done kad

- [ ] Bez privole nema booka (mobile gate)  
- [x] Prefs / legal u settings (djelomično)  
- [ ] Push dozvola + token registracija  
- [ ] Bar jedan tip obavijesti radi end-to-end  
