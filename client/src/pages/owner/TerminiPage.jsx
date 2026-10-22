import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  useCancelBookingMutation,
  useCreateBookingMutation,
  useGetAvailabilityQuery,
  useListTenantBookingsQuery,
} from '../../api/bookingApi.js';
import { useListMembershipsQuery } from '../../api/membershipApi.js';
import { useCreateServiceMutation, useListServicesQuery } from '../../api/serviceApi.js';
import { useUpdateTenantMutation } from '../../api/tenantApi.js';
import { ConsentGate } from '../../components/ConsentBanner.jsx';
import { usePrivacyConsent } from '../../hooks/usePrivacyConsent.js';
import MemberSelect from './MemberSelect.jsx';
import {
  dayHours,
  formatDay,
  hoursPayload,
  studioHours,
  toDateKey,
  upcomingDays,
} from './studioTime.js';
import './TerminiPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;

const defaultService = {
  name: 'Termin',
  durationMinutes: 60,
  slotIntervalMinutes: 60,
  capacity: 12,
  cancellationWindowMinutes: 60,
  price: 0,
  membershipRequired: true,
};

function memberLabel(item) {
  return item.user?.name || item.user?.email || 'Član';
}

function sessionsLeft(item) {
  if (item.sessionsIncluded == null) return 'Neograničeno';
  const left = Math.max(0, (item.sessionsIncluded || 0) - (item.sessionsUsed || 0));
  return `${left} preostalo`;
}

export default function TerminiPage() {
  const { studio } = useOutletContext();
  const hours = studioHours(studio);
  const tenantId = String(studio.id || '');
  const ready = REAL_ID.test(tenantId);
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => toDateKey(days[0]));
  const [memberId, setMemberId] = useState('');
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [slotTime, setSlotTime] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState('');
  const [hoursReady, setHoursReady] = useState(false);

  const { data: serviceData, isLoading: loadingServices } = useListServicesQuery(tenantId, {
    skip: !ready,
  });
  const { data: memberData } = useListMembershipsQuery(tenantId, { skip: !ready });
  const [createService, { isLoading: creatingService }] = useCreateServiceMutation();
  const [updateTenant] = useUpdateTenantMutation();
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();
  const { accepted: consentOk } = usePrivacyConsent();

  const services = (serviceData?.services || []).filter((item) => item.active !== false);
  const service = services[0] || null;
  const serviceId = service ? String(service.id) : '';

  const { data: availability, isFetching: loadingSlots } = useGetAvailabilityQuery(
    { tenantId, serviceId, date },
    { skip: !ready || !serviceId || !hoursReady },
  );
  const { data: bookingData, isLoading: loadingBookings } = useListTenantBookingsQuery(
    { tenantId, date, limit: 100 },
    { skip: !ready || !hoursReady },
  );

  const memberships = (memberData?.memberships || []).filter((item) => item.status === 'ACTIVE');
  const memberOptions = useMemo(
    () => (memberData?.memberships || [])
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => ({
        value: String(item.userId),
        label: memberLabel(item),
        hint: item.user?.email || '',
        note: sessionsLeft(item),
      })),
    [memberData],
  );
  const slots = availability?.slots || [];
  const openSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const dayBookings = (bookingData?.bookings || [])
    .filter((item) => item.status === 'CONFIRMED')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDate = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [date]);
  const dayOpen = dayHours(selectedDate, hours).works;

  const nameByUser = useMemo(() => {
    const map = new Map();
    for (const item of memberData?.memberships || []) {
      map.set(String(item.userId), memberLabel(item));
    }
    return map;
  }, [memberData]);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    const payload = hoursPayload(studioHours(studio));

    async function prepare() {
      setError('');
      try {
        await updateTenant({
          id: tenantId,
          body: {
            bookingSettings: {
              workingHours: payload,
            },
          },
        }).unwrap();
      } catch {
        if (!cancelled) setError('Radno vrijeme nije sinkronizirano. Provjerite Postavke.');
      } finally {
        if (!cancelled) setHoursReady(true);
      }
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [ready, tenantId, studio.id, studio.hours, updateTenant]);

  useEffect(() => {
    if (!ready || loadingServices || service || creatingService) return undefined;
    let cancelled = false;

    async function ensureService() {
      try {
        await createService({ tenantId, body: defaultService }).unwrap();
      } catch {
        if (!cancelled) setError('Usluga termina nije kreirana. Pokušajte ponovno.');
      }
    }

    ensureService();
    return () => {
      cancelled = true;
    };
  }, [ready, loadingServices, service, creatingService, tenantId, createService]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
  }, [date]);

  async function onBook(event) {
    event.preventDefault();
    setError('');
    setOk('');
    if (!consentOk) {
      setError('Potrebna je privola za rezervacije.');
      return;
    }
    if (!memberId) {
      setError('Odaberite člana.');
      return;
    }
    if (!slotTime) {
      setError('Odaberite sat.');
      return;
    }
    if (!serviceId) {
      setError('Usluga još nije spremna.');
      return;
    }

    try {
      await createBooking({
        serviceId,
        date,
        startTime: slotTime,
        userId: memberId,
      }).unwrap();
      setOk('Rezervacija je spremljena u bazu.');
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
        setError('Član nema aktivnu članarinu ili preostale termine.');
        return;
      }
      if (code === 'BOOKING_CONFLICT') {
        setError('Član već ima rezervaciju u tom terminu.');
        return;
      }
      if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola za rezervacije. Prihvatite je u banneru ili u Postavke → Privatnost.');
        return;
      }
      setError('Rezervacija nije spremljena.');
    }
  }

  async function onCancel(bookingId) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId).unwrap();
      setOk('Rezervacija je otkazana.');
    } catch (failure) {
      const code = failure?.data?.code;
      if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola za otkaz. Prihvatite je u banneru ili u Postavke → Privatnost.');
      } else {
        setError(failure?.status === 'FETCH_ERROR'
          ? 'Poslužitelj nije dostupan.'
          : 'Otkaz nije uspio.');
      }
    } finally {
      setBusyId('');
    }
  }

  if (!ready) {
    return (
      <section className="studio-panel termini">
        <h1>Termini</h1>
        <p>Studio još nije u bazi. Dovršite registraciju pa dodajte rezervacije.</p>
      </section>
    );
  }

  return (
    <section className="studio-panel termini">
      <div className="termini__head">
        <div>
          <h1>Termini</h1>
          <p>Dodajte rezervacije članovima — sve ide u bazu i vidi se u kalendaru.</p>
        </div>
        <Link className="termini__link" to="/stranica/clanovi">
          Upravljajte članovima
        </Link>
      </div>

      {!consentOk ? (
        <ConsentGate title="Privola je potrebna za rezervacije u studiju" />
      ) : null}

      <div className="termini__stats">
        <article>
          <span>Odabrani dan</span>
          <strong>{formatDay(selectedDate)}</strong>
        </article>
        <article>
          <span>Slobodni sati</span>
          <strong>{dayOpen ? openSlots.length : 0}</strong>
        </article>
        <article>
          <span>Rezervacije</span>
          <strong>{dayBookings.length}</strong>
        </article>
        <article>
          <span>Kapacitet / sat</span>
          <strong>{service?.capacity || '—'}</strong>
        </article>
      </div>

      {error ? <p className="termini__error">{error}</p> : null}
      {ok ? <p className="termini__ok">{ok}</p> : null}

      <div className="termini__layout">
        <aside className="termini__days" aria-label="Odabir dana">
          {days.map((item) => {
            const key = toDateKey(item);
            const open = dayHours(item, hours).works;
            return (
              <button
                key={key}
                type="button"
                className={[
                  key === date ? 'is-on' : '',
                  !open ? 'is-closed' : '',
                ].filter(Boolean).join(' ') || undefined}
                onClick={() => setDate(key)}
              >
                <strong>{formatDay(item)}</strong>
                <span>{open ? 'Otvoreno' : 'Zatvoreno'}</span>
              </button>
            );
          })}
        </aside>

        <div className="termini__main">
          <form className="termini__book" onSubmit={onBook}>
            <header>
              <h2>Nova rezervacija</h2>
              <p>
                {service
                  ? `${service.name} · ${service.durationMinutes} min · max ${service.capacity}`
                  : creatingService || loadingServices
                    ? 'Pripremamo uslugu…'
                    : 'Nema usluge'}
              </p>
            </header>

            {!dayOpen ? (
              <p className="termini__empty">Studio je zatvoren ovog dana. Odaberite drugi dan ili uredite sate u Postavkama.</p>
            ) : memberships.length === 0 ? (
              <p className="termini__empty">
                Nema aktivnih članova.{' '}
                <Link to="/stranica/clanovi">Dodajte člana</Link>
                {' '}pa se vratite ovdje.
              </p>
            ) : (
              <>
                <MemberSelect
                  label="Član"
                  value={memberId}
                  options={memberOptions}
                  open={memberMenuOpen}
                  onOpen={() => setMemberMenuOpen(true)}
                  onClose={() => setMemberMenuOpen(false)}
                  onChange={setMemberId}
                  placeholder="Odaberite člana"
                />

                <div className="termini__slots" role="group" aria-label="Slobodni termini">
                  {loadingSlots ? <p className="termini__hint">Učitavamo sate…</p> : null}
                  {!loadingSlots && openSlots.length === 0 ? (
                    <p className="termini__hint">Nema slobodnih sati za ovaj dan.</p>
                  ) : null}
                  {openSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      className={slotTime === slot.startTime ? 'is-on' : undefined}
                      onClick={() => setSlotTime(slot.startTime)}
                    >
                      <strong>{slot.startTime}</strong>
                      <span>{slot.available}/{slot.capacity}</span>
                    </button>
                  ))}
                </div>

                <button
                  className="termini__primary"
                  type="submit"
                  disabled={booking || !serviceId || !memberId || !slotTime}
                >
                  {booking ? 'Spremamo…' : 'Spremi rezervaciju'}
                </button>
              </>
            )}
          </form>

          <section className="termini__list-wrap">
            <header>
              <h2>Rezervacije tog dana</h2>
              <p>Potvrđeni upisi iz baze.</p>
            </header>
            {loadingBookings ? <p className="termini__hint">Učitavamo rezervacije…</p> : null}
            {!loadingBookings && dayBookings.length === 0 ? (
              <p className="termini__empty">Još nema rezervacija za {formatDay(selectedDate)}.</p>
            ) : null}
            {dayBookings.length > 0 ? (
              <ul className="termini__list">
                {dayBookings.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>
                        {item.startTime}
                        –
                        {item.endTime}
                      </strong>
                      <span>{nameByUser.get(String(item.userId)) || 'Član'}</span>
                    </div>
                    <button
                      type="button"
                      className="termini__cancel"
                      disabled={cancelling && busyId === item.id}
                      onClick={() => onCancel(item.id)}
                    >
                      {busyId === item.id ? 'Otkazujemo…' : 'Otkaži'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
