import { useState } from 'react';
import { useGetPlatformActivityQuery } from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

const TYPE_LABELS = {
  page_view: 'Posjet',
  login_success: 'Prijava',
  register_success: 'Registracija',
  member_created: 'Novi član',
  booking_created: 'Rezervacija',
  booking_cancelled: 'Otkaz',
  password_reset_requested: 'Oporavak lozinke',
};

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

export default function PlatformActivityPage() {
  const [filter, setFilter] = useState('actions');
  const { data, isLoading, isError, isFetching } = useGetPlatformActivityQuery({
    days: 7,
    type: filter,
  });

  const summary = data?.summary || {};
  const events = data?.events || [];

  if (isLoading) {
    return (
      <PlatformSection title="Aktivnost" lead="Učitavamo događaje…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Aktivnost" lead="Podaci trenutno nisu dostupni.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  return (
    <PlatformSection
      title="Aktivnost"
      lead={`Nedavni događaji na platformi · zadnjih ${data.days} dana. Zadnje ${events.length} zapisa u feedu.`}
    >
      <div className="analytics__stats analytics__stats--wide" aria-label="Sažetak aktivnosti">
        <article>
          <span>Ukupno</span>
          <strong>{summary.total || 0}</strong>
        </article>
        <article>
          <span>Akcije</span>
          <strong>{summary.actions || 0}</strong>
        </article>
        <article>
          <span>Posjeti</span>
          <strong>{summary.page_view || 0}</strong>
        </article>
        <article>
          <span>Prijave</span>
          <strong>{summary.login_success || 0}</strong>
        </article>
        <article>
          <span>Rezervacije</span>
          <strong>{summary.booking_created || 0}</strong>
        </article>
        <article>
          <span>Otkazi</span>
          <strong>{summary.booking_cancelled || 0}</strong>
        </article>
      </div>

      <div className="analytics__toolbar">
        <p className="analytics__toolbar-note">
          {isFetching ? 'Osvježavamo…' : 'Filter feeda'}
        </p>
        <div className="analytics__filters" role="tablist" aria-label="Filter aktivnosti">
          {[
            ['actions', 'Akcije'],
            ['all', 'Sve'],
            ['login_success', 'Prijave'],
            ['booking_created', 'Rezervacije'],
            ['booking_cancelled', 'Otkazi'],
            ['member_created', 'Članovi'],
            ['register_success', 'Registracije'],
            ['page_view', 'Posjeti'],
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

      {events.length === 0 ? (
        <p className="analytics__lead">Nema događaja za ovaj filter.</p>
      ) : (
        <ul className="analytics__feed">
          {events.map((item) => (
            <li key={item.id}>
              <div className="analytics__feed-main">
                <span className="analytics__pill is-ok">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <strong>
                  {item.user?.name || 'Anonimno'}
                  {item.user?.email ? (
                    <span className="analytics__sub"> · {item.user.email}</span>
                  ) : null}
                </strong>
                <p className="analytics__feed-meta">
                  {item.studio
                    ? `${item.studio.name} (/s/${item.studio.slug})`
                    : 'Platforma'}
                  {item.path ? ` · ${item.path}` : ''}
                </p>
              </div>
              <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </PlatformSection>
  );
}
