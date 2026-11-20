import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getMe } from '../../api/auth.js';
import {
  cancelBooking,
  createBooking,
  listMyBookings,
} from '../../api/bookings.js';
import { recordConsent } from '../../api/consent.js';
import { getAvailability } from '../../api/services.js';
import {
  messageForCancelBookingError,
  messageForCreateBookingError,
} from '../../lib/bookingErrors.js';
import { memberChromeStyles as chrome } from './memberChrome';
import { CONSENT_VERSION, hasValidConsent } from '../../lib/consent.js';
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
  dateFromKey,
  dayOpen,
  formatCancellationWindow,
  formatDay,
  formatDayChip,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../studio/studioTime.js';
import { BRAND, DARK_SURFACE } from '../../lib/brandColors.js';
import StudioTopCurtain from '../studio/StudioTopCurtain';

type MemberBookScreenProps = {
  tenant: any;
  membership: any;
  isMember: boolean;
  onBack: () => void;
  initialServiceId?: string;
  initialDate?: string;
};

export default function MemberBookScreen({
  tenant,
  membership,
  isMember,
  onBack,
  initialServiceId = '',
  initialDate = '',
}: MemberBookScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const tenantId = String(tenant?.id || '');
  const services = useMemo(
    () => (tenant?.services || []).filter((item: any) => item.active !== false),
    [tenant?.services],
  );
  const trainers = tenant?.trainers || [];
  const steps = useMemo(() => resolveBookingSteps({ trainers }), [trainers]);
  const timeZone = tenant?.timezone || 'Europe/Zagreb';
  const workingHours = tenant?.bookingSettings?.workingHours || [];
  const days = useMemo(() => upcomingDays(14), []);
  const todayKey = toDateKey(new Date());

  const [serviceId, setServiceId] = useState('');
  const [step, setStep] = useState('service');
  const [date, setDate] = useState(() => firstOpenKey(days, workingHours));
  const [staffId, setStaffId] = useState(() => (
    trainers[0] ? String(trainers[0].id) : ''
  ));
  const [slotTime, setSlotTime] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [consentOk, setConsentOk] = useState(false);
  const [acceptingConsent, setAcceptingConsent] = useState(false);
  const [booking, setBooking] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [dayHints, setDayHints] = useState<Record<string, string>>({});
  const [slotCurtainOpen, setSlotCurtainOpen] = useState(false);

  const service = services.find((item: any) => String(item.id) === String(serviceId)) || null;
  const serviceIdSafe = service ? String(service.id) : '';
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const needsMembership = serviceNeedsMembership(service);
  const membershipOk = !needsMembership || isMember;
  const selectedDate = useMemo(() => dateFromKey(date), [date]);
  const open = dayOpen(workingHours, selectedDate);
  const bookableSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const selectedSlot = bookableSlots.find((item) => item.startTime === slotTime) || null;
  const selectedStaff = trainers.find((item: any) => String(item.id) === String(staffId));
  const stepIndex = Math.max(0, steps.indexOf(step));

  const myBookings = useMemo(
    () => filterMemberBookings(bookings, {
      tenantId,
      filter: bookingFilter,
      todayKey,
    }),
    [bookings, tenantId, bookingFilter, todayKey],
  );

  useEffect(() => {
    if (!services.length) {
      setServiceId('');
      return;
    }
    const fromInitial = initialServiceId
      && services.some((item: any) => String(item.id) === String(initialServiceId))
      ? String(initialServiceId)
      : '';
    setServiceId((current) => {
      if (current && services.some((item: any) => String(item.id) === current)) return current;
      if (fromInitial) return fromInitial;
      if (services.length === 1) return String(services[0].id);
      return '';
    });
    if (fromInitial || services.length === 1) setStep('info');
  }, [services, initialServiceId]);

  useEffect(() => {
    if (!initialDate) return;
    const match = days.some((item) => toDateKey(item) === initialDate);
    if (!match) return;
    setDate(initialDate);
    setSlotTime('');
    setStep('slot');
    setSlotCurtainOpen(true);
  }, [initialDate, days]);

  useEffect(() => {
    if (!trainers.length) {
      setStaffId('');
      return;
    }
    setStaffId((current) => {
      if (current && trainers.some((item: any) => String(item.id) === current)) return current;
      return String(trainers[0].id);
    });
  }, [trainers]);

  const refreshBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await listMyBookings(50);
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch {
      /* ignore */
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getMe();
        const user = data?.user || data;
        if (!cancelled) setConsentOk(hasValidConsent(user));
      } catch {
        if (!cancelled) setConsentOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
  }, [date, serviceIdSafe]);

  useEffect(() => {
    const needSlots = membershipOk
      && consentOk
      && serviceIdSafe
      && tenantId
      && open
      && (step === 'date' || step === 'slot' || step === 'review' || step === 'done');
    if (!needSlots) {
      setSlots([]);
      return undefined;
    }
    let cancelled = false;
    void (async () => {
      setLoadingSlots(true);
      try {
        const data = await getAvailability(tenantId, serviceIdSafe, date);
        if (!cancelled) {
          const next = Array.isArray(data?.slots) ? data.slots : [];
          setSlots(next);
          const free = next.filter((item: any) => item.status === 'AVAILABLE').length;
          setDayHints((current) => ({
            ...current,
            [date]: free > 0 ? 'available' : 'empty',
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(err instanceof Error ? err.message : 'Termini nisu učitani.');
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [membershipOk, consentOk, serviceIdSafe, tenantId, date, open, step]);

  function go(next: string) {
    setError('');
    setOk('');
    setStep(next);
    setSlotCurtainOpen(next === 'slot');
  }

  function goBack() {
    if (step === 'done') {
      go(services.length > 1 ? 'service' : 'info');
      setSlotTime('');
      return;
    }
    go(prevStep(steps, step));
  }

  function goForward() {
    if (step === 'service' && !serviceIdSafe) {
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

  async function acceptConsent() {
    setAcceptingConsent(true);
    setError('');
    try {
      await recordConsent({
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'member-book',
      });
      setConsentOk(true);
      setOk('Privola je spremljena.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Privola nije spremljena.');
    } finally {
      setAcceptingConsent(false);
    }
  }

  async function onBook() {
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
    setBooking(true);
    try {
      await createBooking({
        serviceId: serviceIdSafe,
        date,
        startTime: slotTime,
        ...(staffId ? { staffId } : {}),
      });
      setOk('Termin je rezerviran.');
      setSlotTime('');
      await refreshBookings();
      go('done');
    } catch (failure) {
      setError(messageForCreateBookingError(failure));
    } finally {
      setBooking(false);
    }
  }

  async function onCancel(bookingId: string) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId);
      setOk('Rezervacija je otkazana. Termin vam se ne broji kao iskorišten.');
      await refreshBookings();
    } catch (failure) {
      setError(messageForCancelBookingError(failure, { cancelWindowLabel }));
    } finally {
      setBusyId('');
    }
  }

  function canCancel(item: any) {
    if (item.status !== 'CONFIRMED') return false;
    const svc = services.find((row: any) => String(row.id) === String(item.serviceId));
    const windowMinutes = Number(svc?.cancellationWindowMinutes ?? cancelWindow) || cancelWindow;
    const now = zonedClock(timeZone);
    return withinCancellationWindow(now, item.date, item.startTime, windowMinutes);
  }

  return (
    <View style={[chrome.root, { backgroundColor: '#0F172A' }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1E3A5F', '#15233B', '#0F172A']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          chrome.content,
          { paddingTop: compact ? 44 : 56, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [chrome.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color="#14B8A6" />
          <Text style={[chrome.backLabel, { color: '#14B8A6' }]}>Početna</Text>
        </Pressable>

        <Text style={styles.studio}>{tenant?.name || 'Studio'}</Text>
        <Text style={[chrome.title, { color: '#E8F2EF' }]}>Rezervacija</Text>
        <Text style={styles.lead}>
          Koraci se prilagođavaju usluzi i poslovanju.
        </Text>
        {isMember ? (
          <Text style={styles.plan}>
            {membership?.planName || 'Članarina'}
            {' · '}
            {sessionsLabel(membership)}
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {ok && step !== 'done' ? <Text style={styles.ok}>{ok}</Text> : null}

        {!consentOk ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Privola</Text>
            <Text style={styles.gateTitle}>Privola je potrebna</Text>
            <Text style={styles.gateLead}>
              Za rezervacije potvrdite privolu na obradu podataka.
            </Text>
            <Pressable
              onPress={() => {
                void acceptConsent();
              }}
              style={({ pressed }) => [
                styles.cta,
                acceptingConsent && styles.ctaDisabled,
                pressed && styles.pressed,
              ]}
              disabled={acceptingConsent}
            >
              <Text style={styles.ctaLabel}>
                {acceptingConsent ? 'Spremamo…' : 'Prihvaćam'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {consentOk && services.length === 0 ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Usluga</Text>
            <Text style={styles.gateTitle}>Nema usluge</Text>
            <Text style={styles.gateLead}>
              Studio još nije postavio uslugu za termine.
            </Text>
          </View>
        ) : null}

        {consentOk && services.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stepsRow}
              style={styles.stepsScroll}
            >
              {steps.filter((id) => id !== 'done').map((id, index) => {
                const active = id === step;
                const done = steps.indexOf(step) > index;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      if (id !== 'service' && !serviceId && services[0]) {
                        setServiceId(String(services[0].id));
                      }
                      go(id);
                    }}
                    style={[
                      styles.stepChip,
                      active && styles.stepChipOn,
                      done && !active ? { opacity: 0.92 } : null,
                    ]}
                  >
                    <Text style={[styles.stepChipLabel, active && styles.stepChipLabelOn]}>
                      {String(index + 1).padStart(2, '0')}
                      {' '}
                      {BOOKING_STEP_LABELS[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {step === 'service' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>Usluga</Text>
                {services.map((item: any) => {
                  const id = String(item.id);
                  const on = serviceIdSafe === id;
                  const price = formatServicePrice(item.price);
                  return (
                    <Pressable
                      key={id}
                      onPress={() => {
                        setServiceId(id);
                        go('info');
                      }}
                      style={[styles.serviceCard, on && styles.serviceCardOn]}
                    >
                      <Text style={styles.serviceName}>{item.name}</Text>
                      <Text style={styles.serviceMeta}>
                        {item.durationMinutes || '—'}
                        {' '}
                        min
                        {item.capacity > 1 ? ` · do ${item.capacity} mjesta` : ''}
                        {price ? ` · ${price}` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {step === 'info' && service ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>{service.name}</Text>
                <Text style={styles.hint}>
                  {service.durationMinutes || '—'}
                  {' '}
                  min
                  {service.capacity ? ` · kapacitet ${service.capacity}` : ''}
                  {formatServicePrice(service.price)
                    ? ` · ${formatServicePrice(service.price)}`
                    : ''}
                </Text>
                <Text style={styles.hint}>
                  Otkaz najkasnije
                  {' '}
                  {cancelWindowLabel}
                </Text>
                {isMember && needsMembership ? (
                  <Text style={styles.plan}>{sessionsLabel(membership)}</Text>
                ) : null}
                {needsMembership && !isMember ? (
                  <View style={styles.gate}>
                    <Text style={styles.gateTitle}>Članarina je potrebna</Text>
                    <Text style={styles.gateLead}>
                      Obratite se studiju da vam aktivira članarinu.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.navRow}>
                    {services.length > 1 ? (
                      <Pressable onPress={goBack} style={styles.ghostBtn}>
                        <Text style={styles.ghostLabel}>Natrag</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={goForward} style={styles.cta}>
                      <Text style={styles.ctaLabel}>Nastavi</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}

            {step === 'staff' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>Djelatnik</Text>
                <View style={styles.trainerRow}>
                  {trainers.map((trainer: any) => {
                    const id = String(trainer.id);
                    const on = staffId === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setStaffId(id)}
                        style={[styles.trainerChip, on && styles.trainerChipOn]}
                      >
                        <Text style={styles.trainerName}>{trainer.name}</Text>
                        <Text style={styles.trainerTitle}>
                          {trainer.title || 'Djelatnik'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.navRow}>
                  <Pressable onPress={goBack} style={styles.ghostBtn}>
                    <Text style={styles.ghostLabel}>Natrag</Text>
                  </Pressable>
                  <Pressable onPress={goForward} style={styles.cta}>
                    <Text style={styles.ctaLabel}>Nastavi</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {step === 'date' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>Datum</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.days}>
                  {days.map((item) => {
                    const key = toDateKey(item);
                    const works = dayOpen(workingHours, item);
                    const selected = key === date;
                    const chip = formatDayChip(item);
                    const hint = dayHints[key];
                    const meta = !works
                      ? 'Zatvoreno'
                      : hint === 'empty'
                        ? 'Bez termina'
                        : hint === 'available'
                          ? 'Dostupno'
                          : 'Otvoreno';
                    return (
                      <Pressable
                        key={key}
                        disabled={!works}
                        onPress={() => setDate(key)}
                        style={[
                          styles.dayChip,
                          selected && styles.dayChipOn,
                          !works && styles.dayChipClosed,
                        ]}
                      >
                        <Text style={styles.dayName}>{chip.weekday}</Text>
                        <Text style={styles.dayNum}>{chip.day}</Text>
                        <Text style={styles.dayMeta}>{meta}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.navRow}>
                  <Pressable onPress={goBack} style={styles.ghostBtn}>
                    <Text style={styles.ghostLabel}>Natrag</Text>
                  </Pressable>
                  <Pressable
                    onPress={goForward}
                    disabled={!open}
                    style={[styles.cta, !open && styles.ctaDisabled]}
                  >
                    <Text style={styles.ctaLabel}>Nastavi</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {step === 'slot' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>{formatDay(selectedDate)}</Text>
                <Text style={styles.hint}>Termini se otvaraju zastorom s vrha.</Text>
                <Pressable
                  onPress={() => setSlotCurtainOpen(true)}
                  style={styles.slotTrigger}
                  accessibilityRole="button"
                  accessibilityLabel="Otvori odabir termina"
                >
                  <View style={styles.slotTriggerCopy}>
                    <Text style={styles.slotTriggerLabel}>
                      {selectedSlot ? selectedSlot.startTime : 'Odaberite termin'}
                    </Text>
                    <Text style={styles.slotTriggerMeta}>
                      {selectedSlot
                        ? slotNote(selectedSlot)
                        : loadingSlots
                          ? 'Učitavanje…'
                          : bookableSlots.length > 0
                            ? `${bookableSlots.length} slobodnih`
                            : 'Nema slobodnih'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={BRAND.tealBright} />
                </Pressable>
                <View style={styles.navRow}>
                  <Pressable onPress={goBack} style={styles.ghostBtn}>
                    <Text style={styles.ghostLabel}>Natrag</Text>
                  </Pressable>
                  <Pressable
                    onPress={goForward}
                    disabled={!selectedSlot}
                    style={[styles.cta, !selectedSlot && styles.ctaDisabled]}
                  >
                    <Text style={styles.ctaLabel}>Nastavi</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {step === 'review' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>
                  Korak
                  {' '}
                  {String(stepIndex + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.sectionTitle}>Pregled</Text>
                <Text style={styles.hint}>
                  {service?.name}
                  {' · '}
                  {formatDay(selectedDate)}
                  {' · '}
                  {selectedSlot?.startTime}
                  {selectedStaff ? ` · ${selectedStaff.name}` : ''}
                </Text>
                <Text style={styles.hint}>
                  Otkaz najkasnije
                  {' '}
                  {cancelWindowLabel}
                </Text>
                <View style={styles.navRow}>
                  <Pressable onPress={goBack} style={styles.ghostBtn}>
                    <Text style={styles.ghostLabel}>Natrag</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void onBook();
                    }}
                    disabled={booking || !selectedSlot}
                    style={[styles.cta, (booking || !selectedSlot) && styles.ctaDisabled]}
                  >
                    {booking ? (
                      <ActivityIndicator color="#042F2E" />
                    ) : (
                      <Text style={styles.ctaLabel}>Potvrdi</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}

            {step === 'done' ? (
              <View style={styles.section}>
                <Text style={styles.kicker}>Gotovo</Text>
                <Text style={styles.sectionTitle}>Rezervacija potvrđena</Text>
                <Text style={styles.hint}>
                  {service?.name}
                  {' · '}
                  {formatBookingDay(date)}
                </Text>
                <Pressable
                  onPress={() => {
                    setSlotTime('');
                    go(services.length > 1 ? 'service' : 'info');
                  }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaLabel}>Nova rezervacija</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.kicker}>Pregled</Text>
          <Text style={styles.sectionTitle}>Moje rezervacije</Text>
          <View style={styles.filterRow}>
            {([
              ['upcoming', 'Nadolazeće'],
              ['past', 'Prošle'],
              ['cancelled', 'Otkazane'],
            ] as const).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => setBookingFilter(id)}
                style={[
                  styles.filterChip,
                  bookingFilter === id && styles.filterChipOn,
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    bookingFilter === id && styles.filterLabelOn,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {loadingBookings ? <Text style={styles.hint}>Učitavamo…</Text> : null}
          {!loadingBookings && myBookings.length === 0 ? (
            <Text style={styles.hint}>Nema rezervacija u ovom filteru.</Text>
          ) : null}
          {myBookings.map((item: any) => {
            const allowed = canCancel(item);
            return (
              <View key={item.id} style={styles.bookingRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.bookingTitle}>
                    {formatBookingDay(item.date)}
                    {' · '}
                    {item.startTime}
                    –
                    {item.endTime}
                  </Text>
                  <Text style={styles.bookingMeta}>
                    {item.serviceName || 'Termin'}
                    {item.staff?.name ? ` · ${item.staff.name}` : ''}
                    {' · '}
                    {bookingStatusDisplay(item, services)}
                  </Text>
                </View>
                {item.status === 'CONFIRMED' ? (
                  allowed ? (
                    <Pressable
                      onPress={() => {
                        void onCancel(item.id);
                      }}
                      disabled={busyId === item.id}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelLabel}>
                        {busyId === item.id ? '…' : 'Otkaži'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.locked}>Isteklo</Text>
                  )
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <StudioTopCurtain
        open={step === 'slot' && slotCurtainOpen}
        onClose={() => setSlotCurtainOpen(false)}
        kicker={`Korak ${String(stepIndex + 1).padStart(2, '0')}`}
        title={formatDay(selectedDate)}
        subtitle={
          loadingSlots
            ? 'Učitavamo termine…'
            : bookableSlots.length > 0
              ? 'Odaberite slobodan termin.'
              : 'Nema slobodnih termina.'
        }
        footer={(
          <View style={styles.navRow}>
            <Pressable
              onPress={() => {
                setSlotCurtainOpen(false);
                goBack();
              }}
              style={styles.ghostBtn}
            >
              <Text style={styles.ghostLabel}>Natrag</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!selectedSlot) {
                  setError('Odaberite slobodan termin.');
                  return;
                }
                setSlotCurtainOpen(false);
                go(nextStep(steps, step));
              }}
              disabled={!selectedSlot}
              style={[styles.cta, !selectedSlot && styles.ctaDisabled]}
            >
              <Text style={styles.ctaLabel}>Nastavi</Text>
            </Pressable>
          </View>
        )}
      >
        <View style={styles.slots}>
          {slots.map((slot) => {
            const free = slot.status === 'AVAILABLE';
            const on = slotTime === slot.startTime;
            return (
              <Pressable
                key={slot.startTime}
                disabled={!free}
                onPress={() => setSlotTime(slot.startTime)}
                style={[
                  styles.slotChip,
                  on && styles.slotChipOn,
                  !free && styles.slotChipDisabled,
                ]}
              >
                <Text style={styles.slotTime}>{slot.startTime}</Text>
                <Text style={styles.slotMeta}>{slotNote(slot)}</Text>
              </Pressable>
            );
          })}
        </View>
      </StudioTopCurtain>
    </View>
  );
}

const styles = StyleSheet.create({
  studio: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#14B8A6',
    marginBottom: 4,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.7)',
    marginBottom: 8,
  },
  plan: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(94, 234, 212, 0.9)',
    marginBottom: 12,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  ok: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#14B8A6',
    marginBottom: 10,
  },
  gate: {
    marginTop: 8,
    marginBottom: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    gap: 8,
  },
  kicker: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.45)',
  },
  gateTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    color: '#F7FCFA',
  },
  gateLead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  stepsScroll: { marginBottom: 14 },
  stepsRow: { gap: 8, paddingRight: 8 },
  stepChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    borderRadius: 8,
    backgroundColor: 'rgba(15, 28, 26, 0.4)',
  },
  stepChipOn: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  stepChipDisabled: { opacity: 0.45 },
  stepChipLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.65)',
  },
  stepChipLabelOn: { color: '#5EEAD4' },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    color: '#F7FCFA',
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.62)',
    marginBottom: 12,
  },
  serviceCard: {
    marginBottom: 8,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
    borderRadius: 8,
  },
  serviceCardOn: {
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
  },
  serviceName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  serviceMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.58)',
    marginTop: 4,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ghostBtn: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#E8F2EF',
  },
  slotTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
  },
  slotTriggerCopy: {
    flex: 1,
    minWidth: 0,
  },
  slotTriggerLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: BRAND.onDark,
  },
  slotTriggerMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.95)',
    marginTop: 2,
  },
  days: { marginBottom: 8 },
  dayChip: {
    width: 78,
    marginRight: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    alignItems: 'center',
  },
  dayChipOn: {
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  dayChipClosed: { opacity: 0.4 },
  dayName: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: 'rgba(232, 242, 239, 0.7)',
  },
  dayNum: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22,
    color: '#F7FCFA',
    marginVertical: 2,
  },
  dayMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  trainerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  trainerChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  trainerChipOn: {
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  trainerName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#F7FCFA',
  },
  trainerTitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  slotChip: {
    width: '22.5%',
    minWidth: 68,
    maxWidth: 84,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  slotChipOn: {
    borderColor: BRAND.blue,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  slotChipDisabled: { opacity: 0.38 },
  slotTime: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: BRAND.onDark,
  },
  slotMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.95)',
    marginTop: 1,
  },
  cta: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: DARK_SURFACE.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.18)',
  },
  filterChipOn: {
    borderColor: 'rgba(20, 184, 166, 0.55)',
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
  },
  filterLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.65)',
  },
  filterLabelOn: { color: '#5EEAD4' },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.14)',
  },
  bookingTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#F7FCFA',
  },
  bookingMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 242, 239, 0.62)',
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94, 234, 212, 0.45)',
  },
  cancelLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#14B8A6',
  },
  locked: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
  },
  pressed: { opacity: 0.82 },
});
