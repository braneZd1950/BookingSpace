import { Link } from 'react-router-dom';
import PlatformFooter from '../../components/PlatformFooter.jsx';
import { mediaUrl, STUDIO_KEY } from '../../lib/studio.js';
import { hourRows } from './studioTime.js';
import './SiteFrame.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

function leaveToAppHome() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STUDIO_KEY);
  window.dispatchEvent(new Event('studio-changed'));
}

/** Atmosphere photos when the studio has not uploaded its own yet. */
const ambient = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80',
  about: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
  shotA: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
  shotB: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80',
  shotC: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
};

function hoursLine(label, row) {
  if (!row) return `${label}: zatvoreno`;
  return row.works ? `${label}: ${row.from}–${row.to}` : `${label}: zatvoreno`;
}

function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

function galleryShots(galleryImages, heroSrc) {
  const uploaded = (galleryImages || [])
    .map((item) => mediaUrl(typeof item === 'string' ? item : item?.url))
    .filter(Boolean);
  if (uploaded.length) return uploaded;
  return [
    heroSrc || ambient.shotA,
    heroSrc || ambient.shotB,
    heroSrc || ambient.shotC,
  ];
}

function GalleryBlock({ shots, emptyCopy = false }) {
  if (!shots.length) {
    return emptyCopy ? (
      <section>
        <h3>Galerija</h3>
        <p>Fotografije dolaze ovdje.</p>
      </section>
    ) : null;
  }
  const filled = shots.length > 3;
  return (
    <section className="site__gallery">
      <h3>Galerija</h3>
      <div className={filled ? 'site__shots site__shots--filled' : 'site__shots'}>
        {shots.map((src, index) => {
          const role = index === 0 ? 'a' : index === 1 ? 'b' : 'c';
          return (
            <figure
              key={`${src}-${index}`}
              className={filled ? 'site__shot' : `site__shot site__shot--${role}`}
              style={photoStyle(src, 'center')}
            />
          );
        })}
      </div>
    </section>
  );
}

function studioLegalPath(legalBase, slug, page) {
  const base = (legalBase || (slug ? `/s/${slug}` : '')).replace(/\/$/, '');
  if (!base) return null;
  return `${base}/${page}`;
}

function LiveFooter({
  name,
  phone,
  email,
  address,
  hours,
  sections,
  bookTo,
  legalBase = '',
  slug = '',
}) {
  const showHours = sections.openingHours;
  const showContact = sections.contact || sections.location;
  const phoneLink = telHref(phone);
  const privacyTo = studioLegalPath(legalBase, slug, 'privatnost');
  const termsTo = studioLegalPath(legalBase, slug, 'uvjeti');
  const cookiesTo = studioLegalPath(legalBase, slug, 'kolacici');
  const hasStudioLegal = Boolean(privacyTo && termsTo && cookiesTo);

  return (
    <footer className="site__foot">
      <div className="site__foot-aura" aria-hidden="true" />
      <div className="site__foot-grid">
        <div className="site__foot-brand">
          <p className="site__foot-eyebrow">Vaša poveznica</p>
          <strong>{name}</strong>
          <p>Rezervirajte termin online — prema radnom vremenu i pravilima studija.</p>
          {bookTo ? (
            <Link className="site__foot-cta" to={bookTo}>
              Termini
            </Link>
          ) : null}
        </div>

        {showHours ? (
          <div>
            <h3>Radno vrijeme</h3>
            <ul>
              {hourRows.map(([key, label]) => (
                <li key={key}>{hoursLine(label, hours?.[key])}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {showContact ? (
          <div>
            <h3>Kontakt</h3>
            <ul className="site__foot-contact">
              {sections.contact && phone ? (
                <li>
                  {phoneLink ? <a href={phoneLink}>{phone}</a> : phone}
                </li>
              ) : null}
              {sections.contact && email ? (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ) : null}
              {sections.location && address ? (
                <li>{address}</li>
              ) : null}
              {sections.contact && !phone && !email ? (
                <li>Kontakt još nije upisan.</li>
              ) : null}
              {sections.location && !address ? (
                <li>Lokacija još nije upisana.</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {hasStudioLegal ? (
        <div className="site__foot-rules">
          <div>
            <p className="site__foot-eyebrow">Pravila poslovanja</p>
            <p className="site__foot-rules-lead">
              Pravila privatnosti, uvjeti korištenja i kolačići ovog studija —
              odvojeno od pravila platforme anyminutes ispod.
            </p>
          </div>
          <nav className="site__foot-legal" aria-label="Pravila poslovanja">
            <Link to={privacyTo}>Privatnost</Link>
            <span aria-hidden="true">·</span>
            <Link to={termsTo}>Uvjeti korištenja</Link>
            <span aria-hidden="true">·</span>
            <Link to={cookiesTo}>Kolačići</Link>
          </nav>
        </div>
      ) : null}

      <div className="site__foot-platform">
        <PlatformFooter credit={name} onHomeClick={leaveToAppHome} />
      </div>
    </footer>
  );
}

function BookControl({ bookTo, className = 'site__book' }) {
  if (bookTo) return <Link className={className} to={bookTo}>Odaberite termin</Link>;
  return <span className={className}>Odaberite termin</span>;
}

function photoStyle(url, position = 'center') {
  if (!url) return undefined;
  return { backgroundImage: `url("${url}")`, backgroundPosition: position };
}

export default function SiteFrame({
  name,
  description,
  phone,
  email,
  address,
  heroSrc,
  logoSrc,
  palette,
  sections,
  hours,
  galleryImages = [],
  layout = 'banner',
  bookTo = '',
  legalBase = '',
  slug = '',
  withBar = true,
}) {
  const theme = palette.theme;
  const frame = ['banner', 'bar', 'sidebar'].includes(layout) ? layout : 'banner';
  const style = {
    background: theme.canvas,
    color: theme.ink,
    fontFamily: theme.fontFamily,
    '--site-brand': theme.primaryColor,
    '--site-on': theme.onPrimary,
    '--site-soft': theme.secondaryColor,
    '--site-radius': theme.borderRadius,
  };
  const logo = logoSrc ? <img className="site__logo" src={logoSrc} alt="" /> : null;
  const canBook = sections.schedule || sections.services;
  const book = canBook ? <BookControl bookTo={bookTo} /> : null;
  const heroPhoto = heroSrc || ambient.hero;
  const aboutPhoto = heroSrc || ambient.about;
  const shots = galleryShots(galleryImages, heroSrc);
  const heroBackground = `linear-gradient(180deg, rgb(12 18 24 / 28%), rgb(12 18 24 / 72%)), url("${heroPhoto}")`;

  if (!withBar) {
    return (
      <article className="site site--live" style={style}>
        <header
          className="site__hero site__hero--photo"
          style={{ backgroundImage: heroBackground }}
        >
          <div className="site__hero-copy">
            {logo}
            <h2>{name}</h2>
            {description ? <p>{description}</p> : null}
            {book}
          </div>
        </header>

        {sections.about && description ? (
          <section className="site__band">
            <div className="site__band-copy">
              <h3>O studiju</h3>
              <p>{description}</p>
            </div>
            <div
              className="site__photo"
              style={photoStyle(aboutPhoto, heroSrc ? 'center 30%' : 'center')}
              aria-hidden="true"
            />
          </section>
        ) : null}

        {canBook ? (
          <section className="site__cta">
            <div>
              <h3>Termini</h3>
              <p>Odaberite sat. Mjesto je slobodno ili puno — to se vidi odmah.</p>
            </div>
            <BookControl bookTo={bookTo} className="site__book site__book--solid" />
          </section>
        ) : null}

        {sections.gallery ? <GalleryBlock shots={shots} /> : null}

        <LiveFooter
          name={name}
          phone={phone}
          email={email}
          address={address}
          hours={hours}
          sections={sections}
          bookTo={bookTo}
          legalBase={legalBase}
          slug={slug}
        />
      </article>
    );
  }

  const showIntro = sections.hero || sections.about;
  const background = heroSrc
    ? `linear-gradient(180deg, rgb(12 18 24 / 28%), rgb(12 18 24 / 62%)), url("${heroSrc}")`
    : `linear-gradient(145deg, ${theme.primaryColor}, ${theme.secondaryColor})`;
  const schedule = canBook ? (
    <section>
      <h3>Termini</h3>
      <p>Sat je slobodan ili pun. To se vidi ovdje.</p>
    </section>
  ) : null;
  const hoursBlock = sections.openingHours ? (
    <section>
      <h3>Kad radimo</h3>
      <ul>
        {hourRows.map(([key, label]) => (
          <li key={key}>{hoursLine(label, hours?.[key])}</li>
        ))}
      </ul>
    </section>
  ) : null;
  const contact = sections.contact || sections.location ? (
    <section>
      <h3>Kontakt</h3>
      {sections.contact ? <p>{[phone, email].filter(Boolean).join(' · ') || 'Kontakt još nije upisan.'}</p> : null}
      {sections.location ? <p>{address || 'Lokacija još nije upisana.'}</p> : null}
    </section>
  ) : null;
  const gallery = sections.gallery ? <GalleryBlock shots={shots} emptyCopy={!shots.length} /> : null;
  const about = sections.about && description ? (
    <section>
      <h3>O studiju</h3>
      <p>{description}</p>
    </section>
  ) : null;
  const bar = (
    <header className="site__bar">
      <div className="site__id">
        {logo}
        <strong>{name}</strong>
      </div>
      {book}
    </header>
  );

  if (frame === 'bar') {
    return (
      <article className="site site--bar" style={style}>
        {bar}
        <div className="site__body">
          {about}
          {schedule}
          {hoursBlock}
          {contact}
          {gallery}
        </div>
      </article>
    );
  }

  if (frame === 'sidebar') {
    return (
      <article className="site site--sidebar" style={style}>
        {bar}
        <div className="site__split">
          <aside>
            {contact}
            {hoursBlock}
          </aside>
          <div>
            {about}
            {schedule}
            {gallery}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="site site--banner" style={style}>
      {showIntro ? (
        <header className="site__hero" style={{ backgroundImage: background }}>
          {logo}
          <h2>{name}</h2>
          {description ? <p>{description}</p> : null}
          {book}
        </header>
      ) : null}
      <div className="site__body">
        {schedule}
        {hoursBlock}
        {contact}
        {gallery}
      </div>
    </article>
  );
}

export function frameSources(draft, heroPreview, logoPreview) {
  return {
    heroSrc: heroPreview || mediaUrl(draft.heroImageUrl),
    logoSrc: logoPreview || mediaUrl(draft.logoUrl),
  };
}
