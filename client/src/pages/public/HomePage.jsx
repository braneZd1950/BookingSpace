import { Link } from 'react-router-dom';
import { getHomePartners, SHOW_HOME_PARTNERS } from '../../homePartners.js';
import './HomePage.scss';

const steps = [
  {
    n: '01',
    title: 'Otvorite studio',
    text: 'Registracija u minutama. Dobijete vlastitu stranicu (/s/vas-studio) — ne profil u tuđem katalogu.',
  },
  {
    n: '02',
    title: 'Postavite raspored',
    text: 'Radno vrijeme, kapacitet, paketi ili članarine. Uplata može ostati uživo u salonu.',
  },
  {
    n: '03',
    title: 'Pošaljite link klijentima',
    text: 'Oni rezerviraju kod vas. Vi u kalendaru vidite tko dolazi danas — bez WhatsApp bilježnice.',
  },
];

const edges = [
  {
    title: 'Vaš brand, ne katalog',
    text: 'Klijent otvara vašu stranicu. Nema pretrage „u blizini” koja ga šalje konkurenciji.',
  },
  {
    title: 'Uplata uživo je OK',
    text: 'Članarinu evidenirate vi. Ne forsiramo online karticu ni proviziju na svaku rezervaciju.',
  },
  {
    title: 'Jedan jasan dan',
    text: 'Vlasnik odmah vidi koliko termina danas ima i dijeljenje linka u jednom potezu.',
  },
  {
    title: 'Privola ugrađena',
    text: 'Bez privole nema rezervacije. Manje sive zone oko podataka nego u marketplace appovima.',
  },
];

export default function HomePage() {
  const { partners, label, ariaLabel, live } = getHomePartners();
  const loop = [...partners, ...partners];

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="home-brand">
        <div className="home__hero-shade" aria-hidden="true" />
        <div className="home__hero-copy">
          <p className="home__brand" id="home-brand">anyminutes</p>
          <h1>Termini i članarine na vašoj stranici — bez marketplacea.</h1>
          <p className="home__lead">
            Za igraonice, wellness, salone i studije. Klijenti rezerviraju kod vas;
            vi držite kalendar i odnos — ne dijelite ih s katalogom.
          </p>
          <div className="home__actions">
            <Link className="home__cta" to="/register">
              Postanite partner
            </Link>
            <Link className="home__cta home__cta--ghost" to="/login">
              Prijava
            </Link>
          </div>
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

      <section className="home__block home__block--wide" aria-labelledby="home-edge">
        <h2 id="home-edge">Zašto drugačije</h2>
        <p className="home__edge-lead">
          Katalog-aplikacije donose otkriće, ali i dijeljenje klijenata, složen setup i
          pritisak na online naplatu. anyminutes je namjerno studio-first.
        </p>
        <ul className="home__edges">
          {edges.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home__block" aria-labelledby="home-what">
        <h2 id="home-what">Što je anyminutes</h2>
        <p>
          Alat za raspored: slobodni termini, kapacitet i popis dolazaka.
          Fitness često radi na članarinama; igraonice i wellness češće na
          rezervaciji ili paketu posjeta. Ista platforma — drugi način rada.
        </p>
      </section>

      <section className="home__block home__block--wide" aria-labelledby="home-how">
        <h2 id="home-how">Kako radi</h2>
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

      <section className="home__split" aria-labelledby="home-partner">
        <div>
          <h2 id="home-partner">Za partnere</h2>
          <p>
            Vodite raspored i klijente iz jednog sučelja — bez forsiranja modela
            „mjesečni član”.
          </p>
          <ul>
            <li>Vlastita javna stranica (dijelite link, ne katalog)</li>
            <li>Termini, kapacitet i „tko dolazi danas”</li>
            <li>Članarine ili paketi — uplata može biti uživo</li>
            <li>Email potvrde članu + obavijest studiju</li>
          </ul>
          <Link className="home__text-link" to="/register">
            Postanite partner
          </Link>
        </div>
        <div>
          <h2 id="home-member">Za klijente</h2>
          <p>
            Otvorite stranicu svog studija, prijavite se i rezervirajte.
            Vidite preostale termine, otkazujete prema pravilima studija —
            bez traženja salona u marketplace feedu.
          </p>
          <Link className="home__text-link" to="/login">
            Prijava klijenta
          </Link>
        </div>
      </section>

      <section className="home__close" aria-labelledby="home-close">
        <h2 id="home-close">Spremni za red u rasporedu?</h2>
        <p>
          Otvorite studio, pošaljite link klijentima i držite kalendar kod sebe.
        </p>
        <div className="home__actions home__actions--close">
          <Link className="home__cta home__cta--solid" to="/register">
            Postanite partner
          </Link>
          <Link className="home__cta home__cta--line" to="/login">
            Prijava
          </Link>
        </div>
      </section>
    </main>
  );
}
