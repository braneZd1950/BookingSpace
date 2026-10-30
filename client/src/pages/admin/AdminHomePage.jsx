import { Link, useOutletContext } from 'react-router-dom';
import {
  PLATFORM_POLL,
  useGetPlatformAnalyticsQuery,
  useGetPlatformUsersQuery,
} from '../../api/analyticsApi.js';
import './AdminPages.scss';

const links = [
  {
    to: '/analitika',
    index: '01',
    title: 'Pregled platforme',
    text: 'Studiji, korisnici, aktivnost, naplata i sustav.',
  },
  {
    to: '/analitika/studiji',
    index: '02',
    title: 'Studiji',
    text: 'Popis aktivnih studija i njihov status.',
  },
  {
    to: '/analitika/korisnici',
    index: '03',
    title: 'Korisnici',
    text: 'Svi računi na platformi — članovi i vlasnici.',
  },
];

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('hr-HR').format(Number(value));
}

export default function AdminHomePage() {
  const { me } = useOutletContext();
  const isSuper = Boolean(me?.platformSuperAdmin);
  const name = me?.user?.name || 'Admin';

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useGetPlatformUsersQuery(30, PLATFORM_POLL.users);

  const {
    data: overviewData,
    isLoading: overviewLoading,
  } = useGetPlatformAnalyticsQuery(30, PLATFORM_POLL.overview);

  const summary = usersData?.summary || {};
  const customers = summary.customers ?? 0;
  const owners = summary.owners ?? 0;
  const totalUsers = summary.total ?? 0;
  const studios = overviewData?.inventory?.tenants ?? 0;
  const loading = usersLoading || overviewLoading;

  return (
    <main className="admin-home">
      <div className="admin-home__atmosphere" aria-hidden="true">
        <span className="admin-home__wash" />
        <span className="admin-home__grain" />
      </div>

      <div className="admin-home__stage">
        <header className="admin-home__head">
          <div>
            <p className="admin-home__eyebrow">Platforma</p>
            <h1>Administracija</h1>
            <p className="admin-home__lede">
              Dobrodošli,
              {' '}
              {name}
              . Prijava ide preko obične stranice — ovdje vodite pregled i djelatnike.
            </p>
          </div>
          <p className={`admin-home__live${usersFetching ? ' is-busy' : ''}`}>
            {loading ? 'Učitavanje…' : 'Uživo'}
          </p>
        </header>

        <section className="admin-home__metrics" aria-label="Sažetak korisnika">
          <article className="admin-home__metric">
            <span className="admin-home__metric-kicker">Ukupno</span>
            <strong>{loading ? '…' : formatCount(totalUsers)}</strong>
            <p>Svi računi na platformi</p>
          </article>
          <article className="admin-home__metric admin-home__metric--people">
            <span className="admin-home__metric-kicker">Fizičke osobe</span>
            <strong>{loading ? '…' : formatCount(customers)}</strong>
            <p>Privatni korisnici (članovi)</p>
          </article>
          <article className="admin-home__metric admin-home__metric--biz">
            <span className="admin-home__metric-kicker">Poslovni</span>
            <strong>{loading ? '…' : formatCount(owners)}</strong>
            <p>Pravni korisnici (vlasnici studija)</p>
          </article>
          <article className="admin-home__metric">
            <span className="admin-home__metric-kicker">Studiji</span>
            <strong>{loading ? '…' : formatCount(studios)}</strong>
            <p>Aktivna i registrirana mjesta</p>
          </article>
        </section>

        <section className="admin-home__nav-block" aria-labelledby="admin-nav-title">
          <header className="admin-home__nav-head">
            <span className="admin-home__index" aria-hidden="true">01</span>
            <div>
              <p className="admin-home__kicker">Navigacija</p>
              <h2 id="admin-nav-title">Gdje dalje</h2>
              <p>Otvorite analitiku, studije ili upravljanje djelatnicima.</p>
            </div>
          </header>

          <div className="admin-home__grid">
            {links.map((item) => (
              <Link key={item.to} className="admin-home__card" to={item.to}>
                <span className="admin-home__card-index" aria-hidden="true">{item.index}</span>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </Link>
            ))}
            {isSuper ? (
              <Link className="admin-home__card admin-home__card--accent" to="/admin/djelatnici">
                <span className="admin-home__card-index" aria-hidden="true">04</span>
                <strong>Djelatnici</strong>
                <span>
                  Dodajte operatere platforme. Super admin se ne stvara ovdje —
                  samo ručno u bazi.
                </span>
              </Link>
            ) : (
              <article className="admin-home__card admin-home__card--muted">
                <span className="admin-home__card-index" aria-hidden="true">04</span>
                <strong>Djelatnici</strong>
                <span>Upravljanje djelatnicima dostupno je samo super adminu.</span>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
