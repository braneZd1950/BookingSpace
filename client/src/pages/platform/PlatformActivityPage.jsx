import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformActivityQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformActivityPage.scss';

const TYPE_LABELS = {
  page_view: 'Posjet',
  login_success: 'Prijava',
  register_success: 'Registracija',
  tenant_created: 'Novi studio',
  member_created: 'Novi član',
  booking_created: 'Rezervacija',
  booking_cancelled: 'Otkaz',
  booking_completed: 'Završeno',
  booking_no_show: 'Nedolazak',
  password_reset_requested: 'Oporavak lozinke',
};

const FILTERS = [
  ['actions', 'Akcije'],
  ['all', 'Sve'],
  ['login_success', 'Prijave'],
  ['booking_created', 'Rezervacije'],
  ['booking_completed', 'Završeno'],
  ['booking_cancelled', 'Otkazi'],
  ['member_created', 'Članovi'],
  ['tenant_created', 'Studiji'],
  ['register_success', 'Registracije'],
  ['page_view', 'Posjeti'],
];

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

function pillClass(type) {
  if (type === 'booking_cancelled' || type === 'booking_no_show') return 'is-warn';
  if (type === 'page_view') return 'is-muted';
  if (
    type === 'booking_created'
    || type === 'booking_completed'
    || type === 'tenant_created'
    || type === 'member_created'
    || type === 'register_success'
  ) {
    return 'is-ok';
  }
  if (type === 'login_success') return 'is-login';
  return '';
}

export default function PlatformActivityPage() {
  const { me } = useOutletContext() || {};
  const [filter, setFilter] = useState('actions');
  const { data, isLoading, isError, isFetching } = useGetPlatformActivityQuery(
    { days: 7, type: filter },
    PLATFORM_POLL.activity,
  );

  const summary = data?.summary || {};
  const events = data?.events || [];

  if (isLoading) {
    return (
      <main className="platform-activity">
        <div className="platform-activity__stage">
          <p className="platform-activity__lede">Učitavamo događaje…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-activity">
        <div className="platform-activity__stage">
          <header className="platform-activity__head">
            <div>
              <p className="platform-activity__eyebrow">Platforma</p>
              <h1>Aktivnost</h1>
              <p className="platform-activity__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="platform-activity">
      <div className="platform-activity__atmosphere" aria-hidden="true">
        <span className="platform-activity__wash" />
        <span className="platform-activity__grain" />
      </div>

      <div className="platform-activity__stage">
        <header className="platform-activity__head">
          <div>
            <p className="platform-activity__eyebrow">Platforma</p>
            <h1>Aktivnost</h1>
            <p className="platform-activity__lede">
              Nedavni događaji · zadnjih
              {' '}
              {data.days}
              {' '}
              dana · osvježava se uživo.
            </p>
          </div>
          <div className="platform-activity__head-actions">
            <p className={`platform-activity__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Dnevnik aktivnosti platforme',
                subtitle: `Audit feed · zadnjih ${data.days} dana · filter: ${FILTERS.find(([id]) => id === filter)?.[1] || filter}.`,
                fileStem: 'aktivnost',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Ukupno', value: formatCount(summary.total) },
                  { label: 'Akcije', value: formatCount(summary.actions) },
                  { label: 'Posjeti', value: formatCount(summary.page_view) },
                  { label: 'Prijave', value: formatCount(summary.login_success) },
                  { label: 'Rezervacije', value: formatCount(summary.booking_created) },
                  { label: 'Otkazi', value: formatCount(summary.booking_cancelled) },
                ],
                sections: [{
                  title: 'Feed događaja',
                  lead: `Ispisano ${events.length} zapisa (trenutni filter).`,
                  columns: ['Vrijeme', 'Tip', 'Korisnik', 'E-pošta', 'Kontekst', 'Putanja'],
                  rows: events.map((item) => [
                    formatWhen(item.createdAt),
                    TYPE_LABELS[item.type] || item.type,
                    item.user?.name || 'Anonimno',
                    item.user?.email || '—',
                    item.studio
                      ? `${item.studio.name} (/s/${item.studio.slug})`
                      : 'Platforma',
                    item.path || '—',
                  ]),
                }],
                notes: [
                  'Audit zapis za internu kontrolu pristupa i događaja.',
                  'Čuvajte kao dokazni trag odvojeno od žive baze.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-activity__metrics" aria-label="Sažetak aktivnosti">
          <article>
            <span>Ukupno</span>
            <strong>{formatCount(summary.total)}</strong>
          </article>
          <article>
            <span>Akcije</span>
            <strong>{formatCount(summary.actions)}</strong>
          </article>
          <article>
            <span>Posjeti</span>
            <strong>{formatCount(summary.page_view)}</strong>
          </article>
          <article>
            <span>Prijave</span>
            <strong>{formatCount(summary.login_success)}</strong>
          </article>
          <article>
            <span>Rezervacije</span>
            <strong>{formatCount(summary.booking_created)}</strong>
          </article>
          <article>
            <span>Otkazi</span>
            <strong>{formatCount(summary.booking_cancelled)}</strong>
          </article>
        </section>

        <section className="platform-activity__block" aria-labelledby="activity-feed-title">
          <header className="platform-activity__block-head">
            <span className="platform-activity__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-activity__kicker">Feed</p>
              <h2 id="activity-feed-title">Nedavni događaji</h2>
              <p>
                Zadnjih
                {' '}
                {events.length}
                {' '}
                zapisa u feedu.
              </p>
            </div>
          </header>

          <div className="platform-activity__toolbar">
            <div className="platform-activity__filters" role="tablist" aria-label="Filter aktivnosti">
              {FILTERS.map(([id, label]) => (
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

          {events.length === 0 ? (
            <p className="platform-activity__empty">Nema događaja za ovaj filter.</p>
          ) : (
            <ul className="platform-activity__feed">
              {events.map((item, index) => (
                <li key={item.id}>
                  <span className="platform-activity__n" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="platform-activity__body">
                    <div className="platform-activity__title">
                      <span className={`platform-activity__pill ${pillClass(item.type)}`.trim()}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                      <strong>{item.user?.name || 'Anonimno'}</strong>
                    </div>
                    {item.user?.email ? (
                      <p className="platform-activity__sub">{item.user.email}</p>
                    ) : null}
                    <p className="platform-activity__meta">
                      {item.studio
                        ? `${item.studio.name} (/s/${item.studio.slug})`
                        : 'Platforma'}
                      {item.path ? ` · ${item.path}` : ''}
                    </p>
                  </div>
                  <time className="platform-activity__when" dateTime={item.createdAt}>
                    <span>Vrijeme</span>
                    <strong>{formatWhen(item.createdAt)}</strong>
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
