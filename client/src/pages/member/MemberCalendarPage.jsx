import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useGetTenantOccupancyQuery } from '../../api/bookingApi.js';
import { loadLabel } from '../../../../shared/calendarOccupancy.js';
import {
  CALENDAR_LEVEL_ORDER,
  CALENDAR_WEEKDAY_SHORT,
  MEMBER_CALENDAR_COPY,
  formatOccupancySlotMeta,
  formatOccupancySlotTime,
  listActiveTenantServices,
  occupancyDaySubtitle,
  occupancySlotBadge,
  resolveOccupancyDayLevel,
} from '../../../../shared/memberCalendarUi.js';
import { monthCells, monthLabel, toDateKey } from '../owner/studioTime.js';
import './MemberCalendarPage.scss';

function formatSelectedDay(key) {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export default function MemberCalendarPage() {
  const { slug } = useParams();
  const { tenant } = useOutletContext();
  const tenantId = String(tenant?.id || '');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const [serviceId, setServiceId] = useState('');

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const dateFrom = toDateKey(new Date(year, month, 1));
  const dateTo = toDateKey(new Date(year, month + 1, 0));
  const cells = useMemo(() => monthCells(year, month), [year, month]);

  const { data, isFetching, isError } = useGetTenantOccupancyQuery(
    {
      tenantId,
      dateFrom,
      dateTo,
      ...(serviceId ? { serviceId } : {}),
    },
    { skip: !tenantId },
  );

  const byDate = useMemo(() => {
    const map = new Map();
    for (const day of data?.days || []) map.set(day.date, day);
    return map;
  }, [data]);

  const selectedDay = byDate.get(selected) || null;
  // Prefer studio services from layout so filter chips stay after picking one.
  const services = useMemo(
    () => listActiveTenantServices(tenant?.services, data?.services),
    [tenant?.services, data?.services],
  );
  const bookTo = `/s/${slug}/termini`;

  return (
    <main className="member-cal">
      <header className="member-cal__hero">
        <p className="member-cal__kicker">{tenant?.name || 'Studio'}</p>
        <h1>Kalendar</h1>
        <p className="member-cal__lead">
          Pregledajte zauzetost dana unaprijed — bez poziva. Oznake vrijede za
          treninge, wellness, igraonice i ostale kapacitetne usluge.
        </p>
      </header>

      <div className="member-cal__toolbar">
        <button
          type="button"
          className="member-cal__today"
          onClick={() => {
            const now = new Date();
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelected(toDateKey(now));
          }}
        >
          Danas
        </button>
        <div className="member-cal__month">
          <button
            type="button"
            aria-label="Prethodni mjesec"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <strong>{monthLabel(new Date(year, month, 1))}</strong>
          <button
            type="button"
            aria-label="Sljedeći mjesec"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>
      </div>

      {services.length > 1 ? (
        <div className="member-cal__filters" role="tablist" aria-label="Usluge">
          <button
            type="button"
            role="tab"
            aria-selected={!serviceId}
            className={!serviceId ? 'is-on' : undefined}
            onClick={() => setServiceId('')}
          >
            {MEMBER_CALENDAR_COPY.filterAll}
          </button>
          {services.map((item) => {
            const id = String(item.id);
            const on = serviceId === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                className={on ? 'is-on' : undefined}
                onClick={() => setServiceId(id)}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {isError ? (
        <p className="member-cal__error" role="alert">{MEMBER_CALENDAR_COPY.loadError}</p>
      ) : null}

      <div className="member-cal__week" aria-hidden="true">
        {CALENDAR_WEEKDAY_SHORT.map((label) => <span key={label}>{label}</span>)}
      </div>

      <div className={`member-cal__grid${isFetching ? ' is-loading' : ''}`} role="grid">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`e-${index}`} className="member-cal__empty" />;
          const key = toDateKey(cell);
          const day = byDate.get(key);
          const level = resolveOccupancyDayLevel(day);
          return (
            <button
              key={key}
              type="button"
              className={`member-cal__cell is-${level}${selected === key ? ' is-on' : ''}`}
              onClick={() => setSelected(key)}
            >
              <strong>{cell.getDate()}</strong>
              {day?.bookingCount ? <span>{day.bookingCount}</span> : <i />}
            </button>
          );
        })}
      </div>

      <ul className="member-cal__legend">
        {CALENDAR_LEVEL_ORDER.map((level) => (
          <li key={level}>
            <i className={`is-${level}`} />
            {loadLabel(level)}
          </li>
        ))}
      </ul>

      <section className="member-cal__day" aria-label="Detalji dana">
        <header>
          <p className="member-cal__kicker">{MEMBER_CALENDAR_COPY.selectedDay}</p>
          <h2>{formatSelectedDay(selected)}</h2>
          <p>{occupancyDaySubtitle(selectedDay)}</p>
        </header>

        {selectedDay?.open === false ? (
          <p className="member-cal__hint">{MEMBER_CALENDAR_COPY.closedDay}</p>
        ) : !(selectedDay?.slots || []).length ? (
          <p className="member-cal__hint">{MEMBER_CALENDAR_COPY.emptyDay}</p>
        ) : (
          <ul className="member-cal__slots">
            {(selectedDay.slots || []).map((slot) => (
              <li key={`${slot.serviceId}-${slot.startTime}`}>
                <div>
                  <strong>{formatOccupancySlotTime(slot)}</strong>
                  <span>{slot.serviceName || 'Termin'}</span>
                  <em>{formatOccupancySlotMeta(slot)}</em>
                </div>
                <b className={`is-${slot.level || 'free'}`}>
                  {occupancySlotBadge(slot)}
                </b>
              </li>
            ))}
          </ul>
        )}

        <Link className="member-cal__cta" to={bookTo}>
          {MEMBER_CALENDAR_COPY.bookCta}
        </Link>
      </section>
    </main>
  );
}
