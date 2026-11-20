import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  useCreateServiceMutation,
  useListServicesQuery,
  useUpdateServiceMutation,
} from '../../api/serviceApi.js';
import FilterTabBar from '../../components/FilterTabBar.jsx';
import { formatCancellationWindow } from './studioTime.js';
import './ServicesPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const DURATION_PRESETS = [30, 45, 60, 90];
const CAPACITY_PRESETS = [1, 6, 8, 12];
const CANCEL_PRESETS = [0, 30, 60, 120];

const emptyForm = {
  name: 'Termin',
  description: '',
  duration: '60',
  capacity: '12',
  cancelWindow: '60',
  membershipRequired: true,
};

function Shell({ children }) {
  return (
    <section className="studio-panel services">
      <div className="services__atmosphere" aria-hidden="true">
        <span className="services__wash" />
        <span className="services__grain" />
      </div>
      <div className="services__stage">{children}</div>
    </section>
  );
}

export default function ServicesPage() {
  const { studio } = useOutletContext();
  const tenantId = String(studio?.id || '');
  const ready = REAL_ID.test(tenantId);
  const { data, isLoading, isError } = useListServicesQuery(tenantId, { skip: !ready });
  const [createService, { isLoading: creating }] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();

  const [filter, setFilter] = useState('active');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const services = data?.services || [];
  const activeServices = useMemo(
    () => services.filter((item) => item.active !== false),
    [services],
  );
  const visible = useMemo(
    () => (filter === 'active' ? activeServices : services),
    [filter, activeServices, services],
  );

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setNotice('');
    setOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || 'Termin',
      description: item.description || '',
      duration: String(item.durationMinutes ?? 60),
      capacity: String(item.capacity ?? 12),
      cancelWindow: String(item.cancellationWindowMinutes ?? 60),
      membershipRequired: item.membershipRequired !== false,
    });
    setFormError('');
    setNotice('');
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function onSave(event) {
    event.preventDefault();
    setFormError('');
    if (!ready) {
      setFormError('Studio još nije u bazi.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Upišite naziv usluge.');
      return;
    }
    const durationMinutes = Number(form.duration);
    const capacity = Number(form.capacity);
    const cancellationWindowMinutes = Number(form.cancelWindow);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setFormError('Upišite trajanje u minutama.');
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setFormError('Upišite kapacitet (najmanje 1).');
      return;
    }
    if (!Number.isFinite(cancellationWindowMinutes) || cancellationWindowMinutes < 0) {
      setFormError('Upišite rok otkaza u minutama.');
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationMinutes,
      slotIntervalMinutes: durationMinutes,
      capacity,
      cancellationWindowMinutes,
      price: 0,
      membershipRequired: form.membershipRequired,
    };

    try {
      if (editingId) {
        await updateService({ serviceId: editingId, body }).unwrap();
        setNotice('Usluga je spremljena.');
      } else {
        await createService({ tenantId, body }).unwrap();
        setNotice('Usluga je dodana.');
        setFilter('active');
      }
      closeModal();
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan.');
        return;
      }
      setFormError('Usluga nije spremljena. Provjerite podatke i pokušajte ponovno.');
    }
  }

  async function onToggleActive(item) {
    setActionError('');
    setBusyId(item.id);
    try {
      const nextActive = item.active === false;
      await updateService({
        serviceId: item.id,
        body: { active: nextActive },
      }).unwrap();
      setNotice(
        nextActive
          ? `${item.name || 'Usluga'} je ponovno aktivna.`
          : `${item.name || 'Usluga'} je deaktivirana.`,
      );
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setActionError('Poslužitelj nije dostupan.');
        return;
      }
      setActionError('Status usluge nije promijenjen.');
    } finally {
      setBusyId('');
    }
  }

  if (!ready) {
    return (
      <Shell>
        <p className="services__eyebrow">Ponuda</p>
        <h1>Usluge</h1>
        <p className="services__lede">Studio još nije u bazi.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="services__head">
        <div>
          <p className="services__eyebrow">Ponuda</p>
          <h1>Usluge</h1>
          <p className="services__lede">
            Naziv, trajanje, kapacitet i rok otkaza — ovo članovi biraju pri rezervaciji.
          </p>
        </div>
        <button className="services__primary" type="button" onClick={openCreate}>
          Dodajte uslugu
        </button>
      </header>

      <div className="services__stats" aria-label="Sažetak usluga">
        <article>
          <span>Aktivne</span>
          <strong>{activeServices.length}</strong>
        </article>
        <article>
          <span>Sve</span>
          <strong>{services.length}</strong>
        </article>
      </div>

      {notice ? <p className="services__notice" role="status">{notice}</p> : null}
      {actionError ? <p className="services__error">{actionError}</p> : null}

      {open ? (
        <div
          className="services__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="services-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form className="services__sheet" onSubmit={onSave}>
            <div className="services__sheet-glow" aria-hidden="true" />
            <header className="services__sheet-head">
              <div>
                <p className="services__sheet-eyebrow">
                  {editingId ? 'Izmjena' : 'Nova stavka'}
                </p>
                <h2 id="services-modal-title">
                  {editingId ? 'Uredi uslugu' : 'Nova usluga'}
                </h2>
              </div>
              <button
                className="services__modal-close"
                type="button"
                aria-label="Zatvori"
                onClick={closeModal}
              >
                <span aria-hidden="true" />
              </button>
            </header>

            <div className="services__sheet-body">
              <label className="services__field">
                <span>Naziv usluge</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))}
                  placeholder="npr. Personalni trening"
                  autoFocus
                />
              </label>
              <label className="services__field">
                <span>Kratki opis</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))}
                  placeholder="npr. Trening jedan na jedan"
                  rows={3}
                />
              </label>

              <fieldset className="services__block">
                <legend>Trajanje i kapacitet</legend>
                <div className="services__pair">
                  <label className="services__field">
                    <span>Trajanje (min)</span>
                    <input
                      inputMode="numeric"
                      value={form.duration}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))}
                    />
                  </label>
                  <label className="services__field">
                    <span>Kapacitet</span>
                    <input
                      inputMode="numeric"
                      value={form.capacity}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        capacity: event.target.value,
                      }))}
                    />
                  </label>
                </div>
                <div className="services__segment" role="group" aria-label="Brzo trajanje">
                  <p>Trajanje</p>
                  <div>
                    {DURATION_PRESETS.map((value) => (
                      <button
                        key={`d-${value}`}
                        type="button"
                        className={String(value) === form.duration ? 'is-on' : undefined}
                        onClick={() => setForm((current) => ({
                          ...current,
                          duration: String(value),
                        }))}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="services__segment" role="group" aria-label="Brzi kapacitet">
                  <p>Mjesta</p>
                  <div>
                    {CAPACITY_PRESETS.map((value) => (
                      <button
                        key={`c-${value}`}
                        type="button"
                        className={String(value) === form.capacity ? 'is-on' : undefined}
                        onClick={() => setForm((current) => ({
                          ...current,
                          capacity: String(value),
                        }))}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </fieldset>

              <fieldset className="services__block">
                <legend>Otkaz i članarina</legend>
                <label className="services__field">
                  <span>Rok otkaza (min)</span>
                  <input
                    inputMode="numeric"
                    value={form.cancelWindow}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      cancelWindow: event.target.value,
                    }))}
                  />
                </label>
                <div className="services__segment services__segment--wide" role="group" aria-label="Brzi rok otkaza">
                  <p>Rok</p>
                  <div>
                    {CANCEL_PRESETS.map((value) => (
                      <button
                        key={`k-${value}`}
                        type="button"
                        className={String(value) === form.cancelWindow ? 'is-on' : undefined}
                        onClick={() => setForm((current) => ({
                          ...current,
                          cancelWindow: String(value),
                        }))}
                      >
                        {value === 0 ? 'Bez' : value}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`services__toggle${form.membershipRequired ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={form.membershipRequired}
                  onClick={() => setForm((current) => ({
                    ...current,
                    membershipRequired: !current.membershipRequired,
                  }))}
                >
                  <span className="services__toggle-track" aria-hidden="true">
                    <span className="services__toggle-thumb" />
                  </span>
                  <span className="services__toggle-copy">
                    <strong>Zahtijeva aktivnu članarinu</strong>
                    <small>
                      {form.membershipRequired
                        ? 'Samo članovi s aktivnom članarinom mogu rezervirati.'
                        : 'Otvoreno i bez aktivne članarine.'}
                    </small>
                  </span>
                </button>
              </fieldset>

              {formError ? <p className="services__error">{formError}</p> : null}
            </div>

            <div className="services__sheet-actions">
              <button className="services__ghost" type="button" onClick={closeModal}>
                Odustani
              </button>
              <button className="services__primary" type="submit" disabled={creating}>
                {creating ? 'Spremamo…' : editingId ? 'Spremi izmjene' : 'Dodaj uslugu'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="services__toolbar">
        <FilterTabBar
          className="services__filters"
          aria-label="Filter usluga"
          value={filter}
          onChange={setFilter}
          options={[
            ['active', `Aktivne (${activeServices.length})`],
            ['all', `Sve (${services.length})`],
          ]}
        />
      </div>

      {isLoading ? <p className="services__lede">Učitavamo usluge…</p> : null}
      {isError ? <p className="services__error">Usluge se nisu učitale.</p> : null}

      {!isLoading && !isError && visible.length === 0 ? (
        <article className="services__empty">
          <p className="services__kicker">Popis</p>
          <h2>Još nema usluga</h2>
          <p>Dodajte prvu uslugu da članovi mogu rezervirati termine.</p>
          <button className="services__primary" type="button" onClick={openCreate}>
            Dodajte uslugu
          </button>
        </article>
      ) : null}

      {!isLoading && visible.length > 0 ? (
        <ul className="services__list">
          {visible.map((item) => {
            const active = item.active !== false;
            const busy = busyId === item.id;
            return (
              <li key={item.id} className={active ? undefined : 'is-muted'}>
                <div className="services__row-copy">
                  <div className="services__row-title">
                    <h2>{item.name || 'Usluga'}</h2>
                    <span className={active ? 'is-ok' : 'is-off'}>
                      {active ? 'Aktivno' : 'Neaktivno'}
                    </span>
                  </div>
                  {item.description ? (
                    <p>{item.description}</p>
                  ) : null}
                  <p>
                    {item.durationMinutes || '—'}
                    {' '}
                    min · max
                    {' '}
                    {item.capacity || '—'}
                    {item.membershipRequired ? ' · članarina' : ''}
                  </p>
                  <p className="services__meta">
                    Otkaz:
                    {' '}
                    {formatCancellationWindow(item.cancellationWindowMinutes)}
                  </p>
                </div>
                <div className="services__actions">
                  <button type="button" onClick={() => openEdit(item)}>
                    Uredi
                  </button>
                  <button
                    type="button"
                    className={active ? 'is-danger' : undefined}
                    disabled={Boolean(busyId)}
                    onClick={() => {
                      void onToggleActive(item);
                    }}
                  >
                    {busy ? '…' : active ? 'Deaktiviraj' : 'Aktiviraj'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Shell>
  );
}
