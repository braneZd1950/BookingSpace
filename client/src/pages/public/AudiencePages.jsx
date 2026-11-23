import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import MarketingSeoPage from './MarketingSeoPage.jsx';
import {
  AUDIENCE_HUB,
  AUDIENCE_PAGES,
  breadcrumbJsonLd,
  organizationJsonLd,
} from '../../lib/seo.js';
import { NotFoundPage } from './StatusPage.jsx';

const LABELS = {
  fitness: 'Fitness',
  'pilates-yoga': 'Pilates i yoga',
  'kozmeticki-saloni': 'Kozmetički saloni',
  igraonice: 'Igraonice',
  wellness: 'Wellness',
};

export function AudienceHubPage() {
  const crumbs = [
    { name: 'Početna', path: '/' },
    { name: 'Za koga je Blizari', path: AUDIENCE_HUB.path },
  ];
  return (
    <MarketingSeoPage
      seo={AUDIENCE_HUB}
      kicker="Djelatnosti"
      h1={AUDIENCE_HUB.h1}
      lead={AUDIENCE_HUB.lead}
      ctaLabel="Isprobajte Blizari"
      breadcrumbs={crumbs}
      jsonLd={[
        organizationJsonLd(),
        breadcrumbJsonLd(crumbs),
      ]}
    >
      <div className="seo-mkt__cards">
        {Object.entries(AUDIENCE_PAGES).map(([slug, page]) => (
          <Link key={slug} className="seo-mkt__card" to={page.path}>
            <strong>{LABELS[slug] || slug}</strong>
            <span>{page.lead}</span>
          </Link>
        ))}
      </div>
      <p className="seo-mkt__note">
        Blizari nije javni katalog koji šalje klijente drugim poslovanjima.
        Svaki studio ima vlastitu stranicu i vlastite klijente.
      </p>
    </MarketingSeoPage>
  );
}

export function AudienceDetailPage() {
  const { niche } = useParams();
  const page = AUDIENCE_PAGES[niche];
  if (!page) return <NotFoundPage />;

  const crumbs = [
    { name: 'Početna', path: '/' },
    { name: 'Za koga je Blizari', path: AUDIENCE_HUB.path },
    { name: LABELS[niche] || niche, path: page.path },
  ];

  return (
    <MarketingSeoPage
      seo={page}
      kicker={LABELS[niche]}
      h1={page.h1}
      lead={page.lead}
      bullets={page.bullets}
      ctaLabel={page.cta}
      breadcrumbs={crumbs}
      jsonLd={breadcrumbJsonLd(crumbs)}
    >
      <p className="seo-mkt__note">
        Opisujemo samo funkcionalnosti dostupne u trenutačnom pilotu.
        Blagajna i online kartično plaćanje nisu dio ovog dema.
      </p>
    </MarketingSeoPage>
  );
}
