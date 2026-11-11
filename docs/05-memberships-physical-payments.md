# Članarine i fizička naplata

Indeks: [README.md](README.md) · Lean: [lean/phase-05-frontend.md](lean/phase-05-frontend.md)

Članovi u UI-u: gotovo. Blagajna UI: još faza 5. API za uplate već postoji. Stripe **nije** u MVP-u.

---

## Cilj

Član plati u studiju (gotovina / POS), a rezervira online u anyminutesu.

## Identiteti

| Što | Primjer | Traje |
| --- | --- | --- |
| Korisnik | Ivan Horvat (`U12345`) | Trajno |
| Članarina | `MEM-2026-000125` | Jedan paket / mjesec |

Sljedeći mjesec novi `MEM-…`, isti korisnik.

```text
Plan: 12 treninga
Valjano: 01.09. – 30.09.
Iskorišteno: 5 → preostalo 7
```

---

## Tok fizičke naplate

1. Član dođe u studio  
2. Osoblje ga nađe (ime / email / telefon)  
3. Ako nema računa → kreiraj / pozovi  
4. Odaberi plan  
5. Zapiši uplatu  
6. Sustav kreira članarinu → `ACTIVE`  
7. Član odmah može rezervirati  

Metode: `CASH`, `CARD_TERMINAL`, `BANK_TRANSFER`.

---

## Pravilo pristupa

Član može rezervirati kad:

```text
status === ACTIVE
AND danas <= validUntil
AND sessionsRemaining > 0   (ili unlimited)
AND usluga je dozvoljena planom
```

---

## Primjer potrošnje

| Radnja | Preostalo |
| --- | --- |
| Rezervira 18:00 | 12 → 11 |
| Otkaže na vrijeme | 11 → 12 |
| Trening odrađen | ostaje 11 |
| NO_SHOW (default) | 11 → 10 |

---

## Tipovi planova

| Tip | Primjer |
| --- | --- |
| Fiksni termini | 12 treninga / 30 dana |
| Unlimited | Neograničeno / 30 dana |
| Po uslugama | Samo Power Plate + grupa, ne PT |

---

## Što još fali u UI-u

API: `POST/GET …/payments`.  
Faza 5: jasan ekran blagajne (uplata → članarina) + povijest uplata.
