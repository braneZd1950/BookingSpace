import { Link } from 'react-router-dom';
import { getHomePartners } from '../../homePartners.js';
import './HomePage.scss';

const steps = [
  {
    n: '01',
    title: 'Postanite partner',
    text: 'Registrirajte se e-poštom i nazivom obrta. Dobijete adresu npr. igraonica-luka.booking.hr.',
  },
  {
    n: '02',
    title: 'Postavite raspored',
    text: 'Unesite radno vrijeme, kapacitet i način rada: jednokratni termini, paketi posjeta ili mjesečne članarine — ovisno o poslu.',
  },
  {
    n: '03',
    title: 'Klijenti rezerviraju',
    text: 'Klijent otvara vašu stranicu, vidi slobodne sate i rezervira. Vi u kalendaru vidite tko dolazi.',
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
          <h1>Organizacija termina bez bilježnice i WhatsAppa.</h1>
          <p className="home__lead">
            Za igraonice, wellness, salone i studije — sve koji dogovaraju sate,
            kapacitet i tko dolazi, bez obzira imaju li „članove” ili samo goste.
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
      </section>

      <section className="home__block" aria-labelledby="home-what">
        <h2 id="home-what">Što je anyminutes</h2>
        <p>
          Alat za raspored: slobodni termini, kapacitet i popis dolazaka na jednom
          mjestu. Fitness centri često rade na članarinama; igraonice i wellness
          češće na rezervaciji termina ili paketu posjeta. Ista platforma — drugačiji
          način rada.
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
            <li>Javna stranica s radnim vremenom i kontaktom</li>
            <li>Termini i kapacitet (igraonica, tretman, trening…)</li>
            <li>Po potrebi: paketi posjeta ili članarine</li>
            <li>Kalendar dolazaka i postavke računa</li>
          </ul>
          <Link className="home__text-link" to="/register">
            Postanite partner
          </Link>
        </div>
        <div>
          <h2 id="home-member">Za klijente</h2>
          <p>
            Aktivirali su vam članarinu? Prijavite se i sami odaberite termin.
            Vidite radno vrijeme svog studija, rezervirate i otkazujete prema
            njegovim pravilima, a uvijek znate koliko vam je treninga ostalo.
          </p>
          <Link className="home__text-link" to="/login">
            Prijava klijenta
          </Link>
        </div>
      </section>

      <section className="home__close" aria-labelledby="home-close">
        <h2 id="home-close">Spremni za red u rasporedu?</h2>
        <p>
          Prijavite poslovanje kao partner. Klijenti dolaze na vašu stranicu i
          rezerviraju — vi držite kalendar.
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
