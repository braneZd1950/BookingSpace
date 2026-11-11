# Motor rezervacija

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md) · Backend: [lean/backend-status.md](lean/backend-status.md)

Ovo je najvažniji dio proizvoda. U kodu: faze 2–3. Trener (`staffId`) je opcionalan; obavezan ako studio ima trenerе.

---

## Parametri usluge

| Polje | Primjer |
| --- | --- |
| `durationMinutes` | 30 |
| `slotIntervalMinutes` | 15 |
| `capacity` | 6 |
| prozor otkaza | 15 min |
| treba li članarinu | da |

Početci termina: 18:00, 18:15, 18:30, 18:45…

---

## Dva modela kapaciteta

### A — kapacitet po slotu

18:00 ima 6 mjesta, 18:15 ima svojih 6 — čak i ako se trajanja preklapaju.  
Koristi samo ako studio stvarno ima dovoljno prostora/opreme.

### B — istovremeni resurs (sigurnije)

Booking zauzima kapacitet od početka do kraja. Preklapanje troši isti resurs.

MVP: konfigurabilni model; za Power Plate vidi pitanje u [14-example-powerplate.md](14-example-powerplate.md).

---

## Kad je slot slobodan?

1. Usluga i studio aktivni  
2. Unutar radnog vremena  
3. Termin još nije prošao  
4. Član ima aktivnu članarinu (ako treba)  
5. Ima preostalih treninga  
6. Ima slobodnog kapaciteta  
7. Nema konfliktne rezervacije istog člana  

UI: `18:00 — 4/6`. Kad je `6/6` → **POPUNJENO**.

---

## Otkaz

`cancellationWindowMinutes` npr. 15.  
Za 18:00 član može otkazati do 17:45. Kasnije online ne može; osoblje može override.

---

## Potrošnja članarine

Ne povećavaj „iskorišteno” naslijepo.

| Status | Tipično |
| --- | --- |
| CONFIRMED | drži 1 termin |
| CANCELLED (u roku) | vraća termin |
| COMPLETED | ostaje potrošen |
| NO_SHOW | default: potrošen (kasnije konfigurabilno) |

Koristi `sessionsIncluded` / `sessionsUsed` atomarno kad god možeš.

---

## Zaštita od double-bookinga

Stvaranje rezervacije mora biti atomarno.  
Server **ponovno** provjerava članarinu, kapacitet i konflikte neposredno prije inserta.  
**Nikad** ne vjeruj brojkama koje je browser već pokazao.

---

## Waitlist (kasnije)

Kad je puno: „Pridruži se listi čekanja”. Pri otkazu: obavijesti prvog, privremeno rezerviraj, isteći nakon vremena.  
Još **nije** u kodu.
