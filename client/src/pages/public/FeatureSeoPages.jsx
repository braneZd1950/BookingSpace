import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import MarketingSeoPage from './MarketingSeoPage.jsx';
import {
  FEATURE_PAGES,
  FEATURES_HUB,
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from '../../lib/seo.js';
import { NotFoundPage } from './StatusPage.jsx';

const LABELS = {
  'online-rezervacije': 'Online rezervacije',
  'upravljanje-clanovima': 'Upravljanje članovima',
  'usluge-i-termini': 'Usluge i termini',
  'clanarine-i-paketi': 'Članarine i paketi',
};

export function FeaturesHubPage() {
  const crumbs = [
    { name: 'Početna', path: '/' },
    { name: 'Funkcionalnosti', path: FEATURES_HUB.path },
  ];
  return (
    <MarketingSeoPage
      seo={FEATURES_HUB}
      kicker="Funkcionalnosti"
      h1={FEATURES_HUB.h1}
      lead={FEATURES_HUB.lead}
      secondaryLabel="Mogućnosti (pregled)"
      secondaryTo="/mogucnosti"
      breadcrumbs={crumbs}
      jsonLd={[softwareApplicationJsonLd(), breadcrumbJsonLd(crumbs)]}
    >
      <div className="seo-mkt__cards">
        {Object.entries(FEATURE_PAGES).map(([slug, page]) => (
          <Link key={slug} className="seo-mkt__card" to={page.path}>
            <strong>{LABELS[slug] || slug}</strong>
            <span>{page.lead}</span>
          </Link>
        ))}
      </div>
    </MarketingSeoPage>
  );
}

export function FeatureDetailPage() {
  const { feature } = useParams();
  const page = FEATURE_PAGES[feature];
  if (!page) return <NotFoundPage />;

  const crumbs = [
    { name: 'Početna', path: '/' },
    { name: 'Funkcionalnosti', path: FEATURES_HUB.path },
    { name: LABELS[feature] || feature, path: page.path },
  ];

  return (
    <MarketingSeoPage
      seo={page}
      kicker="Funkcionalnost"
      h1={page.h1}
      lead={page.lead}
      bullets={page.bullets}
      breadcrumbs={crumbs}
      jsonLd={breadcrumbJsonLd(crumbs)}
    />
  );
}
