import { useEffect, useId, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useListTenantBookingsQuery } from '../../api/bookingApi.js';
import { useListMembershipsQuery } from '../../api/membershipApi.js';
import { useListServicesQuery } from '../../api/serviceApi.js';
import {
  dayHours,
  formatDay,
  monthCells,
  monthLabel,
  sameDay,
  studioHours,
} from './studioTime.js';
import './CalendarPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const weekLabels = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
const DEFAULT_CAPACITY = 12;

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

function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

function occupancyLevel(ratio, open) {
  if (!open) return 'closed';
  if (ratio <= 0) return 'free';
  if (ratio <= 0.25) return 'low';
  if (ratio <= 0.5) return 'mid';
  if (ratio <= 0.75) return 'high';
  return 'max';
}

function loadLabel(level) {
  if (level === 'max') return 'Puno';
  if (level === 'high') return 'Visoko';
  if (level === 'mid') return 'Srednje';
  if (level === 'low') return 'Nisko';
  if (level === 'closed') return 'Zatvoreno';
  return 'Slobodno';
}

function dayPeak(list, capacity) {
  if (!list.length) return { count: 0, peak: 0, ratio: 0, capacity };
  const bySlot = new Map();
  for (const item of list) {
    const key = `${item.startTime}-${item.endTime}`;
    bySlot.set(key, (bySlot.get(key) || 0) + 1);
  }
  const peak = Math.max(...bySlot.values());
  const cap = Math.max(1, capacity || DEFAULT_CAPACITY);
  return {
    count: list.length,
    peak,
    ratio: Math.min(1, peak / cap),
    capacity: cap,
  };
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

function buildDemoBookings(year, month, hours, members, capacity) {
  const names = members.length > 0
    ? members.map((item) => item.user?.name || 'Član')
    : demoNames;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lightSlots = ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00'];
  const weekSlots = hourSlots(hours.week?.from || '07:00', hours.week?.to || '21:00');
  const cap = Math.max(1, capacity);
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

    if (day === packedDay) {
      weekSlots.forEach((start, index) => {
        const hour = Number(start.slice(0, 2));
        const endTime = `${pad(hour + 1)}:00`;
        const seats = start === '09:00' ? cap : 1;
        for (let seat = 0; seat < seats; seat += 1) {
          items.push({
            id: `demo-full-${year}-${month}-${day}-${start}-${seat}`,
            date: toKey(date),
            startTime: start,
            endTime,
            status: 'CONFIRMED',
            memberName: names[(index + seat) % names.length],
            capacity: cap,
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
        date: toKey(date),
        startTime: start,
        endTime: `${pad(hour + 1)}:00`,
        status: 'CONFIRMED',
        memberName: names[(day + index) % names.length],
        capacity: cap,
        demo: true,
      });
    }
  }

  return items;
}

export default function CalendarPage() {
  const { studio } = useOutletContext();
  const hours = studioHours(studio);
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const titleId = useId();
  const tenantId = String(studio.id || '');
  const ready = REAL_ID.test(tenantId);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const dateFrom = `${year}-${pad(month + 1)}-01`;
  const dateTo = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;
  const cells = monthCells(year, month);

  const {
    data: bookingData,
    isLoading: loadingBookings,
    isError: bookingsError,
    error: bookingsErr,
  } = useListTenantBookingsQuery(
    { tenantId, dateFrom, dateTo, limit: 500 },
    { skip: !ready },
  );
  const { data: memberData } = useListMembershipsQuery(tenantId, { skip: !ready });
  const { data: serviceData } = useListServicesQuery(tenantId, { skip: !ready });

  const memberships = memberData?.memberships || [];
  const services = (serviceData?.services || []).filter((item) => item.active !== false);
  const capacity = services.reduce(
    (max, item) => Math.max(max, Number(item.capacity) || 0),
    0,
  ) || DEFAULT_CAPACITY;

  const liveBookings = useMemo(
    () => enrichBookings(bookingData?.bookings || [], memberships),
    [bookingData, memberships],
  );

  const bookings = useMemo(() => {
    if (showDemo) {
      return buildDemoBookings(
        year,
        month,
        hours,
        memberships.filter((item) => item.status === 'ACTIVE'),
        capacity,
      );
    }
    return liveBookings;
  }, [showDemo, liveBookings, year, month, hours, memberships, capacity]);

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

  const selectedKey = selected ? toKey(selected) : '';
  const dayBookings = selectedKey ? (byDay.get(selectedKey) || []) : [];
  const daySlots = useMemo(() => {
    const groups = new Map();
    for (const item of dayBookings) {
      const key = `${item.startTime}-${item.endTime}`;
      const current = groups.get(key) || {
        startTime: item.startTime,
        endTime: item.endTime,
        date: item.date,
        members: [],
        capacity: item.capacity || capacity,
        serviceName: item.serviceName || '',
      };
      current.members.push(item);
      current.capacity = Math.max(current.capacity, item.capacity || capacity);
      if (item.serviceName) current.serviceName = item.serviceName;
      groups.set(key, current);
    }
    return [...groups.values()];
  }, [dayBookings, capacity]);

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

  function shiftMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelected(null);
  }

  return (
    <section className="studio-panel cal">
      <div className="cal__head">
        <div>
          <h1>Kalendar</h1>
          <p>
            {showDemo
              ? 'Primjer rasporeda — nije povezan s bazom.'
              : 'Zauzeti termini iz baze, po danima i kapacitetu usluge.'}
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
          <div className="cal__month-nav">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Prethodni mjesec">
              ‹
            </button>
            <strong>{monthLabel(cursor)}</strong>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Sljedeći mjesec">
              ›
            </button>
          </div>
        </div>
      </div>

      {!ready ? (
        <p className="studio-empty">Studio još nije u bazi. Dovršite registraciju da vidite stvarne termine.</p>
      ) : null}

      {ready && !showDemo && loadingBookings ? (
        <p className="studio-empty">Učitavamo termine iz baze…</p>
      ) : null}

      {ready && !showDemo && bookingsError ? (
        <p className="cal__error">
          {bookingsErr?.status === 'FETCH_ERROR'
            ? 'Poslužitelj nije dostupan. Kalendar se nije učitao.'
            : 'Rezervacije se nisu učitale. Pokušajte ponovno.'}
        </p>
      ) : null}

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
      <p className="cal__legend-note">
        Boja dana = najpuniji termin tog dana u odnosu na kapacitet
        {services[0] ? ` (${capacity} mjesta)` : ` (${DEFAULT_CAPACITY} mjesta)`}.
      </p>

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

          const key = toKey(date);
          const open = dayHours(date, hours).works;
          const current = sameDay(date, today);
          const list = byDay.get(key) || [];
          const stats = dayPeak(list, capacity);
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
              onClick={() => setSelected(date)}
              aria-label={`${formatDay(date)}, ${loadLabel(level)}${stats.count ? `, ${stats.count} upisa` : ''}`}
            >
              <span className="cal__day">{date.getDate()}</span>
              <span className="cal__hint">{loadLabel(level)}</span>
              {stats.count > 0 ? <span className="cal__count">{stats.count}</span> : null}
            </button>
          );
        })}
      </div>

      {ready && !showDemo && !loadingBookings && !bookingsError && liveBookings.length === 0 ? (
        <p className="studio-empty">
          Još nema rezervacija u bazi za ovaj mjesec. Uključite „Primjer rasporeda” za pregled izgleda.
        </p>
      ) : null}

      {selected ? (
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
                <h2 id={titleId}>{formatDay(selected)}</h2>
                <p>
                  {dayBookings.length === 0
                    ? 'Nema rezervacija ovog dana.'
                    : `${dayBookings.length} ${dayBookings.length === 1 ? 'upis' : 'upisa'} u ${daySlots.length} ${daySlots.length === 1 ? 'terminu' : 'termina'}`}
                </p>
              </div>
              <button
                type="button"
                className="cal-modal__close"
                onClick={() => setSelected(null)}
                aria-label="Zatvori"
              >
                ×
              </button>
            </header>

            {daySlots.length === 0 ? (
              <p className="cal-modal__empty">
                {dayHours(selected, hours).works
                  ? 'Dan je otvoren, ali još nema upisa u bazi.'
                  : 'Studio je zatvoren ovog dana.'}
              </p>
            ) : (
              <ul className="cal-modal__list">
                {daySlots.map((slot) => {
                  const filled = slot.members.length;
                  const cap = Math.max(1, slot.capacity || capacity);
                  const full = filled >= cap;
                  return (
                    <li
                      key={`${slot.date}-${slot.startTime}`}
                      className={full ? 'is-group-full' : undefined}
                    >
                      <div className="cal-modal__slot">
                        <time dateTime={`${slot.date}T${slot.startTime}`}>
                          {slot.startTime}
                          <span>–</span>
                          {slot.endTime}
                        </time>
                        <span className="cal-modal__cap">
                          {filled}/{cap}
                          {full ? ' · popunjeno' : ''}
                          {slot.serviceName ? ` · ${slot.serviceName}` : ''}
                        </span>
                      </div>
                      <ul className="cal-modal__people">
                        {slot.members.map((item) => (
                          <li key={item.id}>
                            <strong>{item.memberName}</strong>
                            <span>{statusLabel(item.status)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
