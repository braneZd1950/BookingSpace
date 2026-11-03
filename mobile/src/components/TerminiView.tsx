import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '../api/client';
import {
  cancelBooking,
  createBooking,
  getAvailability,
  listTenantBookings,
  type Booking,
  type Slot,
} from '../api/bookings';
import { listMemberships, type Membership } from '../api/memberships';
import { createService, listServices, type Service } from '../api/services';
import { listStaff, type StaffMember } from '../api/staff';
import { updateTenant } from '../api/tenants';
import ConsentGate from './ConsentGate';
import { useStudio } from '../features/studio/StudioContext';
import {
  dayHours,
  formatDay,
  hoursPayload,
  parseDateKey,
  studioHours,
  toDateKey,
  upcomingDays,
} from '../lib/studioTime';
import { tokens } from '../theme/tokens';
import { makeTerminiStyles } from '../ui/terminiStyles';

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

function memberLabel(item: Membership) {
  return item.user?.name || item.user?.email || 'Član';
}

function sessionsLeft(item: Membership) {
  if (item.sessionsIncluded == null) return 'Neograničeno';
  const left = Math.max(0, (item.sessionsIncluded || 0) - (item.sessionsUsed || 0));
  return `${left} preostalo`;
}

export function TerminiView() {
  const router = useRouter();
  const { studio, ready: studioReady } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const styles = useMemo(() => makeTerminiStyles(brand, soft, ink), [brand, soft, ink]);

  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const hours = useMemo(() => studioHours(studio?.hours), [studio?.hours]);
  const days = useMemo(() => upcomingDays(14), []);

  const [date, setDate] = useState(() => toDateKey(days[0]));
  const [memberId, setMemberId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState('');
  const [hoursReady, setHoursReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingBusy, setBookingBusy] = useState(false);

  const [service, setService] = useState<Service | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [trainers, setTrainers] = useState<StaffMember[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const selectedDate = useMemo(() => parseDateKey(date), [date]);
  const dayOpen = dayHours(selectedDate, hours).works;
  const openSlots = slots.filter((item) => item.status === 'AVAILABLE');
  const dayBookings = bookings
    .filter((item) => item.status === 'CONFIRMED')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nameByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of memberships) map.set(String(item.userId), memberLabel(item));
    return map;
  }, [memberships]);

  const activeMembers = memberships.filter((item) => item.status === 'ACTIVE');

  const bootstrap = useCallback(async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      await updateTenant(tenantId, {
        bookingSettings: { workingHours: hoursPayload(hours) },
      });
    } catch {
      setError('Radno vrijeme nije sinkronizirano. Provjerite Postavke.');
    }
    setHoursReady(true);

    try {
      let services = (await listServices(tenantId)).filter((item) => item.active !== false);
      if (services.length === 0) {
        await createService(tenantId, defaultService);
        services = (await listServices(tenantId)).filter((item) => item.active !== false);
      }
      setService(services[0] || null);

      const [mems, staff] = await Promise.all([
        listMemberships(tenantId),
        listStaff(tenantId),
      ]);
      setMemberships(mems);
      const activeStaff = staff.filter((item) => item.status === 'ACTIVE');
      setTrainers(activeStaff);
      if (activeStaff.length) setStaffId(String(activeStaff[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Podaci termina nisu učitani.');
    } finally {
      setLoading(false);
    }
  }, [ready, tenantId, hours]);

  useEffect(() => {
    if (!studioReady) return;
    void bootstrap();
  }, [studioReady, bootstrap]);

  const loadDay = useCallback(async () => {
    if (!ready || !hoursReady || !service) return;
    setLoadingSlots(true);
    setLoadingBookings(true);
    try {
      const [slotRows, bookingRows] = await Promise.all([
        getAvailability(tenantId, String(service.id), date),
        listTenantBookings(tenantId, { date }),
      ]);
      setSlots(slotRows);
      setBookings(bookingRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dan nije učitan.');
    } finally {
      setLoadingSlots(false);
      setLoadingBookings(false);
    }
  }, [ready, hoursReady, service, tenantId, date]);

  useEffect(() => {
    setSlotTime('');
    setOk('');
    void loadDay();
  }, [loadDay]);

  async function onBook() {
    setError('');
    setOk('');
    if (!memberId) {
      setError('Odaberite člana.');
      return;
    }
    if (trainers.length > 0 && !staffId) {
      setError('Odaberite trenera.');
      return;
    }
    if (!slotTime) {
      setError('Odaberite sat.');
      return;
    }
    if (!service) {
      setError('Usluga još nije spremna.');
      return;
    }

    setBookingBusy(true);
    try {
      await createBooking({
        serviceId: String(service.id),
        date,
        startTime: slotTime,
        userId: memberId,
        ...(staffId ? { staffId } : {}),
      });
      setOk('Rezervacija je spremljena u bazu.');
      setSlotTime('');
      await loadDay();
      const mems = await listMemberships(tenantId);
      setMemberships(mems);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'SLOT_UNAVAILABLE') setError('Taj sat više nije slobodan.');
      else if (code === 'MEMBERSHIP_REQUIRED' || code === 'NO_SESSIONS') {
        setError('Član nema aktivnu članarinu ili preostale termine.');
      } else if (code === 'BOOKING_CONFLICT') {
        setError('Član već ima rezervaciju u tom terminu.');
      } else if (code === 'STAFF_REQUIRED' || code === 'STAFF_UNAVAILABLE') {
        setError('Odaberite dostupnog trenera.');
      } else if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola za rezervacije (Postavke → Privatnost na webu).');
      } else if (err instanceof TypeError) {
        setError('Poslužitelj nije dostupan.');
      } else {
        setError(err instanceof Error ? err.message : 'Rezervacija nije spremljena.');
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
      setOk('Rezervacija je otkazana.');
      await loadDay();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'CONSENT_REQUIRED') {
        setError('Potrebna je privola za otkaz.');
      } else {
        setError(err instanceof TypeError ? 'Poslužitelj nije dostupan.' : 'Otkaz nije uspio.');
      }
    } finally {
      setBusyId('');
    }
  }

  if (!studioReady || loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', minHeight: 320 }]}>
        <ActivityIndicator color={brand} size="large" />
      </View>
    );
  }

  if (!ready) {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Termini</Text>
          <Text style={styles.title}>Još nije spremno</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>
            Studio još nije u bazi. Dovršite registraciju pa dodajte rezervacije.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const selectedMember = activeMembers.find((item) => String(item.userId) === memberId);
  const canSubmit = Boolean(
    service
    && memberId
    && slotTime
    && !(trainers.length > 0 && !staffId)
    && !bookingBusy,
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>Kalendar</Text>
        <Text style={styles.title}>Termini</Text>
        <View style={styles.accent} />
        <Text style={styles.lede}>
          Dodajte rezervacije članovima — sve ide u bazu i vidi se u kalendaru.
        </Text>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(app)/clanovi')}>
          <Text style={styles.linkLabel}>Upravljajte članovima</Text>
        </Pressable>
      </View>

      <View style={styles.stats} accessibilityLabel="Pregled dana">
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Odabrani dan</Text>
          <Text style={styles.statValue}>{formatDay(selectedDate)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Slobodni sati</Text>
          <Text style={styles.statValue}>{dayOpen ? openSlots.length : 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Rezervacije</Text>
          <Text style={styles.statValue}>{dayBookings.length}</Text>
        </View>
        <View style={[styles.stat, { borderRightWidth: 0 }]}>
          <Text style={styles.statLabel}>Kapacitet / sat</Text>
          <Text style={styles.statValue}>{service?.capacity ?? '—'}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {ok ? <Text style={styles.ok}>{ok}</Text> : null}

      <View style={styles.days} accessibilityLabel="Odabir dana">
        <Text style={styles.railLabel}>Dan</Text>
        {days.map((item) => {
          const key = toDateKey(item);
          const open = dayHours(item, hours).works;
          const on = key === date;
          return (
            <Pressable
              key={key}
              onPress={() => setDate(key)}
              style={[styles.dayBtn, on && styles.dayBtnOn, !open && styles.dayBtnClosed]}
            >
              <Text style={[styles.dayTitle, on && styles.dayTitleOn]}>{formatDay(item)}</Text>
              <Text style={[styles.dayMeta, on && styles.dayMetaOn]}>
                {open ? 'Otvoreno' : 'Zatvoreno'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ConsentGate brand={brand} title="Privola za rezervacije">
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.index}>01</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Upis</Text>
            <Text style={styles.panelTitle}>Nova rezervacija</Text>
            <Text style={styles.panelSub}>
              {service
                ? `${service.name} · ${service.durationMinutes} min · max ${service.capacity}`
                : 'Pripremamo uslugu…'}
            </Text>
          </View>
        </View>

        {!dayOpen ? (
          <Text style={styles.empty}>
            Studio je zatvoren ovog dana. Odaberite drugi dan ili uredite sate u Postavkama.
          </Text>
        ) : activeMembers.length === 0 ? (
          <Text style={styles.empty}>
            Nema aktivnih članova. Dodajte člana pa se vratite ovdje.
          </Text>
        ) : (
          <>
            <View>
              <Text style={styles.fieldLabel}>Član</Text>
              <Pressable style={styles.select} onPress={() => setMemberMenuOpen(true)}>
                <Text style={styles.selectText}>
                  {selectedMember ? memberLabel(selectedMember) : 'Odaberite člana'}
                </Text>
                {selectedMember ? (
                  <Text style={styles.selectHint}>{sessionsLeft(selectedMember)}</Text>
                ) : null}
              </Pressable>
            </View>

            {trainers.length > 0 ? (
              <View>
                <Text style={styles.fieldLabel}>Trener</Text>
                <View style={{ gap: 6 }}>
                  {trainers.map((item) => {
                    const on = staffId === String(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setStaffId(String(item.id))}
                        style={[styles.select, on && { borderColor: brand, backgroundColor: soft }]}
                      >
                        <Text style={styles.selectText}>
                          {item.name}
                          {item.title ? ` · ${item.title}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.slots} accessibilityLabel="Slobodni termini">
              {loadingSlots ? <Text style={styles.hint}>Učitavamo sate…</Text> : null}
              {!loadingSlots && openSlots.length === 0 ? (
                <Text style={styles.hint}>Nema slobodnih sati za ovaj dan.</Text>
              ) : null}
              {openSlots.map((slot) => {
                const on = slotTime === slot.startTime;
                return (
                  <Pressable
                    key={slot.startTime}
                    onPress={() => setSlotTime(slot.startTime)}
                    style={[styles.slot, on && styles.slotOn]}
                  >
                    <Text style={[styles.slotTime, on && styles.slotTimeOn]}>{slot.startTime}</Text>
                    <Text style={[styles.slotCap, on && styles.slotCapOn]}>
                      {slot.available}/{slot.capacity}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.primary, !canSubmit && styles.primaryDisabled]}
              disabled={!canSubmit}
              onPress={onBook}
            >
              <Text style={styles.primaryLabel}>
                {bookingBusy ? 'Spremamo…' : 'Spremi rezervaciju'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.index}>02</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Dan</Text>
            <Text style={styles.panelTitle}>Rezervacije</Text>
            <Text style={styles.panelSub}>
              {formatDay(selectedDate)}
              {' · '}
              potvrđeni upisi
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaCount}>{dayBookings.length}</Text>
            <Text style={styles.metaLabel}>upisa</Text>
          </View>
        </View>

        {loadingBookings ? <Text style={styles.hint}>Učitavamo rezervacije…</Text> : null}
        {!loadingBookings && dayBookings.length === 0 ? (
          <Text style={styles.empty}>
            Još nema rezervacija za {formatDay(selectedDate)}.
          </Text>
        ) : null}

        {dayBookings.map((item, index) => (
          <View
            key={item.id}
            style={[styles.bookingRow, index === 0 && { borderTopWidth: 0, paddingTop: 0 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTime}>
                {item.startTime}–{item.endTime}
              </Text>
              <Text style={styles.bookingName}>
                {nameByUser.get(String(item.userId)) || 'Član'}
                {item.staff?.name ? ` · ${item.staff.name}` : ''}
              </Text>
            </View>
            <Pressable
              style={styles.cancel}
              disabled={busyId === item.id}
              onPress={() => onCancel(item.id)}
            >
              <Text style={styles.cancelLabel}>
                {busyId === item.id ? 'Otkazujemo…' : 'Otkaži'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      </ConsentGate>

      <Modal visible={memberMenuOpen} transparent animationType="slide" onRequestClose={() => setMemberMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMemberMenuOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Odaberite člana</Text>
            <ScrollView>
              {activeMembers.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.option}
                  onPress={() => {
                    setMemberId(String(item.userId));
                    setMemberMenuOpen(false);
                  }}
                >
                  <Text style={styles.selectText}>{memberLabel(item)}</Text>
                  <Text style={styles.selectHint}>
                    {item.user?.email || ''}
                    {item.user?.email ? ' · ' : ''}
                    {sessionsLeft(item)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
