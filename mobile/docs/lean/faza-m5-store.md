# Faza M5 — Store (TestFlight / Play)

**Stanje:** djelomično — EAS preview za demo; internal track / Sentry van dema  
**Hipoteza:** Internal release dovoljan je za pravi pilot studija.

---

## Cilj

Development/preview build preko EAS-a, zatim internal testing track.

## U opsegu

| Korak | Što napraviti |
| --- | --- |
| 1 | `eas.json` + EAS projekt |
| 2 | App ikona, splash, bundle id / package |
| 3 | Produkcijski `EXPO_PUBLIC_API_URL` |
| 4 | Android internal testing i/ili TestFlight |
| 5 | Crash reporting (npr. Sentry RN) |
| 6 | Kratke store napomene (hr) |

## Preduvjeti

- M2 petlja radi na development/preview buildu  
- Privacy policy / uvjeti linkovi (isti kao web)  
- Nema tajni u repou  

## Izvan opsega

Javni marketing launch · tablet layout perfection · iPad-only UI · blagajna

## Done kad

- [x] EAS preview build prolazi  
- [x] Preview APK se može instalirati (demo)  
- [ ] Internal distribuacija (Play / TestFlight)  
- [ ] Produkcijski API URL potvrđen za store build  
- [ ] Osnovni crash reporting (Sentry RN)  
