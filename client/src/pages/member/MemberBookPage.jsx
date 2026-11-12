import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  useCancelBookingMutation,
  useCreateBookingMutation,
  useGetAvailabilityQuery,
  useListMyBookingsQuery,
} from '../../api/bookingApi.js';
import { useGetPublicTenantQuery } from '../../api/tenantApi.js';
import { ConsentGate } from '../../components/ConsentBanner.jsx';
import { useDefaultStaffId } from '../../hooks/useDefaultStaffId.js';
import { usePrivacyConsent } from '../../hooks/usePrivacyConsent.js';
import {
  messageForCancelBookingError,
  messageForCreateBookingError,
} from '../../lib/bookingErrors.js';
import { dateKeyToLocalDate } from '../../lib/dateRange.js';
import {
  firstOpenKey,
  formatBookingDay,
  sessionsLabel,
  slotNote,
} from '../../../../shared/memberBookLabels.js';
import {
  dayOpen,
  formatCancellationWindow,
  formatDay,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../owner/studioTime.js';
import './MemberBookPage.scss';

const shortWeekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });

function shortDay(date) {
  const name = shortWeekday.format(date).replace('.', '');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function canCancelBooking(booking, windowMinutes, timeZone) {
  const now = zonedClock(timeZone || 'Europe/Zagreb');
  return withinCancellationWindow(
    now,
    booking.date,
    booking.startTime,
    windowMinutes ?? 0,
  );
}

function policyMark(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${Math.floor(hours)} h ${value % 60} min`;
}

function themeStyle(palette) {
  const theme = palette?.theme;
  if (!theme) return undefined;
  // Match paletteSurfaceVars: in dark mode ink/canvas follow global tokens so
  // inline studio light-ink does not beat dark CSS rules.
  const dark = typeof document !== 'undefined'
    && (document.documentElement.getAttribute('data-theme') === 'dark'
      || (document.documentElement.getAttribute('data-theme') !== 'light'
        && window.matchMedia('(prefers-color-scheme: dark)').matches));
  return {
    '--book-brand': theme.primaryColor,
    '--book-soft': dark
      ? `color-mix(in srgb, ${theme.primaryColor} 26%, var(--surface))`
      : theme.secondaryColor,
    '--book-ink': dark ? 'var(--fg)' : theme.ink,
    '--book-canvas': dark ? 'var(--bg)' : theme.canvas,
  };
}

export default function MemberBookPage() {
  const { slug } = useParams();
  const {
    tenant: tenantFromLayout,
    membership,
    isMember,
    loggedIn,
    palette,
  } = useOutletContext();
  const { accepted: consentOk } = usePrivacyConsent();
  const { data: publicData } = useGetPublicTenantQuery(slug, {
    skip: !slug,
    refetchOnMountOrArgChange: true,
    pollingInterval: 15000,
  });
  const tenant = publicData?.tenant || tenantFromLayout;
  const tenantId = String(tenant.id);
  const services = tenant.services || [];
  const trainers = useMemo(() => tenant.trainers || [], [tenant.trainers]);
  const service = services.find((item) => item.active !== false) || services[0] || null;
  const serviceId = service ? String(service.id) : '';
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const timeZone = tenant.timezone || 'Europe/Zagreb';
  const workingHours = tenant.bookingSettings?.workingHours || [];
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => firstOpenKey(days, workingHours));
  const [staffId, setStaffId] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState('');
  const [policyFlash, setPolicyFlash] = useState(false);
  const daysRef = useRef(null);
  const lastWindowRef = useRef(cancelWindow);

  useDefaultStaffId(trainers, setStaffId);

  useEffect(() => {
    if (lastWindowRef.current === cancelWindow) return;
    lastWindowRef.current = cancelWindow;
    setPolicyFlash(true);
    const timer = window.setTimeout(() => setPolicyFlash(false), 1600);
    return () => window.clearTimeout(timer);
  }, [cancelWindow]);

  const canFetchSlots = loggedIn && isMember && Boolean(serviceId) && consentOk;
  const { currentData: availability, isFetching: loadingSlots } = useGetAvailabilityQuery(
    { tenantId, serviceId, date },
    { skip: !canFetchSlots },
  );
  const { data: bookingData, isLoading: loadingBookings } = useListMyBookingsQuery(50, {
    skip: !loggedIn,
  });
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const selectedDate = useMemo(() => dateKeyToLocalDate(date), [date]);
  const open = dayOpen(workingHours, selectedDate);
  // currentData avoids showing yesterday's slots while today's request is in flight
  const slots = availability?.slots || [];
  const bookableSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const selectedSlot = bookableSlots.find((item) => item.startTime === slotTime) || null;

  const myBookings = (bookingData?.bookings || [])
    .filter((item) => String(item.tenantId) === tenantId && item.status === 'CONFIRMED')
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime);
    });
  const dayBookings = myBookings.filter((item) => item.date === date);

  useEffect(() => {
    setSlotTime('');
    setOk('');
  }, [date]);

  useEffect(() => {
    const node = daysRef.current;
    if (!node) return undefined;

    function onWheel(event) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = node.scrollWidth - node.clientWidth;
      if (maxScroll <= 0) return;

      const next = Math.min(maxScroll, Math.max(0, node.scrollLeft + event.deltaY));
      if (next === node.scrollLeft) return;

      event.preventDefault();
      node.scrollLeft = next;
    }

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [canFetchSlots]);

  async function onBook(event) {
    event.preventDefault();
    setError('');
    setOk('');
    if (trainers.length > 0 && !staffId) {
      setError('Odaberite trenera.');
      return;
    }
    if (!slotTime) {
      setError('Odaberite sat.');
      return;
    }
    try {
      await createBooking({
        serviceId,
        date,
        startTime: slotTime,
        ...(staffId ? { staffId } : {}),
      }).unwrap();
      setOk('Termin je rezerviran.');
      setSlotTime('');
    } catch (failure) {
      setError(messageForCreateBookingError(failure, 'member'));
    }
  }

  async function onCancel(bookingId) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId).unwrap();
      setOk('Rezervacija je otkazana. Termin vam se ne broji kao iskorišten.');
    } catch (failure) {
      setError(messageForCancelBookingError(failure, {
        audience: 'member',
        cancelWindowLabel,
      }));
    } finally {
      setBusyId('');
    }
  }

  const railStatus = isMember ? sessionsLabel(membership) : 'Termini';

  return (
    <main className="member-book" style={themeStyle(palette)}>
      <div className="member-book__atmosphere" aria-hidden="true">
        <span className="member-book__wash" />
        <span className="member-book__grain" />
      </div>

      <div className="member-book__layout">
        <aside className="member-book__rail" aria-hidden="true">
          <p className="member-book__rail-mark">Termini</p>
          <p className="member-book__rail-status">{railStatus || 'Termini'}</p>
        </aside>

        <div className="member-book__stage">
          <header className="member-book__hero">
            <p className="member-book__studio">{tenant.name}</p>
            <h1>Termini</h1>
            <p className="member-book__lead">
              {service
                ? `${service.name} · ${service.durationMinutes} min`
                : 'Studio još nema objavljenu uslugu za rezervaciju.'}
            </p>
            {isMember ? (
              <p className="member-book__plan">
                {membership.planName || 'Članarina'}
                {' · '}
                {sessionsLabel(membership)}
              </p>
            ) : null}
          </header>

          {error ? <p className="member-book__error" role="alert">{error}</p> : null}
          {ok ? <p className="member-book__ok" role="status">{ok}</p> : null}

          <ol className="member-book__trust" aria-label="Zašto rezervirati ovdje">
            <li>
              <span className="member-book__trust-num" aria-hidden="true">01</span>
              <span>
                Rezervacija izravno kod
                {' '}
                {tenant.name}
                {' '}
                — ne u marketplace katalogu
              </span>
            </li>
            <li>
              <span className="member-book__trust-num" aria-hidden="true">02</span>
              <span>Potvrda na e-poštu nakon rezervacije ili otkaza</span>
            </li>
            <li>
              <span className="member-book__trust-num" aria-hidden="true">03</span>
              <span>Članarina i uplata dogovaraju se sa studijom; ovdje vodite termine</span>
            </li>
          </ol>

          {!loggedIn ? (
            <section className="member-book__gate">
              <p className="member-book__kicker">Pristup</p>
              <h2>Prijava je potrebna</h2>
              <p>Prijavite se da vidite slobodne sate i rezervirate termin.</p>
              <Link className="member-book__cta" to="/login">
                Prijava
              </Link>
            </section>
          ) : null}

          {loggedIn && !isMember ? (
            <section className="member-book__gate">
              <p className="member-book__kicker">Članstvo</p>
              <h2>Članarina je potrebna</h2>
              <p>
                Pregled termina je dostupan članovima s aktivnom članarinom.
                Obratite se studiju da vam je aktiviraju.
              </p>
              {(tenant.phone || tenant.email) ? (
                <p className="member-book__contact">
                  {[tenant.phone, tenant.email].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </section>
          ) : null}

          {loggedIn && isMember && !consentOk ? (
            <ConsentGate title="Privola je potrebna za rezervacije" />
          ) : null}

          {loggedIn && isMember && consentOk && !service ? (
            <section className="member-book__gate">
              <p className="member-book__kicker">Usluga</p>
              <h2>Nema usluge</h2>
              <p>Studio još nije postavio uslugu za termine. Probajte kasnije.</p>
            </section>
          ) : null}

          {canFetchSlots ? (
            <div className="member-book__flow">
              <aside
                className={policyFlash ? 'member-book__policy is-updated' : 'member-book__policy'}
                aria-label="Uvjeti otkazivanja"
                aria-live="polite"
              >
                <div className="member-book__policy-head">
                  <div>
                    <p className="member-book__kicker">Pravila</p>
                    <h2>Uvjeti otkazivanja</h2>
                  </div>
                  <span className="member-book__policy-mark" key={cancelWindow}>
                    {policyMark(cancelWindow)}
                  </span>
                </div>
                <p>
                  Termin možete otkazati najkasnije
                  {' '}
                  <strong key={`label-${cancelWindow}`}>{cancelWindowLabel}</strong>
                  .
                  U tom roku rezervacija se briše i termin se
                  {' '}
                  <strong>ne broji kao iskorišten</strong>
                  .
                </p>
                <p>
                  Ako otkažete kasnije ili ne dođete, studio zadržava termin kao iskorišten
                  prema svojim pravilima.
                </p>
              </aside>

              <section className="member-book__pick" aria-label="Odabir dana">
                <header className="member-book__section-head">
                  <p className="member-book__kicker">Korak 01</p>
                  <h2>Dan</h2>
                  <p>Sljedeća dva tjedna</p>
                </header>
                <div ref={daysRef} className="member-book__days" role="listbox" aria-label="Dani">
                  {days.map((item) => {
                    const key = toDateKey(item);
                    const works = dayOpen(workingHours, item);
                    const selected = key === date;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={!works}
                        className={[
                          selected ? 'is-on' : '',
                          !works ? 'is-closed' : '',
                        ].filter(Boolean).join(' ') || undefined}
                        onClick={() => setDate(key)}
                      >
                        <span className="member-book__day-name">{shortDay(item)}</span>
                        <strong>{item.getDate()}.</strong>
                        <span className="member-book__day-meta">
                          {works ? 'Otvoreno' : 'Zatvoreno'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <form className="member-book__pick" onSubmit={onBook}>
                <header className="member-book__section-head">
                  <p className="member-book__kicker">Korak 02</p>
                  <h2>{formatDay(selectedDate)}</h2>
                  <p>
                    {!open
                      ? 'Studio je zatvoren ovog dana.'
                      : loadingSlots
                        ? 'Učitavamo slobodne sate…'
                        : bookableSlots.length > 0
                          ? 'Odaberite slobodan sat.'
                          : 'Nema slobodnih sati za ovaj dan.'}
                  </p>
                </header>

                {open && trainers.length > 0 ? (
                  <div className="member-book__trainers" role="group" aria-label="Trener">
                    <p className="member-book__trainers-label">Kod koga rezervirate</p>
                    <div className="member-book__trainer-list">
                      {trainers.map((trainer) => {
                        const id = String(trainer.id);
                        const on = staffId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            aria-pressed={on}
                            className={on ? 'is-on' : undefined}
                            onClick={() => setStaffId(id)}
                          >
                            <strong>{trainer.name}</strong>
                            <span>{trainer.title || 'Trener'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {open ? (
                  <>
                    <div className="member-book__slots" role="group" aria-label="Termini">
                      {slots.map((slot) => {
                        const free = slot.status === 'AVAILABLE';
                        const on = slotTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={!free}
                            aria-pressed={on}
                            className={[
                              on ? 'is-on' : '',
                              slot.status === 'FULL' ? 'is-full' : '',
                              slot.status === 'PAST' ? 'is-past' : '',
                            ].filter(Boolean).join(' ') || undefined}
                            onClick={() => setSlotTime(slot.startTime)}
                          >
                            <strong>{slot.startTime}</strong>
                            <span>{slotNote(slot)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className={`member-book__confirm${selectedSlot ? ' is-ready' : ''}`}>
                      <p>
                        {selectedSlot
                          ? `${formatDay(selectedDate)} · ${selectedSlot.startTime}${
                            staffId
                              ? ` · ${trainers.find((item) => String(item.id) === staffId)?.name || ''}`
                              : ''
                          }`
                          : 'Odaberite sat za potvrdu rezervacije.'}
                      </p>
                      <button
                        className="member-book__cta"
                        type="submit"
                        disabled={booking || !selectedSlot}
                      >
                        {booking ? 'Rezerviramo…' : 'Rezerviraj termin'}
                      </button>
                    </div>
                  </>
                ) : null}
              </form>

              <section className="member-book__bookings">
                <header className="member-book__section-head">
                  <p className="member-book__kicker">Pregled</p>
                  <h2>Vaše rezervacije</h2>
                  <p>
                    {dayBookings.length > 0
                      ? `${dayBookings.length} za odabrani dan · otkaz unutar roka vraća termin`
                      : `Otkaz najkasnije ${cancelWindowLabel} · inače se termin broji`}
                  </p>
                </header>
                {loadingBookings ? <p className="member-book__hint">Učitavamo…</p> : null}
                {!loadingBookings && myBookings.length === 0 ? (
                  <p className="member-book__hint">Još nemate rezervacija u ovom studiju.</p>
                ) : null}
                {myBookings.length > 0 ? (
                  <ul className="member-book__list">
                    {myBookings.map((item) => {
                      const allowed = canCancelBooking(item, cancelWindow, timeZone);
                      return (
                        <li key={item.id} className={item.date === date ? 'is-day' : undefined}>
                          <div>
                            <strong>
                              {formatBookingDay(item.date)}
                              {' · '}
                              {item.startTime}
                              –
                              {item.endTime}
                            </strong>
                            <span>
                              {item.serviceName || 'Termin'}
                              {item.staff?.name ? ` · ${item.staff.name}` : ''}
                              {' · '}
                              {allowed
                                ? 'Možete otkazati bez gubitka termina'
                                : 'Rok za otkaz je istekao'}
                            </span>
                          </div>
                          {allowed ? (
                            <button
                              type="button"
                              className="member-book__cancel"
                              disabled={cancelling && busyId === item.id}
                              onClick={() => onCancel(item.id)}
                            >
                              {busyId === item.id ? 'Otkazujemo…' : 'Otkaži'}
                            </button>
                          ) : (
                            <span className="member-book__locked">Zaključano</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
