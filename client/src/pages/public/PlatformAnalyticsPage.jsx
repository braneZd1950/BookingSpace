import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformAnalyticsQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformAnalyticsPage.scss';

const LABELS = {
  page_view: 'Posjeti stranica',
  login_success: 'Prijave',
  register_success: 'Registracije',
  tenant_created: 'Novi studiji',
  member_created: 'Dodani članovi',
  booking_created: 'Rezervacije',
  booking_cancelled: 'Otkazi',
  booking_completed: 'Završeni termini',
  booking_no_show: 'Nedolasci',
  password_reset_requested: 'Oporavak lozinke',
};

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

function formatDay(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('hr-HR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function dayActivity(row) {
  return (
    Number(row.page_view) || 0
  ) + (
    Number(row.login_success) || 0
  ) + (
    Number(row.booking_created) || 0
  ) + (
    Number(row.booking_cancelled) || 0
  ) + (
    Number(row.member_created) || 0
  );
}

export default function PlatformAnalyticsPage() {
  const { me } = useOutletContext() || {};
  const { data, isLoading, isError, isFetching } = useGetPlatformAnalyticsQuery(
    30,
    PLATFORM_POLL.overview,
  );

  const activeDays = useMemo(() => {
    const rows = [...(data?.series || [])]
      .filter((row) => dayActivity(row) > 0)
      .reverse();
    const maxViews = Math.max(1, ...rows.map((row) => Number(row.page_view) || 0));
    return rows.map((row) => ({
      ...row,
      label: formatDay(row.date),
      viewsPct: Math.round(((Number(row.page_view) || 0) / maxViews) * 100),
    }));
  }, [data?.series]);

  if (isLoading) {
    return (
      <main className="platform-overview">
        <div className="platform-overview__stage">
          <p className="platform-overview__lede">Učitavamo analitiku…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-overview">
        <div className="platform-overview__stage">
          <header className="platform-overview__head">
            <div>
              <p className="platform-overview__eyebrow">Platforma</p>
              <h1>Pregled</h1>
              <p className="platform-overview__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  const counts = data.counts || {};

  return (
    <main className="platform-overview">
      <div className="platform-overview__atmosphere" aria-hidden="true">
        <span className="platform-overview__wash" />
        <span className="platform-overview__grain" />
      </div>

      <div className="platform-overview__stage">
        <header className="platform-overview__head">
          <div>
            <p className="platform-overview__eyebrow">Platforma</p>
            <h1>Pregled</h1>
            <p className="platform-overview__lede">
              Globalno korištenje — agregati bez podataka pojedinog studija ili člana.
              Zadnjih
              {' '}
              {data.days}
              {' '}
              dana.
            </p>
          </div>
          <div className="platform-overview__head-actions">
            <p className={`platform-overview__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Pregled platforme',
                subtitle: `Globalno korištenje · zadnjih ${data.days} dana. Agregati bez osobnih podataka.`,
                fileStem: 'pregled',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Studiji', value: formatCount(data.inventory?.tenants) },
                  { label: 'Korisnici', value: formatCount(data.inventory?.users) },
                  { label: 'Događaji', value: formatCount(data.totalEvents) },
                ],
                sections: [
                  {
                    title: 'Akcije u razdoblju',
                    columns: ['Metrika', 'Broj'],
                    rows: Object.entries(LABELS).map(([key, label]) => [
                      label,
                      formatCount(counts[key]),
                    ]),
                  },
                  {
                    title: 'Dani s aktivnošću',
                    columns: ['Dan', 'Datum', 'Posjeti', 'Prijave', 'Rezervacije', 'Otkazi', 'Članovi'],
                    rows: activeDays.map((row) => [
                      row.label,
                      row.date,
                      formatCount(row.page_view),
                      formatCount(row.login_success),
                      formatCount(row.booking_created),
                      formatCount(row.booking_cancelled),
                      formatCount(row.member_created),
                    ]),
                  },
                  {
                    title: 'Najposjećenije putanje',
                    columns: ['Putanja', 'Posjeta'],
                    rows: (data.topPaths || []).map((item) => [
                      item.path,
                      formatCount(item.count),
                    ]),
                  },
                ],
                notes: [
                  'Operativni pregled za periodičnu pohranu i ispis.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-overview__metrics" aria-label="Sažetak">
          <article>
            <span>Studiji</span>
            <strong>{formatCount(data.inventory?.tenants)}</strong>
          </article>
          <article>
            <span>Korisnici</span>
            <strong>{formatCount(data.inventory?.users)}</strong>
          </article>
          <article>
            <span>Događaji</span>
            <strong>{formatCount(data.totalEvents)}</strong>
          </article>
        </section>

        <section className="platform-overview__block" aria-labelledby="actions-title">
          <header className="platform-overview__block-head">
            <span className="platform-overview__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-overview__kicker">Akcije</p>
              <h2 id="actions-title">Što se događalo</h2>
              <p>Zbroj događaja u odabranom razdoblju.</p>
            </div>
          </header>
          <div className="platform-overview__actions" aria-label="Akcije">
            {Object.entries(LABELS).map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>{formatCount(counts[key])}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="platform-overview__block" aria-labelledby="days-title">
          <header className="platform-overview__block-head">
            <span className="platform-overview__index" aria-hidden="true">02</span>
            <div>
              <p className="platform-overview__kicker">Vremenska linija</p>
              <h2 id="days-title">Po danima</h2>
              <p>
                Samo dani s aktivnošću (
                {activeDays.length}
                {' '}
                od
                {' '}
                {data.days}
                ). Najnoviji prvi.
              </p>
            </div>
          </header>

          {activeDays.length === 0 ? (
            <p className="platform-overview__empty">Još nema aktivnosti u ovom razdoblju.</p>
          ) : (
            <ul className="platform-overview__days">
              {activeDays.map((row) => (
                <li key={row.date}>
                  <div className="platform-overview__day-main">
                    <div className="platform-overview__day-label">
                      <strong>{row.label}</strong>
                      <span>{row.date}</span>
                    </div>
                    <div
                      className="platform-overview__day-bar"
                      aria-hidden="true"
                    >
                      <span style={{ width: `${row.viewsPct}%` }} />
                    </div>
                    <p className="platform-overview__day-views">
                      <strong>{formatCount(row.page_view)}</strong>
                      <span>posjeta</span>
                    </p>
                  </div>
                  <dl className="platform-overview__day-meta">
                    <div>
                      <dt>Prijave</dt>
                      <dd>{formatCount(row.login_success)}</dd>
                    </div>
                    <div>
                      <dt>Rezervacije</dt>
                      <dd>{formatCount(row.booking_created)}</dd>
                    </div>
                    <div>
                      <dt>Otkazi</dt>
                      <dd>{formatCount(row.booking_cancelled)}</dd>
                    </div>
                    <div>
                      <dt>Članovi</dt>
                      <dd>{formatCount(row.member_created)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="platform-overview__block" aria-labelledby="paths-title">
          <header className="platform-overview__block-head">
            <span className="platform-overview__index" aria-hidden="true">03</span>
            <div>
              <p className="platform-overview__kicker">Promet</p>
              <h2 id="paths-title">Najposjećenije putanje</h2>
              <p>Najčešće otvorene adrese u razdoblju.</p>
            </div>
          </header>
          <ul className="platform-overview__paths">
            {(data.topPaths || []).map((item, index) => (
              <li key={item.path}>
                <span className="platform-overview__path-n" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <code>{item.path}</code>
                <strong>{formatCount(item.count)}</strong>
              </li>
            ))}
            {(data.topPaths || []).length === 0 ? (
              <li className="platform-overview__empty">Još nema dovoljno posjeta.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
