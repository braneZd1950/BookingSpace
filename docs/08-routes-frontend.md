# Frontend rute

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

Izvor istine: `client/src/app/App.jsx`.

Brand: **Blizari**.

---

## Javna platforma

| Ruta | Stranica |
| --- | --- |
| `/` | Početna (B2B) |
| `/mogucnosti` | Mogućnosti |
| `/otkrij` | Discover studija |
| `/login` · `/register` | Prijava / registracija |
| `/zaboravljena-lozinka` · `/nova-lozinka` | Reset lozinke |
| `/potvrda-emaila` | Potvrda promjene e-pošte |
| `/postavljanje` | Wizard studija |
| `/privatnost` · `/uvjeti` · `/kolacici` · `/kontakt` · `/povratna-informacija` | Pravni / kontakt |
| `/odrzavanje` | Održavanje |
| `*` | 404 |

Cijela app u maintenance: `VITE_MAINTENANCE=true`.  
Neočekivana greška: `ErrorBoundary` → `/greska`.

---

## Admin platforme — `/analitika`

Ulaz: `PlatformGate` (`platformAdmin` iz `/auth/me`).

| Ruta | Stranica |
| --- | --- |
| `/analitika` | Sažetak |
| `/analitika/studiji` | Studiji |
| `/analitika/korisnici` | Korisnici |
| `/analitika/aktivnost` | Aktivnost |
| `/analitika/placanja` | SaaS naplata partnera |
| `/analitika/izvjestaji` | Izvještaji |
| `/analitika/sustav` | Sustav |

---

## Studio vlasnika — `/stranica`

| Ruta | Nav | Stranica |
| --- | --- | --- |
| `/stranica` | Početna | Preview javne stranice |
| `/stranica/termini` | Termini | Raspored / rezervacija |
| `/stranica/kalendar` | Kalendar | Mjesec |
| `/stranica/clanovi` | Članovi | Članovi + treneri |
| `/stranica/usluge` | Usluge | Usluge studija |
| `/stranica/analitika` | Analitika | Analitika studija |
| `/stranica/postavke` | Postavke | Profil, sati, obavijesti |

Isključeno flagovima (`studioFeatures.js`): galerija (ovisno o flagu), online, **plaćanja / blagajna**, plan.

---

## Studio člana — `/s/:slug`

| Ruta | Nav | Stranica |
| --- | --- | --- |
| `/s/:slug` | Početna | Pregled + članarina |
| `/s/:slug/termini` | Termini | Self-book / otkaz |
| `/s/:slug/kalendar` | Kalendar | Occupancy (bez PII) |
| `/s/:slug/postavke` | Postavke | Račun (profil, email, prefs, sigurnost, legal) |
| `/s/:slug/online` | Online | Katalog (**flag off** u pilotu) |
| `/s/:slug/privatnost` · `/uvjeti` · `/kolacici` | — | Studio policy |

---

## Kasnije / van dema

| Ideja | Napomena |
| --- | --- |
| Pravi DNS `{slug}.…` | Danas samo slug putanja |
| Blagajna UI | Faza 5 — **nije u pilotu** |
| Marketplace / Stripe UI | Nije u planu sada |
