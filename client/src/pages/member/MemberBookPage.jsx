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
import { usePrivacyConsent } from '../../hooks/usePrivacyConsent.js';
import {
  formatCancellationWindow,
  formatDay,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../owner/studioTime.js';
import './MemberBookPage.scss';

const shortWeekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });
const bookingDay = new Intl.DateTimeFormat('hr-HR', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

function dayOpen(workingHours, date) {
  const day = date.getDay();
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row) return false;
  return !row.closed && Boolean(row.open) && Boolean(row.close);
}

function sessionsLabel(membership) {
  if (!membership) return '';
  if (membership.sessionsIncluded == null) return 'Neograničeno';
  const left = membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
  return `${left} preostalo`;
}

function shortDay(date) {
  const name = shortWeekday.format(date).replace('.', '');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function formatBookingDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const label = bookingDay.format(new Date(y, m - 1, d));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function slotNote(slot) {
  if (slot.status === 'FULL') return 'Puno';
  if (slot.status === 'PAST') return 'Prošlo';
  if (slot.available === slot.capacity) return 'Slobodno';
  if (slot.available === 1) return '1 mjesto';
  return `${slot.available} mjesta`;
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

function firstOpenKey(days, workingHours) {
  const open = days.find((item) => dayOpen(workingHours, item));
  return toDateKey(open || days[0]);
}

function policyMark(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${Math.floor(hours)} h ${value % 60} min`;
}

export default function MemberBookPage() {
  const { slug } = useParams();
  const { tenant: tenantFromLayout, membership, isMember, loggedIn } = useOutletContext();
  const { accepted: consentOk } = usePrivacyConsent();
  const { data: publicData } = useGetPublicTenantQuery(slug, {
    skip: !slug,
    refetchOnMountOrArgChange: true,
    pollingInterval: 15000,
  });
  const tenant = publicData?.tenant || tenantFromLayout;
  const tenantId = String(tenant.id);
  const services = tenant.services || [];
  const service = services.find((item) => item.active !== false) || services[0] || null;
  const serviceId = service ? String(service.id) : '';
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const timeZone = tenant.timezone || 'Europe/Zagreb';
  const workingHours = tenant.bookingSettings?.workingHours || [];
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => firstOpenKey(days, workingHours));
  const [slotTime, setSlotTime] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState('');
  const [policyFlash, setPolicyFlash] = useState(false);
  const daysRef = useRef(null);
  const lastWindowRef = useRef(cancelWindow);

  useEffect(() => {
    if (lastWindowRef.current === cancelWindow) return;
    lastWindowRef.current = cancelWindow;
    setPolicyFlash(true);
    const timer = window.setTimeout(() => setPolicyFlash(false), 1600);
    return () => window.clearTimeout(timer);
  }, [cancelWindow]);

  const canFetchSlots = loggedIn && isMember && Boolean(serviceId) && consentOk;
  const { data: availability, isFetching: loadingSlots } = useGetAvailabilityQuery(
    { tenantId, serviceId, date },
    { skip: !canFetchSlots },
  );
  const { data: bookingData, isLoading: loadingBookings } = useListMyBookingsQuery(50, {
    skip: !loggedIn,
  });
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  const selectedDate = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [date]);
  const open = dayOpen(workingHours, selectedDate);
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
    if (!slotTime) {
      setError('Odaberite sat.');
      return;
    }
    try {
      await createBooking({
        serviceId,
        date,
        startTime: slotTime,
      }).unwrap();
      setOk('Termin je rezerviran.');
      setSlotTime('');
    } catch (failure) {
      const code = failure?.data?.code;
      if (failure?.status === 'FETCH_ERROR') {
        setError('Poslužitelj nije dostupan.');
        return;
      }
      if (code === 'SLOT_UNAVAILABLE') {
        setError('Taj sat više nije slobodan.');
        return;
      }
      if (code === 'MEMBERSHIP_REQUIRED' || code === 'NO_SESSIONS') {
        setError('Nemate aktivnu članarinu ili preostale termine.');
        return;
      }
      if (code === 'BOOKING_CONFLICT') {
        setError('Već imate rezervaciju u tom terminu.');
        return;
      }
      if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola. Prihvatite je u banneru ili u Privatnost.');
        return;
      }
      setError('Rezervacija nije uspjela.');
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
      const code = failure?.data?.code;
      if (code === 'CANCELLATION_WINDOW') {
        setError(`Prekasno je za otkaz. Rok je ${cancelWindowLabel}.`);
      } else if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola. Prihvatite je u banneru ili u Privatnost.');
      } else {
        setError(failure?.status === 'FETCH_ERROR'
          ? 'Poslužitelj nije dostupan.'
          : 'Otkaz nije uspio.');
      }
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="member-book">
      <header className="member-book__head">
        <div>
          <h1>Termini</h1>
          <p>
            {service
              ? `${service.name} · ${service.durationMinutes} min`
              : 'Studio još nema objavljenu uslugu za rezervaciju.'}
          </p>
        </div>
        {isMember ? (
          <p className="member-book__badge">
            {membership.planName || 'Članarina'}
            {' · '}
            {sessionsLabel(membership)}
          </p>
        ) : null}
      </header>

      {error ? <p className="member-book__error" role="alert">{error}</p> : null}
      {ok ? <p className="member-book__ok" role="status">{ok}</p> : null}

      {!loggedIn ? (
        <section className="member-book__gate">
          <h2>Prijava je potrebna</h2>
          <p>Prijavite se da vidite slobodne sate i rezervirate termin.</p>
          <Link className="member-book__cta" to="/login">
            Prijava
          </Link>
        </section>
      ) : null}

      {loggedIn && !isMember ? (
        <section className="member-book__gate">
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
              <h2>Uvjeti otkazivanja</h2>
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
                      ? `${formatDay(selectedDate)} · ${selectedSlot.startTime}`
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
    </main>
  );
}
