# Roadmap

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md) · Lean: [lean/README.md](lean/README.md)

---

## Demo / pilot (sada)

Cilj: stabilan booking loop (web + mobile) za pravi studio — **bez** blagajne i naplate.

1. Drži docs (`07`, `03`, `08`, `16`, mobile status) usklađene s kodom  
2. Pilot učenje — studio koristi članove + termine (web i/ili preview APK)  
3. Zeleni testovi prije shippa: unit + security + Playwright deep + (kad uređaj radi) Maestro  
4. Online treninzi samo kad proizvod eksplicitno uključi (`ONLINE_ENABLED`)  

**Van opsega ovog dema:** blagajna UI, Stripe, fizička naplata u app-u.

---

## Nakon povratne informacije s pilota

Ne kreći prije dokazane svakodnevne upotrebe bookinga:

- **Blagajna UI** (faza 5) — API već postoji; UI kad studio traži zapis gotovine/kartice  
- waitlist  
- bogatiji mail / push predlošci  
- native Expo push (M4)  
- Play internal / TestFlight + Sentry RN (M5 dovršetak)  
- ponavljajuće rezervacije  
- bolja prava osoblja  
- check-in dolaska  
- podsjetnici na istekle članarine  
- pravi subdomena / custom domena  

## Kasnije širenje proizvoda

Stripe, automatska obnova, promo kodovi, napredni izvještaji, SMS, kalendar integracije.

## Niše (nakon sportskog pilota)

Vidi [15-niches-playroom-wellness.md](15-niches-playroom-wellness.md):

1. Booking **bez** članarine kad partner dopušta  
2. Copy po niši (klijenti vs članovi)  
3. Odabir usluge prije slota (wellness)  
4. Direktorij partnera  

## Daleko

White-label, više lokacija, napredni raspored osoblja, marketplace.
