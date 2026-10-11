import { useGetPlatformAnalyticsQuery } from '../../api/analyticsApi.js';
import './AnalyticsPage.scss';

const LABELS = {
  page_view: 'Posjeti stranica',
  login_success: 'Prijave',
  register_success: 'Registracije',
  member_created: 'Dodani članovi',
  booking_created: 'Rezervacije',
  booking_cancelled: 'Otkazi',
  password_reset_requested: 'Oporavak lozinke',
};

export default function PlatformAnalyticsPage() {
  const { data, isLoading, isError } = useGetPlatformAnalyticsQuery(30);

  if (isLoading) {
    return (
      <main className="analytics">
        <p>Učitavamo analitiku…</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="analytics">
        <h1>Pregled</h1>
        <p className="analytics__lead">Podaci trenutno nisu dostupni.</p>
      </main>
    );
  }

  const counts = data.counts || {};

  return (
    <main className="analytics">
      <header className="analytics__head">
        <div>
          <h1>Pregled</h1>
          <p className="analytics__lead">
            Globalno korištenje — agregati bez podataka pojedinog studija ili člana.
            Zadnjih {data.days} dana.
          </p>
        </div>
      </header>

      <div className="analytics__stats" aria-label="Sažetak">
        <article>
          <span>Studiji</span>
          <strong>{data.inventory?.tenants ?? 0}</strong>
        </article>
        <article>
          <span>Korisnici</span>
          <strong>{data.inventory?.users ?? 0}</strong>
        </article>
        <article>
          <span>Događaji</span>
          <strong>{data.totalEvents ?? 0}</strong>
        </article>
      </div>

      <div className="analytics__stats analytics__stats--wide" aria-label="Akcije">
        {Object.entries(LABELS).map(([key, label]) => (
          <article key={key}>
            <span>{label}</span>
            <strong>{counts[key] || 0}</strong>
          </article>
        ))}
      </div>

      <section className="analytics__block">
        <h2>Po danima</h2>
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dan</th>
                <th>Posjeti</th>
                <th>Prijave</th>
                <th>Rezervacije</th>
                <th>Otkazi</th>
                <th>Članovi</th>
              </tr>
            </thead>
            <tbody>
              {(data.series || []).map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.page_view}</td>
                  <td>{row.login_success}</td>
                  <td>{row.booking_created}</td>
                  <td>{row.booking_cancelled}</td>
                  <td>{row.member_created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics__block">
        <h2>Najposjećenije putanje</h2>
        <ul className="analytics__paths">
          {(data.topPaths || []).map((item) => (
            <li key={item.path}>
              <code>{item.path}</code>
              <strong>{item.count}</strong>
            </li>
          ))}
          {(data.topPaths || []).length === 0 ? (
            <li className="analytics__empty">Još nema dovoljno posjeta.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
