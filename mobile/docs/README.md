# Mobilna dokumentacija — anyminutes

Jednostavan indeks za **React Native (Expo)** aplikaciju.  
Isti pristup kao web: **Build → Measure → Learn**, korak po korak.

Backend i baza **već postoje** (`server/` + MongoDB). Mobile je novi klijent na isti REST API.

Brand: **anyminutes**.

---

## Brzi start

| Želim… | Idi ovdje |
| --- | --- |
| Razumjeti zašto RN | [01 — Vizija](01-vizija.md) |
| Znati stack i tokove | [02 — Arhitektura](02-arhitektura.md) |
| Podići Expo projekt | [03 — Setup](03-setup-expo.md) |
| Vidjeti ekrane | [04 — Ekrani](04-ekrani.md) |
| Spojiti se na API | [05 — API i auth](05-api-i-auth.md) |
| Graditi po fazama | [lean/README.md](lean/README.md) |
| Znati što je gotovo | [07 — Status](07-status.md) |
| **Pregledati na PC-u** | [09 — Pregled na računalu](09-pregled-na-racunalu.md) |

Web docs (isti proizvod): [../../docs/README.md](../../docs/README.md)

---

## Po ulozi

### Početnik

1. [01-vizija.md](01-vizija.md)  
2. [03-setup-expo.md](03-setup-expo.md)  
3. [lean/faza-m1-auth-shell.md](lean/faza-m1-auth-shell.md)  
4. Zatim faze M2 → M3  

### Senior / arhitektura

1. [02-arhitektura.md](02-arhitektura.md)  
2. [05-api-i-auth.md](05-api-i-auth.md) + [../../docs/07-api-spec.md](../../docs/07-api-spec.md)  
3. [06-odluke.md](06-odluke.md)  
4. [lean/README.md](lean/README.md)  

---

## Lean faze (mobile)

| Faza | Fokus | Stanje |
| --- | --- | --- |
| M1 | Auth + shell (član / vlasnik) | **Sljedeće** |
| M2 | Član — termini (self-book) | Planirano |
| M3 | Vlasnik — termini / članovi | Planirano |
| M4 | Push + privola + PWA paritet | Planirano |
| M5 | Store (TestFlight / Play) | Planirano |

Detalji: [lean/README.md](lean/README.md)

---

## Pravila

- **Ne** dupliciraj business logiku na telefonu — server odlučuje.  
- Koristi isti JWT i iste endpointе kao web.  
- Hrvatski UI copy.  
- Najmanja promjena koja pomiče aktivnu fazu.  
- Ažuriraj [07-status.md](07-status.md) kad nešto shippaš.  
