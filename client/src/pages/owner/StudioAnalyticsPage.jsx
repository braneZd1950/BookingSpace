import { useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetStudioAnalyticsQuery } from '../../api/analyticsApi.js';
import '../public/AnalyticsPage.scss';

const LABELS = {
  page_view: 'Posjeti',
  login_success: 'Prijave (vezane uz studio)',
  member_created: 'Dodani članovi',
  booking_created: 'Rezervacije',
  booking_cancelled: 'Otkazi',
  booking_completed: 'Završeni termini',
  booking_no_show: 'Nedolasci',
};

const REAL_ID = /^[a-f\d]{24}$/i;

export default function StudioAnalyticsPage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const { data, isLoading, isError } = useGetStudioAnalyticsQuery(
    { tenantId, days: 30 },
    { skip: !ready, ...PLATFORM_POLL.studio },
  );

  if (!ready) {
    return (
      <section className="studio-panel analytics analytics--studio">
        <h1>Analitika</h1>
        <p className="analytics__lead">Studio još nije u bazi.</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="studio-panel analytics analytics--studio">
        <p>Učitavamo analitiku…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="studio-panel analytics analytics--studio">
        <h1>Analitika</h1>
        <p className="analytics__lead">Podaci nisu dostupni.</p>
      </section>
    );
  }

  const counts = data.counts || {};

  return (
    <section className="studio-panel analytics analytics--studio">
      <header className="analytics__head">
        <div>
          <h1>Analitika</h1>
          <p className="analytics__lead">
            Samo tvoj studio — zadnjih {data.days} dana. Drugi studiji i platforma ne vide ove brojke.
          </p>
        </div>
      </header>

      <div className="analytics__stats analytics__stats--wide" aria-label="Akcije studija">
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
    </section>
  );
}
