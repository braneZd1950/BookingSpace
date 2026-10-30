import { Link, useOutletContext } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useListOnlineCatalogQuery } from '../../api/onlineApi.js';
import { ONLINE_ENABLED } from '../../lib/onlineFeature.js';
import './MemberOnlinePage.scss';

function apiOrigin() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/api\/?$/, '');
}

function mediaUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith('/uploads/')) return `${apiOrigin()}${raw}`;
  return raw;
}

function embedUrl(raw) {
  if (!raw) return null;
  try {
    const absolute = mediaUrl(raw);
    const url = new URL(absolute);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v')
        || url.pathname.match(/\/embed\/([^/]+)/)?.[1]
        || url.pathname.match(/\/shorts\/([^/]+)/)?.[1];
      return id ? { type: 'iframe', src: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? { type: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null;
    }
    if (host.includes('cloudinary.com') || host.includes('res.cloudinary') || raw.startsWith('/uploads/')) {
      return { type: 'video', src: absolute };
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url.pathname)) {
      return { type: 'video', src: absolute };
    }
  } catch {
    return null;
  }
  return { type: 'link', src: mediaUrl(raw) };
}

function priceLabel(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return 'Plaćanje uskoro';
  return `${amount.toFixed(2).replace('.', ',')} € · uskoro`;
}

function accessMessage(access, loggedIn, isMember) {
  if (!loggedIn) {
    return 'Prijavite se da vidite što je uključeno u vašu članarinu.';
  }
  if (!isMember) {
    return 'Online treninzi su dostupni članovima s aktivnom članarinom.';
  }
  if (access?.freeCatalog) {
    const left = access.sessionsRemaining;
    if (left == null) return 'Imate neograničen paket — online treninzi su uključeni.';
    return `Imate ${left} preostalih termina — online treninzi su trenutno besplatni.`;
  }
  return 'Nema preostalih termina u paketu. Pojedinačna kupnja online treninga stiže uskoro.';
}

function themeStyle(palette) {
  const theme = palette?.theme;
  if (!theme) return undefined;
  return {
    '--online-brand': theme.primaryColor,
    '--online-soft': theme.secondaryColor,
    '--online-ink': theme.ink,
    '--online-canvas': theme.canvas,
  };
}

function OnlineShell({ tenant, palette, children, status = 'Online' }) {
  return (
    <main className="member-online" style={themeStyle(palette)}>
      <div className="member-online__atmosphere" aria-hidden="true">
        <span className="member-online__wash" />
        <span className="member-online__grain" />
      </div>

      <div className="member-online__layout">
        <aside className="member-online__rail" aria-hidden="true">
          <p className="member-online__rail-mark">Online</p>
          <p className="member-online__rail-status">{status}</p>
        </aside>

        <div className="member-online__stage">
          <header className="member-online__hero">
            <p className="member-online__studio">{tenant.name}</p>
            <h1>Online</h1>
            <p className="member-online__lead">
              Snimljeni treninzi — kod kuće, vlastitim tempom.
            </p>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}

function ComingSoon({ tenant, palette }) {
  return (
    <OnlineShell tenant={tenant} palette={palette} status="Uskoro">
      <section className="member-online__soon" aria-live="polite">
        <p className="member-online__kicker">Stanje</p>
        <strong>Uskoro dolazi</strong>
        <p>
          Online treninzi još nisu uključeni. Radimo na snimkama, otključavanju
          preko članarine i plaćanju za one bez preostalih termina.
        </p>
        <Link className="member-online__cta" to={`/s/${tenant.slug}/termini`}>
          Idi na Termine
        </Link>
      </section>
    </OnlineShell>
  );
}

export default function MemberOnlinePage() {
  const { tenant, membership, isMember, loggedIn, palette } = useOutletContext();
  const tenantId = String(tenant.id);

  if (!ONLINE_ENABLED) {
    return <ComingSoon tenant={tenant} palette={palette} />;
  }

  return (
    <MemberOnlineLive
      tenant={tenant}
      tenantId={tenantId}
      membership={membership}
      isMember={isMember}
      loggedIn={loggedIn}
      palette={palette}
    />
  );
}

function MemberOnlineLive({ tenant, tenantId, membership, isMember, loggedIn, palette }) {
  const { data, isLoading, isError } = useListOnlineCatalogQuery(tenantId, {
    skip: !tenantId,
    refetchOnMountOrArgChange: true,
  });
  const [activeId, setActiveId] = useState('');

  const workouts = data?.workouts || [];
  const access = data?.access;
  const active = useMemo(
    () => workouts.find((item) => String(item.id) === String(activeId)) || null,
    [workouts, activeId],
  );
  const player = active?.videoUrl ? embedUrl(active.videoUrl) : null;

  const status = isMember
    ? (membership.sessionsIncluded == null
      ? 'Neograničeno'
      : `${Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0))} preostalo`)
    : 'Katalog';

  return (
    <OnlineShell tenant={tenant} palette={palette} status={status}>
      {isMember ? (
        <p className="member-online__plan">
          {membership.planName || 'Članarina'}
        </p>
      ) : null}

      <p className="member-online__access" role="status">
        {accessMessage(access, loggedIn, isMember)}
        {!loggedIn ? (
          <>
            {' '}
            <Link to="/login">Prijava</Link>
          </>
        ) : null}
      </p>

      {isLoading ? <p className="member-online__hint">Učitavamo treninge…</p> : null}
      {isError ? <p className="member-online__error">Treninzi se nisu učitali.</p> : null}

      {!isLoading && !isError && workouts.length === 0 ? (
        <section className="member-online__soon">
          <p className="member-online__kicker">Katalog</p>
          <strong>Još nema online treninga</strong>
          <p>Studio uskoro može objaviti snimke. Provjerite Termine za uživo rezervacije.</p>
          <Link className="member-online__cta" to={`/s/${tenant.slug}/termini`}>
            Termini
          </Link>
        </section>
      ) : null}

      {active && !active.locked ? (
        <section className="member-online__player" aria-label={active.title}>
          <div className="member-online__frame">
            {player?.type === 'iframe' ? (
              <iframe
                title={active.title}
                src={player.src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : player?.type === 'video' ? (
              <video src={player.src} controls playsInline preload="metadata" />
            ) : (
              <a href={mediaUrl(active.videoUrl)} target="_blank" rel="noreferrer">
                Otvori video
              </a>
            )}
          </div>
          <div className="member-online__player-copy">
            <h2>{active.title}</h2>
            {active.description ? <p>{active.description}</p> : null}
            <button type="button" className="member-online__ghost" onClick={() => setActiveId('')}>
              Zatvori player
            </button>
          </div>
        </section>
      ) : null}

      {workouts.length > 0 ? (
        <ol className="member-online__list">
          {workouts.map((item, index) => {
            const on = String(item.id) === String(activeId);
            return (
              <li key={item.id} className={item.locked ? 'is-locked' : undefined}>
                <span className="member-online__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="member-online__item">
                  <strong>{item.title}</strong>
                  <span>
                    {item.durationMinutes}
                    {' min'}
                    {item.free
                      ? ' · uključeno u paket'
                      : ` · ${priceLabel(item.price)}`}
                  </span>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                {item.locked ? (
                  <span className="member-online__lock">Zaključano</span>
                ) : (
                  <button
                    type="button"
                    className="member-online__cta"
                    aria-pressed={on}
                    onClick={() => setActiveId(on ? '' : item.id)}
                  >
                    {on ? 'Prikaži manje' : 'Pogledaj'}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </OnlineShell>
  );
}
