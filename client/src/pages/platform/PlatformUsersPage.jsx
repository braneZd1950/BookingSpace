import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformUsersQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformUsersPage.scss';

const roleLabel = {
  BUSINESS_OWNER: 'Vlasnik',
  CUSTOMER: 'Član',
  STAFF: 'Osoblje studija',
  ADMIN: 'Super admin',
  PLATFORM_STAFF: 'Djelatnik platforme',
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

function pillClass(role) {
  if (role === 'ADMIN' || role === 'PLATFORM_STAFF') return 'is-admin';
  if (role === 'BUSINESS_OWNER') return 'is-owner';
  if (role === 'CUSTOMER') return 'is-member';
  return '';
}

export default function PlatformUsersPage() {
  const { me } = useOutletContext() || {};
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { data, isLoading, isError, isFetching } = useGetPlatformUsersQuery(
    30,
    PLATFORM_POLL.users,
  );

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
      if (filter === 'admins' && item.role !== 'ADMIN' && item.role !== 'PLATFORM_STAFF') {
        return false;
      }
      if (filter === 'new') {
        const since = data?.since ? new Date(data.since) : null;
        if (!since || new Date(item.createdAt) < since) return false;
      }
      if (!needle) return true;
      const hay = [item.name, item.email, item.phone, item.role].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [users, query, filter, data?.since]);

  const maxLogins = useMemo(
    () => Math.max(1, ...visible.map((item) => Number(item.logins) || 0)),
    [visible],
  );

  if (isLoading) {
    return (
      <main className="platform-users">
        <div className="platform-users__stage">
          <p className="platform-users__lede">Učitavamo račune…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-users">
        <div className="platform-users__stage">
          <header className="platform-users__head">
            <div>
              <p className="platform-users__eyebrow">Platforma</p>
              <h1>Korisnici</h1>
              <p className="platform-users__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="platform-users">
      <div className="platform-users__atmosphere" aria-hidden="true">
        <span className="platform-users__wash" />
        <span className="platform-users__grain" />
      </div>

      <div className="platform-users__stage">
        <header className="platform-users__head">
          <div>
            <p className="platform-users__eyebrow">Platforma</p>
            <h1>Korisnici</h1>
            <p className="platform-users__lede">
              Svi računi na platformi · prijave u zadnjih
              {' '}
              {data.days}
              {' '}
              dana. Bez lozinki i bez detalja članarina.
            </p>
          </div>
          <div className="platform-users__head-actions">
            <p className={`platform-users__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Popis korisnika platforme',
                subtitle: `Svi računi · prijave u zadnjih ${data.days} dana. Osobni podaci bez lozinki.`,
                fileStem: 'korisnici',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Ukupno', value: formatCount(summary.total) },
                  { label: 'Vlasnici', value: formatCount(summary.owners) },
                  { label: 'Članovi', value: formatCount(summary.customers) },
                  { label: 'Admini', value: formatCount(summary.admins) },
                  { label: `Novi (${data.days} d)`, value: formatCount(summary.newInPeriod) },
                ],
                sections: [{
                  title: 'Računi',
                  lead: `Ispisano ${users.length} zapisa.`,
                  columns: ['Ime', 'E-pošta', 'Telefon', 'Uloga', 'Studiji', 'Vlasnik', 'Član', 'Prijave', 'Registriran'],
                  rows: users.map((item) => [
                    item.name || '—',
                    item.email || '—',
                    item.phone || '—',
                    roleLabel[item.role] || item.role,
                    formatCount(item.linkedStudios),
                    formatCount(item.ownsStudios),
                    formatCount(item.memberOfStudios),
                    formatCount(item.logins),
                    formatDate(item.createdAt),
                  ]),
                }],
                notes: [
                  'Dokument sadrži osobne podatke. Čuvajte ga kao povjerljivu arhivu.',
                  'Lozinke nisu uključene.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-users__metrics" aria-label="Sažetak korisnika">
          <article>
            <span>Ukupno</span>
            <strong>{formatCount(summary.total)}</strong>
          </article>
          <article>
            <span>Vlasnici</span>
            <strong>{formatCount(summary.owners)}</strong>
          </article>
          <article>
            <span>Članovi</span>
            <strong>{formatCount(summary.customers)}</strong>
          </article>
          <article>
            <span>Admini</span>
            <strong>{formatCount(summary.admins)}</strong>
          </article>
          <article>
            <span>
              Novi (
              {data.days}
              {' '}
              d)
            </span>
            <strong>{formatCount(summary.newInPeriod)}</strong>
          </article>
        </section>

        <section className="platform-users__block" aria-labelledby="users-list-title">
          <header className="platform-users__block-head">
            <span className="platform-users__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-users__kicker">Računi</p>
              <h2 id="users-list-title">Popis korisnika</h2>
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

          <div className="platform-users__toolbar">
            <label className="platform-users__search">
              <span className="visually-hidden">Pretraži korisnike</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Traži ime ili e-poštu…"
              />
            </label>
            <div className="platform-users__filters" role="tablist" aria-label="Filter korisnika">
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
            <p className="platform-users__empty">Nema korisnika za ovaj filter.</p>
          ) : (
            <ul className="platform-users__list">
              {visible.map((item, index) => {
                const loginsPct = Math.round(((Number(item.logins) || 0) / maxLogins) * 100);
                return (
                  <li key={item.id}>
                    <div className="platform-users__row-top">
                      <span className="platform-users__n" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="platform-users__identity">
                        <div className="platform-users__title">
                          <strong>{item.name}</strong>
                          <span className={`platform-users__pill ${pillClass(item.role)}`.trim()}>
                            {roleLabel[item.role] || item.role}
                          </span>
                        </div>
                        <p className="platform-users__sub">
                          {item.email}
                          {item.phone ? ` · ${item.phone}` : ''}
                        </p>
                      </div>
                      <p className="platform-users__joined">
                        <span>Registriran</span>
                        <strong>{formatDate(item.createdAt)}</strong>
                      </p>
                    </div>

                    <div className="platform-users__traffic" aria-hidden="true">
                      <span style={{ width: `${loginsPct}%` }} />
                    </div>

                    <dl className="platform-users__meta">
                      <div>
                        <dt>Studiji</dt>
                        <dd>{formatCount(item.linkedStudios)}</dd>
                      </div>
                      <div>
                        <dt>Kao vlasnik</dt>
                        <dd>{formatCount(item.ownsStudios)}</dd>
                      </div>
                      <div>
                        <dt>Kao član</dt>
                        <dd>{formatCount(item.memberOfStudios)}</dd>
                      </div>
                      <div>
                        <dt>Prijave</dt>
                        <dd>{formatCount(item.logins)}</dd>
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
