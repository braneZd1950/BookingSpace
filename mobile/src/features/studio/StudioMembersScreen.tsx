import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import {
  isFixtureId,
  isLocalDesignMode,
  localDesignMembers,
  localDesignStaff,
} from './localDesignFixtures.js';
import StudioContactFields from './StudioContactFields';
import StudioEmptyState from './StudioEmptyState';
import StudioFormSubmit from './StudioFormSubmit';
import StudioListHead from './StudioListHead';
import StudioPresetRow from './StudioPresetRow';
import StudioScreenShell from './StudioScreenShell';
import { formatShortDate, memberCountLabel } from './studioFormat.js';
import { studioUiStyles as ui } from './studioUiStyles.js';
import { useStudioFormReveal } from './useStudioFormReveal.js';
import { isEmail } from '../../../../shared/isEmail.js';
import {
  daysLeft,
  daysLeftInMonth,
  monthRange,
} from '../../../../shared/dateRange.js';

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

function monthLabelHr(from = new Date()) {
  const label = new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(from);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function statusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Aktivno';
  if (status === 'SUSPENDED') return 'Uklonjeno';
  if (status === 'EXPIRED') return 'Isteklo';
  return status || '—';
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
  const {
    formOpen,
    formVisible,
    openForm: revealOpen,
    closeForm: revealClose,
    formRevealStyle,
  } = useStudioFormReveal();

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

  function openForm() {
    revealOpen(() => {
      setFormError('');
      setNotice('');
      setActionError('');
    });
  }

  function closeForm(after?: () => void) {
    revealClose(() => {
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

  const titleAccessory = (
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
      style={({ pressed }) => [ui.addBtnSolid, pressed && ui.pressed]}
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
  );

  return (
    <StudioScreenShell
      studioName={studioName}
      onBack={onBack}
      title={section === 'team' ? 'Tim' : 'Članovi'}
      lead={lead}
      titleAccessory={titleAccessory}
      keyboardShouldPersistTaps="handled"
    >
      <View style={ui.segmentTabs} accessibilityRole="tablist">
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
                    ui.segmentTab,
                    on && ui.segmentTabOn,
                    pressed && ui.pressed,
                  ]}
                >
                  <Text style={[ui.segmentTabLabel, on && ui.segmentTabLabelOn]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

      {section === 'members' ? (
        <View style={ui.statsWrap}>
          <View style={[ui.statsRow, ui.statsRowInWrap]}>
                <View style={ui.stat}>
                  <Text style={ui.statLabel}>Aktivni</Text>
                  <Text style={ui.statValue}>{activeMembers.length}</Text>
                </View>
                <View style={ui.stat}>
                  <Text style={ui.statLabel}>Arhiva</Text>
                  <Text style={ui.statValue}>{archiveMembers.length}</Text>
                </View>
            <View style={[ui.stat, endingSoon > 0 && ui.statWarn]}>
                  <Text style={ui.statLabel}>Ističe uskoro</Text>
                  <Text style={ui.statValue}>{endingSoon}</Text>
                </View>
              </View>
          <View style={[ui.statsRow, ui.statsRowInWrap]}>
                <View style={ui.stat}>
                  <Text style={ui.statLabel}>Iskorišteni termini</Text>
                  <Text style={ui.statValue}>{sessionsUsed}</Text>
                </View>
            <View style={ui.statWide}>
                  <Text style={ui.statLabel}>Dolasci ({monthName})</Text>
                  <Text style={ui.statValue}>{visitsThisMonth}</Text>
                </View>
              </View>
            </View>
          ) : (
        <View style={[ui.statsRow, ui.statsRowSolo]}>
              <View style={ui.stat}>
                <Text style={ui.statLabel}>Aktivni u timu</Text>
                <Text style={ui.statValue}>{activeStaff.length}</Text>
              </View>
              <View style={ui.stat}>
                <Text style={ui.statLabel}>Treneri</Text>
                <Text style={ui.statValue}>
                  {activeStaff.filter((item) => item.role === 'STAFF').length}
                </Text>
              </View>
              <View style={ui.stat}>
                <Text style={ui.statLabel}>Vlasnik</Text>
                <Text style={ui.statValue}>
                  {
                    activeStaff.filter((item) => item.role === 'BUSINESS_OWNER')
                      .length
                  }
                </Text>
              </View>
            </View>
          )}

          {usingLocalFixtures ? (
            <Text style={ui.fixtureBanner} accessibilityRole="text">
              Lokalni demo podaci — samo za dizajn (__DEV__).
            </Text>
          ) : null}
          {notice ? <Text style={ui.notice}>{notice}</Text> : null}
          {error ? <Text style={ui.error}>{error}</Text> : null}
          {actionError ? <Text style={ui.error}>{actionError}</Text> : null}

          {formVisible ? (
            <View style={ui.formShell}>
              <Animated.View style={[ui.form, formRevealStyle]}>
                {section === 'members' ? (
                  <>
                    <Text style={ui.sectionLabel}>Novi član</Text>
                    <Text style={ui.formHint}>
                      Novom članu šaljemo e-poštu s privremenom lozinkom za prijavu.
                    </Text>
                    <StudioContactFields
                      name={name}
                      email={email}
                      phone={phone}
                      onChangeName={setName}
                      onChangeEmail={setEmail}
                      onChangePhone={setPhone}
                      editable={!saving}
                    />
                    <StudioPresetRow
                      label="Treninga u paketu"
                      values={SESSION_PRESETS}
                      selected={sessions}
                      onSelect={setSessions}
                      disabled={saving}
                    />
                    <TextInput
                      style={ui.input}
                      value={sessions}
                      onChangeText={setSessions}
                      placeholder="Broj treninga"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      keyboardType="number-pad"
                      editable={!saving}
                    />
                    <StudioFormSubmit
                      label="Dodaj člana"
                      accessibilityLabel="Spremi člana"
                      onPress={onAddMember}
                      saving={saving}
                      error={formError}
                    />
                  </>
                ) : (
                  <>
                    <Text style={ui.sectionLabel}>Novi trener</Text>
                    <Text style={ui.formHint}>
                      Članovi ga mogu izabrati pri rezervaciji. Novom računu
                      lozinka ide na e-poštu.
                    </Text>
                    <StudioContactFields
                      name={name}
                      email={email}
                      phone={phone}
                      onChangeName={setName}
                      onChangeEmail={setEmail}
                      onChangePhone={setPhone}
                      editable={!saving}
                    />
                    <TextInput
                      style={ui.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Uloga / naziv"
                      placeholderTextColor="rgba(232, 242, 239, 0.28)"
                      editable={!saving}
                    />
                    <StudioFormSubmit
                      label="Dodaj trenera"
                      accessibilityLabel="Spremi trenera"
                      onPress={onAddStaff}
                      saving={saving}
                      error={formError}
                    />
                  </>
                )}
              </Animated.View>
            </View>
          ) : null}

          {section === 'members' ? (
            <>
          <TextInput
            style={ui.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Traži ime, e-poštu ili plan…"
                placeholderTextColor="rgba(232, 242, 239, 0.28)"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={ui.filterRow}>
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
                        ui.filterChip,
                        on && ui.filterChipOn,
                        pressed && ui.pressed,
                      ]}
                    >
                      <Text
                        style={[ui.filterLabel, on && ui.filterLabelOn]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

          <StudioListHead
            sectionLabel="Popis"
            dayLabel="Članarine"
            countLabel={memberCountLabel(visibleMembers.length)}
            countStrong={visibleMembers.length > 0}
          />

              {loading ? (
                <View style={ui.loadingRow}>
                  <ActivityIndicator color="#5EEAD4" size="small" />
                  <Text style={ui.hint}>Učitavamo članove…</Text>
                </View>
              ) : null}

          {!loading && visibleMembers.length === 0 ? (
            <StudioEmptyState
              icon="people-outline"
              title={query ? 'Nema rezultata' : 'Još nema članova'}
              body={
                query
                  ? 'Pokušajte drugi pojam ili promijenite filter.'
                  : 'Dodajte prvog člana da počnete pratiti članarine i termine.'
              }
              actionLabel={!query && !formVisible ? 'Dodajte člana' : undefined}
              onAction={!query && !formVisible ? openForm : undefined}
            />
          ) : null}

              {!loading && visibleMembers.length > 0 ? (
                <View style={ui.list}>
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
                        style={[ui.row, !active && ui.rowMuted]}
                      >
                        <View style={ui.avatar}>
                          <Text style={ui.avatarText}>
                            {displayName.trim().slice(0, 1).toUpperCase() || 'Č'}
                          </Text>
                        </View>
                        <View style={ui.rowCopy}>
                          <View style={ui.rowTitle}>
                            <Text style={ui.rowName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            <Text
                              style={[
                                ui.badge,
                                active ? ui.badgeOk : ui.badgeMuted,
                              ]}
                            >
                              {statusLabel(item.status)}
                            </Text>
                          </View>
                          <Text style={ui.rowMeta} numberOfLines={1}>
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
                          <Text style={ui.rowDates}>
                            {formatShortDate(item.validFrom)}
                            {' – '}
                            {formatShortDate(item.validUntil)}
                            {expiry ? (
                              <Text style={soon ? styles.expirySoon : styles.expiry}>
                                {` · ${expiry}`}
                              </Text>
                            ) : null}
                          </Text>
                          <View style={ui.actions}>
                            {(item.status === 'ACTIVE'
                              || item.status === 'EXPIRED'
                              || item.status === 'SUSPENDED') ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Obnovite članarinu"
                                onPress={() => {
                                  void onRenew(item);
                                }}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  ui.actionBtn,
                                  pressed && ui.pressed,
                                ]}
                              >
                                {busy ? (
                                  <ActivityIndicator color="#5EEAD4" size="small" />
                                ) : (
                                  <Text style={ui.actionLabel}>Obnovite</Text>
                                )}
                              </Pressable>
                            ) : null}
                            {item.status === 'ACTIVE' ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Uklonite člana"
                                onPress={() => {
                                  void onRemoveMember(item);
                                }}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  ui.actionBtn,
                                  ui.actionDanger,
                                  pressed && ui.pressed,
                                ]}
                              >
                                <Text style={ui.actionDangerLabel}>Uklonite</Text>
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
          <StudioListHead
            sectionLabel="Tim"
            dayLabel="Osoblje"
            countLabel={`${activeStaff.length} aktivno`}
            countStrong={activeStaff.length > 0}
          />

              {loading ? (
                <View style={ui.loadingRow}>
                  <ActivityIndicator color="#5EEAD4" size="small" />
                  <Text style={ui.hint}>Učitavamo tim…</Text>
                </View>
              ) : null}

          {!loading && activeStaff.length === 0 ? (
            <StudioEmptyState
              icon="fitness-outline"
              title="Još nema tima"
              body="Dodajte trenera da članovi mogu birati kod koga rezerviraju termin."
              actionLabel={!formVisible ? 'Dodajte trenera' : undefined}
              onAction={!formVisible ? openForm : undefined}
            />
          ) : null}

              {!loading && activeStaff.length > 0 ? (
                <View style={ui.list}>
                  {activeStaff.map((item) => {
                    const displayName = item.name || 'Trener';
                    const busy = busyId === item.id;
                    const isOwner = item.role === 'BUSINESS_OWNER';
                    return (
                      <View key={item.id} style={ui.row}>
                        <View style={ui.avatar}>
                          <Text style={ui.avatarText}>
                            {displayName.trim().slice(0, 1).toUpperCase() || 'T'}
                          </Text>
                        </View>
                        <View style={ui.rowCopy}>
                          <View style={ui.rowTitle}>
                            <Text style={ui.rowName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            <Text style={[ui.badge, ui.badgeOk]}>
                              {item.title || (isOwner ? 'Vlasnik' : 'Trener')}
                            </Text>
                          </View>
                          <Text style={ui.rowMeta} numberOfLines={2}>
                            {item.email || 'Bez e-pošte'}
                            {item.phone ? ` · ${item.phone}` : ''}
                            {` · ${isOwner ? 'Vlasnik' : 'Trener'}`}
                          </Text>
                          <View style={ui.actions}>
                            {item.role === 'STAFF' ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Uklonite trenera"
                                onPress={() => {
                                  void onRemoveStaff(item);
                                }}
                                disabled={Boolean(busyId)}
                                style={({ pressed }) => [
                                  ui.actionBtn,
                                  ui.actionDanger,
                                  pressed && ui.pressed,
                                ]}
                              >
                                {busy ? (
                                  <ActivityIndicator color="#FCA5A5" size="small" />
                                ) : (
                                  <Text style={ui.actionDangerLabel}>
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
    </StudioScreenShell>
  );
}

const styles = StyleSheet.create({
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
  expiry: {
    color: 'rgba(232, 242, 239, 0.48)',
  },
  expirySoon: {
    color: 'rgba(251, 191, 36, 0.95)',
  },
  teamNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(232, 242, 239, 0.45)',
    paddingVertical: 6,
  },
});
