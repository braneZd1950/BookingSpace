import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import { BRAND } from '../../lib/brand.js';
import './FeaturesPage.scss';

const pillars = [
  {
    id: 'site',
    title: 'Vaše poslovanje, vaša stranica',
    text: 'Postavite vlastitu online stranicu, predstavite svoje usluge, informacije i dostupne termine. Podijelite poveznicu sa svojim klijentima i omogućite im da rezerviraju kada im odgovara.',
  },
  {
    id: 'booking',
    title: 'Manje dogovaranja, više vremena',
    text: 'Smanjite potrebu za porukama, pozivima i ručnim dogovaranjem termina. Klijenti mogu samostalno napraviti rezervaciju, a vi imate pregled svega što je dogovoreno.',
  },
  {
    id: 'organize',
    title: 'Organizacija na jednom mjestu',
    text: 'Upravljajte rasporedom, rezervacijama, klijentima, članovima i članarinama kroz jedan pregledan sustav, bez potrebe da koristite više različitih alata.',
  },
  {
    id: 'fit',
    title: 'Prilagođeno vašem načinu rada',
    text: 'Bez obzira vodite li treninge, pružate individualne usluge, organizirate aktivnosti ili radite s članovima, Blizari se razvija kako bi podržao različite načine poslovanja.',
  },
];

function PillarIcon({ id }) {
  const common = {
    className: 'features__icon',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  if (id === 'booking') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M12 8.2v4.1l2.7 1.6" />
      </svg>
    );
  }

  if (id === 'organize') {
    return (
      <svg {...common}>
        <rect x="4.5" y="5.5" width="15" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M8 3.9v3M16 3.9v3M4.5 10.2h15M9 14h6M9 17h3.5" />
      </svg>
    );
  }

  if (id === 'fit') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          d="M12 4.6v1.7M12 17.7v1.7M4.6 12h1.7M17.7 12h1.7M6.6 6.6l1.2 1.2M16.2 16.2l1.2 1.2M17.4 6.6l-1.2 1.2M7.8 16.2l-1.2 1.2"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3.8" y="5" width="16.4" height="14" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M3.8 9.2h16.4M8 5v4.2" />
    </svg>
  );
}

export default function FeaturesPage() {
  return (
    <main className="features">
      <div className="features__atmosphere" aria-hidden="true">
        <span className="features__orb features__orb--a" />
        <span className="features__orb features__orb--b" />
        <span className="features__grain" />
        <span className="features__watermark">
          <BrandWordmark slot="watermark" tone="dark" decorative />
        </span>
      </div>

      <div className="features__shell">
        <header className="features__hero">
          <p className="features__brand">
            <BrandWordmark slot="page" tone="dark" />
          </p>
          <p className="features__kicker">Mogućnosti</p>
          <h1>Mogućnosti Blizaria</h1>
          <p className="features__subtitle">
            Sve što vam treba za organizaciju poslovanja.
          </p>
          <p className="features__lede">
            Blizari vam pomaže organizirati svakodnevni rad, upravljati klijentima i
            rezervacijama te omogućiti jednostavniji način dogovaranja termina. Sve
            na jednom mjestu, prilagođeno vašem poslovanju.
          </p>
        </header>

        <ul className="features__grid">
          {pillars.map((item) => (
            <li key={item.id} className="features__card">
              <span className="features__icon-wrap" aria-hidden="true">
                <PillarIcon id={item.id} />
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <section className="features__close" aria-labelledby="features-close">
          <p className="features__close-kicker">{BRAND.sloganHr}</p>
          <h2 id="features-close">Vi vodite posao. Blizari vam pomaže u organizaciji.</h2>
          <p>
            Započnite s vlastitom stranicom i pojednostavnite način na koji
            upravljate svojim poslovanjem.
          </p>
          <div className="features__actions">
            <Link className="features__cta" to="/register">
              Napravite svoju stranicu
            </Link>
            <Link className="features__cta features__cta--ghost" to="/">
              Natrag na početnu
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
