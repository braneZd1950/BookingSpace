/** Isti FAQ kao web HomePage — za članski ekran u mobilnoj. */
export const MEMBER_FAQS = [
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
];

export const ABOUT_PROMISES = [
  {
    title: 'Jednostavnost na prvom mjestu',
    text: 'Ako nešto nije jasno odmah, to je moj posao da popravim.',
  },
  {
    title: 'Vaš posao ostaje vaš',
    text: 'Vaša stranica, vaši klijenti i vaši odnosi pripadaju vama. Ja dajem samo alate.',
  },
  {
    title: 'Slušam vas',
    text: 'Vaše poruke i ideje izravno utječu na to što dolazi sljedeće.',
  },
  {
    title: 'Bez praznih priča',
    text: 'Govorim vam što aplikacija radi danas, iskreno i bez pretjerivanja.',
  },
];

export const ABOUT_SECTIONS = [
  {
    kicker: 'Kako je sve počelo',
    title: 'AnyMinutes je počeo od jednog vrlo stvarnog problema.',
    paragraphs: [
      'Mnogi vlasnici malih poslova svoje termine i klijente još uvijek vode po papirima, bilježnicama i porukama. To oduzima vrijeme, stvara zbrku i lako se nešto izgubi.',
      'Gledajući to iz blizine, shvatio sam da može i jednostavnije. Htio sam napraviti alat koji je pregledan, osoban i lak za korištenje — takav da ga uključite i odmah znate što radite, bez mučenja i bez priručnika.',
    ],
  },
  {
    kicker: 'Tko stoji iza AnyMinutesa',
    title: 'Iza AnyMinutesa za sada stojim ja.',
    paragraphs: [
      'Nema velikog tima ni investitora — samo ideja da mali poslovi zaslužuju alat koji im olakšava dan, a ne dodaje posla. To mi daje slobodu da slušam izravno vas i da proizvod vodim u smjeru koji vama ima smisla.',
    ],
  },
  {
    kicker: 'Naša misija',
    title: 'Zašto radim ovo',
    paragraphs: [
      'Vjerujem da mali poslovi — studiji, saloni, igraonice — nemaju vremena za složene programe. Vaše vrijeme pripada vašim klijentima, a ne administraciji.',
      'Zato gradim AnyMinutes: da bude jednostavan, pregledan i da radi upravo ono što vam treba.',
    ],
  },
];

export function hoursLine(label, row) {
  if (!row) return `${label}: zatvoreno`;
  return row.works ? `${label}: ${row.from}–${row.to}` : `${label}: zatvoreno`;
}
