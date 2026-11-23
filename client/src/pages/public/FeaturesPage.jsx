import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import MarketingIconCards from '../../components/marketing/MarketingIconCards.jsx';
import SeoHead from '../../components/SeoHead.jsx';
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

export default function FeaturesPage() {
  return (
    <main className="features">
      <SeoHead
        title={`Mogućnosti ${BRAND.name} — rezervacije, članovi, termini`}
        description="Pregled mogućnosti Blizaria: vlastita stranica, online rezervacije, raspored, članovi i članarine na jednom mjestu."
        path="/mogucnosti"
      />
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

        <MarketingIconCards
          items={pillars}
          listClassName="features__grid"
          cardClassName="features__card"
          iconWrapClassName="features__icon-wrap"
          iconClassName="features__icon"
          titleTag="h2"
        />

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
            <Link className="features__cta features__cta--ghost" to="/funkcionalnosti">
              Detaljne funkcionalnosti
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
