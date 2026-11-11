import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/nativeDriver.js';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { listTenantBookings } from '../../api/bookings.js';
import {
  createMembership,
  createPlan,
  listMemberships,
  listPlans,
  suspendMembership,
} from '../../api/memberships.js';
import { createStaff, listStaff, suspendStaff } from '../../api/staff.js';
import AuthLegalStrip from '../auth/AuthLegalStrip';
import {
  isLocalDesignMode,
  localDesignMembers,
  localDesignStaff,
} from './localDesignFixtures.js';

type StudioMembersScreenProps = {
  tenantId?: string;
  studioName?: string;
  onBack: () => void;
};

type MemberRow = {
  id: string;
  userId?: string;
  membershipPlanId?: string;
  code?: string;
  status?: string;
  planName?: string;
  validFrom?: string;
  validUntil?: string;
  sessionsIncluded?: number | null;
  sessionsUsed?: number;
  user?: { name?: string; email?: string; phone?: string | null } | null;
};

type PlanRow = {
  id: string;
  sessionsIncluded?: number | null;
  name?: string;
};

type StaffRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  title?: string;
  role?: string;
  status?: string;
};

type SectionId = 'members' | 'team';
type FilterId = 'active' | 'archive' | 'all';

const SESSION_PRESETS = [6, 12, 18] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateFmt = new Intl.DateTimeFormat('hr-HR', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

function isEmail(value: string) {
  return EMAIL_RE.test(value);
}

function daysLeftInMonth(from = new Date()) {
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  return Math.max(1, end.getDate() - from.getDate() + 1);
}

function monthRange(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const pad = (value: number) => String(value).padStart(2, '0');
  const last = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

function monthLabelHr(from = new Date()) {
  const label = new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(from);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function daysLeft(until?: string) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function statusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Aktivno';
  if (status === 'SUSPENDED') return 'Uklonjeno';
  if (status === 'EXPIRED') return 'Isteklo';
  return status || '—';
}

function memberCountLabel(count: number) {
  const n = Number(count) || 0;
  if (n === 0) return 'Nema članova';
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return `${n} član`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} člana`;
  return `${n} članova`;
}

function formatShortDate(value?: string) {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return dateFmt.format(new Date(y, m - 1, d));
}

function sessionsLabel(item: MemberRow) {
  if (item.sessionsIncluded == null) return 'Neograničeno';
  const used = Number(item.sessionsUsed) || 0;
  const total = Number(item.sessionsIncluded) || 0;
  return `${used} / ${total}`;
}

function sessionsRatio(item: MemberRow) {
  if (item.sessionsIncluded == null) return 1;
  const total = Number(item.sessionsIncluded) || 0;
  if (total <= 0) return 0;
  return Math.min(1, (Number(item.sessionsUsed) || 0) / total);
}

function expiryLabel(until?: string) {
  const left = daysLeft(until);
  if (left == null) return null;
  if (left < 0) return 'Isteklo';
  if (left === 0) return 'Ističe danas';
  return `Još ${left} dana`;
}

function errorCode(failure: unknown) {
  if (failure && typeof failure === 'object' && 'code' in failure) {
    return String((failure as { code?: string }).code || '');
  }
  return '';
}

function errorStatus(failure: unknown) {
  if (failure && typeof failure === 'object' && 'status' in failure) {
    return Number((failure as { status?: number }).status) || 0;
  }
  return 0;
}

/**
 * Članovi + Tim — paritet s web MembersPage (lista, dodaj, obnovi, ukloni).
 */
export default function StudioMembersScreen({
  tenantId,
  studioName,
  onBack,
}: StudioMembersScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const enter = useRef(new Animated.Value(0)).current;
  const formReveal = useRef(new Animated.Value(0)).current;
  const formAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const [section, setSection] = useState<SectionId>('members');
  const [filter, setFilter] = useState<FilterId>('active');
  const [query, setQuery] = useState('');
  const [memberships, setMemberships] = useState<MemberRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [visitsThisMonth, setVisitsThisMonth] = useState(0);
  const [usingLocalFixtures, setUsingLocalFixtures] = useState(false);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sessions, setSessions] = useState('12');
  const [title, setTitle] = useState('Trener');

  const activeMembers = useMemo(
    () => memberships.filter((item) => item.status === 'ACTIVE'),
    [memberships],
  );
  const archiveMembers = useMemo(
    () => memberships.filter((item) => item.status !== 'ACTIVE'),
    [memberships],
  );
  const activeStaff = useMemo(
    () => staff.filter((item) => item.status === 'ACTIVE'),
    [staff],
  );
  const endingSoon = useMemo(
    () =>
      activeMembers.filter((item) => {
        const left = daysLeft(item.validUntil);
        return left != null && left >= 0 && left <= 7;
      }).length,
    [activeMembers],
  );
  const sessionsUsed = useMemo(
    () =>
      activeMembers.reduce(
        (sum, item) => sum + (Number(item.sessionsUsed) || 0),
        0,
      ),
    [activeMembers],
  );
  const monthName = useMemo(() => monthLabelHr(), []);

  const visibleMembers = useMemo(() => {
    const base =
      filter === 'active'
        ? activeMembers
        : filter === 'archive'
          ? archiveMembers
          : memberships;
    const needle = query.trim().toLowerCase();
    const filtered = !needle
      ? base
      : base.filter((item) =>
          [
            item.user?.name,
            item.user?.email,
            item.user?.phone,
            item.planName,
            item.code,
          ]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        );
    return [...filtered].sort((a, b) => {
      const aActive = a.status === 'ACTIVE' ? 0 : 1;
      const bActive = b.status === 'ACTIVE' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return String(a.user?.name || '').localeCompare(String(b.user?.name || ''), 'hr');
    });
  }, [filter, activeMembers, archiveMembers, memberships, query]);

  const load = useCallback(async () => {
    // Lokalni dizajn: u __DEV__ uvijek 2 člana + 2 tima (ne dira bazu).
    if (isLocalDesignMode()) {
      setUsingLocalFixtures(true);
      setMemberships(localDesignMembers() as MemberRow[]);
      setStaff(localDesignStaff() as StaffRow[]);
      setVisitsThisMonth(3);
      setPlans([]);
      setLoading(true);
      setError('');
      if (tenantId) {
        try {
          const plansData = await listPlans(tenantId);
          setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
        } catch {
          setPlans([]);
        }
      }
      setLoading(false);
      return;
    }

    setUsingLocalFixtures(false);
    if (!tenantId) {
      setMemberships([]);
      setPlans([]);
      setStaff([]);
      setVisitsThisMonth(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const range = monthRange();
    try {
      const [membersData, plansData, staffData, bookingData] = await Promise.all([
        listMemberships(tenantId),
        listPlans(tenantId),
        listStaff(tenantId),
        listTenantBookings(tenantId, {
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          limit: 500,
        }),
      ]);
      setMemberships(
        Array.isArray(membersData?.memberships) ? membersData.memberships : [],
      );
      setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
      setStaff(Array.isArray(staffData?.staff) ? staffData.staff : []);
      const bookings = Array.isArray(bookingData?.bookings) ? bookingData.bookings : [];
      setVisitsThisMonth(
        bookings.filter(
          (item: { status?: string }) =>
            item.status === 'CONFIRMED' || item.status === 'COMPLETED',
        ).length,
      );
    } catch {
      setMemberships([]);
      setPlans([]);
      setStaff([]);
      setVisitsThisMonth(0);
      setError('Podaci se nisu učitali. Pokušajte ponovno.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    
    enter.setValue(0);
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);

  function resetMemberForm() {
    setName('');
    setEmail('');
    setPhone('');
    setSessions('12');
    setFormError('');
  }

  function resetStaffForm() {
    setName('');
    setEmail('');
    setPhone('');
    setTitle('Trener');
    setFormError('');
  }

  function stopFormAnim() {
    formAnimRef.current?.stop();
    formAnimRef.current = null;
  }

  function openForm() {
    stopFormAnim();
    setFormError('');
    setNotice('');
    setActionError('');
    setFormOpen(true);
    setFormVisible(true);
    formReveal.setValue(0);
    requestAnimationFrame(() => {
      const anim = Animated.timing(formReveal, {
        toValue: 1,
        duration: 820,
        easing: Easing.bezier(0.33, 0.1, 0.25, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      formAnimRef.current = anim;
      anim.start();
    });
  }

  function closeForm(after?: () => void) {
    stopFormAnim();
    const anim = Animated.timing(formReveal, {
      toValue: 0,
      duration: 460,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    formAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      setFormVisible(false);
      setFormOpen(false);
      if (section === 'team') resetStaffForm();
      else resetMemberForm();
      after?.();
    });
  }

  function toggleForm() {
    if (formOpen || formVisible) {
      closeForm();
      return;
    }
    openForm();
  }

  function switchSection(next: SectionId) {
    if (next === section) return;
    if (formVisible) {
      closeForm(() => {
        setSection(next);
        setActionError('');
        setNotice('');
      });
      return;
    }
    setSection(next);
    setActionError('');
    setNotice('');
  }

  async function ensurePlanForSessions(count: number) {
    const existing = plans.find(
      (plan) => Number(plan.sessionsIncluded) === count && plan.id,
    );
    if (existing?.id) return String(existing.id);
    if (!tenantId) throw new Error('no-tenant');
    const created = await createPlan(tenantId, {
      name: `${count} treninga`,
      price: 0,
      validityDays: daysLeftInMonth(),
      sessionsIncluded: count,
    });
    const plan = created?.plan;
    if (!plan?.id) throw new Error('plan-failed');
    setPlans((current) => [...current, plan]);
    return String(plan.id);
  }

  async function onAddMember() {
    if (!tenantId) {
      setFormError('Studio još nije učitan.');
      return;
    }
    if (!name.trim()) {
      setFormError('Upišite ime člana.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmail(cleanEmail)) {
      setFormError('Upišite ispravnu e-poštu.');
      return;
    }
    const sessionCount = Number(sessions);
    if (!Number.isFinite(sessionCount) || sessionCount < 1 || sessionCount > 200) {
      setFormError('Upišite broj treninga od 1 do 200.');
      return;
    }

    setSaving(true);
    setFormError('');
    setNotice('');
    try {
      const planId = await ensurePlanForSessions(sessionCount);
      const result = await createMembership(tenantId, {
        customer: {
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || undefined,
        },
        membershipPlanId: planId,
        method: 'CASH',
      });
      setFilter('active');
      const nextNotice =
        result.accountCreated && result.inviteSent
          ? `Član je dodan. Lozinka za prijavu poslana je na ${cleanEmail}.`
          : result.accountCreated && !result.inviteSent
            ? `Član je dodan, ali e-pošta s lozinkom nije poslana na ${cleanEmail}. Provjerite SMTP ili javite se članu.`
            : 'Članarina je aktivirana za postojeći račun. Lozinka nije mijenjana.';
      closeForm(() => setNotice(nextNotice));
      await load();
    } catch (failure: unknown) {
      const code = errorCode(failure);
      const status = errorStatus(failure);
      if (code === 'EMAIL_TAKEN' || status === 409) {
        setFormError('Ta e-pošta je već registrirana.');
      } else {
        setFormError('Član nije dodan. Provjerite podatke i pokušajte ponovno.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function onAddStaff() {
    if (!tenantId) {
      setFormError('Studio još nije učitan.');
      return;
    }
    if (!name.trim()) {
      setFormError('Upišite ime trenera.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmail(cleanEmail)) {
      setFormError('Upišite ispravnu e-poštu.');
      return;
    }

    setSaving(true);
    setFormError('');
    setNotice('');
    try {
      const result = await createStaff(tenantId, {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim() || undefined,
        title: title.trim() || 'Trener',
      });
      const nextNotice =
        result.accountCreated && result.inviteSent
          ? `Trener je dodan. Lozinka je poslana na ${cleanEmail}.`
          : result.accountCreated && !result.inviteSent
            ? `Trener je dodan, ali e-pošta s lozinkom nije poslana na ${cleanEmail}.`
            : 'Trener je dodan u tim.';
      closeForm(() => setNotice(nextNotice));
      await load();
    } catch (failure: unknown) {
      const code = errorCode(failure);
      if (code === 'STAFF_EXISTS') {
        setFormError('Ta osoba je već u timu.');
      } else if (code === 'EMAIL_IS_MEMBER') {
        setFormError('Ta e-pošta pripada članu. Koristite drugi račun za trenera.');
      } else {
        setFormError('Trener nije dodan. Provjerite podatke i pokušajte ponovno.');
      }
    } finally {
      setSaving(false);
    }
  }

  function isFixtureId(id?: string) {
    return Boolean(id && String(id).startsWith('local-design-'));
  }

  async function onRenew(item: MemberRow) {
    if (isFixtureId(item.id)) {
      setNotice('Lokalni demo podatak — obnova je isključena.');
      return;
    }
    if (!tenantId) return;
    setActionError('');
    setBusyId(item.id);
    try {
      const planId = String(item.membershipPlanId || plans[0]?.id || '');
      if (!planId) {
        setActionError('Nema plana za obnovu.');
        return;
      }
      await createMembership(tenantId, {
        userId: String(item.userId),
        membershipPlanId: planId,
        method: 'CASH',
      });
      setNotice(`Članarina za ${item.user?.name || 'člana'} je obnovljena.`);
      await load();
    } catch {
      setActionError('Članarina nije obnovljena.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemoveMember(item: MemberRow) {
    if (isFixtureId(item.id)) {
      setNotice('Lokalni demo podatak — uklanjanje je isključeno.');
      return;
    }
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendMembership(item.id);
      setNotice(`${item.user?.name || 'Član'} je uklonjen/a.`);
      await load();
    } catch {
      setActionError('Član nije uklonjen.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemoveStaff(item: StaffRow) {
    if (isFixtureId(item.id)) {
      setNotice('Lokalni demo podatak — uklanjanje je isključeno.');
      return;
    }
    if (!tenantId) return;
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendStaff(tenantId, item.id);
      setNotice(`${item.name || 'Trener'} je uklonjen/a iz tima.`);
      await load();
    } catch (failure: unknown) {
      if (errorCode(failure) === 'CANNOT_REMOVE_SELF') {
        setActionError('Ne možete ukloniti sami sebe.');
      } else {
        setActionError('Trener nije uklonjen.');
      }
    } finally {
      setBusyId('');
    }
  }

  const lead =
    section === 'team'
      ? 'Treneri i vlasnik — članovi ih biraju pri rezervaciji termina.'
      : 'Članarine, preostali termini i brza obnova.';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C1815', '#070B0A', '#050706']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.stage,
          {
            paddingTop: compact ? 48 : 64,
            paddingBottom: compact ? 28 : 40,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View
          style={{
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Natrag na ${studioName || 'studio'}`}
              onPress={onBack}
              hitSlop={10}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={22} color="#5EEAD4" />
              <Text style={styles.backLabel} numberOfLines={1}>
                {studioName || 'Moj studio'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text
                style={[styles.title, compact && { fontSize: 34, lineHeight: 38 }]}
              >
                {section === 'team' ? 'Tim' : 'Članovi'}
              </Text>
              <Text style={styles.lead}>{lead}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                formOpen
                  ? 'Zatvori formu'
                  : section === 'team'
                    ? 'Dodaj trenera'
                    : 'Dodaj člana'
              }
              onPress={toggleForm}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Ionicons
                name={
                  formOpen
                    ? 'close'
                    : section === 'team'
                      ? 'person-add-outline'
                      : 'person-add-outline'
                }
                size={18}
                color="#061210"
              />
            </Pressable>
          </View>

          <View style={styles.sectionTabs} accessibilityRole="tablist">
            {(
              [
                {
                  id: 'members' as const,
                  label: `Članovi (${memberships.length})`,
                },
                {
                  id: 'team' as const,
                  label: `Tim (${activeStaff.length})`,
                },
              ]
            ).map((item) => {
              const on = section === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => switchSection(item.id)}
                  style={({ pressed }) => [
                    styles.sectionTab,
                    on && styles.sectionTabOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.sectionTabLabel, on && styles.sectionTabLabelOn]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {section === 'members' ? (
            <View style={styles.statsWrap}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Aktivni</Text>
                  <Text style={styles.statValue}>{activeMembers.length}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Arhiva</Text>
                  <Text style={styles.statValue}>{archiveMembers.length}</Text>
                </View>
                <View style={[styles.stat, endingSoon > 0 && styles.statWarn]}>
                  <Text style={styles.statLabel}>Ističe uskoro</Text>
                  <Text style={styles.statValue}>{endingSoon}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Iskorišteni termini</Text>
                  <Text style={styles.statValue}>{sessionsUsed}</Text>
                </View>
                <View style={styles.statWide}>
                  <Text style={styles.statLabel}>Dolasci ({monthName})</Text>
                  <Text style={styles.statValue}>{visitsThisMonth}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.statsRow, styles.statsRowSolo]}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Aktivni u timu</Text>
                <Text style={styles.statValue}>{activeStaff.length}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Treneri</Text>
                <Text style={styles.statValue}>
                  {activeStaff.filter((item) => item.role === 'STAFF').length}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Vlasnik</Text>
                <Text style={styles.statValue}>
                  {
                    activeStaff.filter((item) => item.role === 'BUSINESS_OWNER')
                      .length
                  }
                </Text>
              </View>
            </View>
          )}

          {usingLocalFixtures ? (
            <Text style={styles.fixtureBanner} accessibilityRole="text">
              Lokalni demo podaci — samo za dizajn (__DEV__).
            </Text>
          ) : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

          {formVisible ? (
            <View style={styles.formShell}>
              <Animated.View
                style={[
                  styles.form,
                  {
                    opacity: formReveal,
                    transform: [
                      {
                        translateY: formReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-36, 0],
                        }),
                      },
                      {
                        scaleY: formReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.94, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {section === 'members' ? (
                  <>
                    <Text style={styles.sectionLabel}>Novi član</Text>
                    <Text style={styles.formHint}>
                      Novom članu šaljemo e-poštu s privremenom lozinkom za prijavu.
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Ime i prezime"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      autoCapitalize="words"
                      editable={!saving}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="E-pošta"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!saving}
                    />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Telefon (opcionalno)"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="phone-pad"
                      editable={!saving}
                    />
                    <Text style={styles.fieldLabel}>Treninga u paketu</Text>
                    <View style={styles.presetRow}>
                      {SESSION_PRESETS.map((value) => {
                        const on = sessions === String(value);
                        return (
                          <Pressable
                            key={value}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() => setSessions(String(value))}
                            style={({ pressed }) => [
                              styles.preset,
                              on && styles.presetOn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.presetLabel,
                                on && styles.presetLabelOn,
                              ]}
                            >
                              {value}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={sessions}
                      onChangeText={setSessions}
                      placeholder="Broj treninga"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="number-pad"
                      editable={!saving}
                    />
                    {formError ? <Text style={styles.error}>{formError}</Text> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Spremi člana"
                      onPress={onAddMember}
                      disabled={saving}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && styles.pressed,
                        saving && styles.disabled,
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#061210" size="small" />
                      ) : (
                        <Text style={styles.primaryLabel}>Dodaj člana</Text>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionLabel}>Novi trener</Text>
                    <Text style={styles.formHint}>
                      Članovi ga mogu izabrati pri rezervaciji. Novom računu
                      lozinka ide na e-poštu.
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Ime i prezime"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      autoCapitalize="words"
                      editable={!saving}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="E-pošta"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!saving}
                    />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Telefon (opcionalno)"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="phone-pad"
                      editable={!saving}
                    />
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Uloga / naziv"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      editable={!saving}
                    />
                    {formError ? <Text style={styles.error}>{formError}</Text> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Spremi trenera"
                      onPress={onAddStaff}
                      disabled={saving}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && styles.pressed,
                        saving && styles.disabled,
                      ]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#061210" size="small" />
                      ) : (
                        <Text style={styles.primaryLabel}>Dodaj trenera</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </Animated.View>
            </View>
          ) : null}

          {section === 'members' ? (
            <>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Traži ime, e-poštu ili plan…"
                placeholderTextColor="rgba(232, 242, 239, 0.28)"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.filterRow}>
                {(
                  [
                    { id: 'active' as const, label: `Aktivni (${activeMembers.length})` },
                    { id: 'archive' as const, label: `Arhiva (${archiveMembers.length})` },
                    { id: 'all' as const, label: `Svi (${memberships.length})` },
                  ]
                ).map((item) => {
                  const on = filter === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setFilter(item.id)}
                      style={({ pressed }) => [
                        styles.filterChip,
                        on && styles.filterChipOn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[styles.filterLabel, on && styles.filterLabelOn]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.listHead}>
                <View style={styles.listHeadCopy}>
                  <Text style={styles.sectionLabel}>Popis</Text>
                  <Text style={styles.listDay}>Članarine</Text>
                </View>
                <Text
                  style={[
                    styles.count,
                    visibleMembers.length > 0 && styles.countStrong,
                  ]}
                >
                  {memberCountLabel(visibleMembers.length)}
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#5EEAD4" size="small" />
                  <Text style={styles.hint}>Učitavamo članove…</Text>
                </View>
              ) : null}

              {!loading && visibleMembers.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="people-outline" size={22} color="#5EEAD4" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {query ? 'Nema rezultata' : 'Još nema članova'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {query
                      ? 'Pokušajte drugi pojam ili promijenite filter.'
                      : 'Dodajte prvog člana da počnete pratiti članarine i termine.'}
                  </Text>
                  {!query && !formVisible ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={openForm}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.primaryLabel}>Dodajte člana</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {!loading && visibleMembers.length > 0 ? (
                <View style={styles.list}>
                  {visibleMembers.map((item) => {
                    const displayName = item.user?.name || 'Član';
                    const active = item.status === 'ACTIVE';
                    const ratio = sessionsRatio(item);
                    const expiry = active ? expiryLabel(item.validUntil) : null;
                    const soon = (() => {
                      const left = daysLeft(item.validUntil);
                      return left != null && left >= 0 && left <= 7;
                    })();
                    const busy = busyId === item.id;
                    return (
                      <View
                        key={item.id}
                        style={[styles.row, !active && styles.rowMuted]}
                      >
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {displayName.trim().slice(0, 1).toUpperCase() || 'Č'}
                          </Text>
                        </View>
                        <View style={styles.rowCopy}>
                          <View style={styles.rowTitle}>
                            <Text style={styles.rowName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            <Text
                              style={[
                                styles.badge,
                                active ? styles.badgeOk : styles.badgeMuted,
                              ]}
                            >
                              {statusLabel(item.status)}
                            </Text>
                          </View>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {item.user?.email || 'Bez e-pošte'}
                            {item.user?.phone ? ` · ${item.user.phone}` : ''}
                          </Text>
                          <Text style={styles.rowPlan} numberOfLines={1}>
                            {item.planName || 'Plan'}
                            {' · '}
                            {sessionsLabel(item)}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${Math.round(ratio * 100)}%` },
                                ratio >= 0.85 && item.sessionsIncluded != null
                                  ? styles.barHot
                                  : null,
                              ]}
                            />
                          </View>
                          <Text style={styles.rowDates}>
                            {formatShortDate(item.validFrom)}
                            {' – '}
                            {formatShortDate(item.validUntil)}
                            {expiry ? (
                              <Text style={soon ? styles.expirySoon : styles.expiry}>
                                {` · ${expiry}`}
                              </Text>
                            ) : null}
                          </Text>
                          <View style={styles.actions}>
                            {(item.status === 'ACTIVE'
                              || item.status === 'EXPIRED'
                              || item.status === 'SUSPENDED') ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Obnovite članarinu"
                                onPress={() => onRenew(item)}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  styles.actionBtn,
                                  pressed && styles.pressed,
                                ]}
                              >
                                {busy ? (
                                  <ActivityIndicator color="#5EEAD4" size="small" />
                                ) : (
                                  <Text style={styles.actionLabel}>Obnovite</Text>
                                )}
                              </Pressable>
                            ) : null}
                            {item.status === 'ACTIVE' ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Uklonite člana"
                                onPress={() => onRemoveMember(item)}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  styles.actionBtn,
                                  styles.actionDanger,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Text style={styles.actionDangerLabel}>Uklonite</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.listHead}>
                <View style={styles.listHeadCopy}>
                  <Text style={styles.sectionLabel}>Tim</Text>
                  <Text style={styles.listDay}>Osoblje</Text>
                </View>
                <Text
                  style={[
                    styles.count,
                    activeStaff.length > 0 && styles.countStrong,
                  ]}
                >
                  {activeStaff.length} aktivno
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#5EEAD4" size="small" />
                  <Text style={styles.hint}>Učitavamo tim…</Text>
                </View>
              ) : null}

              {!loading && activeStaff.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="fitness-outline" size={22} color="#5EEAD4" />
                  </View>
                  <Text style={styles.emptyTitle}>Još nema tima</Text>
                  <Text style={styles.emptyBody}>
                    Dodajte trenera da članovi mogu birati kod koga rezerviraju
                    termin.
                  </Text>
                  {!formVisible ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={openForm}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.primaryLabel}>Dodajte trenera</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {!loading && activeStaff.length > 0 ? (
                <View style={styles.list}>
                  {activeStaff.map((item) => {
                    const displayName = item.name || 'Trener';
                    const busy = busyId === item.id;
                    const isOwner = item.role === 'BUSINESS_OWNER';
                    return (
                      <View key={item.id} style={styles.row}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {displayName.trim().slice(0, 1).toUpperCase() || 'T'}
                          </Text>
                        </View>
                        <View style={styles.rowCopy}>
                          <View style={styles.rowTitle}>
                            <Text style={styles.rowName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            <Text style={[styles.badge, styles.badgeOk]}>
                              {item.title || (isOwner ? 'Vlasnik' : 'Trener')}
                            </Text>
                          </View>
                          <Text style={styles.rowMeta} numberOfLines={2}>
                            {item.email || 'Bez e-pošte'}
                            {item.phone ? ` · ${item.phone}` : ''}
                            {` · ${isOwner ? 'Vlasnik' : 'Trener'}`}
                          </Text>
                          <View style={styles.actions}>
                            {item.role === 'STAFF' ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Uklonite trenera"
                                onPress={() => onRemoveStaff(item)}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  styles.actionBtn,
                                  styles.actionDanger,
                                  pressed && styles.pressed,
                                ]}
                              >
                                {busy ? (
                                  <ActivityIndicator color="#FCA5A5" size="small" />
                                ) : (
                                  <Text style={styles.actionDangerLabel}>
                                    Uklonite
                                  </Text>
                                )}
                              </Pressable>
                            ) : (
                              <Text style={styles.teamNote}>
                                Uvijek dostupan za rezervacije
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </Animated.View>

        <View style={styles.footer}>
          <AuthLegalStrip />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060908',
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#060908',
  },
  flex: { flex: 1, minHeight: 0 },
  stage: {
    flexGrow: 1,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#5EEAD4',
    maxWidth: 260,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  titleCopy: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#E8F2EF',
    marginBottom: 8,
  },
  lead: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(232, 242, 239, 0.66)',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5EEAD4',
    marginTop: 4,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sectionTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sectionTabOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  sectionTabLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  sectionTabLabelOn: {
    color: '#5EEAD4',
  },
  statsWrap: {
    gap: 8,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsRowSolo: {
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    backgroundColor: 'rgba(10, 20, 18, 0.28)',
    gap: 4,
  },
  statWide: {
    flex: 2,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 242, 239, 0.12)',
    backgroundColor: 'rgba(10, 20, 18, 0.28)',
    gap: 4,
  },
  statWarn: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  statLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
  },
  statValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  fixtureBanner: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(251, 191, 36, 0.95)',
    marginBottom: 10,
  },
  notice: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#5EEAD4',
    marginBottom: 12,
  },
  error: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 113, 133, 0.95)',
    marginBottom: 10,
  },
  formShell: {
    overflow: 'hidden',
    marginBottom: 18,
  },
  form: {
    gap: 10,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 242, 239, 0.12)',
    transformOrigin: 'top center',
  },
  formHint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232, 242, 239, 0.55)',
    marginTop: -4,
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginTop: 4,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.22)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.45)',
  },
  search: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.16)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#F7FCFA',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  preset: {
    minWidth: 52,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  presetOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  presetLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.6)',
  },
  presetLabelOn: {
    color: '#5EEAD4',
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#061210',
  },
  disabled: { opacity: 0.7 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.14)',
    backgroundColor: 'rgba(10, 20, 18, 0.35)',
  },
  filterChipOn: {
    borderColor: 'rgba(94, 234, 212, 0.55)',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
  },
  filterLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  filterLabelOn: {
    color: '#5EEAD4',
  },
  sectionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(232, 242, 239, 0.42)',
    marginBottom: 10,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  listHeadCopy: { flex: 1, minWidth: 0 },
  listDay: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#E8F2EF',
    marginTop: -4,
  },
  count: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.48)',
    paddingBottom: 2,
  },
  countStrong: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#5EEAD4',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(232, 242, 239, 0.55)',
  },
  empty: {
    paddingTop: 8,
    gap: 10,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#E8F2EF',
  },
  emptyBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(232, 242, 239, 0.64)',
    maxWidth: 340,
  },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(232, 242, 239, 0.12)',
  },
  rowMuted: { opacity: 0.62 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    marginTop: 2,
  },
  avatarText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#5EEAD4',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#F7FCFA',
  },
  badge: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgeOk: { color: '#5EEAD4' },
  badgeMuted: { color: 'rgba(232, 242, 239, 0.45)' },
  rowMeta: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.62)',
  },
  rowPlan: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: 'rgba(232, 242, 239, 0.72)',
  },
  barTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(232, 242, 239, 0.1)',
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(94, 234, 212, 0.75)',
  },
  barHot: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
  },
  rowDates: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.42)',
  },
  expiry: {
    color: 'rgba(232, 242, 239, 0.48)',
  },
  expirySoon: {
    color: 'rgba(251, 191, 36, 0.95)',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
  },
  actionLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#5EEAD4',
  },
  actionDanger: {
    borderColor: 'rgba(251, 113, 133, 0.35)',
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
  },
  actionDangerLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#FCA5A5',
  },
  teamNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
    paddingVertical: 6,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  pressed: { opacity: 0.72 },
});
