# Frontend rute

Indeks: [README.md](README.md) · Status: [16-current-status.md](16-current-status.md)

Izvor istine: `client/src/app/App.jsx`.

---

## Javna platforma

| Ruta | Stranica |
| --- | --- |
| `/` | Početna (B2B) |
| `/login` · `/register` | Prijava / registracija |
| `/zaboravljena-lozinka` · `/nova-lozinka` | Reset lozinke |
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
| `/stranica/analitika` | Analitika | Analitika studija |
| `/stranica/postavke` | Postavke | Profil, sati, obavijesti |

Isključeno flagovima (`studioFeatures.js`): galerija, online, plaćanja, plan.

---

## Studio člana — `/s/:slug`

| Ruta | Nav | Stranica |
| --- | --- | --- |
| `/s/:slug` | Početna | Pregled + članarina |
| `/s/:slug/termini` | Termini | Self-book / otkaz |
| `/s/:slug/online` | Online | Katalog (flag) |
| `/s/:slug/privatnost` | — | Privola |

---

## Kasnije

| Ideja | Napomena |
| --- | --- |
| Pravi DNS `{slug}.…` | Danas samo copy |
| Blagajna UI | Faza 5 |
| Marketplace / Stripe UI | Nije u planu sada |
