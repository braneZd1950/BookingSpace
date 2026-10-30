import { Link } from 'react-router-dom';
import { getHomePartners, SHOW_HOME_PARTNERS } from '../../lib/homePartners.js';
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

const benefits = [
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
];

const steps = [
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
];

const faqs = [
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

export default function HomePage() {
  const { partners, label, ariaLabel, live } = getHomePartners();
  const loop = [...partners, ...partners];

  return (
    <main className="home">
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
        </div>
        <div className="home__hero-copy">
          <p className="home__brand" id="home-brand">anyminutes</p>
          <h1>Vaši termini. Vaši klijenti. Jedno mjesto.</h1>
          <p className="home__lead">
            Napravite vlastitu stranicu za rezervacije, podijelite link s klijentima
            i vodite cijeli raspored bez stalnih poruka i dogovaranja. Jednostavno, od prvog dana.
          </p>
          <div className="home__actions">
            <Link className="home__cta" to="/register">
              Napravite svoju stranicu
            </Link>
            <a className="home__cta home__cta--ghost" href="#kako">
              Pogledajte kako radi
            </a>
          </div>
          <p className="home__trust">
            Postavljanje traje svega nekoliko minuta. Bez komplikacija.
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
        <h2 id="home-problem">Poznato vam je ovo?</h2>
        <div className="home__prose">
          <p>
            Dan vam je pun, a telefon ne prestaje zvoniti. Poruke o terminima stižu
            kasno navečer i u pauzama. Netko otkaže u zadnji čas, a vi ručno tražite
            kome taj termin ponuditi.
          </p>
          <p>
            Raspored vam je na papiru, u glavi i u tri različite aplikacije.
            Teško je pratiti tko dolazi, tko još nije platio članarinu i koji je
            termin slobodan.
          </p>
          <p>
            Umjesto da radite svoj posao, veći dio dana provodite dogovarajući se oko njega.
          </p>
        </div>
      </section>

      <section className="home__block" aria-labelledby="home-solution">
        <h2 id="home-solution">anyminutes preuzima dogovaranje umjesto vas</h2>
        <div className="home__prose">
          <p>
            S anyminutesom klijenti sami rezerviraju termin preko vaše stranice,
            u bilo koje doba dana. Vi u svakom trenutku vidite tko dolazi i kada,
            sve na jednom mjestu.
          </p>
          <p>
            Nema više prebrojavanja poruka ni ručnog upisivanja termina.
            Raspored se slaže sam, a vama ostaje više vremena za klijente i za posao.
          </p>
          <p>Jednostavno za vas i jednostavno za vaše klijente.</p>
        </div>
      </section>

      <section
        id="prednosti"
        className="home__block home__block--wide home__anchor"
        aria-labelledby="home-benefits"
      >
        <h2 id="home-benefits">Zašto vlasnici biraju anyminutes</h2>
        <ul className="home__edges">
          {benefits.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="kako"
        className="home__block home__block--wide home__anchor"
        aria-labelledby="home-how"
      >
        <h2 id="home-how">U tri koraka do prvih rezervacija</h2>
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
      </section>

      <section className="home__block" aria-labelledby="home-page">
        <h2 id="home-page">Vlastita stranica koju dijelite samo sa svojim klijentima</h2>
        <div className="home__prose">
          <p>
            Svaki posao kod nas dobiva svoju online stranicu i svoj link za rezervacije.
            Na njoj su vaše usluge, vaše radno vrijeme i vaš način rada.
          </p>
          <p>
            Taj link šaljete izravno svojim klijentima — u poruci, na društvenim mrežama
            ili na posjetnici. Klijent ga otvori i odmah rezervira termin.
          </p>
          <p>
            Stranica je vaša i služi samo vašem poslu. Klijenti ne lutaju među drugim
            ponudama — dolaze točno k vama.
          </p>
        </div>
        <p className="home__note">
          Primjer adrese:
          {' '}
          <code className="home__code">/s/vas-studio</code>
        </p>
      </section>

      <section className="home__block" aria-labelledby="home-ops">
        <h2 id="home-ops">Termini, raspored i članarine na jednom mjestu</h2>
        <div className="home__prose">
          <p>
            U anyminutesu na jednom mjestu vodite termine, svoj raspored, popis
            klijenata i njihove članarine.
          </p>
          <p>
            Vidite tko je rezervirao, koji su termini slobodni i kako vam izgleda tjedan.
            Podatke o klijentima držite uredno, bez bilježnica i razbacanih poruka.
          </p>
          <p>
            Sve je posloženo tako da brzo nađete ono što trebate i da manje vremena
            trošite na administraciju.
          </p>
        </div>
      </section>

      <section className="home__split" aria-labelledby="home-clients">
        <div>
          <h2 id="home-clients">I vaši klijenti će biti zadovoljni</h2>
          <p>
            Vaši klijenti rezerviraju termin u nekoliko klikova, bez dopisivanja i
            čekanja na odgovor. Jasno vide koji su termini slobodni i biraju onaj
            koji im najbolje odgovara.
          </p>
          <p className="home__split-extra">
            Rezerviraju kad njima odgovara — ujutro, navečer ili za vikend.
            Jednostavno iskustvo znači da se rado vraćaju.
          </p>
          <Link className="home__text-link" to="/otkrij">
            Otkrijte studije
          </Link>
        </div>
        <div>
          <h2 id="home-trust-title">Vaš posao i vaši klijenti ostaju vaši</h2>
          <p>
            anyminutes nije javni imenik u kojem klijenti pregledavaju i uspoređuju
            razne poslove. Nema preusmjeravanja vaših klijenata drugima.
          </p>
          <p className="home__split-extra">
            Vi dobivate vlastiti online prostor i vlastiti link, a mi vam dajemo
            alate da sve vodite lakše. Odnos s vašim klijentima ostaje vaš —
            mi smo tu samo da vam olakšamo svakodnevni posao.
          </p>
          <Link className="home__text-link" to="/register">
            Napravite svoju stranicu
          </Link>
        </div>
      </section>

      <section className="home__close" aria-labelledby="home-close">
        <h2 id="home-close">Spremni za manje dogovaranja, a više posla?</h2>
        <p>
          Napravite svoju stranicu danas i pustite da rezervacije stižu same.
          Postavljanje traje svega nekoliko minuta.
        </p>
        <div className="home__actions home__actions--close">
          <Link className="home__cta home__cta--solid" to="/register">
            Napravite svoju stranicu
          </Link>
          <Link className="home__cta home__cta--line" to="/login">
            Prijava
          </Link>
        </div>
        <p className="home__trust home__trust--close">
          Jednostavno za postaviti. Jednostavno za koristiti.
        </p>
      </section>

      <section
        id="faq"
        className="home__block home__block--wide home__anchor home__faq-block"
        aria-labelledby="home-faq"
      >
        <h2 id="home-faq">Česta pitanja</h2>
        <div className="home__faq">
          {faqs.map((item) => (
            <details key={item.q} className="home__faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
