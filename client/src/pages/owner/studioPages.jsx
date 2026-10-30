import { Link, useOutletContext } from 'react-router-dom';
import { GALLERY_ENABLED } from '../../lib/studioFeatures.js';
import { findLayout } from './layouts.js';
import SiteFrame, { frameSources } from './SiteFrame.jsx';
import { studioHost } from './siteTemplates.js';

export function StudioHome() {
  const { studio, palette } = useOutletContext();
  const draft = {
    description: studio.description || '',
    phone: studio.phone || '',
    email: studio.email || '',
    address: studio.address || '',
    heroImageUrl: studio.heroImageUrl || '',
    logoUrl: studio.logoUrl || '',
  };
  const sources = frameSources(draft, '', '');
  const host = studioHost(studio.slug);

  if (!studio.guideDone) {
    return (
      <section className="studio-panel">
        <h1>Početna</h1>
        <p>Dovršite postavljanje da klijenti vide {host}.</p>
        <p>
          <Link to="/postavljanje">Nastavite vodič</Link>
        </p>
      </section>
    );
  }

  return (
    <SiteFrame
      name={studio.name}
      description={draft.description}
      phone={draft.phone}
      email={draft.email}
      address={draft.address}
      heroSrc={sources.heroSrc}
      logoSrc={sources.logoSrc}
      palette={palette}
      sections={{
        hero: true,
        about: true,
        services: true,
        schedule: true,
        contact: true,
        location: true,
        openingHours: true,
        ...studio.sections,
        gallery: GALLERY_ENABLED ? Boolean(studio.sections?.gallery) : false,
      }}
      galleryImages={GALLERY_ENABLED ? (studio.siteSettings?.gallery || []) : []}
      hours={studio.hours}
      layout={findLayout(studio.layout).id}
      bookTo="/stranica/termini"
      slug={studio.slug}
      legalBase={studio.slug ? `/s/${studio.slug}` : ''}
      withBar={false}
    />
  );
}
