import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetStudioAnalyticsQuery } from '../../api/analyticsApi.js';
import { useListTenantBookingsQuery } from '../../api/bookingApi.js';
import { useListMembershipsQuery } from '../../api/membershipApi.js';
import './StudioAnalyticsPage.scss';

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

function formatMonthHr(yearMonth) {
  const [year, month] = String(yearMonth).split('-').map(Number);
  if (!year || !month) return yearMonth;
  const label = new Intl.DateTimeFormat('hr-HR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function daysLeft(until) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function monthRange(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const pad = (value) => String(value).padStart(2, '0');
  const last = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

function seriesByMonth(series) {
  const map = new Map();
  for (const row of series) {
    const key = String(row.date || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    const current = map.get(key) || {
      month: key,
      page_view: 0,
      booking_created: 0,
      booking_cancelled: 0,
      member_created: 0,
    };
    current.page_view += Number(row.page_view) || 0;
    current.booking_created += Number(row.booking_created) || 0;
    current.booking_cancelled += Number(row.booking_cancelled) || 0;
    current.member_created += Number(row.member_created) || 0;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function memberName(item) {
  return item.user?.name || item.user?.email || 'Član';
}

function buildMemberInsights(memberships, bookings) {
  const active = memberships.filter((item) => item.status === 'ACTIVE');
  const visitsByUser = new Map();
  for (const booking of bookings) {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue;
    const id = String(booking.userId || '');
    if (!id) continue;
    visitsByUser.set(id, (visitsByUser.get(id) || 0) + 1);
  }

  const endingSoon = [];
  const packageHot = [];
  const noVisit = [];
  let withVisit = 0;

  for (const item of active) {
    const userId = String(item.userId || '');
    const left = daysLeft(item.validUntil);
    const visits = visitsByUser.get(userId) || 0;
    if (visits > 0) withVisit += 1;
    else noVisit.push(item);

    if (left != null && left >= 0 && left <= 7) {
      endingSoon.push({ item, left, visits });
    }

    const included = item.sessionsIncluded;
    if (included != null) {
      const used = Number(item.sessionsUsed) || 0;
      const total = Number(included) || 0;
      if (total > 0 && used / total >= 0.85) {
        packageHot.push({
          item,
          used,
          total,
          ratio: used / total,
          visits,
        });
      }
    }
  }

  endingSoon.sort((a, b) => a.left - b.left);
  packageHot.sort((a, b) => b.ratio - a.ratio);
  noVisit.sort((a, b) => memberName(a).localeCompare(memberName(b)));

  const regularity = active.length > 0
    ? Math.round((withVisit / active.length) * 100)
    : 0;

  return {
    activeCount: active.length,
    endingSoonCount: endingSoon.length,
    packageHotCount: packageHot.length,
    noVisitCount: noVisit.length,
    regularity,
    endingSoon: endingSoon.slice(0, 6),
    packageHot: packageHot.slice(0, 6),
    noVisit: noVisit.slice(0, 6),
  };
}

function Shell({ children }) {
  return (
    <section className="studio-panel analytics analytics--studio">
      <div className="analytics__atmosphere" aria-hidden="true">
        <span className="analytics__wash" />
        <span className="analytics__grain" />
      </div>
      <div className="analytics__stage">{children}</div>
    </section>
  );
}

export default function StudioAnalyticsPage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const range = useMemo(() => monthRange(), []);
  const { data, isLoading, isError } = useGetStudioAnalyticsQuery(
    { tenantId, days: 30 },
    { skip: !ready, ...PLATFORM_POLL.studio },
  );
  const { data: memberData } = useListMembershipsQuery(tenantId, { skip: !ready });
  const { data: bookingData } = useListTenantBookingsQuery(
    { tenantId, dateFrom: range.dateFrom, dateTo: range.dateTo, limit: 500 },
    { skip: !ready },
  );

  const insights = useMemo(
    () => buildMemberInsights(
      memberData?.memberships || [],
      bookingData?.bookings || [],
    ),
    [memberData, bookingData],
  );

  if (!ready) {
    return (
      <Shell>
        <p className="analytics__eyebrow">Uvidi</p>
        <h1>Analitika</h1>
        <p className="analytics__lede">Studio još nije u bazi.</p>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <p className="analytics__eyebrow">Uvidi</p>
        <h1>Analitika</h1>
        <p className="analytics__lede">Učitavamo analitiku…</p>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <p className="analytics__eyebrow">Uvidi</p>
        <h1>Analitika</h1>
        <p className="analytics__lede">Podaci nisu dostupni.</p>
      </Shell>
    );
  }

  const counts = data.counts || {};
  const months = seriesByMonth(data.series || []);
  const totalBookings = counts.booking_created || 0;

  return (
    <Shell>
      <header className="analytics__head">
        <div>
          <p className="analytics__eyebrow">Uvidi</p>
          <h1>Analitika</h1>
          <p className="analytics__lede">
            Samo tvoj studio — zadnjih {data.days} dana. Drugi studiji i platforma ne vide ove brojke.
          </p>
        </div>
        <p className="analytics__period">
          <span>Razdoblje</span>
          <strong>
            {data.days}
            {' '}
            dana
          </strong>
        </p>
      </header>

      <div className="analytics__stats" aria-label="Akcije studija">
        {Object.entries(LABELS).map(([key, label]) => (
          <article key={key}>
            <span>{label}</span>
            <strong>{counts[key] || 0}</strong>
          </article>
        ))}
      </div>

      <section className="analytics__block">
        <header className="analytics__panel-head">
          <span className="analytics__index" aria-hidden="true">01</span>
          <div>
            <p className="analytics__kicker">Vrijeme</p>
            <h2>Po mjesecima</h2>
            <p>Zbroj posjeta, rezervacija, otkaza i novih članova po mjesecu.</p>
          </div>
          <p className="analytics__meta">
            <strong>{totalBookings}</strong>
            <span>rezervacija</span>
          </p>
        </header>
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mjesec</th>
                <th>Posjeti</th>
                <th>Rezervacije</th>
                <th>Otkazi</th>
                <th>Članovi</th>
              </tr>
            </thead>
            <tbody>
              {months.map((row) => (
                <tr key={row.month}>
                  <td>
                    <time dateTime={row.month}>{formatMonthHr(row.month)}</time>
                  </td>
                  <td>{row.page_view}</td>
                  <td>{row.booking_created}</td>
                  <td>{row.booking_cancelled}</td>
                  <td>{row.member_created}</td>
                </tr>
              ))}
              {months.length === 0 ? (
                <tr>
                  <td colSpan={5} className="analytics__empty">Još nema podataka za ovo razdoblje.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics__block">
        <header className="analytics__panel-head">
          <span className="analytics__index" aria-hidden="true">02</span>
          <div>
            <p className="analytics__kicker">Članovi</p>
            <h2>Stanje članarina</h2>
            <p>
              Aktivni, redovitost dolazaka ovaj mjesec, pred istekom i paketi skoro potrošeni.
            </p>
          </div>
          <p className="analytics__meta">
            <strong>{insights.activeCount}</strong>
            <span>aktivnih</span>
          </p>
        </header>

        <div className="analytics__member-stats" aria-label="Sažetak članova">
          <article>
            <span>Aktivni</span>
            <strong>{insights.activeCount}</strong>
          </article>
          <article>
            <span>Redovitost</span>
            <strong>
              {insights.regularity}
              %
            </strong>
          </article>
          <article className={insights.endingSoonCount > 0 ? 'is-warn' : undefined}>
            <span>Pred istekom</span>
            <strong>{insights.endingSoonCount}</strong>
          </article>
          <article className={insights.packageHotCount > 0 ? 'is-warn' : undefined}>
            <span>Paket skoro potrošen</span>
            <strong>{insights.packageHotCount}</strong>
          </article>
          <article>
            <span>Bez dolaska (mjesec)</span>
            <strong>{insights.noVisitCount}</strong>
          </article>
        </div>

        {insights.activeCount === 0 ? (
          <p className="analytics__empty">
            Još nema aktivnih članova.{' '}
            <Link to="/stranica/clanovi">Dodajte člana</Link>
            .
          </p>
        ) : (
          <div className="analytics__member-lists">
            <div>
              <h3>Pred istekom (7 dana)</h3>
              {insights.endingSoon.length === 0 ? (
                <p className="analytics__empty">Nitko ne ističe uskoro.</p>
              ) : (
                <ul className="analytics__members">
                  {insights.endingSoon.map(({ item, left }) => (
                    <li key={item.id}>
                      <div>
                        <strong>{memberName(item)}</strong>
                        <span>
                          do
                          {' '}
                          {formatDate(item.validUntil)}
                        </span>
                      </div>
                      <em className="is-warn">
                        {left === 0 ? 'Danas' : `Još ${left} d`}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Paket skoro potrošen</h3>
              {insights.packageHot.length === 0 ? (
                <p className="analytics__empty">Nema paketa blizu limitu.</p>
              ) : (
                <ul className="analytics__members">
                  {insights.packageHot.map(({ item, used, total }) => (
                    <li key={item.id}>
                      <div>
                        <strong>{memberName(item)}</strong>
                        <span>{item.planName || 'Plan'}</span>
                      </div>
                      <em>
                        {used}
                        /
                        {total}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Bez dolaska ovaj mjesec</h3>
              {insights.noVisit.length === 0 ? (
                <p className="analytics__empty">Svi aktivni imaju barem jedan dolazak.</p>
              ) : (
                <ul className="analytics__members">
                  {insights.noVisit.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{memberName(item)}</strong>
                        <span>{item.user?.email || 'Bez e-pošte'}</span>
                      </div>
                      <em>0</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <p className="analytics__fine">
          Redovitost = udio aktivnih članova s barem jednom rezervacijom u tekućem mjesecu.
          {' '}
          <Link to="/stranica/clanovi">Otvori članove</Link>
        </p>
      </section>
    </Shell>
  );
}
