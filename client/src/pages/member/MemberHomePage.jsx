import { Link, useOutletContext } from 'react-router-dom';
import { GALLERY_ENABLED } from '../../lib/studioFeatures.js';
import SiteFrame, { frameSources } from '../owner/SiteFrame.jsx';
import { hoursFromWorking, paletteFromTenant, sectionsFromTenant } from './publicSite.js';
import './MemberHomePage.scss';

const untilDay = new Intl.DateTimeFormat('hr-HR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function sessionsLeft(membership) {
  if (!membership || membership.sessionsIncluded == null) return null;
  return membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
}

function formatValidUntil(value) {
  if (!value) return '';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? new Date(`${raw.slice(0, 10)}T12:00:00`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return untilDay.format(date);
}

export default function MemberHomePage() {
  const { tenant, membership, isMember, loggedIn } = useOutletContext();
  const slug = tenant.slug;
  const bookTo = `/s/${slug}/termini`;
  const palette = paletteFromTenant(tenant);
  const hours = hoursFromWorking(tenant.bookingSettings?.workingHours);
  const baseSections = sectionsFromTenant(tenant);
  const sections = {
    ...baseSections,
    gallery: GALLERY_ENABLED ? Boolean(baseSections.gallery) : false,
  };
  const sources = frameSources({
    heroImageUrl: tenant.heroImageUrl || '',
    logoUrl: tenant.logoUrl || '',
  }, '', '');
  const left = sessionsLeft(membership);
  const until = formatValidUntil(membership?.validUntil);

  return (
    <div className="member-home">
      <div className="member-home__status" aria-live="polite">
        {!loggedIn ? (
          <p>
            Pregledavate stranicu studija.
            {' '}
            <Link to="/login">Prijavite se</Link>
            {' '}
            za rezervaciju.
          </p>
        ) : null}

        {loggedIn && isMember ? (
          <div className="member-home__pass">
            <div className="member-home__pass-copy">
              <p className="member-home__pass-label">Vaša članarina</p>
              <p className="member-home__pass-title">
                {membership.planName || 'Članarina'}
              </p>
              <ul className="member-home__pass-meta">
                {left != null ? (
                  <li>
                    <span aria-hidden="true">01</span>
                    {left}
                    {' od '}
                    {membership.sessionsIncluded}
                    {' preostalo'}
                  </li>
                ) : (
                  <li>
                    <span aria-hidden="true">01</span>
                    Neograničeni termini
                  </li>
                )}
                {until ? (
                  <li>
                    <span aria-hidden="true">02</span>
                    Vrijedi do
                    {' '}
                    {until}
                  </li>
                ) : null}
              </ul>
            </div>
            <Link className="member-home__pass-cta" to={bookTo}>
              Rezervirajte termin
            </Link>
          </div>
        ) : null}

        {loggedIn && !isMember ? (
          <p>
            Prijavljeni ste, ali nemate aktivnu članarinu u ovom studiju.
            Obratite se studiju da je aktiviraju.
          </p>
        ) : null}
      </div>

      <SiteFrame
        name={tenant.name}
        description={tenant.description || ''}
        phone={tenant.phone || ''}
        email={tenant.email || ''}
        address={tenant.address || ''}
        heroSrc={sources.heroSrc}
        logoSrc={sources.logoSrc}
        palette={palette}
        sections={sections}
        galleryImages={GALLERY_ENABLED ? (tenant.siteSettings?.gallery || []) : []}
        hours={hours}
        bookTo={bookTo}
        slug={slug}
        legalBase={`/s/${slug}`}
        withBar={false}
      />
    </div>
  );
}
