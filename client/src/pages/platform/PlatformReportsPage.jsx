import { PLATFORM_POLL, useGetPlatformReportsQuery } from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

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
  const { data, isLoading, isError } = useGetPlatformReportsQuery(30, PLATFORM_POLL.reports);

  if (isLoading) {
    return (
      <PlatformSection title="Izvještaji" lead="Učitavamo usporedbu razdoblja…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Izvještaji" lead="Podaci trenutno nisu dostupni.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  const comparison = data.comparison || {};
  const highlights = data.highlights || {};

  return (
    <PlatformSection
      title="Izvještaji"
      lead={`Usporedba zadnjih ${data.days} dana s prethodnim jednakim razdobljem. Agregati bez osobnih podataka.`}
    >
      <div className="analytics__stats analytics__stats--wide" aria-label="Istaknuto">
        <article>
          <span>Rezervacije</span>
          <strong>{highlights.bookings || 0}</strong>
        </article>
        <article>
          <span>Prijave</span>
          <strong>{highlights.logins || 0}</strong>
        </article>
        <article>
          <span>Novi studiji</span>
          <strong>{highlights.newStudios || 0}</strong>
        </article>
        <article>
          <span>Novi korisnici</span>
          <strong>{highlights.newUsers || 0}</strong>
        </article>
        <article>
          <span>Stopa otkaza</span>
          <strong>
            {highlights.cancelRate || 0}
            %
          </strong>
        </article>
      </div>

      <section className="analytics__block">
        <h2>Trenutno vs prethodno razdoblje</h2>
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metrika</th>
                <th>Trenutno</th>
                <th>Prethodno</th>
                <th>Promjena</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([key, label]) => {
                const row = comparison[key] || { current: 0, previous: 0, deltaPct: null };
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>{row.current}</td>
                    <td>{row.previous}</td>
                    <td>
                      <span className={`analytics__delta ${deltaClass(row.deltaPct)}`.trim()}>
                        {deltaText(row.deltaPct)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics__block">
        <h2>Najaktivniji studiji (rezervacije)</h2>
        {(data.topStudios || []).length === 0 ? (
          <p className="analytics__lead">Još nema dovoljno rezervacija u ovom razdoblju.</p>
        ) : (
          <div className="analytics__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Studio</th>
                  <th>Slug</th>
                  <th>Rezervacije</th>
                </tr>
              </thead>
              <tbody>
                {data.topStudios.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>
                      {item.slug ? `/s/${item.slug}` : '—'}
                    </td>
                    <td>{item.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PlatformSection>
  );
}
