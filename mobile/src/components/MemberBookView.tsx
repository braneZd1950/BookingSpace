import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ApiError } from '../api/client';
import {
  cancelBooking,
  createBooking,
  getAvailability,
  listMyBookings,
  type Booking,
  type Slot,
} from '../api/bookings';
import { listMyMemberships, type Membership } from '../api/memberships';
import {
  getPublicTenant,
  type PublicService,
  type PublicTrainer,
  type WorkingHour,
} from '../api/tenants';
import ConsentGate from './ConsentGate';
import { useAuth } from '../features/auth/AuthContext';
import { studioFromTenant } from '../features/studio/studioMap';
import {
  formatBookingDay,
  formatCancellationWindow,
  formatDay,
  parseDateKey,
  shortDay,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../lib/studioTime';
import { tokens } from '../theme/tokens';
import { makeMemberBookStyles } from '../ui/memberBookStyles';

function dayOpen(workingHours: WorkingHour[] | undefined, date: Date) {
  const day = date.getDay();
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row) return false;
  return !row.closed && Boolean(row.open) && Boolean(row.close);
}

function sessionsLabel(membership: Membership | null) {
  if (!membership) return '';
  if (membership.sessionsIncluded == null) return 'Neograničeno';
  const left = membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
  return `${left} preostalo`;
}

function slotNote(slot: Slot) {
  if (slot.status === 'FULL') return 'Puno';
  if (slot.status === 'PAST') return 'Prošlo';
  if (slot.available === slot.capacity) return 'Slobodno';
  if (slot.available === 1) return '1 mjesto';
  return `${slot.available} mjesta`;
}

function policyMark(minutes: number) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  if (Number.isInteger(hours)) return `${hours} h`;
  return `${Math.floor(hours)} h ${value % 60} min`;
}

function canCancelBooking(booking: Booking, windowMinutes: number, timeZone: string) {
  if (!booking.date) return false;
  const now = zonedClock(timeZone || 'Europe/Zagreb');
  return withinCancellationWindow(now, booking.date, booking.startTime, windowMinutes ?? 0);
}

function firstOpenKey(days: Date[], workingHours?: WorkingHour[]) {
  const open = days.find((item) => dayOpen(workingHours, item));
  return toDateKey(open || days[0]);
}

/** Member Termini — parity with web `/s/:slug/termini` (MemberBookPage). */
export function MemberBookView() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const loggedIn = Boolean(user);

  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [timeZone, setTimeZone] = useState('Europe/Zagreb');
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [service, setService] = useState<PublicService | null>(null);
  const [trainers, setTrainers] = useState<PublicTrainer[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [brand, setBrand] = useState<string>(tokens.brand);
  const [soft, setSoft] = useState<string>(tokens.brandSoft);
  const [ink, setInk] = useState<string>(tokens.fg);

  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(() => toDateKey(days[0]));
  const [staffId, setStaffId] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const styles = useMemo(() => makeMemberBookStyles(brand, soft, ink), [brand, soft, ink]);
  const isMember = Boolean(membership);
  const cancelWindow = Number(service?.cancellationWindowMinutes ?? 60) || 60;
  const cancelWindowLabel = formatCancellationWindow(cancelWindow);
  const selectedDate = useMemo(() => parseDateKey(date), [date]);
  const open = dayOpen(workingHours, selectedDate);
  const bookableSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const selectedSlot = bookableSlots.find((item) => item.startTime === slotTime) || null;
  const dayBookings = myBookings.filter((item) => item.date === date);
  const canFetchSlots = loggedIn && isMember && Boolean(service?.id);

  const bootstrap = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const [tenant, memberships] = await Promise.all([
        getPublicTenant(String(slug)),
        listMyMemberships(50),
      ]);
      const studio = studioFromTenant(tenant);
      setTenantId(String(tenant.id));
      setTenantName(tenant.name);
      setTenantPhone(tenant.phone || '');
      setTenantEmail(tenant.email || '');
      setTimeZone(tenant.timezone || 'Europe/Zagreb');
      setWorkingHours(tenant.bookingSettings?.workingHours || []);
      setBrand(studio.theme.primaryColor || tokens.brand);
      setSoft(studio.theme.secondaryColor || tokens.brandSoft);
      setInk(studio.theme.ink || tokens.fg);
      const services = (tenant.services || []).filter((item) => item.active !== false);
      setService(services[0] || null);
      setTrainers(tenant.trainers || []);
      const mine = memberships.find(
        (item) => item.status === 'ACTIVE'
          && (item.tenant?.slug === slug || String(item.tenantId) === String(tenant.id)),
      ) || null;
      setMembership(mine);
      setDate(firstOpenKey(days, tenant.bookingSettings?.workingHours));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Termini nisu učitani.');
    } finally {
      setLoading(false);
    }
  }, [slug, days]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (trainers.length === 0) {
      setStaffId('');
      return;
    }
    setStaffId((current) => {
      if (current && trainers.some((item) => String(item.id) === current)) return current;
      return String(trainers[0].id);
    });
  }, [trainers]);

  const loadSlots = useCallback(async () => {
    if (!canFetchSlots || !tenantId || !service) return;
    setLoadingSlots(true);
    try {
      const rows = await getAvailability(tenantId, String(service.id), date);
      setSlots(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slotovi nisu učitani.');
    } finally {
      setLoadingSlots(false);
    }
  }, [canFetchSlots, tenantId, service, date]);

  const loadBookings = useCallback(async () => {
    if (!loggedIn || !tenantId) return;
    setLoadingBookings(true);
    try {
      const rows = await listMyBookings(50);
      setMyBookings(
        rows
          .filter((item) => String(item.tenantId) === tenantId && item.status === 'CONFIRMED')
          .sort((a, b) => {
            const byDate = String(a.date || '').localeCompare(String(b.date || ''));
            return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime);
          }),
      );
    } catch {
      /* keep prior list */
    } finally {
      setLoadingBookings(false);
    }
  }, [loggedIn, tenantId]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function onBook() {
    setError('');
    setOk('');
    if (trainers.length > 0 && !staffId) {
      setError('Odaberite trenera.');
      return;
    }
    if (!slotTime || !service) {
      setError('Odaberite sat.');
      return;
    }
    setBookingBusy(true);
    try {
      await createBooking({
        serviceId: String(service.id),
        date,
        startTime: slotTime,
        ...(staffId ? { staffId } : {}),
      });
      setOk('Termin je rezerviran.');
      setSlotTime('');
      await Promise.all([loadSlots(), loadBookings(), bootstrap()]);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'SLOT_UNAVAILABLE') setError('Taj sat više nije slobodan.');
      else if (code === 'MEMBERSHIP_REQUIRED' || code === 'NO_SESSIONS') {
        setError('Nemate aktivnu članarinu ili preostale termine.');
      } else if (code === 'BOOKING_CONFLICT') {
        setError('Već imate rezervaciju u tom terminu.');
      } else if (code === 'STAFF_REQUIRED' || code === 'STAFF_UNAVAILABLE') {
        setError('Odaberite dostupnog trenera.');
      } else if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola. Prihvatite je u Privatnost.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Rezervacija nije uspjela.');
      }
    } finally {
      setBookingBusy(false);
    }
  }

  async function onCancel(bookingId: string) {
    setError('');
    setOk('');
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId);
      setOk('Rezervacija je otkazana. Termin vam se ne broji kao iskorišten.');
      await Promise.all([loadSlots(), loadBookings(), bootstrap()]);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'CANCELLATION_WINDOW') {
        setError(`Prekasno je za otkaz. Rok je ${cancelWindowLabel}.`);
      } else if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola. Prihvatite je u Privatnost.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Otkaz nije uspio.');
      }
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: soft }}>
        <ActivityIndicator color={brand} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: soft }}
      contentContainerStyle={styles.root}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stage}>
        <View style={styles.hero}>
          <Text style={styles.studio}>{tenantName}</Text>
          <Text style={styles.title}>Termini</Text>
          <View style={styles.accent} />
          <Text style={styles.lead}>
            {service
              ? `${service.name} · ${service.durationMinutes} min`
              : 'Studio još nema objavljenu uslugu za rezervaciju.'}
          </Text>
          {isMember ? (
            <Text style={styles.plan}>
              {membership?.planName || 'Članarina'}
              {' · '}
              {sessionsLabel(membership)}
            </Text>
          ) : null}
        </View>

        {error ? <Text style={styles.flashErr}>{error}</Text> : null}
        {ok ? <Text style={styles.flashOk}>{ok}</Text> : null}

        <View style={styles.trust}>
          <View style={styles.trustRow}>
            <Text style={styles.trustNum}>01</Text>
            <Text style={styles.trustText}>
              Rezervacija izravno kod {tenantName} — ne u marketplace katalogu
            </Text>
          </View>
          <View style={styles.trustRow}>
            <Text style={styles.trustNum}>02</Text>
            <Text style={styles.trustText}>Potvrda na e-poštu nakon rezervacije ili otkaza</Text>
          </View>
          <View style={styles.trustRow}>
            <Text style={styles.trustNum}>03</Text>
            <Text style={styles.trustText}>
              Članarina i uplata dogovaraju se sa studijom; ovdje vodite termine
            </Text>
          </View>
        </View>

        {!loggedIn ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Pristup</Text>
            <Text style={styles.gateTitle}>Prijava je potrebna</Text>
            <Text style={styles.gateBody}>
              Prijavite se da vidite slobodne sate i rezervirate termin.
            </Text>
          </View>
        ) : null}

        {loggedIn && !isMember ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Članstvo</Text>
            <Text style={styles.gateTitle}>Članarina je potrebna</Text>
            <Text style={styles.gateBody}>
              Pregled termina je dostupan članovima s aktivnom članarinom. Obratite se studiju
              da vam je aktiviraju.
            </Text>
            {(tenantPhone || tenantEmail) ? (
              <Text style={styles.plan}>
                {[tenantPhone, tenantEmail].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        ) : null}

        {loggedIn && isMember && !service ? (
          <View style={styles.gate}>
            <Text style={styles.kicker}>Usluga</Text>
            <Text style={styles.gateTitle}>Nema usluge</Text>
            <Text style={styles.gateBody}>
              Studio još nije postavio uslugu za termine. Probajte kasnije.
            </Text>
          </View>
        ) : null}

        {canFetchSlots ? (
          <ConsentGate brand={brand} title="Privola za rezervacije">
            <View style={styles.policy}>
              <View style={styles.policyHead}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.kicker}>Pravila</Text>
                  <Text style={styles.sectionTitle}>Uvjeti otkazivanja</Text>
                </View>
                <Text style={styles.policyMark}>{policyMark(cancelWindow)}</Text>
              </View>
              <Text style={styles.policyText}>
                Termin možete otkazati najkasnije
                {' '}
                {cancelWindowLabel}
                . U tom roku rezervacija se briše i termin se ne broji kao iskorišten.
              </Text>
              <Text style={styles.policyText}>
                Ako otkažete kasnije ili ne dođete, studio zadržava termin kao iskorišten prema
                svojim pravilima.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.kicker}>Korak 01</Text>
                <Text style={styles.sectionTitle}>Dan</Text>
                <Text style={styles.sectionHint}>Sljedeća dva tjedna</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
                {days.map((item) => {
                  const key = toDateKey(item);
                  const works = dayOpen(workingHours, item);
                  const selected = key === date;
                  return (
                    <Pressable
                      key={key}
                      disabled={!works}
                      onPress={() => setDate(key)}
                      style={[
                        styles.day,
                        selected && styles.dayOn,
                        !works && styles.dayClosed,
                      ]}
                    >
                      <Text style={[styles.dayName, selected && styles.dayNameOn]}>
                        {shortDay(item)}
                      </Text>
                      <Text style={[styles.dayNum, selected && styles.dayNumOn]}>
                        {item.getDate()}
                        .
                      </Text>
                      <Text style={[styles.dayMeta, selected && styles.dayMetaOn]}>
                        {works ? 'Otvoreno' : 'Zatvoreno'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.kicker}>Korak 02</Text>
                <Text style={styles.sectionTitle}>{formatDay(selectedDate)}</Text>
                <Text style={styles.sectionHint}>
                  {!open
                    ? 'Studio je zatvoren ovog dana.'
                    : loadingSlots
                      ? 'Učitavamo slobodne sate…'
                      : bookableSlots.length > 0
                        ? 'Odaberite slobodan sat.'
                        : 'Nema slobodnih sati za ovaj dan.'}
                </Text>
              </View>

              {open && trainers.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.trainersLabel}>Kod koga rezervirate</Text>
                  <View style={styles.trainerList}>
                    {trainers.map((trainer) => {
                      const id = String(trainer.id);
                      const on = staffId === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setStaffId(id)}
                          style={[styles.trainer, on && styles.trainerOn]}
                        >
                          <Text style={styles.trainerName}>{trainer.name}</Text>
                          <Text style={styles.trainerTitle}>{trainer.title || 'Trener'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {open ? (
                <>
                  {loadingSlots ? (
                    <ActivityIndicator color={brand} />
                  ) : (
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
                              styles.slot,
                              on && styles.slotOn,
                              !free && styles.slotDisabled,
                            ]}
                          >
                            <Text style={[styles.slotTime, on && styles.slotTimeOn]}>
                              {slot.startTime}
                            </Text>
                            <Text style={[styles.slotNote, on && styles.slotNoteOn]}>
                              {slotNote(slot)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <View style={[styles.confirm, selectedSlot ? styles.confirmReady : null]}>
                    <Text style={styles.confirmText}>
                      {selectedSlot
                        ? `${formatDay(selectedDate)} · ${selectedSlot.startTime}${
                          staffId
                            ? ` · ${trainers.find((item) => String(item.id) === staffId)?.name || ''}`
                            : ''
                        }`
                        : 'Odaberite sat za potvrdu rezervacije.'}
                    </Text>
                    <Pressable
                      disabled={bookingBusy || !selectedSlot}
                      onPress={() => void onBook()}
                      style={[styles.cta, (bookingBusy || !selectedSlot) && styles.ctaDisabled]}
                    >
                      <Text style={styles.ctaLabel}>
                        {bookingBusy ? 'Rezerviramo…' : 'Rezerviraj termin'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.kicker}>Pregled</Text>
                <Text style={styles.sectionTitle}>Vaše rezervacije</Text>
                <Text style={styles.sectionHint}>
                  {dayBookings.length > 0
                    ? `${dayBookings.length} za odabrani dan · otkaz unutar roka vraća termin`
                    : `Otkaz najkasnije ${cancelWindowLabel} · inače se termin broji`}
                </Text>
              </View>

              {loadingBookings ? (
                <Text style={styles.sectionHint}>Učitavamo…</Text>
              ) : null}
              {!loadingBookings && myBookings.length === 0 ? (
                <Text style={styles.sectionHint}>Još nemate rezervacija u ovom studiju.</Text>
              ) : null}

              <View style={styles.bookingList}>
                {myBookings.map((item) => {
                  const allowed = canCancelBooking(item, cancelWindow, timeZone);
                  return (
                    <View
                      key={item.id}
                      style={[styles.bookingRow, item.date === date && styles.bookingDay]}
                    >
                      <View style={styles.bookingCopy}>
                        <Text style={styles.bookingTitle}>
                          {formatBookingDay(String(item.date))}
                          {' · '}
                          {item.startTime}
                          –
                          {item.endTime}
                        </Text>
                        <Text style={styles.bookingMeta}>
                          {item.serviceName || 'Termin'}
                          {item.staff?.name ? ` · ${item.staff.name}` : ''}
                          {' · '}
                          {allowed
                            ? 'Možete otkazati bez gubitka termina'
                            : 'Rok za otkaz je istekao'}
                        </Text>
                      </View>
                      {allowed ? (
                        <Pressable
                          style={styles.cancelBtn}
                          disabled={busyId === item.id}
                          onPress={() => void onCancel(item.id)}
                        >
                          <Text style={styles.cancelLabel}>
                            {busyId === item.id ? 'Otkazujemo…' : 'Otkaži'}
                          </Text>
                        </Pressable>
                      ) : (
                        <Text style={styles.locked}>Zaključano</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ConsentGate>
        ) : null}
      </View>
    </ScrollView>
  );
}
