import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetStudioAnalyticsQuery } from '../../api/analyticsApi.js';
import { useListTenantBookingsQuery } from '../../api/bookingApi.js';
import { useListMembershipsQuery } from '../../api/membershipApi.js';
import { rollingDaysRange } from '../../lib/dateRange.js';
import {
  buildMemberInsights,
  memberName,
} from '../../../../shared/memberInsights.js';
import { formatDate } from '../../lib/formatters.js';
import './StudioAnalyticsPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;

const PERIOD_OPTIONS = [
  { days: 1, label: 'Danas' },
  { days: 7, label: '7 dana' },
  { days: 30, label: '30 dana' },
  { days: 90, label: '90 dana' },
];

const STATUS_META = [
  { key: 'COMPLETED', label: 'Završeni', tone: 'ok' },
  { key: 'CONFIRMED', label: 'Potvrđene / buduće', tone: 'info' },
  { key: 'CANCELLED', label: 'Otkazani', tone: 'warn' },
  { key: 'NO_SHOW', label: 'Nedolasci', tone: 'alert' },
];

const STATUS_COLORS = {
  COMPLETED: '#0e6b73',
  CONFIRMED: '#3d8b96',
  CANCELLED: '#c47a2c',
  NO_SHOW: '#b4534a',
};

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

function parseDateKey(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatPeriodLabel(dateFrom, dateTo) {
  const start = parseDateKey(dateFrom);
  const end = parseDateKey(dateTo);
  if (!start || !end) return 'Razdoblje';
  try {
    return new Intl.DateTimeFormat('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatRange(start, end);
  } catch {
    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  }
}

function formatDayTick(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return '';
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'numeric',
  }).format(date);
}

function Delta({ metric }) {
  if (!metric || metric.deltaPct == null) {
    return <em className="analytics__delta is-flat">—</em>;
  }
  const value = metric.deltaPct;
  const tone = value > 0 ? 'is-up' : value < 0 ? 'is-down' : 'is-flat';
  const sign = value > 0 ? '+' : '';
  return (
    <em className={`analytics__delta ${tone}`}>
      {sign}
      {value}
      %
    </em>
  );
}

function conicGradient(parts, total) {
  if (!total) return 'conic-gradient(color-mix(in srgb, var(--analytics-ink) 10%, transparent) 0 100%)';
  let cursor = 0;
  const stops = parts.map((part) => {
    const start = cursor;
    cursor += (part.value / total) * 100;
    return `${part.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

export default function StudioAnalyticsPage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const [days, setDays] = useState(30);
  const [memberFocus, setMemberFocus] = useState('alerts');

  const range = useMemo(() => rollingDaysRange(days), [days]);
  const { data, isLoading, isError, isFetching } = useGetStudioAnalyticsQuery(
    { tenantId, days },
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

  const bookingsSeries = data?.bookingsSeries || [];
  const maxBookings = Math.max(1, ...bookingsSeries.map((row) => Number(row.total) || 0));
  const statusParts = STATUS_META.map((item) => ({
    ...item,
    value: Number(data?.bookingsByStatus?.[item.key]) || 0,
    color: STATUS_COLORS[item.key],
  }));
  const bookingsTotal = Number(data?.bookingsTotal) || 0;
  const comparison = data?.comparison || {};
  const period = data?.period;
  const tickStep = days <= 7 ? 1 : days <= 30 ? 5 : 10;

  const memberPanels = {
    endingSoon: {
      title: 'Pred istekom (7 dana)',
      empty: 'Nitko ne ističe uskoro.',
      items: insights.endingSoon,
      render: ({ item, left }) => (
        <>
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
        </>
      ),
    },
    packageHot: {
      title: 'Paketi pri kraju',
      empty: 'Nema paketa blizu limitu.',
      items: insights.packageHot,
      render: ({ item, used, total }) => (
        <>
          <div>
            <strong>{memberName(item)}</strong>
            <span>{item.planName || 'Plan'}</span>
          </div>
          <em>
            {used}
            /
            {total}
          </em>
        </>
      ),
    },
    noVisit: {
      title: `Bez dolaska (zadnjih ${days} dana)`,
      empty: 'Svi aktivni imaju barem jedan dolazak u odabranom razdoblju.',
      items: insights.noVisit.map((item) => ({ item })),
      render: ({ item }) => (
        <>
          <div>
            <strong>{memberName(item)}</strong>
            <span>{item.user?.email || 'Bez e-pošte'}</span>
          </div>
          <em>0</em>
        </>
      ),
    },
  };

  const activeMemberPanel = memberFocus === 'alerts'
    ? null
    : memberPanels[memberFocus];

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
  const kpiCards = [
    {
      key: 'page_view',
      label: 'Posjeti',
      value: counts.page_view || 0,
      metric: comparison.page_view,
      hint: 'Javna stranica studija',
    },
    {
      key: 'bookings',
      label: 'Rezervacije',
      value: bookingsTotal,
      metric: comparison.bookingsTotal,
      hint: 'Svi statusi u razdoblju',
    },
    {
      key: 'member_created',
      label: 'Novi članovi',
      value: counts.member_created || 0,
      metric: comparison.member_created,
      hint: 'Članovi ovog studija',
    },
    {
      key: 'COMPLETED',
      label: 'Završeni',
      value: data.bookingsByStatus?.COMPLETED || 0,
      metric: comparison.COMPLETED,
    },
    {
      key: 'CANCELLED',
      label: 'Otkazi',
      value: data.bookingsByStatus?.CANCELLED || 0,
      metric: comparison.CANCELLED,
    },
    {
      key: 'NO_SHOW',
      label: 'Nedolasci',
      value: data.bookingsByStatus?.NO_SHOW || 0,
      metric: comparison.NO_SHOW,
    },
  ];

  return (
    <Shell>
      <header className="analytics__head">
        <div>
          <p className="analytics__eyebrow">Pregled poslovanja</p>
          <h1>Analitika</h1>
          <p className="analytics__lede">
            {studio?.name ? `${studio.name} · ` : ''}
            Ova analitika prikazuje podatke vašeg poslovanja i dostupna je samo ovlaštenim korisnicima.
          </p>
        </div>
        <p className="analytics__period">
          <span>Razdoblje</span>
          <strong>
            {period
              ? formatPeriodLabel(period.dateFrom, period.dateTo)
              : `Zadnjih ${days} dana`}
          </strong>
          {period?.previousFrom && period?.previousTo ? (
            <small>
              Usporedba:
              {' '}
              {formatPeriodLabel(period.previousFrom, period.previousTo)}
            </small>
          ) : null}
        </p>
      </header>

      <div className="analytics__filters" role="group" aria-label="Odabir razdoblja">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.days}
            type="button"
            className={days === option.days ? 'is-active' : undefined}
            aria-pressed={days === option.days}
            disabled={isFetching && days !== option.days}
            onClick={() => setDays(option.days)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="analytics__stats" aria-label="Pregled poslovanja">
        {kpiCards.map((card) => (
          <article key={card.key}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <Delta metric={card.metric} />
            {card.hint ? <small>{card.hint}</small> : null}
          </article>
        ))}
      </div>

      <section className="analytics__block">
        <header className="analytics__panel-head">
          <span className="analytics__index" aria-hidden="true">01</span>
          <div>
            <p className="analytics__kicker">Trend</p>
            <h2>Kretanje rezervacija</h2>
            <p>Broj rezervacija po danu (svi statusi, međusobno isključivi).</p>
          </div>
          <p className="analytics__meta">
            <strong>{bookingsTotal}</strong>
            <span>ukupno</span>
          </p>
        </header>

        {bookingsTotal === 0 ? (
          <p className="analytics__empty">Još nema dovoljno podataka za grafikon rezervacija.</p>
        ) : (
          <div className="analytics__chart" role="img" aria-label="Stupčasti grafikon rezervacija po danima">
            <div className="analytics__bars">
              {bookingsSeries.map((row, index) => {
                const value = Number(row.total) || 0;
                const showTick = index === 0
                  || index === bookingsSeries.length - 1
                  || index % tickStep === 0;
                return (
                  <div key={row.date} className="analytics__bar-col" title={`${row.date}: ${value}`}>
                    <div className="analytics__bar-track">
                      <span style={{ height: `${Math.max(value ? 8 : 0, (value / maxBookings) * 100)}%` }} />
                    </div>
                    {showTick ? (
                      <time dateTime={row.date}>{formatDayTick(row.date)}</time>
                    ) : (
                      <span className="analytics__bar-spacer" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="analytics__block">
        <header className="analytics__panel-head">
          <span className="analytics__index" aria-hidden="true">02</span>
          <div>
            <p className="analytics__kicker">Struktura</p>
            <h2>Status rezervacija</h2>
            <p>
              Završeni, otkazani, nedolasci i potvrđene/buduće — statusi se ne preklapaju.
            </p>
          </div>
          <p className="analytics__meta">
            <strong>{bookingsTotal}</strong>
            <span>rezervacija</span>
          </p>
        </header>

        {bookingsTotal === 0 ? (
          <p className="analytics__empty">Nema rezervacija u odabranom razdoblju.</p>
        ) : (
          <div className="analytics__status-grid">
            <div
              className="analytics__donut"
              style={{ background: conicGradient(statusParts, bookingsTotal) }}
              aria-hidden="true"
            >
              <div className="analytics__donut-hole">
                <strong>{bookingsTotal}</strong>
                <span>ukupno</span>
              </div>
            </div>
            <ul className="analytics__legend">
              {statusParts.map((part) => (
                <li key={part.key}>
                  <span className={`analytics__swatch is-${part.tone}`} style={{ background: part.color }} />
                  <div>
                    <strong>{part.label}</strong>
                    <em>
                      {part.value}
                      {' '}
                      (
                      {Math.round((part.value / bookingsTotal) * 100)}
                      %)
                    </em>
                  </div>
                  <Delta metric={comparison[part.key]} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="analytics__block">
        <header className="analytics__panel-head">
          <span className="analytics__index" aria-hidden="true">03</span>
          <div>
            <p className="analytics__kicker">Članovi i članarine</p>
            <h2>Stanje članarina</h2>
            <p>
              Aktivni članovi, redovitost u odabranom razdoblju, isteci i potrošnja paketa.
              Kliknite pokazatelj za popis.
            </p>
          </div>
          <p className="analytics__meta">
            <strong>{insights.activeCount}</strong>
            <span>aktivnih</span>
          </p>
        </header>

        <div className="analytics__member-stats" aria-label="Sažetak članova">
          <button
            type="button"
            className={memberFocus === 'alerts' ? 'is-active' : undefined}
            onClick={() => setMemberFocus('alerts')}
          >
            <span>Aktivni članovi</span>
            <strong>{insights.activeCount}</strong>
          </button>
          <button type="button" className="is-static" disabled>
            <span>Redovitost</span>
            <strong>
              {insights.regularity}
              %
            </strong>
            <small>
              {insights.withVisitCount}
              {' '}
              od
              {' '}
              {insights.activeCount}
              {' '}
              člana s rezervacijom
            </small>
          </button>
          <button
            type="button"
            className={[
              insights.endingSoonCount > 0 ? 'is-warn' : '',
              memberFocus === 'endingSoon' ? 'is-active' : '',
            ].filter(Boolean).join(' ') || undefined}
            onClick={() => setMemberFocus('endingSoon')}
          >
            <span>Pred istekom</span>
            <strong>{insights.endingSoonCount}</strong>
          </button>
          <button
            type="button"
            className={[
              insights.packageHotCount > 0 ? 'is-warn' : '',
              memberFocus === 'packageHot' ? 'is-active' : '',
            ].filter(Boolean).join(' ') || undefined}
            onClick={() => setMemberFocus('packageHot')}
          >
            <span>Paketi pri kraju</span>
            <strong>{insights.packageHotCount}</strong>
          </button>
          <button
            type="button"
            className={memberFocus === 'noVisit' ? 'is-active' : undefined}
            onClick={() => setMemberFocus('noVisit')}
          >
            <span>Bez dolaska</span>
            <strong>{insights.noVisitCount}</strong>
          </button>
        </div>

        {insights.activeCount === 0 ? (
          <p className="analytics__empty">
            Još nema aktivnih članova.
            {' '}
            <Link to="/stranica/clanovi">Dodajte člana</Link>
            .
          </p>
        ) : activeMemberPanel ? (
          <div className="analytics__member-focus">
            <h3>{activeMemberPanel.title}</h3>
            {activeMemberPanel.items.length === 0 ? (
              <p className="analytics__empty">{activeMemberPanel.empty}</p>
            ) : (
              <ul className="analytics__members">
                {activeMemberPanel.items.map((row) => (
                  <li key={row.item?.id || row.id}>
                    {activeMemberPanel.render(row)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="analytics__member-lists">
            {Object.entries(memberPanels).map(([key, panel]) => (
              <div key={key}>
                <h3>{panel.title}</h3>
                {panel.items.length === 0 ? (
                  <p className="analytics__empty">{panel.empty}</p>
                ) : (
                  <ul className="analytics__members">
                    {panel.items.map((row) => (
                      <li key={row.item?.id || row.id}>
                        {panel.render(row)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="analytics__fine">
          Redovitost = udio aktivnih članova s barem jednom rezervacijom (potvrđenom ili završenom) u odabranom razdoblju.
          Posjeti su posjete javnoj stranici; novi članovi su osobe koje su postale članovi ovog studija — to nije isto što i prijava na platformu.
          {' '}
          <Link to="/stranica/clanovi">Otvori članove</Link>
        </p>
      </section>
    </Shell>
  );
}
