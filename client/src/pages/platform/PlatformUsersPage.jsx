import { useMemo, useState } from 'react';
import { useGetPlatformUsersQuery } from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

const roleLabel = {
  BUSINESS_OWNER: 'Vlasnik',
  CUSTOMER: 'Član',
  STAFF: 'Osoblje',
  ADMIN: 'Admin',
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

export default function PlatformUsersPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError } = useGetPlatformUsersQuery(30);

  const users = data?.users || [];
  const summary = data?.summary || {
    total: 0,
    owners: 0,
    customers: 0,
    admins: 0,
    staff: 0,
    newInPeriod: 0,
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((item) => {
      if (filter === 'owners' && item.role !== 'BUSINESS_OWNER') return false;
      if (filter === 'customers' && item.role !== 'CUSTOMER') return false;
      if (filter === 'admins' && item.role !== 'ADMIN') return false;
      if (filter === 'new') {
        const since = data?.since ? new Date(data.since) : null;
        if (!since || new Date(item.createdAt) < since) return false;
      }
      if (!needle) return true;
      const hay = [item.name, item.email, item.phone, item.role].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [users, query, filter, data?.since]);

  if (isLoading) {
    return (
      <PlatformSection title="Korisnici" lead="Učitavamo račune…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Korisnici" lead="Podaci trenutno nisu dostupni.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  return (
    <PlatformSection
      title="Korisnici"
      lead={`Svi računi na platformi · prijave u zadnjih ${data.days} dana. Bez lozinki i bez detalja članarina.`}
    >
      <div className="analytics__stats analytics__stats--wide" aria-label="Sažetak korisnika">
        <article>
          <span>Ukupno</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Vlasnici</span>
          <strong>{summary.owners}</strong>
        </article>
        <article>
          <span>Članovi</span>
          <strong>{summary.customers}</strong>
        </article>
        <article>
          <span>Admini</span>
          <strong>{summary.admins}</strong>
        </article>
        <article>
          <span>Novi ({data.days} d)</span>
          <strong>{summary.newInPeriod}</strong>
        </article>
      </div>

      <div className="analytics__toolbar">
        <label className="analytics__search">
          <span className="visually-hidden">Pretraži korisnike</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Traži ime ili e-poštu…"
          />
        </label>
        <div className="analytics__filters" role="tablist" aria-label="Filter korisnika">
          {[
            ['all', `Svi (${summary.total})`],
            ['owners', `Vlasnici (${summary.owners})`],
            ['customers', `Članovi (${summary.customers})`],
            ['admins', `Admini (${summary.admins})`],
            ['new', `Novi (${summary.newInPeriod})`],
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
        <p className="analytics__lead">Nema korisnika za ovaj filter.</p>
      ) : (
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Korisnik</th>
                <th>Uloga</th>
                <th>Studiji</th>
                <th>Kao vlasnik</th>
                <th>Kao član</th>
                <th>Prijave</th>
                <th>Registriran</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="analytics__sub">
                      {item.email}
                      {item.phone ? ` · ${item.phone}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`analytics__pill${item.role === 'ADMIN' ? ' is-ok' : ''}`}>
                      {roleLabel[item.role] || item.role}
                    </span>
                  </td>
                  <td>{item.linkedStudios}</td>
                  <td>{item.ownsStudios}</td>
                  <td>{item.memberOfStudios}</td>
                  <td>{item.logins}</td>
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
