import { useEffect, useId, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useListTenantBookingsQuery } from '../../api/bookingApi.js';
import { useListMembershipsQuery } from '../../api/membershipApi.js';
import { useListServicesQuery } from '../../api/serviceApi.js';
import {
  DEFAULT_CAPACITY,
  dayPeak,
  groupDaySlots,
  loadLabel,
  occupancyLevel,
} from '../../../../shared/calendarOccupancy.js';
import {
  dayHours,
  formatDay,
  monthCells,
  monthLabel,
  sameDay,
  studioHours,
  toDateKey,
  weekDates,
  weekStart,
} from './studioTime.js';
import './CalendarPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const weekLabels = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
const MONTH_NAMES = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];
const VIEW_OPTIONS = [
  { id: 'day', label: 'Dan' },
  { id: 'week', label: 'Tjedan' },
  { id: 'month', label: 'Mjesec' },
];

function bookingCountLabel(count) {
  if (count === 1) return '1 rezervacija';
  if (count >= 2 && count <= 4) return `${count} rezervacije`;
  return `${count} rezervacija`;
}

function slotCountLabel(count) {
  if (count === 1) return '1 terminu';
  return `${count} termina`;
}

const demoNames = [
  'Ivan Horvat',
  'Ana Kovač',
  'Marko Babić',
  'Petra Jurić',
  'Luka Marić',
  'Ivana Novak',
  'Tomislav Perić',
  'Maja Šimić',
  'Josip Kralj',
  'Sara Božić',
  'Nikola Vuković',
  'Elena Pavić',
];

const loadLegend = [
  { id: 'free', label: 'Slobodno', note: '0%' },
  { id: 'low', label: 'Nisko', note: 'do 25%' },
  { id: 'mid', label: 'Srednje', note: '26–50%' },
  { id: 'high', label: 'Visoko', note: '51–75%' },
  { id: 'max', label: 'Maksimum', note: '76–100%' },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function statusLabel(status) {
  if (status === 'CONFIRMED') return 'Potvrđeno';
  if (status === 'CANCELLED') return 'Otkazano';
  if (status === 'COMPLETED') return 'Završeno';
  if (status === 'NO_SHOW') return 'Nije došao';
  return status;
}

function hourSlots(from, to) {
  const start = Number(String(from).slice(0, 2));
  const end = Number(String(to).slice(0, 2));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return Array.from({ length: 14 }, (_, index) => `${pad(7 + index)}:00`);
  }
  return Array.from({ length: end - start }, (_, index) => `${pad(start + index)}:00`);
}

function enrichBookings(bookings, memberships) {
  const byUser = new Map(
    memberships.map((item) => [String(item.userId), item.user?.name || 'Član']),
  );

  return bookings
    .filter((item) => item.status === 'CONFIRMED' || item.status === 'COMPLETED')
    .map((item) => ({
      ...item,
      memberName: item.user?.name || byUser.get(String(item.userId)) || 'Član',
      capacity: item.serviceCapacity || DEFAULT_CAPACITY,
      demo: false,
    }));
}

function buildDemoBookings(year, month, hours, members, capacity, services) {
  const names = members.length > 0
    ? members.map((item) => item.user?.name || 'Član')
    : demoNames;
  const servicePool = services.length > 0
    ? services
    : [{ id: 'demo-svc', name: 'Termin', capacity }];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lightSlots = ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00'];
  const weekSlots = hourSlots(hours.monday?.from || '07:00', hours.monday?.to || '21:00');
  const items = [];
  let packedDay = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (!dayHours(date, hours).works) continue;
    if (!packedDay && date.getDay() >= 1 && date.getDay() <= 5) packedDay = day;
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    if (!dayHours(date, hours).works) continue;
    const service = servicePool[day % servicePool.length];
    const cap = Math.max(1, Number(service.capacity) || capacity);

    if (day === packedDay) {
      weekSlots.forEach((start, index) => {
        const hour = Number(start.slice(0, 2));
        const endTime = `${pad(hour + 1)}:00`;
        const seats = start === '09:00' ? cap : 1;
        for (let seat = 0; seat < seats; seat += 1) {
          items.push({
            id: `demo-full-${year}-${month}-${day}-${start}-${seat}`,
            date: toDateKey(date),
            startTime: start,
            endTime,
            status: 'CONFIRMED',
            memberName: names[(index + seat) % names.length],
            capacity: cap,
            serviceId: service.id,
            serviceName: service.name || 'Termin',
            serviceCapacity: cap,
            demo: true,
            packed: true,
            groupFull: seats === cap,
          });
        }
      });
      continue;
    }

    const pattern = (day + month) % 5;
    if (pattern === 0) continue;
    const count = pattern === 1 ? 2 : pattern === 2 ? Math.ceil(cap * 0.4) : pattern === 3 ? Math.ceil(cap * 0.7) : 3;
    for (let index = 0; index < count; index += 1) {
      const start = lightSlots[(day + index) % lightSlots.length];
      const hour = Number(start.slice(0, 2));
      items.push({
        id: `demo-${year}-${month}-${day}-${index}`,
        date: toDateKey(date),
        startTime: start,
        endTime: `${pad(hour + 1)}:00`,
        status: 'CONFIRMED',
        memberName: names[(day + index) % names.length],
        capacity: cap,
        serviceId: service.id,
        serviceName: service.name || 'Termin',
        serviceCapacity: cap,
        demo: true,
      });
    }
  }

  return items;
}

function SlotList({ slots, fallbackCapacity, expandedId, onToggle }) {
  if (slots.length === 0) {
    return <p className="cal-modal__empty">Nema rezervacija za ovaj dan.</p>;
  }

  return (
    <ul className="cal-modal__list">
      {slots.map((slot) => {
        const filled = slot.members.length;
        const cap = Math.max(1, slot.capacity || fallbackCapacity);
        const full = filled >= cap;
        return (
          <li
            key={slot.key}
            className={full ? 'is-group-full' : undefined}
          >
            <div className="cal-modal__slot">
              <div>
                <strong className="cal-modal__service">
                  {slot.serviceName || 'Termin'}
                </strong>
                <time dateTime={`${slot.startTime}`}>
                  {slot.startTime}
                  <span>–</span>
                  {slot.endTime}
                </time>
              </div>
              <span className="cal-modal__cap">
                {filled}
                /
                {cap}
                {' '}
                {cap === 1 ? 'mjesto' : 'mjesta'}
                {full ? ' · popunjeno' : ` · ${cap - filled} slobodno`}
              </span>
            </div>
            <ul className="cal-modal__people">
              {slot.members.map((item) => {
                const open = expandedId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cal-modal__person"
                      onClick={() => onToggle?.(item.id)}
                    >
                      <span>
                        <strong>{item.memberName}</strong>
                        <em>{statusLabel(item.status)}</em>
                        {open && item.user?.email ? (
                          <small>{item.user.email}</small>
                        ) : null}
                      </span>
                      <span aria-hidden="true">{open ? '▴' : '›'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export default function CalendarPage() {
  const { studio } = useOutletContext();
  const hours = studioHours(studio);
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [focusDay, setFocusDay] = useState(() => today);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const titleId = useId();
  const tenantId = String(studio.id || '');
  const ready = REAL_ID.test(tenantId);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weekDays = useMemo(() => weekDates(focusDay), [focusDay]);
  const queryRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = weekStart(focusDay);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { dateFrom: toDateKey(start), dateTo: toDateKey(end) };
    }
    if (viewMode === 'day') {
      const key = toDateKey(focusDay);
      return { dateFrom: key, dateTo: key };
    }
    return {
      dateFrom: `${year}-${pad(month + 1)}-01`,
      dateTo: `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`,
    };
  }, [viewMode, focusDay, year, month]);

  const cells = monthCells(year, month);
  const yearOptions = useMemo(() => {
    const current = today.getFullYear();
    return Array.from({ length: 7 }, (_, index) => current - 2 + index);
  }, [today]);

  const {
    data: bookingData,
    isLoading: loadingBookings,
    isError: bookingsError,
    error: bookingsErr,
  } = useListTenantBookingsQuery(
    { tenantId, dateFrom: queryRange.dateFrom, dateTo: queryRange.dateTo, limit: 500 },
    { skip: !ready },
  );
  const { data: memberData } = useListMembershipsQuery(tenantId, { skip: !ready });
  const { data: serviceData } = useListServicesQuery(tenantId, { skip: !ready });

  const memberships = memberData?.memberships || [];
  const services = (serviceData?.services || []).filter((item) => item.active !== false);
  const fallbackCapacity = services.reduce(
    (max, item) => Math.max(max, Number(item.capacity) || 0),
    0,
  ) || DEFAULT_CAPACITY;

  const liveBookings = useMemo(
    () => enrichBookings(bookingData?.bookings || [], memberships),
    [bookingData, memberships],
  );

  const bookings = useMemo(() => {
    const source = showDemo
      ? buildDemoBookings(
        year,
        month,
        hours,
        memberships.filter((item) => item.status === 'ACTIVE'),
        fallbackCapacity,
        services,
      )
      : liveBookings;
    if (serviceFilter === 'all') return source;
    return source.filter((item) => String(item.serviceId || '') === serviceFilter);
  }, [
    showDemo,
    liveBookings,
    year,
    month,
    hours,
    memberships,
    fallbackCapacity,
    services,
    serviceFilter,
  ]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const item of bookings) {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime)
        || a.memberName.localeCompare(b.memberName));
    }
    return map;
  }, [bookings]);

  const focusKey = toDateKey(focusDay);
  const dayBookings = byDay.get(focusKey) || [];
  const daySlots = useMemo(
    () => groupDaySlots(dayBookings, fallbackCapacity),
    [dayBookings, fallbackCapacity],
  );

  const selectedKey = selected ? toDateKey(selected) : '';
  const modalBookings = selectedKey ? (byDay.get(selectedKey) || []) : [];
  const modalSlots = useMemo(
    () => groupDaySlots(modalBookings, fallbackCapacity),
    [modalBookings, fallbackCapacity],
  );

  const periodStats = useMemo(() => {
    const all = showDemo ? bookings : (bookingData?.bookings || []);
    const filtered = serviceFilter === 'all'
      ? all
      : all.filter((item) => String(item.serviceId || '') === serviceFilter);
    return {
      total: filtered.length,
      completed: filtered.filter((item) => item.status === 'COMPLETED').length,
      cancelled: filtered.filter((item) => item.status === 'CANCELLED').length,
      confirmed: filtered.filter((item) => item.status === 'CONFIRMED').length,
    };
  }, [showDemo, bookings, bookingData, serviceFilter]);

  useEffect(() => {
    if (!selected) return undefined;

    function onKey(event) {
      if (event.key === 'Escape') setSelected(null);
    }

    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [selected]);

  function goToday() {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setFocusDay(now);
    setSelected(null);
    setExpandedId('');
  }

  function shiftMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelected(null);
  }

  function shiftWeek(delta) {
    setFocusDay((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + (delta * 7));
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
    setSelected(null);
  }

  function shiftDay(delta) {
    setFocusDay((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + delta);
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
    setSelected(null);
  }

  function openDay(date) {
    setFocusDay(date);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    if (viewMode === 'month') setSelected(date);
    else setSelected(null);
  }

  const navLabel = viewMode === 'month'
    ? monthLabel(cursor)
    : viewMode === 'week'
      ? `${formatDay(weekDays[0])} – ${formatDay(weekDays[6])}`
      : formatDay(focusDay);

  return (
    <section className="studio-panel cal">
      <div className="cal__atmosphere" aria-hidden="true">
        <span className="cal__wash" />
        <span className="cal__grain" />
      </div>

      <div className="cal__stage">
        <header className="cal__head">
          <div>
            <p className="cal__eyebrow">Pregled</p>
            <h1>Kalendar</h1>
            <p className="cal__lede">
              {showDemo
                ? 'Primjer rasporeda — nije povezan s bazom.'
                : 'Zauzetost se računa prema kapacitetu svakog termina, ne samo broju rezervacija.'}
            </p>
          </div>
          <div className="cal__head-actions">
            <label className="cal__demo-toggle">
              <input
                type="checkbox"
                checked={showDemo}
                onChange={(event) => {
                  setShowDemo(event.target.checked);
                  setSelected(null);
                }}
              />
              Primjer rasporeda
            </label>
            <button type="button" className="cal__today" onClick={goToday}>
              Danas
            </button>
            <div className="cal__month-nav">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'week') shiftWeek(-1);
                  else if (viewMode === 'day') shiftDay(-1);
                  else shiftMonth(-1);
                }}
                aria-label="Prethodno"
              >
                ‹
              </button>
              <strong>{navLabel}</strong>
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'week') shiftWeek(1);
                  else if (viewMode === 'day') shiftDay(1);
                  else shiftMonth(1);
                }}
                aria-label="Sljedeće"
              >
                ›
              </button>
            </div>
          </div>
        </header>

        <div className="cal__controls">
          <div className="cal__views" role="group" aria-label="Prikaz kalendara">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={viewMode === option.id ? 'is-active' : undefined}
                aria-pressed={viewMode === option.id}
                onClick={() => {
                  setViewMode(option.id);
                  setSelected(null);
                  setExpandedId('');
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="cal__filters">
            <label>
              <span>Mjesec</span>
              <select
                value={month}
                onChange={(event) => {
                  const nextMonth = Number(event.target.value);
                  setCursor(new Date(year, nextMonth, 1));
                  setFocusDay(new Date(year, nextMonth, Math.min(focusDay.getDate(), 28)));
                }}
              >
                {MONTH_NAMES.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Godina</span>
              <select
                value={year}
                onChange={(event) => {
                  const nextYear = Number(event.target.value);
                  setCursor(new Date(nextYear, month, 1));
                  setFocusDay(new Date(nextYear, month, Math.min(focusDay.getDate(), 28)));
                }}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Usluga</span>
              <select
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value);
                  setSelected(null);
                  setExpandedId('');
                }}
              >
                <option value="all">Sve usluge</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name || 'Usluga'}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="cal__stats" aria-label="Sažetak razdoblja">
          <article>
            <span>Rezervacije</span>
            <strong>{periodStats.total}</strong>
          </article>
          <article>
            <span>Završene</span>
            <strong>{periodStats.completed}</strong>
          </article>
          <article>
            <span>Otkazane</span>
            <strong>{periodStats.cancelled}</strong>
          </article>
          <article>
            <span>Potvrđene</span>
            <strong>{periodStats.confirmed}</strong>
          </article>
        </div>

        {!ready ? (
          <p className="cal__hint">Studio još nije u bazi. Dovršite registraciju da vidite stvarne termine.</p>
        ) : null}

        {ready && !showDemo && loadingBookings ? (
          <p className="cal__hint">Učitavamo termine iz baze…</p>
        ) : null}

        {ready && !showDemo && bookingsError ? (
          <p className="cal__error">
            {bookingsErr?.status === 'FETCH_ERROR'
              ? 'Poslužitelj nije dostupan. Kalendar se nije učitao.'
              : 'Rezervacije se nisu učitale. Pokušajte ponovno.'}
          </p>
        ) : null}

        <section className="cal__board">
          <header className="cal__panel-head">
            <span className="cal__index" aria-hidden="true">01</span>
            <div>
              <p className="cal__kicker">Popunjenost</p>
              <h2>Legenda</h2>
              <p>
                Boja dana = najpuniji termin tog dana u odnosu na kapacitet usluge
                (npr. 3/3 u igraonici ≠ 3/12 na grupnom treningu).
              </p>
            </div>
          </header>
          <ul className="cal__legend" aria-label="Legenda popunjenosti">
            {loadLegend.map((item) => (
              <li key={item.id} className={`cal__legend-item is-${item.id}`}>
                <span className="cal__legend-swatch" aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {viewMode === 'month' ? (
          <section className="cal__month">
            <header className="cal__panel-head">
              <span className="cal__index" aria-hidden="true">02</span>
              <div>
                <p className="cal__kicker">Mjesec</p>
                <h2>{monthLabel(cursor)}</h2>
                <p>Odaberite dan za pregled rezervacija i kapaciteta.</p>
              </div>
              <p className="cal__meta">
                <strong>{bookings.length}</strong>
                <span>{showDemo ? 'primjer' : 'upisa'}</span>
              </p>
            </header>

            <div className="cal__grid" role="grid" aria-label={`Kalendar ${monthLabel(cursor)}`}>
              {weekLabels.map((label) => (
                <span key={label} className="cal__weekday" role="columnheader">
                  {label}
                </span>
              ))}
              {cells.map((date, index) => {
                if (!date) {
                  return <span key={`empty-${index}`} className="cal__cell cal__cell--empty" />;
                }

                const key = toDateKey(date);
                const open = dayHours(date, hours).works;
                const current = sameDay(date, today);
                const list = byDay.get(key) || [];
                const stats = dayPeak(list, fallbackCapacity);
                const level = occupancyLevel(stats.ratio, open);

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    className={[
                      'cal__cell',
                      `is-load-${level}`,
                      current ? 'is-today' : '',
                      selected && sameDay(date, selected) ? 'is-selected' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => openDay(date)}
                    aria-label={`${formatDay(date)}, ${loadLabel(level)}${stats.count ? `, ${stats.count} upisa` : ''}`}
                  >
                    <span className="cal__day">{date.getDate()}</span>
                    <span className="cal__hint-label">{loadLabel(level)}</span>
                    {stats.count > 0 ? (
                      <span className="cal__count">
                        {stats.count}
                        <em>
                          {stats.peak}
                          /
                          {stats.capacity}
                        </em>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {viewMode === 'week' ? (
          <section className="cal__week">
            <header className="cal__panel-head">
              <span className="cal__index" aria-hidden="true">02</span>
              <div>
                <p className="cal__kicker">Tjedan</p>
                <h2>Raspored aktivnosti</h2>
                <p>Pregled termina po danima s kapacitetom usluge.</p>
              </div>
            </header>
            <div className="cal__week-grid">
              {weekDays.map((date) => {
                const key = toDateKey(date);
                const list = byDay.get(key) || [];
                const slots = groupDaySlots(list, fallbackCapacity);
                const stats = dayPeak(list, fallbackCapacity);
                const level = occupancyLevel(stats.ratio, dayHours(date, hours).works);
                const current = sameDay(date, today);
                return (
                  <article
                    key={key}
                    className={[
                      'cal__week-day',
                      `is-load-${level}`,
                      current ? 'is-today' : '',
                      sameDay(date, focusDay) ? 'is-focus' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className="cal__week-day-head"
                      onClick={() => {
                        setFocusDay(date);
                        setViewMode('day');
                      }}
                    >
                      <strong>{weekLabels[(date.getDay() + 6) % 7]}</strong>
                      <span>{date.getDate()}</span>
                      <em>{stats.count || '—'}</em>
                    </button>
                    <ul className="cal__week-slots">
                      {slots.length === 0 ? (
                        <li className="cal__week-empty">Nema termina</li>
                      ) : (
                        slots.slice(0, 6).map((slot) => (
                          <li key={slot.key}>
                            <strong>{slot.startTime}</strong>
                            <span>{slot.serviceName || 'Termin'}</span>
                            <em>
                              {slot.members.length}
                              /
                              {slot.capacity}
                            </em>
                          </li>
                        ))
                      )}
                      {slots.length > 6 ? (
                        <li className="cal__week-more">
                          +
                          {slots.length - 6}
                          {' '}
                          još
                        </li>
                      ) : null}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {viewMode === 'day' ? (
          <section className="cal__dayview">
            <header className="cal__panel-head">
              <span className="cal__index" aria-hidden="true">02</span>
              <div>
                <p className="cal__kicker">Dan</p>
                <h2>{formatDay(focusDay)}</h2>
                <p>
                  {dayBookings.length === 0
                    ? 'Nema rezervacija ovog dana.'
                    : `${bookingCountLabel(dayBookings.length)} u ${slotCountLabel(daySlots.length)}`}
                </p>
              </div>
              <p className="cal__meta">
                <strong>{dayBookings.length}</strong>
                <span>upisa</span>
              </p>
            </header>
            <SlotList
              slots={daySlots}
              fallbackCapacity={fallbackCapacity}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((current) => (current === id ? '' : id))}
            />
          </section>
        ) : null}

        {ready && !showDemo && !loadingBookings && !bookingsError && liveBookings.length === 0 ? (
          <p className="cal__hint">
            Još nema rezervacija u bazi za ovo razdoblje. Uključite „Primjer rasporeda” za pregled izgleda.
          </p>
        ) : null}
      </div>

      {selected && viewMode === 'month' ? (
        <div
          className="cal-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            className="cal-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="cal-modal__head">
              <div>
                <p className="cal__kicker">Dan</p>
                <h2 id={titleId}>{formatDay(selected)}</h2>
                <p>
                  {modalBookings.length === 0
                    ? 'Nema rezervacija ovog dana.'
                    : `${modalBookings.length} ${modalBookings.length === 1 ? 'upis' : 'upisa'} u ${modalSlots.length} ${modalSlots.length === 1 ? 'terminu' : 'termina'}`}
                </p>
              </div>
              <div className="cal-modal__actions">
                <button
                  type="button"
                  className="cal-modal__daylink"
                  onClick={() => {
                    setFocusDay(selected);
                    setViewMode('day');
                    setSelected(null);
                  }}
                >
                  Dnevni prikaz
                </button>
                <button
                  type="button"
                  className="cal-modal__close"
                  onClick={() => setSelected(null)}
                  aria-label="Zatvori"
                >
                  ×
                </button>
              </div>
            </header>

            {modalSlots.length === 0 ? (
              <p className="cal-modal__empty">
                {dayHours(selected, hours).works
                  ? 'Dan je otvoren, ali još nema upisa u bazi.'
                  : 'Studio je zatvoren ovog dana.'}
              </p>
            ) : (
              <SlotList
                slots={modalSlots}
                fallbackCapacity={fallbackCapacity}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId((current) => (current === id ? '' : id))}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
