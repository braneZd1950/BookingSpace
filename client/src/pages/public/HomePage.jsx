import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import MarketingIconCards from '../../components/marketing/MarketingIconCards.jsx';
import SeoHead from '../../components/SeoHead.jsx';
import { HOME_FAQS } from '../../content/homeFaqs.js';
import { BRAND } from '../../lib/brand.js';
import { contactEmail } from '../../lib/contact.js';
import { getHomePartners, SHOW_HOME_PARTNERS } from '../../lib/homePartners.js';
import {
  HOME_SEO,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from '../../lib/seo.js';
import './HomePage.scss';

const calendars = [
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
];

const clocks = [
  { time: '10:00', label: 'Maja', hour: 10, minute: 0 },
  { time: '17:30', label: 'Ivan', hour: 17, minute: 30 },
  { time: '11:00', label: 'Rođendan', hour: 11, minute: 0 },
  { time: '09:15', label: 'Ana', hour: 9, minute: 15 },
];

const features = [
  {
    id: 'site',
    title: 'Vaša poslovna stranica',
    text: 'Predstavite svoje poslovanje putem vlastite online stranice. Prikažite informacije, usluge, radno vrijeme i dostupne termine. Poveznicu podijelite sa svojim klijentima i omogućite im jednostavnu rezervaciju.',
  },
  {
    id: 'booking',
    title: 'Online rezervacije',
    text: 'Omogućite klijentima da sami pregledaju dostupnost i rezerviraju termine putem vaše stranice. Rezervacije možete pregledavati, upravljati njima, mijenjati ih ili otkazivati iz svojeg poslovnog prostora.',
  },
  {
    id: 'calendar',
    title: 'Raspored i kalendar',
    text: 'Organizirajte svoje termine, aktivnosti i rezervacije kroz pregledan kalendar. Jednostavno pratite što vas očekuje, kada ste dostupni i kako izgleda vaš raspored.',
  },
  {
    id: 'members',
    title: 'Klijenti, članovi i članarine',
    text: 'Vodite evidenciju svojih klijenata i članova, pratite njihove članarine i status te lakše organizirajte njihovo korištenje svojih usluga.',
  },
  {
    id: 'overview',
    title: 'Pregled poslovanja',
    text: 'Na jednom mjestu pratite osnovne informacije o rezervacijama, članovima i članarinama. Imajte bolji pregled svakodnevnog rada i lakše pratite što se događa u vašem poslovanju.',
  },
  {
    id: 'settings',
    title: 'Postavke prilagođene vama',
    text: 'Prilagodite stranicu i osnovne postavke svom načinu rada. Uredite podatke o poslovanju, kontakt, radno vrijeme, izgled stranice i druge dostupne mogućnosti prema svojim potrebama.',
  },
];

const FEATURE_ICON_IDS = {
  site: 'site',
  booking: 'booking-check',
  calendar: 'calendar',
  members: 'members',
  overview: 'overview',
  settings: 'settings',
};

const industries = [
  {
    title: 'Fitness i sportske aktivnosti',
    text: 'Grupni treninzi, teretane, fitness studiji i individualni treninzi.',
  },
  {
    title: 'Dječje igraonice i proslave',
    text: 'Rezervacije prostora, rođendana, proslava i posebnih događanja.',
  },
  {
    title: 'Wellness i ljepota',
    text: 'Masaže, wellness centri, kozmetički i frizerski saloni.',
  },
  {
    title: 'Zdravlje i stručne usluge',
    text: 'Ordinacije, terapeuti i druge djelatnosti koje rade s terminima i klijentima.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Napravite svoj račun',
    text: 'Registrirajte se i unesite osnovne podatke o svom poslovanju.',
  },
  {
    n: '02',
    title: 'Uredite svoju stranicu i usluge',
    text: 'Dodajte usluge, radno vrijeme i informacije koje želite pokazati klijentima.',
  },
  {
    n: '03',
    title: 'Podijelite svoj link',
    text: 'Pošaljite ga postojećim klijentima ili ga stavite na društvene mreže — dolaze izravno k vama.',
  },
  {
    n: '04',
    title: 'Vodite poslovanje iz jednog mjesta',
    text: 'Pratite raspored, rezervacije, članove i osnovni pregled poslovanja u svom sučelju.',
  },
];

export default function HomePage() {
  const { partners, label, ariaLabel, live } = getHomePartners();
  const loop = [...partners, ...partners];

  return (
    <main className="home">
      <SeoHead
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        path={HOME_SEO.path}
        jsonLd={[organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()]}
      />
      <section className="home__hero" aria-labelledby="home-brand">
        <div className="home__hero-shade" aria-hidden="true" />
        <div className="home__calendars" aria-hidden="true">
          {calendars.map((sheet, index) => (
            <article key={sheet.month} className={`home__cal home__cal--${index + 1}`}>
              <header>
                <span>{sheet.month}</span>
                <span>{sheet.year}</span>
              </header>
              <div className="home__cal-grid">
                {sheet.days.map((day) => (
                  <span
                    key={day}
                    className={day === sheet.booked ? 'is-booked' : undefined}
                  >
                    {day}
                  </span>
                ))}
              </div>
              <p>{sheet.note}</p>
            </article>
          ))}
          {clocks.map((clock, index) => {
            const hourAngle = ((clock.hour % 12) + clock.minute / 60) * 30;
            const minuteAngle = clock.minute * 6;
            return (
              <article key={clock.time + clock.label} className={`home__clock home__clock--${index + 1}`}>
                <div className="home__clock-face">
                  <span className="home__clock-tick home__clock-tick--12" />
                  <span className="home__clock-tick home__clock-tick--3" />
                  <span className="home__clock-tick home__clock-tick--6" />
                  <span className="home__clock-tick home__clock-tick--9" />
                  <span
                    className="home__clock-hand home__clock-hand--hour"
                    style={{ '--hand': `${hourAngle}deg` }}
                  />
                  <span
                    className="home__clock-hand home__clock-hand--minute"
                    style={{ '--hand': `${minuteAngle}deg` }}
                  />
                  <span className="home__clock-center" />
                </div>
                <p>
                  <strong>{clock.time}</strong>
                  {' · '}
                  {clock.label}
                </p>
              </article>
            );
          })}
        </div>
        <div className="home__hero-copy">
          <p className="home__brand" id="home-brand">
            <BrandWordmark slot="home" tone="dark" />
          </p>
          <p className="home__slogan">{BRAND.sloganHr}</p>
          <h1>Upravljajte svojim poslovanjem i terminima na jednom mjestu.</h1>
          <p className="home__lead">
            Blizari je platforma za poslovanja koja žele jednostavnije upravljati
            terminima, rezervacijama, klijentima i uslugama. Kreirajte vlastitu
            poslovnu stranicu, omogućite online rezervacije i pratite poslovanje
            iz jedne aplikacije.
          </p>
          <p className="home__lead home__lead--tight">
            Svaki studio zadržava svoje klijente i vlastitu stranicu — Blizari je
            alat za organizaciju, ne katalog koji šalje klijente konkurenciji.
          </p>
          <div className="home__actions">
            <Link className="home__cta" to="/register">
              Isprobajte Blizari
            </Link>
            <a className="home__cta home__cta--ghost" href="#kako">
              Pogledajte kako funkcionira
            </a>
          </div>
          <p className="home__trust">
            Radi u pregledniku. Postavljanje traje svega nekoliko minuta.
          </p>
        </div>

        {SHOW_HOME_PARTNERS ? (
          <div
            className={`home__partners${live ? ' home__partners--live' : ''}`}
            aria-label={ariaLabel}
          >
            <p className="home__partners-label">{label}</p>
            <div className="home__partners-viewport">
              <ul className="home__partners-track">
                {loop.map((partner, index) => (
                  <li key={`${partner.name}-${index}`}>
                    {partner.href ? (
                      <Link to={partner.href}>{partner.name}</Link>
                    ) : (
                      <span>{partner.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>

      <section className="home__block" aria-labelledby="home-problem">
        <h2 id="home-problem">Vaš dan je previše vrijedan za stalno dogovaranje</h2>
        <div className="home__prose">
          <p>Poznajete li ovu svakodnevicu?</p>
          <p>
            Poruke stižu tijekom rada, navečer i vikendom. Jedan klijent pita za
            slobodan termin, drugi želi promijeniti rezervaciju, a treći
            provjerava članarinu.
          </p>
          <p>
            Raspored je u bilježnici, porukama i različitim aplikacijama. Morate
            pamtiti tko dolazi, što je slobodno i tko je već rezervirao.
          </p>
          <p>
            Umjesto da se posvetite klijentima i svom poslu, vrijeme trošite na
            organizaciju.
          </p>
          <p className="home__prose-strong">Vrijeme je da to pojednostavimo.</p>
        </div>
      </section>

      <section
        id="prednosti"
        className="home__block home__block--wide home__anchor home__offer"
        aria-labelledby="home-features"
      >
        <h2 id="home-features">Što Blizari nudi danas</h2>
        <p className="home__edge-lead">
          Sve što vam treba za organizaciju poslovanja, klijenata i rezervacija —
          na jednom mjestu.
        </p>
        <MarketingIconCards
          items={features}
          listClassName="home__offer-grid"
          cardClassName="home__offer-card"
          iconWrapClassName="home__offer-icon-wrap"
          iconClassName="home__offer-icon"
          iconIdFor={(id) => FEATURE_ICON_IDS[id] || id}
        />
        <div className="home__offer-close">
          <p className="home__offer-close-kicker">{BRAND.sloganHr}</p>
          <p>Manje vremena na organizaciju. Više vremena za ono što je zaista važno.</p>
        </div>
      </section>

      <section className="home__block home__block--wide" aria-labelledby="home-industries">
        <h2 id="home-industries">Jedna platforma. Različite djelatnosti.</h2>
        <p className="home__edge-lead">
          Blizari nije napravljen samo za jednu vrstu usluge. Ako radite s
          rasporedom, klijentima i rezervacijama, može vam pomoći da poslovanje
          vodite preglednije.
        </p>
        <ul className="home__edges">
          {industries.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="home__prose home__prose--after">
          <p>
            <strong>I slični poslovi.</strong>
            {' '}
            Važno je kako radite — s terminima, članovima i vlastitim klijentima —
            a ne da vas stavljamo u javni katalog usluga.
          </p>
        </div>
      </section>

      <section className="home__block" aria-labelledby="home-page">
        <h2 id="home-page">Vaše poslovanje dobiva vlastitu online stranicu</h2>
        <div className="home__prose">
          <p>
            Ne trebate posebno graditi web-stranicu samo da bi klijenti znali kako
            rezervirati.
          </p>
          <p>
            U Blizariju na jednom mjestu predstavite poslovanje, usluge, radno
            vrijeme i dostupne termine.
          </p>
          <p>
            Dobivate vlastiti link koji dijelite putem WhatsAppa, Instagrama,
            Facebooka, e-maila ili na postojećoj stranici.
          </p>
          <p>
            Klijent otvara vašu stranicu i rezervira izravno kod vas — ne bira
            između tuđih ponuda.
          </p>
        </div>
        <p className="home__note">
          Primjer adrese:
          {' '}
          <code className="home__code">/s/vase-poslovanje</code>
        </p>
        <p className="home__prose-strong">Vaša stranica. Vaše usluge. Vaši klijenti.</p>
      </section>

      <section className="home__split" aria-labelledby="home-clients">
        <div>
          <h2 id="home-clients">Jednostavno za vas. Jednostavno za vaše klijente.</h2>
          <p>
            Klijenti ne moraju čekati odgovor na poruku da vide što je dostupno.
          </p>
          <p className="home__split-extra">
            Otvare vašu stranicu, pregledaju mogućnosti i odaberu termin koji im
            odgovara. Vi u istom sustavu vidite tko dolazi i kako izgleda raspored.
          </p>
          <p>
            Blizari povezuje ta dva iskustva bez nepotrebnog dopisivanja — uz
            alate koje koristite za vođenje cijelog posla, ne samo rezervacije.
          </p>
        </div>
        <div>
          <h2 id="home-trust-title">Vaš posao i vaši klijenti ostaju vaši</h2>
          <p>
            Blizari nije javni imenik niti tržište na kojem se klijenti
            preusmjeravaju drugim pružateljima usluga.
          </p>
          <p className="home__split-extra">
            Ne natječete se s drugim poslovanjima unutar platforme. Svako
            poslovanje ima vlastitu stranicu i vlastiti link. Vi odlučujete kome
            ga dijelite.
          </p>
          <p>
            Mi dajemo alate za organizaciju. Vi zadržavate odnos sa svojim
            klijentima.
          </p>
          <p className="home__prose-strong">
            Vi vodite posao. Mi pomažemo da ga lakše organizirate.
          </p>
        </div>
      </section>

      <section
        id="kako"
        className="home__block home__block--wide home__anchor"
        aria-labelledby="home-how"
      >
        <h2 id="home-how">Kako započeti?</h2>
        <ol className="home__steps">
          {steps.map((step) => (
            <li key={step.n}>
              <span className="home__step-n" aria-hidden="true">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="home__actions">
          <Link className="home__cta" to="/register">
            Napravite svoju Blizari stranicu
          </Link>
        </div>
      </section>

      <section className="home__block" aria-labelledby="home-story">
        <h2 id="home-story">Više vremena za posao koji volite</h2>
        <div className="home__prose">
          <p>
            Blizari nastaje iz jednostavne ideje: vlasnici malih i srednjih
            poslovanja ne bi trebali trošiti sate na ručno dogovaranje i
            administraciju.
          </p>
          <p>
            Gradimo alat koji je jednostavan, prilagodljiv različitim
            djelatnostima i dovoljno praktičan za svakodnevno vođenje posla —
            onoliko koliko je danas stvarno dostupno i korisno.
          </p>
          <p className="home__prose-strong">
            Manje administracije. Više reda. Više vremena za vaše klijente.
          </p>
        </div>
        <Link className="home__text-link" to="/o-nama">
          Upoznajte Blizari
        </Link>
      </section>

      <section className="home__block" aria-labelledby="home-seo-links">
        <h2 id="home-seo-links">Za različite djelatnosti i potrebe</h2>
        <p>
          Pogledajte kako Blizari pomaže konkretnim vrstama poslovanja i što
          možete raditi danas — bez obećanja koja još nisu u proizvodu.
        </p>
        <ul className="home__link-list">
          <li><Link to="/za-koga-je-blizari">Za koga je Blizari</Link></li>
          <li><Link to="/za-koga-je-blizari/fitness">Fitness i grupni treninzi</Link></li>
          <li><Link to="/za-koga-je-blizari/pilates-yoga">Pilates i yoga</Link></li>
          <li><Link to="/za-koga-je-blizari/kozmeticki-saloni">Kozmetički saloni</Link></li>
          <li><Link to="/za-koga-je-blizari/igraonice">Igraonice</Link></li>
          <li><Link to="/za-koga-je-blizari/wellness">Wellness</Link></li>
          <li><Link to="/funkcionalnosti">Funkcionalnosti</Link></li>
          <li><Link to="/cijene">Cijene (pilot)</Link></li>
        </ul>
      </section>

      <section className="home__close" aria-labelledby="home-close">
        <h2 id="home-close">Vaš posao zaslužuje jednostavniju organizaciju.</h2>
        <p>
          Napravite svoju stranicu i vodite raspored, članove i rezervacije na
          jednom mjestu — u pregledniku, bez obećanja koja još nisu dio proizvoda.
        </p>
        <div className="home__actions home__actions--close">
          <Link className="home__cta home__cta--solid" to="/register">
            Započnite s Blizarijem
          </Link>
          <Link className="home__cta home__cta--line" to="/kontakt">
            Kontaktirajte nas
          </Link>
        </div>
        <p className="home__trust home__trust--close">
          Postavite jednom. Koristite svaki dan.
        </p>
      </section>

      <section
        id="faq"
        className="home__block home__block--wide home__anchor home__faq-block"
        aria-labelledby="home-faq"
      >
        <h2 id="home-faq">Česta pitanja</h2>
        <p className="home__faq-lead">
          Odgovori na najčešća pitanja o Blizariju i načinu na koji vam može olakšati
          vođenje poslovanja.
        </p>
        <div className="home__faq">
          {HOME_FAQS.map((item) => (
            <details key={item.q} className="home__faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <div className="home__faq-close">
          <p className="home__faq-close-kicker">{BRAND.sloganHr}</p>
          <p>
            Blizari — platforma za jednostavnije upravljanje uslužnim poslovanjem.
            Stranica, raspored, klijenti, članovi i rezervacije na jednom mjestu.
          </p>
          <p>
            Imate još pitanja?
            {' '}
            <Link to="/kontakt">Slobodno nam se javite.</Link>
            {' '}
            Ili pišite na
            {' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
