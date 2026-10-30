import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useListTenantBookingsQuery } from '../../api/bookingApi.js';
import {
  useCreateMembershipMutation,
  useCreatePlanMutation,
  useListMembershipsQuery,
  useListPlansQuery,
  useSuspendMembershipMutation,
} from '../../api/membershipApi.js';
import {
  useCreateStaffMutation,
  useListStaffQuery,
  useSuspendStaffMutation,
} from '../../api/staffApi.js';
import './MembersPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const SESSION_PRESETS = [6, 12, 18];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  sessions: '12',
};

const emptyStaffForm = {
  name: '',
  email: '',
  phone: '',
  title: 'Trener',
};

function statusLabel(status) {
  if (status === 'ACTIVE') return 'Aktivno';
  if (status === 'SUSPENDED') return 'Uklonjeno';
  if (status === 'EXPIRED') return 'Isteklo';
  return status;
}

function statusTone(status) {
  if (status === 'ACTIVE') return 'ok';
  if (status === 'EXPIRED') return 'warn';
  if (status === 'SUSPENDED') return 'danger';
  return 'muted';
}

function initials(name) {
  const parts = String(name || 'Č')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'Č';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function sessionsProgress(item) {
  if (item.sessionsIncluded == null) {
    return { label: 'Neograničeno', used: 0, total: 0, ratio: 0, unlimited: true };
  }
  const used = Number(item.sessionsUsed) || 0;
  const total = Number(item.sessionsIncluded) || 0;
  const ratio = total > 0 ? Math.min(1, used / total) : 0;
  return {
    label: `${used} / ${total}`,
    used,
    total,
    ratio,
    unlimited: false,
  };
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function daysLeft(until) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return diff;
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
  const pad = (value) => String(value).padStart(2, '0');
  const last = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

export default function MembersPage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio.id || '');
  const ready = REAL_ID.test(tenantId);
  const { data, isLoading, isError, error } = useListMembershipsQuery(tenantId, { skip: !ready });
  const { data: plansData } = useListPlansQuery(tenantId, { skip: !ready });
  const { data: staffData, isLoading: loadingStaff, isError: staffError } = useListStaffQuery(
    tenantId,
    { skip: !ready },
  );
  const range = useMemo(() => monthRange(), []);
  const { data: bookingData } = useListTenantBookingsQuery(
    { tenantId, dateFrom: range.dateFrom, dateTo: range.dateTo, limit: 500 },
    { skip: !ready },
  );
  const [createPlan] = useCreatePlanMutation();
  const [createMembership, { isLoading: creating }] = useCreateMembershipMutation();
  const [suspendMembership, { isLoading: removing }] = useSuspendMembershipMutation();
  const [createStaff, { isLoading: creatingStaff }] = useCreateStaffMutation();
  const [suspendStaff, { isLoading: removingStaff }] = useSuspendStaffMutation();
  const [section, setSection] = useState('members');
  const [open, setOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState(emptyForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [formError, setFormError] = useState('');
  const [staffFormError, setStaffFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  function closeMemberModal() {
    setOpen(false);
    setFormError('');
  }

  function closeStaffModal() {
    setStaffOpen(false);
    setStaffFormError('');
  }

  const modalOpen = open || staffOpen;

  useEffect(() => {
    if (!modalOpen) return undefined;
    function onKey(event) {
      if (event.key !== 'Escape') return;
      if (staffOpen) {
        setStaffOpen(false);
        setStaffFormError('');
        return;
      }
      setOpen(false);
      setFormError('');
    }
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [modalOpen, staffOpen]);

  const memberships = data?.memberships || [];
  const staff = staffData?.staff || [];
  const activeStaff = staff.filter((item) => item.status === 'ACTIVE');
  const plans = (plansData?.plans || []).filter((plan) => plan.active !== false);
  const sessionCount = Number.parseInt(form.sessions, 10);

  const active = memberships.filter((item) => item.status === 'ACTIVE');
  const others = memberships.filter((item) => item.status !== 'ACTIVE');
  const sessionsUsed = active.reduce((sum, item) => sum + (Number(item.sessionsUsed) || 0), 0);
  const endingSoon = active.filter((item) => {
    const left = daysLeft(item.validUntil);
    return left != null && left >= 0 && left <= 7;
  }).length;
  const visitsThisMonth = (bookingData?.bookings || []).filter(
    (item) => item.status === 'CONFIRMED' || item.status === 'COMPLETED',
  ).length;

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

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  }

  function changeStaff(field, value) {
    setStaffForm((current) => ({ ...current, [field]: value }));
    setStaffFormError('');
  }

  async function ensurePlanForSessions(sessions) {
    const existing = plans.find((plan) => Number(plan.sessionsIncluded) === sessions);
    if (existing?.id) return String(existing.id);
    const created = await createPlan({
      tenantId,
      body: {
        name: `${sessions} treninga`,
        price: 0,
        validityDays: daysLeftInMonth(),
        sessionsIncluded: sessions,
      },
    }).unwrap();
    return String(created.plan.id);
  }

  async function onAdd(event) {
    event.preventDefault();
    setFormError('');
    if (!ready) {
      setFormError('Studio još nije u bazi.');
      return;
    }
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
    try {
      const planId = await ensurePlanForSessions(sessionCount);
      const email = form.email.trim().toLowerCase();
      const result = await createMembership({
        tenantId,
        body: {
          customer: {
            name: form.name.trim(),
            email,
            phone: form.phone.trim() || undefined,
          },
          membershipPlanId: planId,
          method: 'CASH',
        },
      }).unwrap();
      setForm(emptyForm);
      setOpen(false);
      setFilter('active');
      if (result.accountCreated && result.inviteSent) {
        setNotice(`Član je dodan. Lozinka za prijavu poslana je na ${email}.`);
      } else if (result.accountCreated && !result.inviteSent) {
        setNotice(`Član je dodan, ali e-pošta s lozinkom nije poslana na ${email}. Provjerite SMTP ili javite se članu.`);
      } else {
        setNotice('Članarina je aktivirana za postojeći račun. Lozinka nije mijenjana.');
      }
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan.');
        return;
      }
      if (failure?.data?.code === 'EMAIL_TAKEN' || failure?.status === 409) {
        setFormError('Ta e-pošta je već registrirana.');
        return;
      }
      setFormError(failure?.data?.message
        ? 'Član nije dodan. Provjerite podatke i pokušajte ponovno.'
        : 'Član nije dodan. Pokušajte ponovno.');
    }
  }

  async function onAddStaff(event) {
    event.preventDefault();
    setStaffFormError('');
    if (!ready) {
      setStaffFormError('Studio još nije u bazi.');
      return;
    }
    if (!staffForm.name.trim()) {
      setStaffFormError('Upišite ime trenera.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email.trim())) {
      setStaffFormError('Upišite ispravnu e-poštu.');
      return;
    }
    try {
      const email = staffForm.email.trim().toLowerCase();
      const result = await createStaff({
        tenantId,
        body: {
          name: staffForm.name.trim(),
          email,
          phone: staffForm.phone.trim() || undefined,
          title: staffForm.title.trim() || 'Trener',
        },
      }).unwrap();
      setStaffForm(emptyStaffForm);
      setStaffOpen(false);
      if (result.accountCreated && result.inviteSent) {
        setNotice(`Trener je dodan. Lozinka za prijavu poslana je na ${email}.`);
      } else if (result.accountCreated && !result.inviteSent) {
        setNotice(`Trener je dodan, ali e-pošta s lozinkom nije poslana na ${email}.`);
      } else {
        setNotice('Trener je dodan u tim.');
      }
    } catch (failure) {
      const code = failure?.data?.code;
      if (failure?.status === 'FETCH_ERROR') {
        setStaffFormError('Poslužitelj nije dostupan.');
        return;
      }
      if (code === 'STAFF_EXISTS') {
        setStaffFormError('Ta osoba je već u timu.');
        return;
      }
      if (code === 'EMAIL_IS_MEMBER') {
        setStaffFormError('Ta e-pošta pripada članu. Koristite drugi račun za trenera.');
        return;
      }
      setStaffFormError('Trener nije dodan. Provjerite podatke i pokušajte ponovno.');
    }
  }

  async function onRenew(item) {
    setActionError('');
    setBusyId(item.id);
    try {
      const planId = String(item.membershipPlanId || plans[0]?.id || '');
      if (!planId) {
        setActionError('Nema plana za obnovu.');
        return;
      }
      await createMembership({
        tenantId,
        body: {
          userId: String(item.userId),
          membershipPlanId: planId,
          method: 'CASH',
        },
      }).unwrap();
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setActionError('Poslužitelj nije dostupan.');
        return;
      }
      setActionError('Članarina nije obnovljena.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemove(item) {
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendMembership(item.id).unwrap();
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setActionError('Poslužitelj nije dostupan.');
        return;
      }
      setActionError('Član nije uklonjen.');
    } finally {
      setBusyId('');
    }
  }

  async function onRemoveStaff(item) {
    setActionError('');
    setBusyId(item.id);
    try {
      await suspendStaff({ tenantId, userId: item.id }).unwrap();
      setNotice(`${item.name} je uklonjen/a iz tima.`);
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setActionError('Poslužitelj nije dostupan.');
        return;
      }
      if (failure?.data?.code === 'CANNOT_REMOVE_SELF') {
        setActionError('Ne možete ukloniti sami sebe.');
        return;
      }
      setActionError('Trener nije uklonjen.');
    } finally {
      setBusyId('');
    }
  }

  if (!ready) {
    return (
      <section className="studio-panel members">
        <div className="members__atmosphere" aria-hidden="true">
          <span className="members__wash" />
          <span className="members__grain" />
        </div>
        <div className="members__stage">
          <p className="members__eyebrow">Članovi</p>
          <h1>Još nije spremno</h1>
          <p className="members__lede">Studio još nije u bazi. Otvorite ga registracijom, pa dodajte članove.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="studio-panel members">
      <div className="members__atmosphere" aria-hidden="true">
        <span className="members__wash" />
        <span className="members__grain" />
      </div>

      <div className="members__stage">
        <header className="members__head">
          <div>
            <p className="members__eyebrow">{section === 'team' ? 'Osoblje' : 'Zajednica'}</p>
            <h1>{section === 'team' ? 'Tim' : 'Članovi'}</h1>
            <p className="members__lede">
              {section === 'team'
                ? 'Treneri i vlasnik — članovi ih biraju pri rezervaciji termina.'
                : 'Članarine, preostali termini, dolasci iz rezervacija i brza obnova.'}
            </p>
          </div>
          {section === 'members' ? (
            <button
              className="members__primary"
              type="button"
              onClick={() => {
                setOpen(true);
                setFormError('');
                setNotice('');
              }}
            >
              Dodajte člana
            </button>
          ) : (
            <button
              className="members__primary"
              type="button"
              onClick={() => {
                setStaffOpen(true);
                setStaffFormError('');
                setNotice('');
              }}
            >
              Dodajte trenera
            </button>
          )}
        </header>

        <div className="members__sections" role="tablist" aria-label="Odjeljak">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'members'}
            className={section === 'members' ? 'is-on' : undefined}
            onClick={() => {
              setSection('members');
              setActionError('');
            }}
          >
            Članovi ({memberships.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'team'}
            className={section === 'team' ? 'is-on' : undefined}
            onClick={() => {
              setSection('team');
              setActionError('');
            }}
          >
            Tim ({activeStaff.length})
          </button>
        </div>

        {notice ? <p className="members__notice" role="status">{notice}</p> : null}

        {section === 'members' ? (
        <>
          <div className="members__stats" aria-label="Sažetak članova">
            <article>
              <span>Aktivni</span>
              <strong>{active.length}</strong>
            </article>
            <article>
              <span>Arhiva</span>
              <strong>{others.length}</strong>
            </article>
            <article>
              <span>Iskorišteni termini</span>
              <strong>{sessionsUsed}</strong>
            </article>
            <article>
              <span>Dolasci ({monthLabelHr()})</span>
              <strong>{visitsThisMonth}</strong>
            </article>
            <article className={endingSoon > 0 ? 'is-warn' : undefined}>
              <span>Ističe uskoro</span>
              <strong>{endingSoon}</strong>
            </article>
          </div>

          {open ? (
            <div
              className="members__modal"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeMemberModal();
              }}
            >
              <form
                className="members__form members__form--modal"
                onSubmit={onAdd}
                noValidate
                role="dialog"
                aria-modal="true"
                aria-labelledby="members-member-title"
              >
                <div className="members__form-head">
                  <div>
                    <h2 id="members-member-title">Novi član</h2>
                    <p>
                      Upišite podatke člana. Sustav generira lozinku i šalje je na e-poštu člana —
                      vi je ne vidite.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="members__modal-close"
                    onClick={closeMemberModal}
                    aria-label="Zatvori"
                  >
                    ×
                  </button>
                </div>
                <div className="members__grid">
                  <label>
                    Ime i prezime
                    <input
                      value={form.name}
                      onChange={(event) => change('name', event.target.value)}
                      autoComplete="name"
                      placeholder="npr. Ana Kovač"
                      autoFocus
                    />
                  </label>
                  <label>
                    E-pošta člana
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => change('email', event.target.value)}
                      autoComplete="email"
                      placeholder="ana@email.com"
                    />
                  </label>
                  <label className="members__field--phone">
                    Telefon
                    <input
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(event) => change('phone', event.target.value)}
                      autoComplete="tel"
                      placeholder="+385 …"
                    />
                  </label>
                  <div className="members__sessions-field">
                    <label>
                      Broj treninga ({monthLabelHr()})
                      <input
                        type="number"
                        min="1"
                        max="200"
                        inputMode="numeric"
                        value={form.sessions}
                        onChange={(event) => change('sessions', event.target.value)}
                        placeholder="npr. 12"
                      />
                    </label>
                    <div className="members__presets" role="group" aria-label="Brzi odabir treninga">
                      {SESSION_PRESETS.map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={Number(form.sessions) === count ? 'is-on' : undefined}
                          onClick={() => change('sessions', String(count))}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    <p className="members__sessions-hint">
                      Koliko termina član ima do kraja mjeseca. Plan se sprema u bazu automatski.
                    </p>
                  </div>
                </div>
                {formError ? <p className="members__error">{formError}</p> : null}
                <div className="members__form-actions">
                  <button
                    className="members__ghost"
                    type="button"
                    onClick={closeMemberModal}
                  >
                    Odustani
                  </button>
                  <button className="members__primary" type="submit" disabled={creating}>
                    {creating ? 'Dodajemo…' : 'Spremi člana'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="members__toolbar">
            <label className="members__search">
              <span className="visually-hidden">Pretraži članove</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Traži ime, e-poštu ili plan…"
              />
            </label>
            <div className="members__filters" role="tablist" aria-label="Filter članova">
              {[
                ['active', `Aktivni (${active.length})`],
                ['archive', `Arhiva (${others.length})`],
                ['all', `Svi (${memberships.length})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  className={filter === id ? 'is-on' : undefined}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {actionError ? <p className="members__error">{actionError}</p> : null}

          {isLoading ? <p className="studio-empty">Učitavamo članove…</p> : null}
          {isError ? (
            <p className="members__error">
              {error?.status === 'FETCH_ERROR'
                ? 'Poslužitelj nije dostupan.'
                : 'Članovi se nisu učitali.'}
            </p>
          ) : null}

          {!isLoading && !isError && visible.length === 0 ? (
            <article className="members__empty">
              <header className="members__panel-head">
                <span className="members__index" aria-hidden="true">01</span>
                <div>
                  <p className="members__kicker">Popis</p>
                  <h2>{query ? 'Nema rezultata' : 'Još nema članova'}</h2>
                  <p>
                    {query
                      ? 'Pokušajte drugi pojam ili promijenite filter.'
                      : 'Dodajte prvog člana da počnete pratiti članarine i termine.'}
                  </p>
                </div>
              </header>
              {!query && !open ? (
                <button className="members__primary" type="button" onClick={() => setOpen(true)}>
                  Dodajte člana
                </button>
              ) : null}
            </article>
          ) : null}

          {visible.length > 0 ? (
            <section className="members__roster">
              <header className="members__panel-head">
                <span className="members__index" aria-hidden="true">01</span>
                <div>
                  <p className="members__kicker">Popis</p>
                  <h2>Članarine</h2>
                  <p>Obnova, termini i status u jednom pregledu.</p>
                </div>
                <p className="members__count">
                  <strong>{visible.length}</strong>
                  <span>prikazano</span>
                </p>
              </header>
              <ul className="members__list">
                {visible.map((item) => {
                  const progress = sessionsProgress(item);
                  const left = daysLeft(item.validUntil);
                  const tone = statusTone(item.status);
                  const name = item.user?.name || 'Član';
                  const busy = busyId === item.id;

                  return (
                    <li key={item.id} className={item.status !== 'ACTIVE' ? 'is-archived' : undefined}>
                      <div className="members__identity">
                        <span className="members__avatar" aria-hidden="true">{initials(name)}</span>
                        <div>
                          <div className="members__title-row">
                            <strong>{name}</strong>
                            <em className={`members__badge is-${tone}`}>{statusLabel(item.status)}</em>
                          </div>
                          <p className="members__meta">
                            <span>{item.user?.email || 'Bez e-pošte'}</span>
                            {item.user?.phone ? <span>{item.user.phone}</span> : null}
                            {item.code ? <span>{item.code}</span> : null}
                          </p>
                        </div>
                      </div>

                      <div className="members__plan">
                        <span className="members__plan-name">{item.planName || 'Plan'}</span>
                        <span className="members__dates">
                          {formatDate(item.validFrom)}
                          {' – '}
                          {formatDate(item.validUntil)}
                        </span>
                        {item.status === 'ACTIVE' && left != null ? (
                          <span className={left <= 7 ? 'members__expiry is-soon' : 'members__expiry'}>
                            {left < 0 ? 'Isteklo' : left === 0 ? 'Ističe danas' : `Još ${left} dana`}
                          </span>
                        ) : null}
                      </div>

                      <div className="members__sessions">
                        <div className="members__sessions-top">
                          <span>Dolasci / paket</span>
                          <strong>{progress.label}</strong>
                        </div>
                        <div
                          className={[
                            'members__bar',
                            progress.unlimited ? 'is-unlimited' : '',
                            !progress.unlimited && progress.ratio >= 0.85 ? 'is-hot' : '',
                          ].filter(Boolean).join(' ')}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={progress.unlimited ? 100 : progress.total}
                          aria-valuenow={progress.unlimited ? 0 : progress.used}
                          aria-label="Iskorišteni termini"
                        >
                          <i style={{ width: progress.unlimited ? '100%' : `${progress.ratio * 100}%` }} />
                        </div>
                      </div>

                      <div className="members__actions">
                        {(item.status === 'ACTIVE' || item.status === 'EXPIRED' || item.status === 'SUSPENDED') ? (
                          <button
                            type="button"
                            onClick={() => onRenew(item)}
                            disabled={busy || creating || removing}
                          >
                            {busy ? 'Radimo…' : 'Obnovite'}
                          </button>
                        ) : null}
                        {item.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => onRemove(item)}
                            disabled={busy || creating || removing}
                          >
                            Uklonite
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <div className="members__stats members__stats--team" aria-label="Sažetak tima">
            <article>
              <span>Aktivni u timu</span>
              <strong>{activeStaff.length}</strong>
            </article>
            <article>
              <span>Treneri</span>
              <strong>{activeStaff.filter((item) => item.role === 'STAFF').length}</strong>
            </article>
            <article>
              <span>Vlasnik</span>
              <strong>{activeStaff.filter((item) => item.role === 'BUSINESS_OWNER').length}</strong>
            </article>
          </div>

          {staffOpen ? (
            <div
              className="members__modal"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeStaffModal();
              }}
            >
              <form
                className="members__form members__form--modal"
                onSubmit={onAddStaff}
                noValidate
                role="dialog"
                aria-modal="true"
                aria-labelledby="members-staff-title"
              >
                <div className="members__form-head">
                  <div>
                    <h2 id="members-staff-title">Novi trener</h2>
                    <p>
                      Dodajte trenera u tim. Članovi ga mogu izabrati pri rezervaciji.
                      Ako je račun nov, lozinka ide na e-poštu.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="members__modal-close"
                    onClick={closeStaffModal}
                    aria-label="Zatvori"
                  >
                    ×
                  </button>
                </div>
                <div className="members__grid">
                  <label>
                    Ime i prezime
                    <input
                      value={staffForm.name}
                      onChange={(event) => changeStaff('name', event.target.value)}
                      autoComplete="name"
                      placeholder="npr. Marko Horvat"
                      autoFocus
                    />
                  </label>
                  <label>
                    E-pošta
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(event) => changeStaff('email', event.target.value)}
                      autoComplete="email"
                      placeholder="marko@studio.hr"
                    />
                  </label>
                  <label className="members__field--phone">
                    Telefon
                    <input
                      type="tel"
                      inputMode="tel"
                      value={staffForm.phone}
                      onChange={(event) => changeStaff('phone', event.target.value)}
                      autoComplete="tel"
                      placeholder="+385 …"
                    />
                  </label>
                  <label>
                    Uloga / naziv
                    <input
                      value={staffForm.title}
                      onChange={(event) => changeStaff('title', event.target.value)}
                      placeholder="Trener"
                    />
                  </label>
                </div>
                {staffFormError ? <p className="members__error">{staffFormError}</p> : null}
                <div className="members__form-actions">
                  <button
                    className="members__ghost"
                    type="button"
                    onClick={closeStaffModal}
                  >
                    Odustani
                  </button>
                  <button className="members__primary" type="submit" disabled={creatingStaff}>
                    {creatingStaff ? 'Dodajemo…' : 'Spremi trenera'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {actionError ? <p className="members__error">{actionError}</p> : null}

          {loadingStaff ? <p className="studio-empty">Učitavamo tim…</p> : null}
          {staffError ? <p className="members__error">Tim se nije učitao.</p> : null}

          {!loadingStaff && !staffError && activeStaff.length === 0 ? (
            <article className="members__empty">
              <header className="members__panel-head">
                <span className="members__index" aria-hidden="true">01</span>
                <div>
                  <p className="members__kicker">Tim</p>
                  <h2>Još nema tima</h2>
                  <p>Dodajte trenera da članovi mogu birati kod koga rezerviraju termin.</p>
                </div>
              </header>
              {!staffOpen ? (
                <button className="members__primary" type="button" onClick={() => setStaffOpen(true)}>
                  Dodajte trenera
                </button>
              ) : null}
            </article>
          ) : null}

          {activeStaff.length > 0 ? (
            <section className="members__roster">
              <header className="members__panel-head">
                <span className="members__index" aria-hidden="true">01</span>
                <div>
                  <p className="members__kicker">Tim</p>
                  <h2>Osoblje</h2>
                  <p>Treneri dostupni pri rezervaciji.</p>
                </div>
                <p className="members__count">
                  <strong>{activeStaff.length}</strong>
                  <span>aktivno</span>
                </p>
              </header>
              <ul className="members__list members__list--team">
                {activeStaff.map((item) => {
                  const busy = busyId === item.id;
                  return (
                    <li key={item.id}>
                      <div className="members__identity">
                        <span className="members__avatar" aria-hidden="true">{initials(item.name)}</span>
                        <div>
                          <div className="members__title-row">
                            <strong>{item.name}</strong>
                            <em className="members__badge is-ok">{item.title || 'Trener'}</em>
                          </div>
                          <p className="members__meta">
                            <span>{item.email || 'Bez e-pošte'}</span>
                            {item.phone ? <span>{item.phone}</span> : null}
                            <span>{item.role === 'BUSINESS_OWNER' ? 'Vlasnik' : 'Trener'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="members__actions">
                        {item.role === 'STAFF' ? (
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => onRemoveStaff(item)}
                            disabled={busy || creatingStaff || removingStaff}
                          >
                            {busy ? 'Radimo…' : 'Uklonite'}
                          </button>
                        ) : (
                          <span className="members__team-note">Uvijek dostupan za rezervacije</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      )}
      </div>
    </section>
  );
}
