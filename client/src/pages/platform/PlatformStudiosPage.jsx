import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformStudiosQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformStudiosPage.scss';

const nicheLabel = {
  fitness: 'Treninzi i grupe',
  powerplate: 'Treninzi i grupe',
  pilates: 'Treninzi i grupe',
  yoga: 'Treninzi i grupe',
  services: 'Pojedinačni termini',
  playroom: 'Igraonice i događaji',
  generic: 'Nešto drugo',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

export default function PlatformStudiosPage() {
  const { me } = useOutletContext() || {};
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError, isFetching } = useGetPlatformStudiosQuery(
    30,
    PLATFORM_POLL.studios,
  );

  const studios = data?.studios || [];
  const summary = data?.summary || { total: 0, active: 0, inactive: 0, withMembers: 0 };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return studios.filter((item) => {
      if (filter === 'active' && !item.active) return false;
      if (filter === 'inactive' && item.active) return false;
      if (filter === 'members' && item.activeMembers < 1) return false;
      if (!needle) return true;
      const hay = [item.name, item.slug, item.niche, item.nicheCustom, item.email, item.phone]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [studios, query, filter]);

  const maxViews = useMemo(
    () => Math.max(1, ...visible.map((item) => Number(item.pageViews) || 0)),
    [visible],
  );

  if (isLoading) {
    return (
      <main className="platform-studios">
        <div className="platform-studios__stage">
          <p className="platform-studios__lede">Učitavamo partnere…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-studios">
        <div className="platform-studios__stage">
          <header className="platform-studios__head">
            <div>
              <p className="platform-studios__eyebrow">Platforma</p>
              <h1>Studiji</h1>
              <p className="platform-studios__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="platform-studios">
      <div className="platform-studios__atmosphere" aria-hidden="true">
        <span className="platform-studios__wash" />
        <span className="platform-studios__grain" />
      </div>

      <div className="platform-studios__stage">
        <header className="platform-studios__head">
          <div>
            <p className="platform-studios__eyebrow">Platforma</p>
            <h1>Studiji</h1>
            <p className="platform-studios__lede">
              Svi partneri na platformi · aktivnost zadnjih
              {' '}
              {data.days}
              {' '}
              dana. Bez podataka članova.
            </p>
          </div>
          <div className="platform-studios__head-actions">
            <p className={`platform-studios__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Popis studija / partnera',
                subtitle: `Svi partneri na platformi · aktivnost zadnjih ${data.days} dana.`,
                fileStem: 'studiji',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Ukupno', value: formatCount(summary.total) },
                  { label: 'Aktivni', value: formatCount(summary.active) },
                  { label: 'Neaktivni', value: formatCount(summary.inactive) },
                  { label: 'Sa članovima', value: formatCount(summary.withMembers) },
                ],
                sections: [{
                  title: 'Studiji',
                  lead: `Ispisano ${studios.length} zapisa.`,
                  columns: ['Naziv', 'Slug', 'Kontakt', 'Telefon', 'Niša', 'Status', 'Članovi', 'Posjeti', 'Rezervacije', 'Otkazi', 'Upisan'],
                  rows: studios.map((item) => {
                    const niche = item.niche === 'generic' && item.nicheCustom
                      ? item.nicheCustom
                      : (nicheLabel[item.niche] || item.niche || '—');
                    return [
                      item.name || '—',
                      item.slug ? `/s/${item.slug}` : '—',
                      item.email || '—',
                      item.phone || '—',
                      niche,
                      item.active ? 'Aktivan' : 'Neaktivan',
                      formatCount(item.activeMembers),
                      formatCount(item.pageViews),
                      formatCount(item.bookings),
                      formatCount(item.cancellations),
                      formatDate(item.createdAt),
                    ];
                  }),
                }],
                notes: [
                  'Poslovni podaci partnera — čuvajte kao ugovornu / operativnu arhivu.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-studios__metrics" aria-label="Sažetak studija">
          <article>
            <span>Ukupno</span>
            <strong>{formatCount(summary.total)}</strong>
          </article>
          <article>
            <span>Aktivni</span>
            <strong>{formatCount(summary.active)}</strong>
          </article>
          <article>
            <span>Neaktivni</span>
            <strong>{formatCount(summary.inactive)}</strong>
          </article>
          <article>
            <span>Sa članovima</span>
            <strong>{formatCount(summary.withMembers)}</strong>
          </article>
        </section>

        <section className="platform-studios__block" aria-labelledby="studios-list-title">
          <header className="platform-studios__block-head">
            <span className="platform-studios__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-studios__kicker">Partneri</p>
              <h2 id="studios-list-title">Popis studija</h2>
              <p>
                Prikazano
                {' '}
                {visible.length}
                {' '}
                od
                {' '}
                {summary.total}
                .
              </p>
            </div>
          </header>

          <div className="platform-studios__toolbar">
            <label className="platform-studios__search">
              <span className="visually-hidden">Pretraži studije</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Traži naziv, slug ili kontakt…"
              />
            </label>
            <div className="platform-studios__filters" role="tablist" aria-label="Filter studija">
              {[
                ['all', `Svi (${summary.total})`],
                ['active', `Aktivni (${summary.active})`],
                ['inactive', `Neaktivni (${summary.inactive})`],
                ['members', `Sa članovima (${summary.withMembers})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  className={filter === id ? 'is-on' : undefined}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="platform-studios__empty">Nema studija za ovaj filter.</p>
          ) : (
            <ul className="platform-studios__list">
              {visible.map((item, index) => {
                const niche = item.niche === 'generic' && item.nicheCustom
                  ? item.nicheCustom
                  : (nicheLabel[item.niche] || item.niche);
                const viewsPct = Math.round(((Number(item.pageViews) || 0) / maxViews) * 100);
                return (
                  <li key={item.id}>
                    <div className="platform-studios__row-top">
                      <span className="platform-studios__n" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="platform-studios__identity">
                        <div className="platform-studios__title">
                          <strong>{item.name}</strong>
                          <span className={`platform-studios__pill${item.active ? ' is-ok' : ' is-off'}`}>
                            {item.active ? 'Aktivan' : 'Neaktivan'}
                          </span>
                        </div>
                        <p className="platform-studios__sub">
                          <Link to={`/s/${item.slug}`}>
                            /s/
                            {item.slug}
                          </Link>
                          {item.email ? ` · ${item.email}` : ''}
                        </p>
                        <p className="platform-studios__niche">{niche}</p>
                      </div>
                      <p className="platform-studios__joined">
                        <span>Upisan</span>
                        <strong>{formatDate(item.createdAt)}</strong>
                      </p>
                    </div>

                    <div className="platform-studios__traffic" aria-hidden="true">
                      <span style={{ width: `${viewsPct}%` }} />
                    </div>

                    <dl className="platform-studios__meta">
                      <div>
                        <dt>Članovi</dt>
                        <dd>{formatCount(item.activeMembers)}</dd>
                      </div>
                      <div>
                        <dt>Posjeti</dt>
                        <dd>{formatCount(item.pageViews)}</dd>
                      </div>
                      <div>
                        <dt>Rezervacije</dt>
                        <dd>{formatCount(item.bookings)}</dd>
                      </div>
                      <div>
                        <dt>Otkazi</dt>
                        <dd>{formatCount(item.cancellations)}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
