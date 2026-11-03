import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../api/client';
import { listTenantBookings } from '../api/bookings';
import {
  createMembership,
  createPlan,
  listMemberships,
  listPlans,
  suspendMembership,
  type Membership,
  type MembershipPlan,
} from '../api/memberships';
import {
  createStaff,
  listStaff,
  suspendStaff,
  type StaffMember,
} from '../api/staff';
import { useStudio } from '../features/studio/StudioContext';
import { tokens } from '../theme/tokens';
import { makeMembersStyles } from '../ui/membersStyles';

const REAL_ID = /^[a-f\d]{24}$/i;
const SESSION_PRESETS = [6, 12, 18];

const emptyForm = { name: '', email: '', phone: '', sessions: '12' };
const emptyStaffForm = { name: '', email: '', phone: '', title: 'Trener' };

function statusLabel(status: string) {
  if (status === 'ACTIVE') return 'Aktivno';
  if (status === 'SUSPENDED') return 'Uklonjeno';
  if (status === 'EXPIRED') return 'Isteklo';
  return status;
}

function statusTone(status: string): 'ok' | 'warn' | 'danger' | 'muted' {
  if (status === 'ACTIVE') return 'ok';
  if (status === 'EXPIRED') return 'warn';
  if (status === 'SUSPENDED') return 'danger';
  return 'muted';
}

function initials(name: string) {
  const parts = String(name || 'Č').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Č';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function sessionsProgress(item: Membership) {
  if (item.sessionsIncluded == null) {
    return { label: 'Neograničeno', used: 0, total: 0, ratio: 0, unlimited: true };
  }
  const used = Number(item.sessionsUsed) || 0;
  const total = Number(item.sessionsIncluded) || 0;
  const ratio = total > 0 ? Math.min(1, used / total) : 0;
  return { label: `${used} / ${total}`, used, total, ratio, unlimited: false };
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function daysLeft(until?: string) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function daysLeftInMonth(from = new Date()) {
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  return Math.max(1, end.getDate() - from.getDate() + 1);
}

function monthLabelHr(from = new Date()) {
  const label = new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(from);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
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

export function MembersView() {
  const { studio, ready: studioReady } = useStudio();
  const brand = studio?.theme.primaryColor || tokens.brand;
  const soft = studio?.theme.secondaryColor || tokens.brandSoft;
  const ink = studio?.theme.ink || tokens.fg;
  const styles = useMemo(() => makeMembersStyles(brand, soft, ink), [brand, soft, ink]);

  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const range = useMemo(() => monthRange(), []);

  const [section, setSection] = useState<'members' | 'team'>('members');
  const [open, setOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'active' | 'archive' | 'all'>('active');
  const [form, setForm] = useState(emptyForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [formError, setFormError] = useState('');
  const [staffFormError, setStaffFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [visitsThisMonth, setVisitsThisMonth] = useState(0);

  const load = useCallback(async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setActionError('');
    try {
      const [mems, planRows, staffRows, bookings] = await Promise.all([
        listMemberships(tenantId),
        listPlans(tenantId),
        listStaff(tenantId),
        listTenantBookings(tenantId, {
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
          limit: 500,
        }),
      ]);
      setMemberships(mems);
      setPlans(planRows.filter((plan) => plan.active !== false));
      setStaff(staffRows);
      setVisitsThisMonth(
        bookings.filter((item) => item.status === 'CONFIRMED' || item.status === 'COMPLETED').length,
      );
    } catch {
      setActionError('Članovi se nisu učitali.');
    } finally {
      setLoading(false);
    }
  }, [ready, tenantId, range.dateFrom, range.dateTo]);

  useEffect(() => {
    if (!studioReady) return;
    void load();
  }, [studioReady, load]);

  const active = memberships.filter((item) => item.status === 'ACTIVE');
  const others = memberships.filter((item) => item.status !== 'ACTIVE');
  const activeStaff = staff.filter((item) => item.status === 'ACTIVE');
  const sessionsUsed = active.reduce((sum, item) => sum + (Number(item.sessionsUsed) || 0), 0);
  const endingSoon = active.filter((item) => {
    const left = daysLeft(item.validUntil);
    return left != null && left >= 0 && left <= 7;
  }).length;

  const visible = useMemo(() => {
    const source = filter === 'active' ? active : filter === 'archive' ? others : memberships;
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((item) => {
      const hay = [
        item.user?.name,
        item.user?.email,
        item.user?.phone,
        item.planName,
        item.code,
      ].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [active, others, memberships, filter, query]);

  function change(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  }

  function changeStaff(field: keyof typeof emptyStaffForm, value: string) {
    setStaffForm((current) => ({ ...current, [field]: value }));
    setStaffFormError('');
  }

  async function ensurePlanForSessions(sessions: number) {
    const existing = plans.find((plan) => Number(plan.sessionsIncluded) === sessions);
    if (existing?.id) return String(existing.id);
    const created = await createPlan(tenantId, {
      name: `${sessions} treninga`,
      price: 0,
      validityDays: daysLeftInMonth(),
      sessionsIncluded: sessions,
    });
    setPlans((current) => [...current, created]);
    return String(created.id);
  }

  async function onAdd() {
    setFormError('');
    const sessionCount = Number.parseInt(form.sessions, 10);
    if (!form.name.trim()) {
      setFormError('Upišite ime člana.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Upišite ispravnu e-poštu.');
      return;
    }
    if (!Number.isFinite(sessionCount) || sessionCount < 1 || sessionCount > 200) {
      setFormError('Upišite broj treninga od 1 do 200.');
      return;
    }
    setCreating(true);
    try {
      const planId = await ensurePlanForSessions(sessionCount);
      const email = form.email.trim().toLowerCase();
      const result = await createMembership(tenantId, {
        customer: {
          name: form.name.trim(),
          email,
          phone: form.phone.trim() || undefined,
        },
        membershipPlanId: planId,
        method: 'CASH',
      });
      setForm(emptyForm);
      setOpen(false);
      setFilter('active');
      if (result.accountCreated && result.inviteSent) {
        setNotice(`Član je dodan. Lozinka za prijavu poslana je na ${email}.`);
      } else if (result.accountCreated && !result.inviteSent) {
        setNotice(`Član je dodan, ali e-pošta s lozinkom nije poslana na ${email}.`);
      } else {
        setNotice('Članarina je aktivirana za postojeći račun. Lozinka nije mijenjana.');
      }
      await load();
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'EMAIL_TAKEN' || err.status === 409)) {
        setFormError('Ta e-pošta je već registrirana.');
      } else if (err instanceof TypeError) {
        setFormError('Poslužitelj nije dostupan.');
      } else {
        setFormError('Član nije dodan. Pokušajte ponovno.');
      }
    } finally {
      setCreating(false);
    }
  }

  async function onAddStaff() {
    setStaffFormError('');
    if (!staffForm.name.trim()) {
      setStaffFormError('Upišite ime trenera.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email.trim())) {
      setStaffFormError('Upišite ispravnu e-poštu.');
      return;
    }
    setCreatingStaff(true);
    try {
      const email = staffForm.email.trim().toLowerCase();
      const result = await createStaff(tenantId, {
        name: staffForm.name.trim(),
        email,
        phone: staffForm.phone.trim() || undefined,
        title: staffForm.title.trim() || 'Trener',
      });
      setStaffForm(emptyStaffForm);
      setStaffOpen(false);
      if (result.accountCreated && result.inviteSent) {
        setNotice(`Trener je dodan. Lozinka za prijavu poslana je na ${email}.`);
      } else if (result.accountCreated && !result.inviteSent) {
        setNotice(`Trener je dodan, ali e-pošta s lozinkom nije poslana na ${email}.`);
      } else {
        setNotice('Trener je dodan u tim.');
      }
      await load();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'STAFF_EXISTS') setStaffFormError('Ta osoba je već u timu.');
      else if (code === 'EMAIL_IS_MEMBER') {
        setStaffFormError('Ta e-pošta pripada članu. Koristite drugi račun za trenera.');
      } else if (err instanceof TypeError) {
        setStaffFormError('Poslužitelj nije dostupan.');
      } else {
        setStaffFormError('Trener nije dodan. Provjerite podatke i pokušajte ponovno.');
      }
    } finally {
      setCreatingStaff(false);
    }
  }

  async function onRenew(item: Membership) {
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
      await load();
    } catch {
      setActionError('Članarina nije obnovljena.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemove(item: Membership) {
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendMembership(item.id);
      await load();
    } catch {
      setActionError('Član nije uklonjen.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemoveStaff(item: StaffMember) {
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendStaff(tenantId, item.id);
      setNotice(`${item.name} je uklonjen/a iz tima.`);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CANNOT_REMOVE_SELF') {
        setActionError('Ne možete ukloniti sami sebe.');
      } else {
        setActionError('Trener nije uklonjen.');
      }
    } finally {
      setBusyId('');
    }
  }

  const badgeStyle = {
    ok: styles.badgeOk,
    warn: styles.badgeWarn,
    danger: styles.badgeDanger,
    muted: styles.badgeMuted,
  };

  if (!studioReady || (ready && loading && memberships.length === 0 && staff.length === 0)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <ActivityIndicator color={brand} size="large" />
      </View>
    );
  }

  if (!ready) {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>Članovi</Text>
          <Text style={styles.title}>Još nije spremno</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>Studio još nije u bazi. Otvorite ga registracijom, pa dodajte članove.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>{section === 'team' ? 'Osoblje' : 'Zajednica'}</Text>
          <Text style={styles.title}>{section === 'team' ? 'Tim' : 'Članovi'}</Text>
          <View style={styles.accent} />
          <Text style={styles.lede}>
            {section === 'team'
              ? 'Treneri i vlasnik — članovi ih biraju pri rezervaciji termina.'
              : 'Članarine, preostali termini, dolasci iz rezervacija i brza obnova.'}
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => {
              setNotice('');
              if (section === 'members') {
                setOpen(true);
                setFormError('');
              } else {
                setStaffOpen(true);
                setStaffFormError('');
              }
            }}
          >
            <Text style={styles.primaryLabel}>
              {section === 'members' ? 'Dodajte člana' : 'Dodajte trenera'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sections}>
          <Pressable
            style={[styles.sectionBtn, section === 'members' && styles.sectionOn]}
            onPress={() => {
              setSection('members');
              setActionError('');
            }}
          >
            <Text style={[styles.sectionLabel, section === 'members' && styles.sectionLabelOn]}>
              Članovi ({memberships.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sectionBtn, section === 'team' && styles.sectionOn]}
            onPress={() => {
              setSection('team');
              setActionError('');
            }}
          >
            <Text style={[styles.sectionLabel, section === 'team' && styles.sectionLabelOn]}>
              Tim ({activeStaff.length})
            </Text>
          </Pressable>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {section === 'members' ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Aktivni</Text>
                <Text style={styles.statValue}>{active.length}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Arhiva</Text>
                <Text style={styles.statValue}>{others.length}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Iskorišteni termini</Text>
                <Text style={styles.statValue}>{sessionsUsed}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Dolasci ({monthLabelHr()})</Text>
                <Text style={styles.statValue}>{visitsThisMonth}</Text>
              </View>
              <View style={[styles.stat, endingSoon > 0 && styles.statWarn, { width: '100%', borderRightWidth: 0 }]}>
                <Text style={styles.statLabel}>Ističe uskoro</Text>
                <Text style={styles.statValue}>{endingSoon}</Text>
              </View>
            </View>

            <View style={styles.toolbar}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Traži ime, e-poštu ili plan…"
                placeholderTextColor={tokens.muted}
                style={styles.search}
              />
              <View style={styles.filters}>
                {([
                  ['active', `Aktivni (${active.length})`],
                  ['archive', `Arhiva (${others.length})`],
                  ['all', `Svi (${memberships.length})`],
                ] as const).map(([id, label]) => (
                  <Pressable
                    key={id}
                    style={[styles.filterBtn, filter === id && styles.filterOn]}
                    onPress={() => setFilter(id)}
                  >
                    <Text style={[styles.filterLabel, filter === id && styles.filterLabelOn]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.index}>01</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>Popis</Text>
                  <Text style={styles.panelTitle}>Članarine</Text>
                  <Text style={styles.panelSub}>Obnova, termini i status u jednom pregledu.</Text>
                </View>
                <View style={styles.metaRight}>
                  <Text style={styles.metaCount}>{visible.length}</Text>
                  <Text style={styles.metaLabel}>prikazano</Text>
                </View>
              </View>

              {loading ? <Text style={styles.hint}>Učitavamo članove…</Text> : null}
              {!loading && visible.length === 0 ? (
                <Text style={styles.empty}>
                  {query ? 'Nema rezultata za taj pojam.' : 'Još nema članova. Dodajte prvog člana.'}
                </Text>
              ) : null}

              {visible.map((item) => {
                const progress = sessionsProgress(item);
                const left = daysLeft(item.validUntil);
                const tone = statusTone(item.status);
                const name = item.user?.name || 'Član';
                const busy = busyId === item.id;
                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.identity}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials(name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={styles.name}>{name}</Text>
                          <Text style={[styles.badge, badgeStyle[tone]]}>{statusLabel(item.status)}</Text>
                        </View>
                        <Text style={styles.meta}>
                          {item.user?.email || 'Bez e-pošte'}
                          {item.user?.phone ? ` · ${item.user.phone}` : ''}
                        </Text>
                        <Text style={styles.planName}>{item.planName || 'Plan'}</Text>
                        <Text style={styles.dates}>
                          {formatDate(item.validFrom)} – {formatDate(item.validUntil)}
                        </Text>
                        {item.status === 'ACTIVE' && left != null ? (
                          <Text style={[styles.expiry, left <= 7 && styles.expirySoon]}>
                            {left < 0 ? 'Isteklo' : left === 0 ? 'Ističe danas' : `Još ${left} dana`}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View>
                      <View style={styles.sessionsTop}>
                        <Text style={styles.sessionsLabel}>Dolasci / paket</Text>
                        <Text style={styles.sessionsValue}>{progress.label}</Text>
                      </View>
                      <View style={styles.bar}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: progress.unlimited ? '100%' : `${progress.ratio * 100}%`,
                            },
                            !progress.unlimited && progress.ratio >= 0.85 ? styles.barHot : null,
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.actions}>
                      {(item.status === 'ACTIVE' || item.status === 'EXPIRED' || item.status === 'SUSPENDED') ? (
                        <Pressable style={styles.actionBtn} disabled={busy} onPress={() => onRenew(item)}>
                          <Text style={styles.actionLabel}>{busy ? 'Radimo…' : 'Obnovite'}</Text>
                        </Pressable>
                      ) : null}
                      {item.status === 'ACTIVE' ? (
                        <Pressable style={[styles.actionBtn, styles.actionDanger]} disabled={busy} onPress={() => onRemove(item)}>
                          <Text style={[styles.actionLabel, styles.actionDangerLabel]}>Uklonite</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.stats}>
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
              <View style={[styles.stat, { width: '100%', borderRightWidth: 0 }]}>
                <Text style={styles.statLabel}>Vlasnik</Text>
                <Text style={styles.statValue}>
                  {activeStaff.filter((item) => item.role === 'BUSINESS_OWNER').length}
                </Text>
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.index}>01</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>Tim</Text>
                  <Text style={styles.panelTitle}>Osoblje</Text>
                  <Text style={styles.panelSub}>Treneri dostupni pri rezervaciji.</Text>
                </View>
              </View>

              {activeStaff.length === 0 ? (
                <Text style={styles.empty}>Još nema aktivnih trenera u timu.</Text>
              ) : null}

              {activeStaff.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.identity}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(item.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.meta}>
                        {item.title || item.role || 'Trener'}
                        {item.email ? ` · ${item.email}` : ''}
                      </Text>
                    </View>
                  </View>
                  {item.role !== 'BUSINESS_OWNER' ? (
                    <View style={styles.actions}>
                      <Pressable
                        style={[styles.actionBtn, styles.actionDanger]}
                        disabled={busyId === item.id}
                        onPress={() => onRemoveStaff(item)}
                      >
                        <Text style={[styles.actionLabel, styles.actionDangerLabel]}>
                          {busyId === item.id ? 'Uklanjamo…' : 'Uklonite'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>Novi član</Text>
                <Text style={styles.panelSub}>
                  Sustav generira lozinku i šalje je na e-poštu člana — vi je ne vidite.
                </Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setOpen(false)}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View>
                <Text style={styles.fieldLabel}>Ime i prezime</Text>
                <TextInput value={form.name} onChangeText={(v) => change('name', v)} style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>E-pošta člana</Text>
                <TextInput value={form.email} onChangeText={(v) => change('email', v)} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Telefon</Text>
                <TextInput value={form.phone} onChangeText={(v) => change('phone', v)} keyboardType="phone-pad" style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Broj treninga ({monthLabelHr()})</Text>
                <TextInput value={form.sessions} onChangeText={(v) => change('sessions', v)} keyboardType="number-pad" style={styles.input} placeholderTextColor={tokens.muted} />
                <View style={styles.presets}>
                  {SESSION_PRESETS.map((count) => {
                    const on = Number(form.sessions) === count;
                    return (
                      <Pressable key={count} style={[styles.preset, on && styles.presetOn]} onPress={() => change('sessions', String(count))}>
                        <Text style={[styles.presetLabel, on && styles.presetLabelOn]}>{count}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.fieldHint}>Koliko termina član ima do kraja mjeseca.</Text>
              </View>
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <View style={styles.modalActions}>
                <Pressable style={styles.ghost} onPress={() => setOpen(false)}>
                  <Text style={styles.ghostLabel}>Odustani</Text>
                </Pressable>
                <Pressable style={[styles.primary, creating && styles.primaryDisabled]} disabled={creating} onPress={onAdd}>
                  <Text style={styles.primaryLabel}>{creating ? 'Dodajemo…' : 'Spremi člana'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={staffOpen} transparent animationType="slide" onRequestClose={() => setStaffOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStaffOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>Novi trener</Text>
                <Text style={styles.panelSub}>Članovi ga mogu izabrati pri rezervaciji.</Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setStaffOpen(false)}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View>
                <Text style={styles.fieldLabel}>Ime i prezime</Text>
                <TextInput value={staffForm.name} onChangeText={(v) => changeStaff('name', v)} style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>E-pošta</Text>
                <TextInput value={staffForm.email} onChangeText={(v) => changeStaff('email', v)} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Telefon</Text>
                <TextInput value={staffForm.phone} onChangeText={(v) => changeStaff('phone', v)} keyboardType="phone-pad" style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Uloga / naziv</Text>
                <TextInput value={staffForm.title} onChangeText={(v) => changeStaff('title', v)} style={styles.input} placeholderTextColor={tokens.muted} />
              </View>
              {staffFormError ? <Text style={styles.error}>{staffFormError}</Text> : null}
              <View style={styles.modalActions}>
                <Pressable style={styles.ghost} onPress={() => setStaffOpen(false)}>
                  <Text style={styles.ghostLabel}>Odustani</Text>
                </Pressable>
                <Pressable style={[styles.primary, creatingStaff && styles.primaryDisabled]} disabled={creatingStaff} onPress={onAddStaff}>
                  <Text style={styles.primaryLabel}>{creatingStaff ? 'Dodajemo…' : 'Spremi trenera'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
