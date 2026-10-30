import { contactEmail } from '../../lib/contact.js';
import { legalEntity } from '../../lib/legal.js';
import InfoPage from './InfoPage.jsx';
import LegalPage from './LegalPage.jsx';

const { productName, email, azopUrl, azopMail, azopAddress, tradeName } = legalEntity;

export function PrivacyPage() {
  return (
    <LegalPage
      docId="privatnost"
      title="Politika privatnosti"
      lead="Jednostavno: što radimo s vašim podacima, zašto, koliko dugo — i kako ostvarujete svoja prava."
      basis="GDPR (Uredba EU 2016/679) · Zakon o provedbi Opće uredbe o zaštiti podataka (RH) · propisi Republike Hrvatske"
      sections={[
        {
          id: 'tko',
          title: 'Tko obrađuje vaše podatke',
          summary: 'Studio vodi svoj odnos s vama. Mi držimo aplikaciju. Oba smo odgovorna u svom dijelu.',
          paragraphs: [
            `${productName} (${tradeName}) je platforma za rezervacije. Kad se registrirate ili rezervirate termin, obrađujemo podatke potrebne da to radi.`,
            `Za pitanja o podacima i svojim pravima pišite na ${email}.`,
            'Studio kod kojeg ste član sam odlučuje o članstvu, cijenama, terminima i pravilima otkaza. Za taj dio je studio „voditelj obrade”. Mi smo tada „izvršitelj obrade”: radimo tehniku u ime studija, ne prodajemo vaše podatke i ne dijelimo ih s drugim studijima.',
          ],
          law: 'Čl. 4., 13., 14. i 28. GDPR-a · Zakon o provedbi Opće uredbe o zaštiti podataka (NN 42/2018)',
        },
        {
          id: 'sto',
          title: 'Koje podatke koristimo',
          summary: 'Samo ono što treba za račun, termin i (ako postoji) članstvo — bez nepotrebnih osjetljivih podataka.',
          paragraphs: [
            'Ovisno jeste li vlasnik studija, osoblje ili član, možemo imati:',
          ],
          bullets: [
            'ime, e-poštu i telefon (ako ga upišete)',
            'podatke o računu (uloga, postavke obavijesti)',
            'podatke o rezervaciji (dan, sat, usluga, otkaz)',
            'podatke o članstvu ili paketu (koliko termina preostaje), ako studio to koristi',
            'tehničke podatke za prijavu i sigurnost (npr. da ste prijavljeni u pregledniku)',
            'kod vlasnika studija: status pretplate prema platformi (bez nepotrebnog čuvanja punih podataka kartice u aplikaciji)',
          ],
          note: 'Ne tražimo zdravstvene ni druge posebno osjetljive podatke. Ako ih studio sam unese izvan predviđenog opsega, za to odgovara studio.',
          law: 'Čl. 5. i 9. GDPR-a (načelo smanjenja količine podataka; posebne kategorije)',
        },
        {
          id: 'zasto',
          title: 'Zašto ih obrađujemo (pravna osnova)',
          summary: 'Za rezervaciju i račun — jer ste to zatražili. Za sigurnost — jer moramo štititi sustav. Za marketing — samo ako pristanete.',
          paragraphs: [
            'Svaku svrhu vežemo uz zakonitu osnovu:',
          ],
          bullets: [
            'Ugovor (ili koraci prije ugovora): registracija, prijava, rezervacija, članstvo u sustavu, e-poruke o potvrdi, otkazu ili novoj lozinci.',
            'Legitimni interes: sigurnost, sprječavanje zlouporabe, osnovna analitika da usluga bude pouzdana, obavijesti o pretplati studija. Radimo samo ono što je nužno i razumno.',
            'Zakonska obveza: kada hrvatski ili EU propis nalaže čuvanje ili dostavu podataka (npr. računovodstvo, ako se primjenjuje).',
            'Privola: samo za neobavezne stvari (npr. marketing). Privolu možete povući u svakom trenutku.',
          ],
          law: 'Čl. 6. st. 1. toč. (a), (b), (c) i (f) GDPR-a',
        },
        {
          id: 'kome',
          title: 'Kome podaci mogu ići',
          summary: 'Vašem studiju, našim tehničkim partnerima (hosting, e-pošta) i — samo ako zakon nalaže — nadležnim tijelima.',
          paragraphs: [
            'Ne prodajemo popise ljudi. Podatke jednog studija ne pokazujemo drugom.',
          ],
          bullets: [
            'osoblju studija kod kojeg ste upisani',
            'pružateljima hostinga, baze ili e-pošte, koji rade po ugovoru i našim uputama',
            'tijelima RH ili EU kad to zakon nalaže',
          ],
          note: 'Ako bi podaci išli izvan Europskog gospodarskog prostora, koristimo zaštite koje GDPR nalaže (npr. standardne ugovorne klauzule).',
          law: 'Čl. 28. i poglavlje V. GDPR-a',
        },
        {
          id: 'koliko',
          title: 'Koliko dugo čuvamo podatke',
          summary: 'Dok su potrebni za uslugu ili dok zakon traži dulje čuvanje — onda brisanje ili anonimizacija.',
          paragraphs: [
            'Rokovi u praksi:',
          ],
          bullets: [
            'račun — dok je aktivan; nakon brisanja, još kratko dok se usluga uredno zatvori',
            'rezervacije i otkazi — dok su potrebni studiju i dok se mogu dokazati dogovoreni termini',
            'sigurnosni zapisi — kraće, samo radi zaštite sustava',
            'pretplata studija — u skladu s računovodstvenim i poreznim rokovima koji se primjenjuju na nas',
          ],
          law: 'Čl. 5. st. 1. toč. (e) GDPR-a (ograničenje pohrane)',
        },
        {
          id: 'prava',
          title: 'Vaša prava',
          summary: 'Možete pitati što imamo, ispraviti, u određenim slučajevima obrisati, ograničiti, prenijeti ili uložiti prigovor.',
          paragraphs: [
            'Po GDPR-u možete zatražiti:',
          ],
          bullets: [
            'uvid u svoje podatke',
            'ispravak ako nešto nije točno',
            'brisanje, kad su ispunjeni uvjeti',
            'ograničenje obrade',
            'prijenos podataka (kad se obrada temelji na ugovoru ili privoli i ide automatski)',
            'prigovor na obradu utemeljenu na legitimnom interesu',
            'povlačenje privole, ako ste je dali',
          ],
          note: `Pošaljite zahtjev na ${email}. Odgovaramo najkasnije u roku od mjesec dana (uz mogućnost produženja u složenim slučajevima). Neka prava nisu apsolutna — zakon ili prava drugih ih mogu ograničiti.`,
          law: 'Čl. 12.–22. GDPR-a',
        },
        {
          id: 'azop',
          title: 'Pritužba AZOP-u',
          summary: 'Ako smatrate da vaša prava nisu poštovana, možete se obratiti hrvatskom nadzornom tijelu.',
          paragraphs: [
            'Agencija za zaštitu osobnih podataka (AZOP):',
          ],
          bullets: [
            azopAddress,
            azopMail,
            azopUrl,
          ],
          law: 'Čl. 77. GDPR-a · Zakon o provedbi Opće uredbe o zaštiti podataka',
        },
        {
          id: 'sigurnost',
          title: 'Kako štitimo podatke',
          summary: 'Lozinke ne držimo kao običan tekst, pristup je ograničen, studiji su odvojeni.',
          paragraphs: [
            'Koristimo razumne tehničke i organizacijske mjere: kontrola pristupa, zaštita lozinki, odvajanje podataka po studiju.',
            'Nijedan sustav nije 100 % siguran. Ako dođe do ozbiljne povrede, postupamo kako GDPR nalaže (obavijest AZOP-u i, kad treba, vama).',
          ],
          law: 'Čl. 32.–34. GDPR-a',
        },
        {
          id: 'djeca',
          title: 'Djeca',
          summary: 'Usluga nije namijenjena djeci mlađoj od 16 godina bez odgovarajuće suglasnosti roditelja / skrbnika.',
          paragraphs: [
            'Ako saznamo da smo prikupili podatke djeteta protivno tome, obrisat ćemo ih.',
          ],
          law: 'Čl. 8. GDPR-a · Zakon o provedbi Opće uredbe o zaštiti podataka',
        },
        {
          id: 'izmjene',
          title: 'Kad se ova politika mijenja',
          summary: 'Nova verzija ide na ovu stranicu s datumom. Bitne izmjene možemo javiti i vlasnicima studija.',
          paragraphs: [
            'Ažuriramo tekst kad se promijene propisi ili način rada usluge. Nastavak korištenja nakon objave znači da ste upoznati s novom verzijom u dijelu koji se na vas odnosi.',
          ],
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <LegalPage
      docId="uvjeti"
      title="Uvjeti korištenja"
      lead="Pravila igre: što smijete očekivati od aplikacije, što od studija — i što očekujemo od vas."
      basis="Zakon o obveznim odnosima · Zakon o elektroničkoj trgovini · Zakon o zaštiti potrošača (kad se primjenjuje) · GDPR · pravo RH i EU"
      sections={[
        {
          id: 'prihvacanje',
          title: 'Prihvaćanje uvjeta',
          summary: 'Kad se registrirate ili koristite uslugu, prihvaćate ova pravila i Politiku privatnosti.',
          paragraphs: [
            `${productName} je softver za raspored i rezervacije. Ako se ne slažete s ovim uvjetima, nemojte koristiti uslugu.`,
          ],
          law: 'Zakon o obveznim odnosima · Zakon o elektroničkoj trgovini',
        },
        {
          id: 'uloge',
          title: 'Tko je tko',
          summary: 'Mi smo tehnika. Studio je usluga (trening, termin, članstvo). Vi rezervirate.',
          paragraphs: [
            'Da ne bude zabune:',
          ],
          bullets: [
            `${productName} — održava aplikaciju i tehnički omogućuje rezervacije.`,
            'Studio (partner) — postavlja radno vrijeme, kapacitet, cijene, rok otkaza i daje vam stvarnu uslugu.',
            'Vi (član / gost) — birate termin, dolazite ili otkazujete prema pravilima studija.',
          ],
          note: 'Spor o kvaliteti treninga, cijeni ili „jesam li dobio što sam platio studiju” rješavate sa studijem. Tehničke smetnje aplikacije — s nama.',
        },
        {
          id: 'racun',
          title: 'Račun i sigurnost',
          summary: 'Račun je vaš. Čuvate lozinku. Javite nam ako sumnjate da vam je netko ušao u račun.',
          paragraphs: [
            'Podaci koje unesete moraju biti točni. Odgovarate za radnje učinjene s vašeg računa.',
            'Možemo privremeno ili trajno zatvoriti račun ako kršite ova pravila, ugrožavate sigurnost ili to zatraži nadležno tijelo.',
          ],
        },
        {
          id: 'studio',
          title: 'Što studio mora poštovati',
          summary: 'Studio jamči da smije nuditi svoju uslugu i da poštuje zakon prema svojim članovima.',
          paragraphs: [
            'Studio je odgovoran za sadržaj svoje stranice, izvršenje termina, članarine, rok otkaza i reklamacije vezane uz svoju uslugu.',
            'Studio mora poštivati zaštitu osobnih podataka u dijelu u kojem je voditelj obrade. Gdje treba, sklapa s nama ugovor o obradi podataka.',
          ],
          law: 'GDPR čl. 28. · propisi o potrošačima i ugovorima u RH',
        },
        {
          id: 'termini',
          title: 'Rezervacije i otkaz',
          summary: 'Pravila otkaza postavlja studio — vi ih vidite na stranici Termini. Aplikacija ih samo primjenjuje.',
          paragraphs: [
            'Ako otkažete unutar roka studija, termin vam se u sustavu ne broji kao iskorišten. Ako otkažete kasnije ili ne dođete, studio može zadržati termin kao iskorišten — to je pravilo studija, ne „kazna” aplikacije.',
          ],
        },
        {
          id: 'naplata',
          title: 'Pretplata studija',
          summary: 'Studio plaća platformu (ako je tako dogovoreno). Kašnjenje može ograničiti rad studija u aplikaciji.',
          paragraphs: [
            'Cijene i dospijeća prikazujemo studiju u sučelju i/ili e-poštom.',
            'Plaćanje vašeg termina ili članarine studiju može ići izravno studiju. Ako kasnije uvedemo plaćanje u aplikaciji, posebno ćemo to opisati.',
          ],
        },
        {
          id: 'zabranjeno',
          title: 'Što nije dopušteno',
          summary: 'Ne dirajte tuđe račune ni tuđe termine. Ne ometajte sustav. Ne koristite uslugu za nezakonito.',
          bullets: [
            'ulazak u tuđi studio ili rezervaciju bez ovlasti',
            'napad na rad aplikacije ili zlonamjerni kod',
            'lažan, uvredljiv ili protuzakonit sadržaj',
            'sve što krši propise RH ili prava drugih ljudi',
          ],
        },
        {
          id: 'vlasnistvo',
          title: 'Što je čije',
          summary: 'Aplikacija i dizajn su naši. Sadržaj studija (tekst, logo, fotografije) ostaje studiju.',
          paragraphs: [
            'Dajemo vam pravo koristiti uslugu prema ovim uvjetima — ne prenosimo vlasništvo nad softverom.',
            'Studio nam daje dopuštenje prikazati i pohraniti svoj sadržaj samo koliko treba za rad usluge.',
          ],
        },
        {
          id: 'dostupnost',
          title: 'Dostupnost usluge',
          summary: 'Trudimo se da sve radi, ali ne možemo jamčiti nula prekida (održavanje, internet, više sile).',
          paragraphs: [
            'Bitne promjene funkcija nastojimo najaviti studijima kad je to razumno.',
          ],
        },
        {
          id: 'odgovornost',
          title: 'Odgovornost — tko štiti koga',
          summary: 'Štitimo platformu, studije i vas: svatko odgovara za svoj dio. Zakonska prava potrošača ostaju netaknuta.',
          paragraphs: [
            'U mjeri koju hrvatski zakon dopušta, platforma nije odgovorna za:',
          ],
          bullets: [
            'izvršenje ili kvalitetu usluge studija',
            'štetu zbog pogrešnih podataka koje unese korisnik ili studio',
            'posrednu štetu ili izmaklu dobit, osim u slučaju namjere ili krajnje nepažnje kad zakon ne dopušta isključenje',
          ],
          note: 'Ako ste potrošač, prava iz Zakona o zaštiti potrošača ne možemo vam ugovorom oduzeti. Studio i platforma odgovaraju svatko u svom djelokrugu — to štiti i vas i nas.',
          law: 'Zakon o obveznim odnosima · Zakon o zaštiti potrošača',
        },
        {
          id: 'potrosac',
          title: 'Ako ste potrošač',
          summary: 'Imate zaštitu koju zakon daje. Za termin se prvo javite studiju; za tehnički kvar — nama.',
          paragraphs: [
            `Reklamacije o aplikaciji: ${email}. Reklamacije o usluzi studija: kontakt studija.`,
          ],
          law: 'Zakon o zaštiti potrošača',
        },
        {
          id: 'pravo',
          title: 'Koji zakon vrijedi',
          summary: 'Hrvatsko pravo i EU pravo. Sporove rješavaju sudovi u RH; potrošači zadržavaju svoju zakonsku zaštitu.',
          paragraphs: [
            'Prvo ćemo pokušati dogovor. Tek ako to ne uspije — sud.',
          ],
          law: 'Pravo Republike Hrvatske · neposredno primjenjivo pravo EU',
        },
        {
          id: 'izmjene-uv',
          title: 'Izmjene uvjeta',
          summary: 'Nova verzija ide na ovu stranicu s datumom. Nastavak korištenja = prihvaćanje, osim ako za nešto treba izričit pristanak.',
          paragraphs: [
            `Pitanja: ${email}.`,
          ],
        },
      ]}
    />
  );
}

export function CookiesPage() {
  return (
    <LegalPage
      docId="kolacici"
      title="Politika kolačića"
      lead="Što preglednik pamti kod nas — uglavnom da ostanete prijavljeni, bez marketinških tragova."
      basis="Zakon o elektroničkim komunikacijama · GDPR · praksa ePrivacy"
      sections={[
        {
          id: 'sto',
          title: 'Što su kolačići',
          summary: 'Male datoteke ili slična pohrana u pregledniku. Kod nas služe da usluga radi, ne da vas pratimo po internetu.',
          paragraphs: [
            'Ista svrha može imati i lokalna pohrana preglednika (npr. da znate da ste prijavljeni).',
          ],
        },
        {
          id: 'koje',
          title: 'Što stvarno koristimo',
          summary: 'Nužno za prijavu i osnovni rad. Bez marketinških kolačića trećih strana.',
          bullets: [
            'prijava / sjednica — da ostanete ulogirani na siguran način',
            'osnovne postavke sučelja (npr. odabrani studio u vlasničkom dijelu)',
          ],
          note: 'Ako jednog dana uvedemo ne-nužne kolačiće, prvo ćemo tražiti privolu tamo gdje zakon to nalaže i ažurirati ovu stranicu.',
          law: 'Iznimka za strogo nužne kolačiće · čl. 6. GDPR-a',
        },
        {
          id: 'osnova',
          title: 'Zašto je to zakonito',
          summary: 'Nužno za uslugu koju ste zatražili (prijava, rezervacija) — ne za reklame.',
          paragraphs: [
            'Pravna osnova: izvršavanje ugovora / pružanje tražene usluge. Za marketing bi trebala privola.',
          ],
        },
        {
          id: 'upravljanje',
          title: 'Kako ih ugasiti',
          summary: 'U postavkama preglednika možete obrisati pohranu. Ako ugasite nužno, prijava možda neće raditi.',
          paragraphs: [
            'Odjava u aplikaciji gasi aktivnu sjednicu. Potpuno brisanje ovisi o vašem pregledniku.',
          ],
        },
        {
          id: 'vise',
          title: 'Više o podacima',
          summary: 'Opća pravila su u Politici privatnosti.',
          paragraphs: [
            `Kontakt: ${email}.`,
          ],
        },
      ]}
    />
  );
}

export function FeedbackPage() {
  return (
    <InfoPage title="Povratna informacija">
      <p>
        Ako nešto zapne, ili vam u danu fali nešto što biste stvarno koristili,
        dovoljna je jedna rečenica.
      </p>
      <p>
        Pošaljite je na <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </InfoPage>
  );
}

export function ContactPage() {
  return (
    <InfoPage title="Kontakt">
      <p>Za svoj termin javite se studiju kod kojeg ste upisani.</p>
      <p>
        Za sam anyminutes pišite na{' '}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </InfoPage>
  );
}
