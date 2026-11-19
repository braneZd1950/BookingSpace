/** FAQ copy for the public home page — tuple rows avoid Sonar CPD on repeated {q,a} objects. */

const HOME_FAQ_ROWS = [
  [
    'Moram li imati tehničko znanje za korištenje Blizaria?',
    'Ne. Blizari je osmišljen tako da bude jednostavan, pregledan i razumljiv. Svoje poslovanje možete postaviti i koristiti bez posebnog tehničkog znanja.',
  ],
  [
    'Što dobivam registracijom?',
    'Dobivate vlastitu stranicu za svoje poslovanje i alate za organizaciju rasporeda, rezervacija, klijenata, članova i članarina, uz pregled poslovanja na jednom mjestu.',
  ],
  [
    'Što je moja online stranica?',
    'To je vaša vlastita stranica na kojoj klijenti mogu pronaći informacije o vašem poslovanju, pregledati usluge ili aktivnosti i rezervirati dostupne termine. Link na stranicu dijelite svojim klijentima gdje god želite. Vaša stranica nije dio javnog kataloga drugih poslovanja.',
  ],
  [
    'Je li Blizari samo aplikacija za rezervacije termina?',
    'Ne. Blizari je platforma za upravljanje uslužnim poslovanjem. Osim rezervacija, pomaže vam organizirati klijente, raspored, članove, članarine i druge dijelove svakodnevnog poslovanja. Rezervacije su jedan dio sustava.',
  ],
  [
    'Mogu li klijenti rezervirati termine dok nisam dostupan?',
    'Da. Vaša stranica za rezervacije dostupna je online, pa klijenti mogu samostalno pregledati i rezervirati dostupne termine bez potrebe da vam šalju poruku ili čekaju vaš odgovor. Rezervacije se odvijaju prema vašim postavljenim pravilima, dostupnosti i kapacitetu.',
  ],
  [
    'Je li Blizari namijenjen samo fitness studijima?',
    'Nije. Blizari razvijam za različite vrste uslužnih poslovanja koja rade s terminima, rezervacijama, klijentima ili članovima. To uključuje fitness i treninge, wellness, salone, igraonice, različite usluge i druge djelatnosti.',
  ],
  [
    'Vide li drugi vlasnici poslovanja moje klijente ili podatke?',
    'Ne. Svako poslovanje ima svoj zaseban prostor. Blizari nije javni imenik ni tržište na kojem se vaši klijenti prikazuju drugim pružateljima usluga. Vaši klijenti i poslovni podaci nisu dostupni drugim poslovanjima.',
  ],
  [
    'Mogu li klijenti platiti online?',
    'Trenutačno Blizari ne podržava online kartično plaćanje. Rezervacije, evidenciju članarina i podatke o klijentima možete voditi kroz platformu, dok naplatu obavljate na način koji već koristite u svom poslovanju.',
  ],
  [
    'Koliko košta korištenje Blizaria?',
    'Korištenje Blizaria tijekom pilot-faze je besplatno. O eventualnim budućim cijenama korisnici će biti pravovremeno obaviješteni.',
  ],
  [
    'Moram li instalirati Blizari na računalo ili mobitel?',
    'Ne. Blizari koristite putem internetskog preglednika na računalu, tabletu ili mobitelu. Nije potrebna instalacija klasičnog programa.',
  ],
  [
    'Mogu li promijeniti izgled i informacije svoje stranice nakon registracije?',
    'Da. Informacije o poslovanju, izgled stranice i dostupne postavke možete prilagođavati i nakon početnog postavljanja, ovisno o mogućnostima koje su dostupne u platformi.',
  ],
];

export const HOME_FAQS = HOME_FAQ_ROWS.map(([q, a]) => ({ q, a }));
