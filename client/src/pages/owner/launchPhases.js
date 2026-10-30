/** Lean Startup launch phases — keep aligned with docs/lean/README.md */
export const launchPhases = [
  {
    id: 1,
    title: 'Jedan studio, jedan dan',
    status: 'done',
    hypothesis: 'Vlasnik će voditi članove i radno vrijeme u aplikaciji umjesto u bilježnici.',
    build: [
      'Prijava i registracija studija',
      'Postavke: naziv, kontakt, sati',
      'Članovi: dodaj, obustavi, obnovi',
      'Pregled termina i kalendara',
    ],
    measure: '1 stvarni studio tjedan dana upisuje članove ovdje, ne u Excelu.',
    learn: 'Ako ne upisuju, problem nije dizajn stranice — nego vrijednost vođenja članstva.',
  },
  {
    id: 2,
    title: 'Prava rezervacija',
    status: 'done',
    hypothesis: 'Vlasnik će puniti sate i vidjeti tko dolazi, bez telefonskog dogovaranja.',
    build: [
      'Kreiranje termina / usluge s kapacitetom',
      'Upis rezervacije od strane vlasnika',
      'Otkaz i oslobađanje mjesta',
    ],
    measure: 'Najmanje 10 rezervacija u tjedan dana kod pilot studija.',
    learn: 'Ako rezervacije ostanu na WhatsAppu, UI nije kriv — petlja nije zatvorena.',
  },
  {
    id: 3,
    title: 'Klijent sam bira sat',
    status: 'done',
    hypothesis: 'Član će rezervirati sam ako vidi slobodna mjesta i preostale treninge.',
    build: [
      'Prijava člana',
      'Popis slobodnih sati',
      'Rezervacija i otkaz unutar pravila',
    ],
    measure: 'Udio rezervacija koje napravi član (ne vlasnik) > 40%.',
    learn: 'Ako članovi ne rezerviraju, prvo pojednostavite put — ne dodajte marketing stranicu.',
  },
  {
    id: 4,
    title: 'Javna stranica studija',
    status: 'done',
    hypothesis: 'Tek kad petlja rezervacije radi, stranica s logom i galerijom privlači nove klijente.',
    build: [
      'Čarobnjak postavljanja (predložak, layout, boje)',
      'Pregled stranice u studiju',
      'Galerija: upload i prikaz na javnoj stranici',
      'Link na rezervaciju člana',
    ],
    measure: 'Novi upiti ili registracije koje dođu preko stranice.',
    learn: 'Bez dokaza iz faze 2–3, stranica je ukras — ne produkt. Pravi DNS ostaje kasnije.',
  },
  {
    id: 5,
    title: 'Plaćanja i planovi',
    status: 'now',
    hypothesis: 'Upis gotovine/kartice u salonu smanjuje pogreške u broju treninga.',
    build: [
      'Pripremna stranica Blagajna (bez aktivne naplate)',
      'Eksplicitni upis fizičkog plaćanja (gotovina / kartica / transfer)',
      'Povijest blagajne u UI',
      'Usklađenje aktivnih članstava s blagajnom',
    ],
    measure: 'Broj aktivnih članstava točno odgovara blagajni studija.',
    learn: 'Ako brojevi ne sjedaju, prvo popravite petlju — ne Stripe.',
  },
];

export function phaseLabel(status) {
  if (status === 'now') return 'Sada';
  if (status === 'next') return 'Sljedeće';
  if (status === 'done') return 'Gotovo';
  return 'Kasnije';
}
