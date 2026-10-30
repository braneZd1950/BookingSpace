/**
 * Predlošci pravila za studio (voditelj obrade) u skladu s tipičnim
 * zahtjevima GDPR-a i hrvatskog Zakona o provedbi Opće uredbe o zaštiti podataka.
 * Predložak nije formalni pravni savjet — studio ga može i treba prilagoditi.
 */

function contactBits(studio) {
  return [studio.email, studio.phone, studio.address].filter(Boolean);
}

function contactLine(studio) {
  const bits = contactBits(studio);
  if (!bits.length) return studio.name || 'Studio';
  return `${studio.name} (${bits.join(' · ')})`;
}

export function generateStudioPrivacy(studio) {
  const name = studio.name || 'Studio';
  const contact = contactBits(studio);
  return [
    `Politika privatnosti — ${name}`,
    '',
    'Ovaj predložak namijenjen je poslovanju koje koristi platformu anyminutes za rezervacije. Studio je voditelj obrade podataka svojih klijenata i članova; anyminutes pruža tehničku uslugu kao izvršitelj obrade u mjeri u kojoj obrađuje podatke radi rada aplikacije. Tekst prilagodite svojim stvarnim procesima. Nije zamjena za pravni savjet.',
    '',
    '1. Voditelj obrade',
    `${contactLine(studio)} određuje svrhe i načine obrade podataka klijenata i članova te je voditelj obrade u smislu Opće uredbe o zaštiti podataka (GDPR) i hrvatskih propisa o zaštiti osobnih podataka.`,
    '',
    '2. Uloga platforme anyminutes',
    'Platforma anyminutes omogućuje hosting rezervacijske stranice, prijave, evidenciju termina, članarina i povezane tehničke funkcije. anyminutes obrađuje podatke u ime studija samo u mjeri potrebnoj za pružanje te usluge. Opća pravila platforme dostupna su na anyminutesu (Privatnost, Uvjeti, Kolačići) i odvojena su od ove politike studija.',
    '',
    '3. Koje podatke obrađujemo',
    'Ovisno o korištenju usluge: identifikacijski i kontaktni podaci (ime, e-pošta, telefon), podaci o rezervacijama i članarinama, komunikacija sa studijom te tehnički podaci potrebni za prijavu, sigurnost i stabilan rad (npr. sesija, zapis prijave).',
    '',
    '4. Svrhe i pravne osnove',
    'Podatke obrađujemo radi: (a) ugovaranja i izvršenja rezervacije ili članarine (izvršenje ugovora); (b) obavijesti o terminima i odgovora na upite; (c) privole kad je to potrebno za određene radnje u aplikaciji; (d) legitimnog interesa za sigurnost, sprječavanje zlouporabe i osnovno poboljšanje usluge; (e) ispunjavanja zakonskih obveza kad postoje.',
    '',
    '5. Kome dijelimo podatke',
    'Podatke ne prodajemo. Dijelimo ih samo s pružateljima nužnim za rad (npr. hosting, e-pošta, platforma anyminutes) i s nadležnim tijelima kad to zakon nalaže. Svaki pružatelj smije obrađivati podatke samo u skladu s ugovorom i zakonom.',
    '',
    '6. Prijenos izvan EGP-a',
    'Ako se podaci tehnički obrađuju izvan Europskog gospodarskog prostora (npr. kod određenih pružatelja oblaka), primjenjuju se odgovarajuća jamstva predviđena GDPR-om. Potražite detalje kod studija ili u pravilima konkretnog pružatelja.',
    '',
    '7. Rokovi čuvanja',
    'Podatke čuvamo dok je račun ili članarina aktivna i onoliko koliko je potrebno za evidenciju rezervacija, rješavanje sporova i zakonske rokove. Nakon toga brišemo ili anonimiziramo podatke kad više nisu potrebni.',
    '',
    '8. Vaša prava',
    'Imate pravo na uvid, ispravak, brisanje, ograničenje obrade, prenosivost podataka, prigovor te povlačenje privole (ako se obrada temelji na privoli), u skladu s GDPR-om. Povlačenje privole ne utječe na zakonitost obrade do povlačenja, ali može ograničiti rezervacije i članstvo u aplikaciji.',
    '',
    '9. Prigovor nadzornom tijelu',
    'Ako smatrate da se vaši podaci obrađuju protivno propisima, možete podnijeti prigovor Agenciji za zaštitu osobnih podataka (AZOP), Selska cesta 136, 10000 Zagreb, https://azop.hr.',
    '',
    '10. Automatizirano odlučivanje',
    'Studio ne donosi odluke koje proizvode pravne ili slično značajne učinke isključivo automatiziranom obradom, osim ako vas o tome posebno obavijesti.',
    '',
    '11. Kontakt',
    contact.length
      ? `Za zahtjeve vezane uz zaštitu podataka obratite se: ${contact.join(' · ')}.`
      : 'Za zahtjeve vezane uz zaštitu podataka obratite se studiju putem kontaktnih podataka na stranici.',
    '',
    '12. Izmjene',
    'Studio može ažurirati ovu politiku. Važeća verzija objavljuje se na ovoj stranici.',
  ].join('\n');
}

export function generateStudioTerms(studio) {
  const name = studio.name || 'Studio';
  const contact = contactBits(studio);
  const who = contactLine(studio);
  return [
    `Uvjeti korištenja — ${name}`,
    '',
    'Uvod — tko je tko',
    `${who} (dalje: „studio”) pruža usluge rezervacija, članarina i povezanih termina te je ugovorna strana prema vama za te usluge. Tehničku rezervacijsku aplikaciju i hosting stranice pruža platforma anyminutes (dalje: „platforma”), koja nije pružatelj vaše trening / uslužne ponude već tehnički posrednik. Ovi uvjeti uređuju odnos između vas i studija. Odnos prema platformi uređen je odvojenim uvjetima anyminutesa. Predložak prilagodite stvarnim pravilima studija; nije zamjena za pravni savjet.`,
    '',
    '1. Opseg',
    `Ovi uvjeti stupaju na snagu kada: (a) rezervirate termin, (b) aktivirate ili koristite članarinu / paket, (c) otvorite račun radi rezervacija ili (d) na drugi način izričito prihvatite uvjete. Odnose se na korištenje rezervacijske stranice studija ${name}, online rezervacije, članarine i komunikaciju o terminima. Ne uređuju opće poslovanje platforme anyminutes ni usluge trećih strana izvan studija. Ako ne pristajete, nemojte rezervirati ni koristiti račun za rezervacije.`,
    '',
    '2. Rezervacije, otkazivanje i nedolazak',
    'Termini se rezerviraju online prema dostupnosti, radnom vremenu i kapacitetu koje određuje studio. Rok za otkazivanje (npr. broj sati prije početka) objavljuje se na stranici rezervacije i/ili uz uslugu; otkaz unutar toga roka u pravilu briše rezervaciju i ne troši termin iz paketa, osim ako studio drugačije i jasno navede. Otkaz izvan roka, nedolazak ili znatno kasni dolazak studio može tretirati kao iskorišten termin iz članarine / paketa, u skladu s pravilima objavljenima pri rezervaciji. Studio može odbiti ili pomaknuti termin zbog kapaciteta, zatvaranja ili više sile te će vas o tome razumno obavijestiti kad je to moguće.',
    '',
    '3. Članarine i plaćanja',
    'Cijene, broj uključenih termina, trajanje paketa, način plaćanja (npr. u studiju, uplatnica, kartica ako je uključena) i uvjeti povrata navode se pri kupnji ili aktivaciji konkretnog paketa / članarine. Vrijede uvjeti toga paketa; opći opis na stranici nije zamjena za cijenu i rokove potvrđene pri aktivaciji. Povrati i zamjene odvijaju se prema politici studija i obveznim propisima (uključujući prava potrošača kad se primjenjuju). Online naplata putem platforme dostupna je samo ako je studio uključi; inače se uplata dogovara izravno sa studijom.',
    '',
    '4. Račun i obrada podataka',
    'Za rezervacije i članstvo može biti potrebna prijava (račun). Obrada osobnih podataka ne temelji se isključivo na privoli: ovisno o svrsi, studio se može osloniti na izvršenje ugovora (rezervacija / članarina), zakonske obveze, legitimni interes (npr. sigurnost) ili privolu — detalji su u Politici privatnosti studija. Privola se traži samo tamo gdje je to pravna osnova; njezino povlačenje ne utječe na zakonitost obrade do povlačenja, ali može ograničiti funkcije koje ovise o privoli. Pregled javnog sadržaja stranice u pravilu nije uvjetovan privolom za rezervacije.',
    '',
    '5. Odgovornost',
    `${name} odgovara za sadržaj svoje ponude, točnost termina koje objavi, izvršenje usluge, članarine i komunikaciju s klijentima, u skladu s ugovorom i primjenjivim zakonom. Platforma anyminutes odgovara za tehnički rad aplikacije (dostupnost sustava rezervacija, sigurnost računa na razini platforme) u skladu sa svojim uvjetima — ne za kvalitetu treninga, cijene, otkaznu politiku studija ni sporove između vas i studija. Ni studio ni platforma ne isključuju odgovornost koju zakon ne dopušta isključiti (npr. za namjeru, grubu nepažnju ili odgovornost prema potrošaču u mjeri u kojoj je obvezna). Za prekide uzrokovane trećim stranama ili okolnostima izvan razumne kontrole odgovornost je ograničena samo u mjeri dopuštenoj zakonom.`,
    '',
    '6. Prihvatljiva uporaba',
    'Zabranjeno je zloupotrebljavati rezervacije (npr. lažne rezervacije, masovno blokiranje termina), dijeliti pristupne podatke, ometati rad stranice, unositi namjerno netočne podatke ili pokušavati neovlašteni pristup. Studio i/ili platforma mogu privremeno ograničiti račun, poništiti zloupotrebljene rezervacije ili zatražiti potvrdu identiteta / kontakta ako postoji osnovana sumnja na zloupotrebu, uz razuman postupak i bez uskraćivanja zakonskih prava. Korisnik je odgovoran za čuvanje lozinke i aktivnosti na svom računu, osim ako dokaže neovlašteni pristup koji nije mogao spriječiti.',
    '',
    '7. Zaštita podataka',
    'Obavijest o privatnosti studija (Politika privatnosti na ovoj stranici) opisuje kako studio kao voditelj obrade obrađuje podatke svojih klijenata i članova. Odvojeno, politika privatnosti anyminutesa opisuje obradu podataka u vezi s radom same platforme. Te dvije obavijesti nisu zamjena jedna za drugu; za pitanja o podacima koje prikuplja studio obratite se studiju, a za pitanja o platformi — anyminutesu.',
    '',
    '8. Mjerodavno pravo',
    'Na ove uvjete i ugovor sa studijem primjenjuje se pravo Republike Hrvatske, uz poštivanje obveznih propisa Europske unije. Ništa u ovim uvjetima ne ograničava obvezna prava potrošača ni druga prava koja se ne mogu valjano isključiti. Nadležnost sudova određuje se prema zakonu; potrošač može imati pravo na sud prema mjestu prebivališta kad to propis dopušta.',
    '',
    '9. Izmjene',
    'Studio može ažurirati ove uvjete. Važeća verzija uvijek je objavljena na ovoj stranici. O bitnim izmjenama koje utječu na već sklopljene rezervacije ili aktivne članarine studio će vas razumno obavijestiti (npr. e-poštom na adresu računa i/ili obavijesti u aplikaciji) prije početka primjene, osim kad je izmjena nužna zbog zakona ili sigurnosti. Nastavak rezervacija nakon obavijesti i objave može značiti prihvat novih uvjeta za buduće rezervacije; za već potvrđene termine vrijede uvjeti u trenutku rezervacije, osim ako zakon ili dogovor drugačije nalažu.',
    '',
    '10. Kontakt',
    contact.length
      ? `Poslovni subjekt i kontakt za ova pravila: ${contact.join(' · ')}. Dopunite u postavkama studija puni naziv, adresu sjedišta, OIB i ostale podatke propisane za poslovanje u RH ako još nisu navedeni. Za tehnička pitanja o aplikaciji koristite kontakt anyminutesa na platformi.`
      : 'Upišite u postavkama studija puni naziv poslovnog subjekta, adresu sjedišta, OIB, e-poštu i telefon za pravne upite. Bez tih podataka kontakt za uvjete nije potpun. Za tehnička pitanja o aplikaciji koristite kontakt anyminutesa na platformi.',
  ].join('\n');
}

export function generateStudioCookies(studio) {
  const name = studio.name || 'Studio';
  return [
    `Kolačići — ${name}`,
    '',
    `Ova obavijest odnosi se na kolačiće i slične tehnologije na rezervacijskoj stranici studija ${name}. Predložak prilagodite ako koristite dodatne alate. Nije zamjena za pravni savjet.`,
    '',
    '1. Nužni kolačići i lokalna pohrana',
    'Koristimo nužne kolačiće i lokalnu pohranu za prijavu, sigurnost, pamćenje osnovnih postavki i privole. Bez njih rezervacija i račun ne rade pouzdano. Takva obrada temelji se na izvršenju usluge i/ili legitimnom interesu za siguran rad stranice.',
    '',
    '2. Neobavezni alati',
    'Ako studio ili platforma uključe analitiku, marketing ili slične neobavezne alate, o tome ćete biti obaviješteni i moći ćete odbiti ono što nije nužno, u skladu s propisima o elektroničkoj komunikaciji i zaštiti podataka.',
    '',
    '3. Upravljanje',
    'Kolačiće možete brisati ili ograničiti u postavkama preglednika. Brisanje sesije odjavljuje vas s računa. Privolu za obradu podataka možete povući u postavkama računa ili putem banner-a, što može ograničiti rezervacije.',
    '',
    '4. Više informacija',
    'Za podatke koje studio prikuplja o vama vrijedi Politika privatnosti ovog studija. Opća pravila platforme anyminutes (uključujući kolačiće aplikacije) dostupna su na anyminutesu.',
  ].join('\n');
}

export function generateAllStudioLegal(studio) {
  return {
    privacy: generateStudioPrivacy(studio),
    terms: generateStudioTerms(studio),
    cookies: generateStudioCookies(studio),
  };
}
