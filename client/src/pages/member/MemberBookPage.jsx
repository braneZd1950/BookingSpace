import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
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
  isLocalBookingFixtureId,
  isLocalBookingMock,
  localBookingList,
  localBookingServices,
  localBookingSlots,
  localBookingTrainers,
  localBookingWorkingHours,
} from '../../lib/localBookingFixtures.js';
import {
  firstOpenKey,
  formatBookingDay,
  sessionsLabel,
  slotNote,
} from '../../../../shared/memberBookLabels.js';
import {
  BOOKING_STEP_LABELS,
  bookingStatusDisplay,
  filterMemberBookings,
  formatServicePrice,
  nextStep,
  prevStep,
  resolveBookingSteps,
  serviceNeedsMembership,
} from '../../../../shared/memberBookFlow.js';
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

function themeStyle(palette) {
  const theme = palette?.theme;
  if (!theme) return undefined;
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

function windowForBooking(booking, services, fallback) {
  const service = (services || []).find(
    (item) => String(item.id) === String(booking.serviceId),
  );
  return Number(service?.cancellationWindowMinutes ?? fallback) || fallback;
}

export default function MemberBookPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const localMock = isLocalBookingMock();
  const services = useMemo(() => {
    const live = (tenant.services || []).filter((item) => item.active !== false);
    if (live.length) return live;
    return localMock ? localBookingServices() : [];
  }, [tenant.services, localMock]);
  const trainers = useMemo(() => {
    const live = tenant.trainers || [];
    if (live.length) return live;
    return localMock ? localBookingTrainers() : [];
  }, [tenant.trainers, localMock]);
  const steps = useMemo(() => resolveBookingSteps({ trainers }), [trainers]);
  const timeZone = tenant.timezone || 'Europe/Zagreb';
  const workingHours = useMemo(() => {
    const live = tenant.bookingSettings?.workingHours || [];
    if (live.length) return live;
    return localMock ? localBookingWorkingHours() : [];
  }, [tenant.bookingSettings?.workingHours, localMock]);
  const days = useMemo(() => upcomingDays(14), []);
  const todayKey = toDateKey(new Date());

  const queryServiceId = searchParams.get('serviceId') || '';
  const [serviceId, setServiceId] = useState('');
  const [step, setStep] = useState('service');
  const [date, setDate] = useState(() => firstOpenKey(days, workingHours));
  const [staffId, setStaffId] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState('');
  const [dayHints, setDayHints] = useState({});
  const [bookingFilter, setBookingFilter] = useState('upcoming');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const daysRef = useRef(null);

  useDefaultStaffId(trainers, setStaffId);

  const usingFixtureService = isLocalBookingFixtureId(serviceId);
  const service = services.find((item) => String(item.id) === String(serviceId)) || null;
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const needsMembership = serviceNeedsMembership(service);
  const membershipOk = !needsMembership || isMember;
  const canFetchSlots = loggedIn
    && membershipOk
    && Boolean(serviceId)
    && consentOk
    && !usingFixtureService
    && (step === 'date' || step === 'slot' || step === 'review' || step === 'done');

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
  const slots = useMemo(() => {
    const live = availability?.slots || [];
    if (!localMock) return live;
    if (usingFixtureService && open) return localBookingSlots(date, service);
    if (
      !loadingSlots
      && live.length === 0
      && serviceId
      && open
      && (step === 'date' || step === 'slot' || step === 'review')
    ) {
      return localBookingSlots(date, service);
    }
    return live;
  }, [
    availability?.slots,
    localMock,
    usingFixtureService,
    open,
    date,
    service,
    loadingSlots,
    serviceId,
    step,
  ]);
  const bookableSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const selectedSlot = bookableSlots.find((item) => item.startTime === slotTime) || null;
  const selectedStaff = trainers.find((item) => String(item.id) === String(staffId)) || null;
  const stepIndex = Math.max(0, steps.indexOf(step));

  const myBookings = useMemo(() => {
    const live = bookingData?.bookings || [];
    const source = live.length || !localMock
      ? live
      : localBookingList(tenantId);
    return filterMemberBookings(source, {
      tenantId,
      filter: bookingFilter,
      todayKey,
    });
  }, [bookingData, tenantId, bookingFilter, todayKey, localMock]);

  // Prefill service from URL or single-service studios
  useEffect(() => {
    if (!services.length) {
      setServiceId('');
      return;
    }
    const fromQuery = queryServiceId
      && services.some((item) => String(item.id) === String(queryServiceId))
      ? String(queryServiceId)
      : '';
    setServiceId((current) => {
      if (current && services.some((item) => String(item.id) === current)) return current;
      if (fromQuery) return fromQuery;
      if (services.length === 1) return String(services[0].id);
      return '';
    });
    if (fromQuery || services.length === 1) {
      setStep((current) => (current === 'done' ? current : 'info'));
    }
  }, [services, queryServiceId]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
  }, [date, serviceId]);

  useEffect(() => {
    if (!canFetchSlots || loadingSlots || !availability) return;
    setDayHints((current) => ({
      ...current,
      [date]: bookableSlots.length > 0 ? 'available' : 'empty',
    }));
  }, [availability, bookableSlots.length, canFetchSlots, date, loadingSlots]);

  useEffect(() => {
    if (!localMock || !serviceId || !open) return;
    if (canFetchSlots && (loadingSlots || availability)) return;
    setDayHints((current) => ({
      ...current,
      [date]: bookableSlots.length > 0 ? 'available' : 'empty',
    }));
  }, [
    localMock,
    serviceId,
    open,
    canFetchSlots,
    loadingSlots,
    availability,
    date,
    bookableSlots.length,
  ]);

  useEffect(() => {
    if (!workingHours.length) return;
    const selected = dateKeyToLocalDate(date);
    if (selected && dayOpen(workingHours, selected)) return;
    const next = firstOpenKey(days, workingHours);
    if (next && next !== date) setDate(next);
  }, [workingHours, days, date]);

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
  }, [step]);

  function go(next) {
    setError('');
    setOk('');
    if (next !== 'service' && !serviceId && services[0]) {
      setServiceId(String(services[0].id));
    }
    setStep(next);
  }

  function jumpToStep(id) {
    go(id);
  }

  function selectService(id) {
    setServiceId(String(id));
    setSlotTime('');
    setConfirmedBooking(null);
    if (searchParams.get('serviceId') !== String(id)) {
      const next = new URLSearchParams(searchParams);
      next.set('serviceId', String(id));
      setSearchParams(next, { replace: true });
    }
    go('info');
  }

  function goBack() {
    if (step === 'done') {
      go('service');
      setConfirmedBooking(null);
      setSlotTime('');
      return;
    }
    go(prevStep(steps, step));
  }

  function goForward() {
    if (step === 'service' && !serviceId) {
      setError('Odaberite uslugu.');
      return;
    }
    if (step === 'info' && needsMembership && !isMember) {
      setError('Za ovu uslugu potrebna je aktivna članarina.');
      return;
    }
    if (step === 'staff' && trainers.length > 1 && !staffId) {
      setError('Odaberite djelatnika.');
      return;
    }
    if (step === 'date' && !open) {
      setError('Odaberite otvoren dan.');
      return;
    }
    if (step === 'slot' && !slotTime) {
      setError('Odaberite slobodan termin.');
      return;
    }
    go(nextStep(steps, step));
  }

  async function onBook(event) {
    event.preventDefault();
    setError('');
    setOk('');
    if (trainers.length > 0 && !staffId) {
      setError('Odaberite djelatnika.');
      go('staff');
      return;
    }
    if (!slotTime) {
      setError('Odaberite sat.');
      go('slot');
      return;
    }
    const slotsAreMock = localMock && (
      usingFixtureService
      || (!(availability?.slots || []).length && slots.length > 0)
    );
    if (slotsAreMock) {
      setConfirmedBooking({
        serviceName: service?.name,
        date,
        startTime: slotTime,
        endTime: selectedSlot?.endTime,
        staff: selectedStaff ? { name: selectedStaff.name } : null,
      });
      setOk('Lokalni mock — rezervacija nije spremljena u bazu.');
      setSlotTime('');
      go('done');
      return;
    }
    try {
      const result = await createBooking({
        serviceId,
        date,
        startTime: slotTime,
        ...(staffId ? { staffId } : {}),
      }).unwrap();
      setConfirmedBooking(result?.booking || {
        serviceName: service?.name,
        date,
        startTime: slotTime,
        endTime: selectedSlot?.endTime,
        staff: selectedStaff ? { name: selectedStaff.name } : null,
      });
      setOk('Termin je rezerviran.');
      setSlotTime('');
      go('done');
    } catch (failure) {
      setError(messageForCreateBookingError(failure, 'member'));
    }
  }

  async function onCancel(bookingId) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    if (localMock && isLocalBookingFixtureId(bookingId)) {
      setOk('Lokalni mock — otkazivanje nije spremljeno u bazu.');
      setBusyId('');
      return;
    }
    try {
      await cancelBooking(bookingId).unwrap();
      setOk('Rezervacija je otkazana. Termin vam se ne broji kao iskorišten.');
    } catch (failure) {
      const item = (bookingData?.bookings || []).find((row) => row.id === bookingId);
      const label = formatCancellationWindow(
        windowForBooking(item || {}, services, cancelWindow),
      );
      setError(messageForCancelBookingError(failure, {
        audience: 'member',
        cancelWindowLabel: label,
      }));
    } finally {
      setBusyId('');
    }
  }

  const railStatus = isMember ? sessionsLabel(membership) : 'Termini';
  const showSticky = Boolean(
    service
    && step !== 'service'
    && step !== 'done'
    && (date || slotTime || selectedStaff),
  );

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
            <h1>Rezervacija</h1>
            <p className="member-book__lead">
              Odaberite uslugu i slobodan termin. Koraci se prilagođavaju ponudi studija.
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
          {ok && step !== 'done' ? <p className="member-book__ok" role="status">{ok}</p> : null}

          {!loggedIn ? (
            <section className="member-book__gate">
              <p className="member-book__kicker">Pristup</p>
              <h2>Prijava je potrebna</h2>
              <p>Prijavite se da rezervirate termin i pratite svoje rezervacije.</p>
              <Link className="member-book__cta" to="/login">Prijava</Link>
            </section>
          ) : null}

          {loggedIn && !consentOk ? (
            <ConsentGate title="Privola je potrebna za rezervacije" />
          ) : null}

          {loggedIn && consentOk && !services.length ? (
            <section className="member-book__gate">
              <p className="member-book__kicker">Usluga</p>
              <h2>Nema usluge</h2>
              <p>Studio još nije postavio uslugu za termine. Probajte kasnije.</p>
            </section>
          ) : null}

          {loggedIn && consentOk && services.length > 0 ? (
            <>
              <nav className="member-book__steps" aria-label="Koraci rezervacije">
                {steps.filter((id) => id !== 'done').map((id, index) => {
                  const active = id === step;
                  const done = steps.indexOf(step) > index;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={[
                        active ? 'is-active' : '',
                        done ? 'is-done' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      aria-current={active ? 'step' : undefined}
                      onClick={() => jumpToStep(id)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {BOOKING_STEP_LABELS[id]}
                    </button>
                  );
                })}
              </nav>
              {localMock && (
                services.some((item) => isLocalBookingFixtureId(item.id))
                || slots.some((slot) => slot.status === 'AVAILABLE' && !availability?.slots?.length)
              ) ? (
                <p className="member-book__hint" role="note">
                  Lokalni mock podaci — samo za localhost testiranje, ne spremaju se u bazu.
                </p>
              ) : null}

              {step === 'service' ? (
                <section className="member-book__pick" aria-label="Odabir usluge">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>Usluga</h2>
                    <p>Odaberite što želite rezervirati.</p>
                  </header>
                  <div className="member-book__services">
                    {services.map((item) => {
                      const id = String(item.id);
                      const on = serviceId === id;
                      const price = formatServicePrice(item.price);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={on ? 'is-on' : undefined}
                          onClick={() => selectService(id)}
                        >
                          <strong>{item.name}</strong>
                          <span>
                            {item.durationMinutes || '—'}
                            {' '}
                            min
                            {item.capacity > 1 ? ` · do ${item.capacity} mjesta` : ''}
                            {price ? ` · ${price}` : ''}
                            {item.membershipRequired ? ' · članarina' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {step === 'info' && service ? (
                <section className="member-book__pick" aria-label="Detalji usluge">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>{service.name}</h2>
                    <p>Provjerite trajanje, kapacitet i pravila prije nastavka.</p>
                  </header>
                  <dl className="member-book__facts">
                    <div>
                      <dt>Trajanje</dt>
                      <dd>
                        {service.durationMinutes || '—'}
                        {' '}
                        min
                      </dd>
                    </div>
                    {formatServicePrice(service.price) ? (
                      <div>
                        <dt>Cijena</dt>
                        <dd>{formatServicePrice(service.price)}</dd>
                      </div>
                    ) : null}
                    {service.capacity ? (
                      <div>
                        <dt>Kapacitet</dt>
                        <dd>
                          {service.capacity === 1
                            ? '1 mjesto'
                            : `Do ${service.capacity} mjesta`}
                        </dd>
                      </div>
                    ) : null}
                    {isMember && needsMembership ? (
                      <div>
                        <dt>Paket / članarina</dt>
                        <dd>{sessionsLabel(membership) || 'Aktivna'}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Otkazivanje</dt>
                      <dd>
                        Najkasnije
                        {' '}
                        {cancelWindowLabel}
                      </dd>
                    </div>
                  </dl>
                  {needsMembership && !isMember ? (
                    <div className="member-book__gate member-book__gate--inline">
                      <h3>Članarina je potrebna</h3>
                      <p>
                        Ova usluga zahtijeva aktivnu članarinu. Obratite se studiju da vam je aktiviraju.
                      </p>
                      {(tenant.phone || tenant.email) ? (
                        <p className="member-book__contact">
                          {[tenant.phone, tenant.email].filter(Boolean).join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="member-book__nav">
                      {services.length > 1 ? (
                        <button type="button" className="member-book__ghost" onClick={goBack}>
                          Natrag
                        </button>
                      ) : null}
                      <button type="button" className="member-book__cta" onClick={goForward}>
                        Nastavi
                      </button>
                    </div>
                  )}
                </section>
              ) : null}

              {step === 'staff' ? (
                <section className="member-book__pick" aria-label="Odabir djelatnika">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>Djelatnik</h2>
                    <p>Odaberite kod koga rezervirate.</p>
                  </header>
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
                          <span>{trainer.title || 'Djelatnik'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="member-book__nav">
                    <button type="button" className="member-book__ghost" onClick={goBack}>
                      Natrag
                    </button>
                    <button type="button" className="member-book__cta" onClick={goForward}>
                      Nastavi
                    </button>
                  </div>
                </section>
              ) : null}

              {step === 'date' ? (
                <section className="member-book__pick" aria-label="Odabir datuma">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>Datum</h2>
                    <p>Sljedeća dva tjedna · vremenska zona {timeZone.replace('_', ' ')}</p>
                  </header>
                  <div ref={daysRef} className="member-book__days" role="listbox" aria-label="Dani">
                    {days.map((item) => {
                      const key = toDateKey(item);
                      const works = dayOpen(workingHours, item);
                      const selected = key === date;
                      const hint = dayHints[key];
                      const meta = !works
                        ? 'Zatvoreno'
                        : hint === 'empty'
                          ? 'Bez termina'
                          : hint === 'available'
                            ? 'Dostupno'
                            : 'Otvoreno';
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
                            hint === 'empty' ? 'is-empty' : '',
                            hint === 'available' ? 'is-free' : '',
                          ].filter(Boolean).join(' ') || undefined}
                          onClick={() => setDate(key)}
                        >
                          <span className="member-book__day-name">{shortDay(item)}</span>
                          <strong>{item.getDate()}.</strong>
                          <span className="member-book__day-meta">{meta}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="member-book__nav">
                    <button type="button" className="member-book__ghost" onClick={goBack}>
                      Natrag
                    </button>
                    <button
                      type="button"
                      className="member-book__cta"
                      disabled={!open}
                      onClick={goForward}
                    >
                      Nastavi
                    </button>
                  </div>
                </section>
              ) : null}

              {step === 'slot' ? (
                <section className="member-book__pick" aria-label="Odabir termina">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>{formatDay(selectedDate)}</h2>
                    <p>
                      {!open
                        ? 'Studio je zatvoren ovog dana.'
                        : loadingSlots
                          ? 'Učitavamo slobodne termine…'
                          : bookableSlots.length > 0
                            ? 'Odaberite slobodan termin.'
                            : 'Nema slobodnih termina za ovaj dan.'}
                    </p>
                  </header>
                  {open ? (
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
                  ) : null}
                  <div className="member-book__nav">
                    <button type="button" className="member-book__ghost" onClick={goBack}>
                      Natrag
                    </button>
                    <button
                      type="button"
                      className="member-book__cta"
                      disabled={!selectedSlot}
                      onClick={goForward}
                    >
                      Nastavi
                    </button>
                  </div>
                </section>
              ) : null}

              {step === 'review' ? (
                <form className="member-book__pick" onSubmit={onBook} aria-label="Pregled rezervacije">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">
                      Korak
                      {' '}
                      {String(stepIndex + 1).padStart(2, '0')}
                    </p>
                    <h2>Pregled</h2>
                    <p>Potvrdite odabir. Dostupnost se ponovno provjerava pri potvrdi.</p>
                  </header>
                  <dl className="member-book__facts">
                    <div>
                      <dt>Usluga</dt>
                      <dd>{service?.name || '—'}</dd>
                    </div>
                    <div>
                      <dt>Datum</dt>
                      <dd>{formatDay(selectedDate)}</dd>
                    </div>
                    <div>
                      <dt>Vrijeme</dt>
                      <dd>
                        {selectedSlot
                          ? `${selectedSlot.startTime} – ${selectedSlot.endTime || ''}`
                          : '—'}
                      </dd>
                    </div>
                    {selectedStaff ? (
                      <div>
                        <dt>Djelatnik</dt>
                        <dd>{selectedStaff.name}</dd>
                      </div>
                    ) : null}
                    {formatServicePrice(service?.price) ? (
                      <div>
                        <dt>Cijena</dt>
                        <dd>{formatServicePrice(service.price)}</dd>
                      </div>
                    ) : null}
                    {isMember && needsMembership ? (
                      <div>
                        <dt>Članarina</dt>
                        <dd>{sessionsLabel(membership)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Otkazivanje</dt>
                      <dd>
                        Najkasnije
                        {' '}
                        {cancelWindowLabel}
                      </dd>
                    </div>
                  </dl>
                  <div className="member-book__nav">
                    <button type="button" className="member-book__ghost" onClick={goBack}>
                      Natrag
                    </button>
                    <button
                      className="member-book__cta"
                      type="submit"
                      disabled={booking || !selectedSlot}
                    >
                      {booking ? 'Rezerviramo…' : 'Potvrdi rezervaciju'}
                    </button>
                  </div>
                </form>
              ) : null}

              {step === 'done' ? (
                <section className="member-book__pick member-book__done" aria-label="Potvrda">
                  <header className="member-book__section-head">
                    <p className="member-book__kicker">Gotovo</p>
                    <h2>Rezervacija je potvrđena</h2>
                    <p>Potvrdu ćete dobiti i na e-poštu.</p>
                  </header>
                  <dl className="member-book__facts">
                    <div>
                      <dt>Usluga</dt>
                      <dd>{confirmedBooking?.serviceName || service?.name || '—'}</dd>
                    </div>
                    <div>
                      <dt>Datum</dt>
                      <dd>
                        {confirmedBooking?.date
                          ? formatBookingDay(confirmedBooking.date)
                          : formatDay(selectedDate)}
                      </dd>
                    </div>
                    <div>
                      <dt>Vrijeme</dt>
                      <dd>
                        {confirmedBooking?.startTime || selectedSlot?.startTime || '—'}
                        {confirmedBooking?.endTime
                          ? ` – ${confirmedBooking.endTime}`
                          : ''}
                      </dd>
                    </div>
                    {confirmedBooking?.staff?.name || selectedStaff?.name ? (
                      <div>
                        <dt>Djelatnik</dt>
                        <dd>
                          {confirmedBooking?.staff?.name || selectedStaff?.name}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="member-book__nav">
                    <button
                      type="button"
                      className="member-book__cta"
                      onClick={() => {
                        setConfirmedBooking(null);
                        setSlotTime('');
                        go(services.length > 1 ? 'service' : 'info');
                      }}
                    >
                      Nova rezervacija
                    </button>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {loggedIn ? (
            <section className="member-book__bookings">
              <header className="member-book__section-head">
                <p className="member-book__kicker">Pregled</p>
                <h2>Moje rezervacije</h2>
                <p>Odvojeno od rezerviranja — filtrirajte nadolazeće, prošle ili otkazane.</p>
              </header>
              <div className="member-book__filters" role="tablist" aria-label="Filter rezervacija">
                {[
                  { id: 'upcoming', label: 'Nadolazeće' },
                  { id: 'past', label: 'Prošle' },
                  { id: 'cancelled', label: 'Otkazane' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={bookingFilter === item.id}
                    className={bookingFilter === item.id ? 'is-on' : undefined}
                    onClick={() => setBookingFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {loadingBookings ? <p className="member-book__hint">Učitavamo…</p> : null}
              {!loadingBookings && myBookings.length === 0 ? (
                <p className="member-book__hint">
                  {bookingFilter === 'upcoming'
                    ? 'Nema nadolazećih rezervacija.'
                    : bookingFilter === 'past'
                      ? 'Nema prošlih rezervacija.'
                      : 'Nema otkazanih rezervacija.'}
                </p>
              ) : null}
              {myBookings.length > 0 ? (
                <ul className="member-book__list">
                  {myBookings.map((item) => {
                    const windowMinutes = windowForBooking(item, services, cancelWindow);
                    const allowed = item.status === 'CONFIRMED'
                      && canCancelBooking(item, windowMinutes, timeZone);
                    return (
                      <li key={item.id}>
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
                            {bookingStatusDisplay(item, services)}
                            {item.status === 'CONFIRMED'
                              ? allowed
                                ? ' · možete otkazati'
                                : ' · rok za otkaz istekao'
                              : ''}
                          </span>
                        </div>
                        {item.status === 'CONFIRMED' ? (
                          allowed ? (
                            <button
                              type="button"
                              className="member-book__cancel"
                              disabled={cancelling && busyId === item.id}
                              onClick={() => onCancel(item.id)}
                            >
                              {busyId === item.id ? 'Otkazujemo…' : 'Otkaži'}
                            </button>
                          ) : (
                            <span className="member-book__locked">Isteklo</span>
                          )
                        ) : (
                          <span className="member-book__status-chip">
                            {bookingStatusDisplay(item, services)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      {showSticky ? (
        <div className="member-book__sticky" aria-live="polite">
          <div>
            <strong>{service?.name}</strong>
            <span>
              {[
                date ? formatBookingDay(date) : null,
                slotTime || null,
                selectedStaff?.name || null,
              ].filter(Boolean).join(' · ') || 'Odabir u tijeku'}
            </span>
          </div>
          {step === 'review' ? (
            <button
              type="button"
              className="member-book__cta"
              disabled={booking || !selectedSlot}
              onClick={(event) => {
                void onBook(event);
              }}
            >
              {booking ? 'Rezerviramo…' : 'Potvrdi'}
            </button>
          ) : step !== 'done' ? (
            <button type="button" className="member-book__cta" onClick={goForward}>
              Dalje
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
