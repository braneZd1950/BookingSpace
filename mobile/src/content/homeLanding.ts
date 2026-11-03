/** Copy mirror of `client/src/pages/public/HomePage.jsx` — keep in sync. */

export const homeCalendars = [
  {
    month: 'Listopad',
    year: '2026',
    days: [12, 13, 14, 15, 16, 17, 18, 19, 20],
    booked: 16,
    note: 'Maja · 10:00',
  },
  {
    month: 'Studeni',
    year: '2026',
    days: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    booked: 6,
    note: 'Ivan · 17:30',
  },
  {
    month: 'Prosinac',
    year: '2026',
    days: [7, 8, 9, 10, 11, 12, 13, 14, 15],
    booked: 12,
    note: 'Rođendan · 11:00',
  },
  {
    month: 'Siječanj',
    year: '2027',
    days: [18, 19, 20, 21, 22, 23, 24, 25, 26],
    booked: 22,
    note: 'Ana · 09:15',
  },
] as const;

export const homeBenefits = [
  {
    title: 'Manje poruka',
    text: 'Klijenti rezerviraju sami, pa ne morate odgovarati na svaku poruku o slobodnim terminima.',
  },
  {
    title: 'Sve na jednom mjestu',
    text: 'Termini, raspored, klijenti i članarine — sve vodite iz jednog pregleda, bez skakanja između aplikacija.',
  },
  {
    title: 'Rezervacije 0–24',
    text: 'Vaša stranica prima rezervacije i dok spavate. Klijent rezervira kad njemu odgovara.',
  },
  {
    title: 'Jasan pregled dana',
    text: 'U svakom trenutku znate tko dolazi, kada i koliko termina imate slobodno.',
  },
  {
    title: 'Vaša stranica, vaš link',
    text: 'Dobivate vlastitu stranicu s vlastitim linkom koji dijelite točno kome želite.',
  },
  {
    title: 'Jednostavno za sve',
    text: 'Bez tečaja i bez priručnika. Postavite jednom i koristite svaki dan.',
  },
] as const;

export const homeSteps = [
  {
    n: '01',
    title: 'Napravite svoju stranicu',
    text: 'Upišite osnovne podatke o svom poslu, uslugama i radnom vremenu. Vaša stranica je spremna za nekoliko minuta.',
  },
  {
    n: '02',
    title: 'Podijelite link s klijentima',
    text: 'Pošaljite link klijentima ili ga stavite na društvene mreže. Jedan klik i oni su na vašoj stranici.',
  },
  {
    n: '03',
    title: 'Primajte rezervacije',
    text: 'Klijenti biraju termin, a vi sve vidite u svom pregledu. Vi se bavite poslom, raspored se slaže sam.',
  },
] as const;

export const homeFaqs = [
  {
    q: 'Moram li biti vješt s računalima da bih koristio anyminutes?',
    a: 'Ne. anyminutes je napravljen da bude jednostavan. Ako se znate služiti telefonom i porukama, snaći ćete se bez problema.',
  },
  {
    q: 'Što je to „moja stranica” i „moj link”?',
    a: 'To je vaša osobna online stranica na kojoj klijenti rezerviraju termine. Dobivate i link te stranice koji jednostavno pošaljete klijentima ili podijelite na društvenim mrežama.',
  },
  {
    q: 'Mogu li klijenti rezervirati bilo kada?',
    a: 'Da. Vaša stranica prima rezervacije 24 sata dnevno unutar vašeg radnog vremena i kapaciteta — klijenti biraju termin kad njima odgovara, a vi sve vidite u pregledu.',
  },
  {
    q: 'Vidi li itko moje klijente ili ih može kontaktirati?',
    a: 'Ne. anyminutes nije javni imenik. Vaša stranica i vaši klijenti služe samo vašem poslu i ostaju vaši.',
  },
  {
    q: 'Mogu li voditi i članarine, a ne samo pojedinačne termine?',
    a: 'Da. Uz termine i raspored na jednom mjestu možete voditi i članarine svojih klijenata.',
  },
  {
    q: 'Je li anyminutes prikladan za moju vrstu posla?',
    a: 'Koriste ga poslovi koji rade na termine — studiji za vježbanje i wellness, saloni ljepote, dječje igraonice i slično. Ako radite na dogovorene termine, prikladan je i za vas.',
  },
  {
    q: 'Koliko košta anyminutes?',
    a: 'Cjenik i model naplate potvrđujemo pri otvaranju studija ili na upit. Ne iznosimo fiksne cijene na ovoj stranici dok se uvjeti ne dogovore s vama.',
  },
  {
    q: 'Postoji li besplatno probno razdoblje?',
    a: 'Da. Novi studio kreće s probnim razdobljem (do 30 dana), pa možete isprobati raspored i rezervacije prije dugoročne odluke.',
  },
] as const;
