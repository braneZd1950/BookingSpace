import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PlatformFooter from '../../components/PlatformFooter.jsx';
import useResolvedDarkMode from '../../hooks/useResolvedDarkMode.js';
import { nichePlaceLine } from '../../lib/nicheLabels.js';
import { mediaUrl } from '../../lib/studio.js';
import { paletteSurfaceVars } from '../../lib/uiTheme.js';
import { hourRows } from './studioTime.js';
import './SiteFrame.scss';

/** How many services to show on the home before “Pogledajte sve”. */
const FEATURED_SERVICES = 6;

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
  bookTo,
  legalBase = '',
  slug = '',
}) {
  const privacyTo = studioLegalPath(legalBase, slug, 'privatnost');
  const termsTo = studioLegalPath(legalBase, slug, 'uvjeti');
  const cookiesTo = studioLegalPath(legalBase, slug, 'kolacici');
  const hasStudioLegal = Boolean(privacyTo && termsTo && cookiesTo);

  return (
    <footer className="site__foot">
      <div className="site__foot-aura" aria-hidden="true" />
      <div className="site__foot-grid site__foot-grid--simple">
        <div className="site__foot-brand">
          <p className="site__foot-eyebrow">Vaša poveznica</p>
          <strong>{name}</strong>
          <p>Rezervirajte termin online — prema radnom vremenu i pravilima poslovanja.</p>
          {bookTo ? (
            <Link className="site__foot-cta" to={bookTo}>
              Termini
            </Link>
          ) : null}
        </div>
      </div>

      {hasStudioLegal ? (
        <div className="site__foot-rules">
          <div>
            <p className="site__foot-eyebrow">Pravila poslovanja</p>
            <p className="site__foot-rules-lead">
              Politika privatnosti, uvjeti poslovanja i kolačići ovog poslovanja —
              odvojeno od pravila platforme Blizari ispod.
            </p>
          </div>
          <nav className="site__foot-legal" aria-label="Pravila poslovanja">
            <Link to={privacyTo}>Privatnost</Link>
            <span aria-hidden="true">·</span>
            <Link to={termsTo}>Uvjeti i rezervacije</Link>
            <span aria-hidden="true">·</span>
            <Link to={cookiesTo}>Kolačići</Link>
          </nav>
        </div>
      ) : null}

      <div className="site__foot-platform">
        <PlatformFooter credit={name} />
      </div>
    </footer>
  );
}

function BookControl({
  bookTo,
  className = 'site__book',
  label = 'Rezervirajte termin',
}) {
  if (bookTo) return <Link className={className} to={bookTo}>{label}</Link>;
  return <span className={className}>{label}</span>;
}

function formatServicePrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function ServicesBlock({
  services,
  bookTo,
  showAll,
  onToggleAll,
}) {
  const list = Array.isArray(services) ? services : [];
  const hasMore = list.length > FEATURED_SERVICES;
  const visible = showAll || !hasMore ? list : list.slice(0, FEATURED_SERVICES);

  if (list.length === 0) {
    return (
      <section className="site__offer" id="usluge">
        <div className="site__offer-head">
          <div>
            <h3>Usluge i aktivnosti</h3>
            <p>Ponuda još nije objavljena. Provjerite termine ili kontaktirajte poslovanje.</p>
          </div>
          {bookTo ? (
            <Link className="site__offer-link" to={bookTo}>
              Pogledajte termine
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="site__offer" id="usluge">
      <div className="site__offer-head">
        <div>
          <h3>Usluge i aktivnosti</h3>
          <p>Što možete rezervirati ili koristiti — odaberite i nastavite na termine.</p>
        </div>
        {bookTo ? (
          <Link className="site__offer-link" to={bookTo}>
            Pogledajte termine
          </Link>
        ) : null}
      </div>
      <ul className="site__offer-grid">
        {visible.map((item) => {
          const price = formatServicePrice(item.price);
          return (
            <li key={item.id || item.name}>
              <article className="site__offer-card">
                <h4>{item.name || 'Usluga'}</h4>
                {item.description ? <p>{item.description}</p> : null}
                <div className="site__offer-meta">
                  <span>
                    {item.durationMinutes || '—'}
                    {' '}
                    min
                  </span>
                  {item.capacity ? (
                    <span>
                      do
                      {' '}
                      {item.capacity}
                      {' '}
                      mjesta
                    </span>
                  ) : null}
                  {price ? <span>{price}</span> : null}
                </div>
                {bookTo ? (
                  <Link
                    className="site__offer-book"
                    to={`${bookTo}${bookTo.includes('?') ? '&' : '?'}serviceId=${encodeURIComponent(item.id)}`}
                  >
                    Rezervirajte
                  </Link>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <button
          type="button"
          className="site__offer-more"
          onClick={onToggleAll}
        >
          {showAll
            ? 'Prikaži manje'
            : `Pogledajte sve usluge (${list.length})`}
        </button>
      ) : null}
    </section>
  );
}

function HoursBlock({ hours }) {
  return (
    <section className="site__facts" id="radno-vrijeme">
      <h3>Radno vrijeme</h3>
      <ul>
        {hourRows.map(([key, label]) => (
          <li key={key}>{hoursLine(label, hours?.[key])}</li>
        ))}
      </ul>
    </section>
  );
}

function ContactBlock({
  phone,
  email,
  address,
  mapsUrl,
  sections,
}) {
  const phoneLink = telHref(phone);
  return (
    <section className="site__facts" id="kontakt">
      <h3>Kontakt i lokacija</h3>
      <ul className="site__facts-contact">
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
        {sections.location && address ? <li>{address}</li> : null}
        {sections.location && mapsUrl ? (
          <li>
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              Karta lokacije
            </a>
          </li>
        ) : null}
        {sections.contact && !phone && !email ? (
          <li>Kontakt još nije upisan.</li>
        ) : null}
        {sections.location && !address ? (
          <li>Lokacija još nije upisana.</li>
        ) : null}
      </ul>
    </section>
  );
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
  mapsUrl = '',
  heroSrc,
  logoSrc,
  palette,
  sections,
  hours,
  galleryImages = [],
  services = [],
  niche = '',
  nicheCustom = '',
  city = '',
  layout = 'banner',
  bookTo = '',
  legalBase = '',
  slug = '',
  withBar = true,
}) {
  const theme = palette.theme;
  const darkMode = useResolvedDarkMode();
  const frame = ['banner', 'bar', 'sidebar'].includes(layout) ? layout : 'banner';
  const style = paletteSurfaceVars(theme, { dark: darkMode });
  const logo = logoSrc ? <img className="site__logo" src={logoSrc} alt="" /> : null;
  const canBook = sections.schedule || sections.services;
  const book = canBook ? <BookControl bookTo={bookTo} /> : null;
  const heroPhoto = heroSrc || ambient.hero;
  const aboutPhoto = heroSrc || ambient.about;
  const shots = galleryShots(galleryImages, heroSrc);
  const heroBackground = `linear-gradient(180deg, rgb(12 18 24 / 28%), rgb(12 18 24 / 72%)), url("${heroPhoto}")`;
  const placeLine = useMemo(
    () => nichePlaceLine(niche, nicheCustom, city || ''),
    [niche, nicheCustom, city],
  );
  const [showAllServices, setShowAllServices] = useState(false);
  const activeServices = useMemo(
    () => (Array.isArray(services) ? services.filter((item) => item && item.active !== false) : []),
    [services],
  );
  const showServices = Boolean(sections.services);
  const showHours = Boolean(sections.openingHours);
  const showContact = Boolean(sections.contact || sections.location);

  if (!withBar) {
    return (
      <article className="site site--live" style={style}>
        <div className="site__atmosphere" aria-hidden="true">
          <span className="site__orb site__orb--a" />
          <span className="site__orb site__orb--b" />
          <span className="site__grain" />
        </div>
        <header
          className="site__hero site__hero--photo"
          style={{ backgroundImage: heroBackground }}
        >
          <div className="site__hero-copy">
            {logo}
            <p className="site__kicker">{placeLine || 'Poslovanje'}</p>
            <h2>{name}</h2>
            {description ? <p>{description}</p> : null}
            <p className="site__hero-note">Otvoreno prema radnom vremenu</p>
            {book}
          </div>
        </header>

        {sections.about && description ? (
          <section className="site__band" id="o-poslovanju">
            <div className="site__band-copy">
              <h3>O poslovanju</h3>
              <p>{description}</p>
            </div>
            <div
              className="site__photo"
              style={photoStyle(aboutPhoto, heroSrc ? 'center 30%' : 'center')}
              aria-hidden="true"
            />
          </section>
        ) : null}

        {showServices ? (
          <ServicesBlock
            services={activeServices}
            bookTo={canBook ? bookTo : ''}
            showAll={showAllServices}
            onToggleAll={() => setShowAllServices((value) => !value)}
          />
        ) : null}

        {canBook ? (
          <section className="site__cta" id="termini">
            <div>
              <h3>Termini</h3>
              <p>
                Odaberite aktivnost i slobodan termin. Dostupna mjesta prikazuju se odmah.
              </p>
            </div>
            <BookControl
              bookTo={bookTo}
              className="site__book site__book--solid"
              label="Odaberite termin"
            />
          </section>
        ) : null}

        {sections.gallery ? <GalleryBlock shots={shots} /> : null}

        {(showHours || showContact) ? (
          <div className="site__facts-row">
            {showHours ? <HoursBlock hours={hours} /> : null}
            {showContact ? (
              <ContactBlock
                phone={phone}
                email={email}
                address={address}
                mapsUrl={mapsUrl}
                sections={sections}
              />
            ) : null}
          </div>
        ) : null}

        <LiveFooter
          name={name}
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
      {sections.location && mapsUrl ? (
        <p>
          <a href={mapsUrl} target="_blank" rel="noreferrer">Karta lokacije</a>
        </p>
      ) : null}
    </section>
  ) : null;
  const gallery = sections.gallery ? <GalleryBlock shots={shots} emptyCopy={!shots.length} /> : null;
  const about = sections.about && description ? (
    <section>
      <h3>O poslovanju</h3>
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
