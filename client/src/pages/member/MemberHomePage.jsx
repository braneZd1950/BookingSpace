import { Link, useOutletContext } from 'react-router-dom';
import SiteFrame, { frameSources } from '../owner/SiteFrame.jsx';
import { hoursFromWorking, paletteFromTenant, sectionsFromTenant } from './publicSite.js';
import './MemberHomePage.scss';

function sessionsLabel(membership) {
  if (!membership) return null;
  if (membership.sessionsIncluded == null) return 'Neograničeni termini';
  const left = membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
  return `${left} od ${membership.sessionsIncluded} preostalo`;
}

export default function MemberHomePage() {
  const { tenant, membership, isMember, loggedIn } = useOutletContext();
  const slug = tenant.slug;
  const bookTo = `/s/${slug}/termini`;
  const palette = paletteFromTenant(tenant);
  const hours = hoursFromWorking(tenant.bookingSettings?.workingHours);
  const sections = sectionsFromTenant(tenant);
  const sources = frameSources({
    heroImageUrl: tenant.heroImageUrl || '',
    logoUrl: tenant.logoUrl || '',
  }, '', '');
  const sessions = sessionsLabel(membership);

  return (
    <div className="member-home">
      <div className="member-home__status" aria-live="polite">
        {!loggedIn ? (
          <p>
            Pregledavate stranicu studija.
            {' '}
            <Link to="/login">Prijavite se</Link>
            {' '}
            za rezervaciju termina.
          </p>
        ) : null}

        {loggedIn && isMember ? (
          <p>
            <strong>{membership.planName || 'Članarina'}</strong>
            {sessions ? ` · ${sessions}` : ''}
            {membership.validUntil ? ` · do ${membership.validUntil}` : ''}
            {' · '}
            <Link to={bookTo}>Rezervirajte termin</Link>
          </p>
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
        hours={hours}
        bookTo={bookTo}
        withBar={false}
      />
    </div>
  );
}
