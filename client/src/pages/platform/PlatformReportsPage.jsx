import { Link, useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformReportsQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformReportsPage.scss';

const ROWS = [
  ['page_view', 'Posjeti stranica'],
  ['login_success', 'Prijave'],
  ['register_success', 'Registracije'],
  ['tenant_created', 'Novi studiji'],
  ['member_created', 'Dodani članovi'],
  ['booking_created', 'Rezervacije'],
  ['booking_cancelled', 'Otkazi'],
  ['booking_completed', 'Završeni termini'],
  ['booking_no_show', 'Nedolasci'],
];

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

function deltaText(deltaPct) {
  if (deltaPct == null) return '—';
  if (deltaPct === 0) return '0%';
  return `${deltaPct > 0 ? '+' : ''}${deltaPct}%`;
}

function deltaClass(deltaPct) {
  if (deltaPct == null || deltaPct === 0) return '';
  return deltaPct > 0 ? 'is-up' : 'is-down';
}

export default function PlatformReportsPage() {
  const { me } = useOutletContext() || {};
  const { data, isLoading, isError, isFetching } = useGetPlatformReportsQuery(
    30,
    PLATFORM_POLL.reports,
  );

  if (isLoading) {
    return (
      <main className="platform-reports">
        <div className="platform-reports__stage">
          <p className="platform-reports__lede">Učitavamo usporedbu razdoblja…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-reports">
        <div className="platform-reports__stage">
          <header className="platform-reports__head">
            <div>
              <p className="platform-reports__eyebrow">Platforma</p>
              <h1>Izvještaji</h1>
              <p className="platform-reports__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  const comparison = data.comparison || {};
  const highlights = data.highlights || {};
  const topStudios = data.topStudios || [];
  const maxBookings = Math.max(1, ...topStudios.map((item) => Number(item.bookings) || 0));

  return (
    <main className="platform-reports">
      <div className="platform-reports__atmosphere" aria-hidden="true">
        <span className="platform-reports__wash" />
        <span className="platform-reports__grain" />
      </div>

      <div className="platform-reports__stage">
        <header className="platform-reports__head">
          <div>
            <p className="platform-reports__eyebrow">Platforma</p>
            <h1>Izvještaji</h1>
            <p className="platform-reports__lede">
              Usporedba zadnjih
              {' '}
              {data.days}
              {' '}
              dana s prethodnim jednakim razdobljem. Agregati bez osobnih podataka.
            </p>
          </div>
          <div className="platform-reports__head-actions">
            <p className={`platform-reports__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Izvještaj platforme',
                subtitle: `Usporedba zadnjih ${data.days} dana s prethodnim jednakim razdobljem. Agregati bez osobnih podataka.`,
                fileStem: 'izvjestaji',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Rezervacije', value: formatCount(highlights.bookings) },
                  { label: 'Prijave', value: formatCount(highlights.logins) },
                  { label: 'Novi studiji', value: formatCount(highlights.newStudios) },
                  { label: 'Novi korisnici', value: formatCount(highlights.newUsers) },
                  { label: 'Stopa otkaza', value: `${formatCount(highlights.cancelRate)}%` },
                ],
                sections: [
                  {
                    title: 'Trenutno vs prethodno razdoblje',
                    columns: ['Metrika', 'Trenutno', 'Prethodno', 'Promjena'],
                    rows: ROWS.map(([key, label]) => {
                      const row = comparison[key] || { current: 0, previous: 0, deltaPct: null };
                      return [
                        label,
                        formatCount(row.current),
                        formatCount(row.previous),
                        deltaText(row.deltaPct),
                      ];
                    }),
                  },
                  {
                    title: 'Najaktivniji studiji (rezervacije)',
                    columns: ['Studio', 'Slug', 'Rezervacije'],
                    rows: topStudios.map((item) => [
                      item.name || '—',
                      item.slug ? `/s/${item.slug}` : '—',
                      formatCount(item.bookings),
                    ]),
                  },
                ],
                notes: [
                  'Periodični poslovni izvještaj pogodan za tiskanu ili lokalnu pohranu.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-reports__metrics" aria-label="Istaknuto">
          <article>
            <span>Rezervacije</span>
            <strong>{formatCount(highlights.bookings)}</strong>
          </article>
          <article>
            <span>Prijave</span>
            <strong>{formatCount(highlights.logins)}</strong>
          </article>
          <article>
            <span>Novi studiji</span>
            <strong>{formatCount(highlights.newStudios)}</strong>
          </article>
          <article>
            <span>Novi korisnici</span>
            <strong>{formatCount(highlights.newUsers)}</strong>
          </article>
          <article>
            <span>Stopa otkaza</span>
            <strong>
              {formatCount(highlights.cancelRate)}
              %
            </strong>
          </article>
        </section>

        <section className="platform-reports__block" aria-labelledby="compare-title">
          <header className="platform-reports__block-head">
            <span className="platform-reports__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-reports__kicker">Usporedba</p>
              <h2 id="compare-title">Trenutno vs prethodno</h2>
              <p>Isti broj dana, razdoblje odmah prije trenutnog.</p>
            </div>
          </header>

          <ul className="platform-reports__compare">
            {ROWS.map(([key, label], index) => {
              const row = comparison[key] || { current: 0, previous: 0, deltaPct: null };
              return (
                <li key={key}>
                  <span className="platform-reports__n" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="platform-reports__compare-main">
                    <strong>{label}</strong>
                    <dl className="platform-reports__compare-meta">
                      <div>
                        <dt>Trenutno</dt>
                        <dd>{formatCount(row.current)}</dd>
                      </div>
                      <div>
                        <dt>Prethodno</dt>
                        <dd>{formatCount(row.previous)}</dd>
                      </div>
                    </dl>
                  </div>
                  <p className={`platform-reports__delta ${deltaClass(row.deltaPct)}`.trim()}>
                    <span>Promjena</span>
                    <strong>{deltaText(row.deltaPct)}</strong>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="platform-reports__block" aria-labelledby="top-studios-title">
          <header className="platform-reports__block-head">
            <span className="platform-reports__index" aria-hidden="true">02</span>
            <div>
              <p className="platform-reports__kicker">Rang</p>
              <h2 id="top-studios-title">Najaktivniji studiji</h2>
              <p>Po broju rezervacija u trenutnom razdoblju.</p>
            </div>
          </header>

          {topStudios.length === 0 ? (
            <p className="platform-reports__empty">
              Još nema dovoljno rezervacija u ovom razdoblju.
            </p>
          ) : (
            <ul className="platform-reports__studios">
              {topStudios.map((item, index) => {
                const pct = Math.round(((Number(item.bookings) || 0) / maxBookings) * 100);
                return (
                  <li key={item.id}>
                    <div className="platform-reports__studio-top">
                      <span className="platform-reports__n" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="platform-reports__studio-id">
                        <strong>{item.name}</strong>
                        <p className="platform-reports__sub">
                          {item.slug ? (
                            <Link to={`/s/${item.slug}`}>
                              /s/
                              {item.slug}
                            </Link>
                          ) : '—'}
                        </p>
                      </div>
                      <p className="platform-reports__bookings">
                        <span>Rezervacije</span>
                        <strong>{formatCount(item.bookings)}</strong>
                      </p>
                    </div>
                    <div className="platform-reports__bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
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
