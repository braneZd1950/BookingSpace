import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import SeoHead from '../../components/SeoHead.jsx';
import './FeaturesPage.scss';
import './MarketingSeoPage.scss';

export default function MarketingSeoPage({
  seo,
  kicker,
  h1,
  lead,
  bullets = [],
  ctaLabel = 'Isprobajte Blizari',
  ctaTo = '/register',
  secondaryLabel = 'Pogledajte funkcionalnosti',
  secondaryTo = '/funkcionalnosti',
  children,
  jsonLd,
  breadcrumbs,
}) {
  return (
    <main className="features seo-mkt">
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={jsonLd}
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
        {breadcrumbs?.length ? (
          <nav className="seo-mkt__crumbs" aria-label="Put do stranice">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path}>
                {index > 0 ? <span className="seo-mkt__sep" aria-hidden="true"> / </span> : null}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <Link to={crumb.path}>{crumb.name}</Link>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <header className="features__hero">
          <p className="features__brand">
            <BrandWordmark slot="page" tone="dark" />
          </p>
          {kicker ? <p className="features__kicker">{kicker}</p> : null}
          <h1>{h1}</h1>
          {lead ? <p className="features__lede">{lead}</p> : null}
          <div className="seo-mkt__actions">
            <Link className="seo-mkt__cta" to={ctaTo}>{ctaLabel}</Link>
            <Link className="seo-mkt__cta seo-mkt__cta--ghost" to={secondaryTo}>
              {secondaryLabel}
            </Link>
          </div>
        </header>

        {bullets.length ? (
          <section className="seo-mkt__list" aria-label="Što dobivate">
            <h2 className="seo-mkt__h2">Što možete raditi danas</h2>
            <ul>
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {children}
      </div>
    </main>
  );
}
