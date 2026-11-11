# Faza M2 — Član: termini (self-book)

**Stanje:** planirano (nakon M1)  
**Hipoteza:** Član s aktivnom članarinom rezervira i otkazuje na telefonu.  
**API:** [../05-api-i-auth.md](../05-api-i-auth.md) · Web faza 3: [../../../docs/lean/phase-03-frontend.md](../../../docs/lean/phase-03-frontend.md)

---

## Cilj

Paritet članskog bookinga s weba (`/s/:slug/termini`) — bez site buildera.

## U opsegu

| Korak | Što napraviti |
| --- | --- |
| 1 | Odabir studija (slug / memberships/my) |
| 2 | Početna: status članarine |
| 3 | Lista dana + slotovi (availability) |
| 4 | `POST /bookings` |
| 5 | Moje rezervacije + otkaz |
| 6 | Poruke: puno, nema članarine, prošli termin |

## Izvan opsega

Vlasnički book za drugog · waitlist · online treninzi

## Mjeri

Jedan pravi član napravi rezervaciju **samo** s telefona.

## Learn

Ako padaju mrežni pozivi s uređaja — env/IP problem, ne UI.

## Done kad

- [ ] Vidi slotove za dan  
- [ ] Uspješan book  
- [ ] Uspješan cancel u roku  
- [ ] Jasna greška kad je puno / nema membership  
