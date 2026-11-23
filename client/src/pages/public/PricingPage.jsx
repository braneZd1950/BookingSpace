import { Link } from 'react-router-dom';
import MarketingSeoPage from './MarketingSeoPage.jsx';
import { PRICING_SEO, breadcrumbJsonLd } from '../../lib/seo.js';

export default function PricingPage() {
  const crumbs = [
    { name: 'Početna', path: '/' },
    { name: 'Cijene', path: PRICING_SEO.path },
  ];

  return (
    <MarketingSeoPage
      seo={PRICING_SEO}
      kicker="Cjenik"
      h1={PRICING_SEO.h1}
      lead="Tijekom zatvorenog pilota korištenje Blizaria je besplatno. Ne naplaćujemo pretplatu dok ne objavimo drugačije — o tome ćete biti obaviješteni unaprijed."
      ctaLabel="Registrirajte studio"
      bullets={[
        'Pilot: 0 EUR — rezervacije, članovi, termini, vlastita stranica',
        'Bez skrivenih naknada u ovoj fazi',
        'Online kartična naplata i blagajna UI nisu dio pilota',
        'Buduće cijene bit će objavljene prije uvođenja',
      ]}
      breadcrumbs={crumbs}
      jsonLd={breadcrumbJsonLd(crumbs)}
    >
      <p className="seo-mkt__note">
        Imate pitanje o pilota ili kasnijem cjeniku?
        {' '}
        <Link to="/kontakt">Javite se</Link>
        .
      </p>
    </MarketingSeoPage>
  );
}
