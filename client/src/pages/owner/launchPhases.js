/** Lean Startup launch phases — frontend plan only, no backend work required yet. */
export const launchPhases = [
  {
    id: 1,
    title: 'Jedan studio, jedan dan',
    status: 'now',
    hypothesis: 'Vlasnik će voditi članove i radno vrijeme u aplikaciji umjesto u bilježnici.',
    build: [
      'Prijava i registracija studija',
      'Postavke: naziv, kontakt, sati',
      'Članovi: dodaj, obustavi, obnovi',
      'Pregled termina i kalendara (čitaj)',
    ],
    measure: '1 stvarni studio tjedan dana upisuje članove ovdje, ne u Excelu.',
    learn: 'Ako ne upisuju, problem nije dizajn stranice — nego vrijednost vođenja članstva.',
  },
  {
    id: 2,
    title: 'Prava rezervacija',
    status: 'next',
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
    status: 'later',
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
    status: 'later',
    hypothesis: 'Tek kad petlja rezervacije radi, stranica s logom i galerijom privlači nove klijente.',
    build: [
      'Fiksni predložak stranice (bez SEO / društvenih mreža na početku)',
      'Jedna naslovna fotografija',
      'Link na rezervaciju',
    ],
    measure: 'Novi upiti ili registracije koje dođu preko stranice.',
    learn: 'Bez dokaza iz faze 2–3, stranica je ukras — ne produkt.',
  },
  {
    id: 5,
    title: 'Plaćanja i planovi',
    status: 'later',
    hypothesis: 'Upis gotovine/kartice u salonu smanjuje pogreške u broju treninga.',
    build: [
      'Planovi članstva',
      'Upis fizičkog plaćanja',
      'Utrošak treninga po rezervaciji',
    ],
    measure: 'Broj aktivnih članstava točno odgovara blagajni studija.',
    learn: 'Ako brojevi ne sjedaju, prvo popravite petlju — ne Stripe.',
  },
];

export function phaseLabel(status) {
  if (status === 'now') return 'Sada';
  if (status === 'next') return 'Sljedeće';
  return 'Kasnije';
}
