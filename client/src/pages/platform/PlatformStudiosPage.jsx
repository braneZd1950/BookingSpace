import { useMemo, useState } from 'react';
import { PLATFORM_POLL, useGetPlatformStudiosQuery } from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

const nicheLabel = {
  fitness: 'Fitness',
  powerplate: 'Power Plate',
  pilates: 'Pilates',
  yoga: 'Yoga',
  playroom: 'Igraonica',
  generic: 'Općenito',
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

export default function PlatformStudiosPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError } = useGetPlatformStudiosQuery(30, PLATFORM_POLL.studios);

  const studios = data?.studios || [];
  const summary = data?.summary || { total: 0, active: 0, inactive: 0, withMembers: 0 };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return studios.filter((item) => {
      if (filter === 'active' && !item.active) return false;
      if (filter === 'inactive' && item.active) return false;
      if (filter === 'members' && item.activeMembers < 1) return false;
      if (!needle) return true;
      const hay = [item.name, item.slug, item.niche, item.email, item.phone]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [studios, query, filter]);

  if (isLoading) {
    return (
      <PlatformSection title="Studiji" lead="Učitavamo partnere…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Studiji" lead="Podaci trenutno nisu dostupni.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  return (
    <PlatformSection
      title="Studiji"
      lead={`Svi partneri na platformi · aktivnost zadnjih ${data.days} dana. Bez podataka članova.`}
    >
      <div className="analytics__stats" aria-label="Sažetak studija">
        <article>
          <span>Ukupno</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Aktivni</span>
          <strong>{summary.active}</strong>
        </article>
        <article>
          <span>Neaktivni</span>
          <strong>{summary.inactive}</strong>
        </article>
        <article>
          <span>Sa članovima</span>
          <strong>{summary.withMembers}</strong>
        </article>
      </div>

      <div className="analytics__toolbar">
        <label className="analytics__search">
          <span className="visually-hidden">Pretraži studije</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Traži naziv, slug ili kontakt…"
          />
        </label>
        <div className="analytics__filters" role="tablist" aria-label="Filter studija">
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
        <p className="analytics__lead">Nema studija za ovaj filter.</p>
      ) : (
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Studio</th>
                <th>Status</th>
                <th>Niša</th>
                <th>Članovi</th>
                <th>Posjeti</th>
                <th>Rezervacije</th>
                <th>Otkazi</th>
                <th>Upisan</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="analytics__sub">
                      /s/
                      {item.slug}
                      {item.email ? ` · ${item.email}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`analytics__pill${item.active ? ' is-ok' : ' is-off'}`}>
                      {item.active ? 'Aktivan' : 'Neaktivan'}
                    </span>
                  </td>
                  <td>{nicheLabel[item.niche] || item.niche}</td>
                  <td>{item.activeMembers}</td>
                  <td>{item.pageViews}</td>
                  <td>{item.bookings}</td>
                  <td>{item.cancellations}</td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PlatformSection>
  );
}
