# Faza M1 — Auth + shell

**Stanje:** sljedeće  
**Hipoteza:** Korisnik se prijavi i vidi ispravan prostor (član ili vlasnik).  
**Setup:** [../03-setup-expo.md](../03-setup-expo.md)

---

## Cilj

Expo app koja se spoji na API, spremi JWT i otvori navigacijski shell.

## U opsegu

| Korak | Što napraviti |
| --- | --- |
| 1 | Expo + TypeScript u `mobile/` (sačuvaj `docs/`) |
| 2 | `EXPO_PUBLIC_API_URL` + health check |
| 3 | Login ekran → `POST /auth/login` |
| 4 | Token u SecureStore |
| 5 | `GET /auth/me` na startu |
| 6 | `GET /tenants/mine` + `GET /memberships/my` |
| 7 | MemberTabs / OwnerTabs (prazni placeholder ekrani OK) |
| 8 | Odjava |

## Izvan opsega

Termini book/cancel · push · store · registracija vlasnika (može ostati web)

## Mjeri

Možeš li se prijaviti demo / pravim računom i vidjeti shell u < 30 s.

## Learn

Ako login radi a „uloga” je kriva — popravi routing prije UI šminke.

## Done kad

- [ ] Expo start radi  
- [ ] Health OK s uređaja/emulatora  
- [ ] Login + persist token  
- [ ] Me + odabir Member/Owner shell  
- [ ] Logout briše token  
