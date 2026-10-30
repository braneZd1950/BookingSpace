import { useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import {
  useCreatePlatformStaffMutation,
  useListPlatformStaffQuery,
  useRemovePlatformStaffMutation,
} from '../../api/platformStaffApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './AdminStaffPage.scss';

const empty = { name: '', email: '', phone: '', password: '' };

function roleLabel(role) {
  if (role === 'ADMIN') return 'Super admin';
  if (role === 'PLATFORM_STAFF') return 'Djelatnik';
  return role;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

export default function AdminStaffPage() {
  const { me } = useOutletContext();
  const isSuper = Boolean(me?.platformSuperAdmin);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [createdSecret, setCreatedSecret] = useState('');

  const { data, isLoading, isError, refetch } = useListPlatformStaffQuery(undefined, {
    skip: !isSuper,
  });
  const [createStaff, { isLoading: creating }] = useCreatePlatformStaffMutation();
  const [removeStaff, { isLoading: removing }] = useRemovePlatformStaffMutation();

  const staff = data?.staff || [];
  const summary = data?.summary || { total: 0, admins: 0, operators: 0 };

  const operators = useMemo(
    () => staff.filter((item) => item.role === 'PLATFORM_STAFF'),
    [staff],
  );
  const supers = useMemo(
    () => staff.filter((item) => item.role === 'ADMIN'),
    [staff],
  );

  if (!isSuper) {
    return <Navigate to="/admin" replace />;
  }

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage({ type: '', text: '' });
  }

  async function onCreate(event) {
    event.preventDefault();
    setCreatedSecret('');
    setMessage({ type: '', text: '' });
    if (!form.name.trim() || !form.email.trim()) {
      setMessage({ type: 'error', text: 'Upišite ime i e-poštu.' });
      return;
    }
    try {
      const result = await createStaff({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
      }).unwrap();
      setForm(empty);
      if (result.temporaryPassword) {
        setCreatedSecret(result.temporaryPassword);
        setMessage({
          type: 'ok',
          text: 'Djelatnik je dodan. Privremenu lozinku pokažite samo jednom.',
        });
      } else {
        setMessage({ type: 'ok', text: 'Djelatnik je dodan / ažuriran.' });
      }
      refetch();
    } catch (error) {
      const code = error?.data?.code;
      const map = {
        STAFF_EXISTS: 'Taj račun je već djelatnik.',
        IS_SUPER_ADMIN: 'Super admin se ne mijenja ovdje.',
        EMAIL_IS_OWNER: 'E-pošta pripada vlasniku studija.',
        EMAIL_IS_STUDIO_STAFF: 'E-pošta pripada osoblju studija.',
        WEAK_PASSWORD: 'Lozinka mora imati barem 8 znakova.',
      };
      setMessage({
        type: 'error',
        text: map[code] || error?.data?.message || 'Spremanje nije uspjelo.',
      });
    }
  }

  async function onRemove(item) {
    if (!window.confirm(`Ukloniti pristup za ${item.name}?`)) return;
    setMessage({ type: '', text: '' });
    try {
      await removeStaff(item.id).unwrap();
      setMessage({ type: 'ok', text: `${item.name} više nije djelatnik platforme.` });
      refetch();
    } catch (error) {
      const code = error?.data?.code;
      setMessage({
        type: 'error',
        text: code === 'IS_SUPER_ADMIN'
          ? 'Super admin se ne uklanja ovdje.'
          : (error?.data?.message || 'Uklanjanje nije uspjelo.'),
      });
    }
  }

  if (isLoading) {
    return (
      <main className="admin-staff">
        <div className="admin-staff__stage">
          <p className="admin-staff__lede">Učitavamo…</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="admin-staff">
        <div className="admin-staff__stage">
          <header className="admin-staff__head">
            <div>
              <p className="admin-staff__eyebrow">Platforma</p>
              <h1>Djelatnici</h1>
              <p className="admin-staff__lede">Popis trenutno nije dostupan.</p>
            </div>
          </header>
          <p className="admin-staff__back">
            <Link to="/admin">← Administracija</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-staff">
      <div className="admin-staff__atmosphere" aria-hidden="true">
        <span className="admin-staff__wash" />
        <span className="admin-staff__grain" />
      </div>

      <div className="admin-staff__stage">
        <header className="admin-staff__head">
          <div>
            <p className="admin-staff__eyebrow">Platforma</p>
            <h1>Djelatnici platforme</h1>
            <p className="admin-staff__lede">
              Super admin ostaje samo u bazi. Ovdje dodajete operatere koji se
              prijavljuju preko /login.
            </p>
          </div>
          <div className="admin-staff__head-actions">
            <p className="admin-staff__back">
              <Link to="/admin">← Administracija</Link>
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Djelatnici i pristup platformi',
                subtitle: 'Popis operatera i super admina. Lozinke nisu uključene.',
                fileStem: 'djelatnici',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Ukupno', value: formatCount(summary.total) },
                  { label: 'Super admin', value: formatCount(summary.admins) },
                  { label: 'Djelatnici', value: formatCount(summary.operators) },
                ],
                sections: [
                  {
                    title: 'Operateri (PLATFORM_STAFF)',
                    columns: ['Ime', 'E-pošta', 'Telefon', 'Dodan'],
                    rows: operators.map((item) => [
                      item.name || '—',
                      item.email || '—',
                      item.phone || '—',
                      formatDate(item.createdAt),
                    ]),
                  },
                  {
                    title: 'Super admini (samo čitanje)',
                    lead: 'Dodaju se ručno u MongoDB; API ih ne stvara ni ne briše.',
                    columns: ['Ime', 'E-pošta', 'Uloga'],
                    rows: supers.map((item) => [
                      item.name || '—',
                      item.email || '—',
                      roleLabel(item.role),
                    ]),
                  },
                ],
                notes: [
                  'Evidencija pristupa administraciji — čuvajte kao sigurnosnu arhivu.',
                  'Privremene lozinke se ne ispisuju u PDF-u.',
                ],
              })}
            />
          </div>
        </header>

        <section className="admin-staff__metrics" aria-label="Sažetak">
          <article>
            <span>Ukupno</span>
            <strong>{formatCount(summary.total)}</strong>
          </article>
          <article>
            <span>Super admin</span>
            <strong>{formatCount(summary.admins)}</strong>
          </article>
          <article>
            <span>Djelatnici</span>
            <strong>{formatCount(summary.operators)}</strong>
          </article>
        </section>

        <section className="admin-staff__block" aria-labelledby="new-staff-title">
          <header className="admin-staff__block-head">
            <span className="admin-staff__index" aria-hidden="true">01</span>
            <div>
              <p className="admin-staff__kicker">Pristup</p>
              <h2 id="new-staff-title">Novi djelatnik</h2>
              <p>Operater dobiva PLATFORM_STAFF i ulazi preko /login.</p>
            </div>
          </header>

          <form className="admin-staff__form" onSubmit={onCreate}>
            <div className="admin-staff__grid">
              <label>
                Ime i prezime
                <input
                  value={form.name}
                  onChange={(event) => change('name', event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                E-pošta
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => change('email', event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Telefon
                <input
                  value={form.phone}
                  onChange={(event) => change('phone', event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label>
                Lozinka (opcionalno)
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => change('password', event.target.value)}
                  autoComplete="new-password"
                  placeholder="Ako prazno — generiramo privremenu"
                />
              </label>
            </div>
            <button className="admin-staff__submit" type="submit" disabled={creating}>
              {creating ? 'Spremamo…' : 'Dodajte djelatnika'}
            </button>
          </form>

          {message.text ? (
            <p className={`admin-staff__msg${message.type === 'error' ? ' is-error' : ' is-ok'}`}>
              {message.text}
            </p>
          ) : null}

          {createdSecret ? (
            <p className="admin-staff__secret">
              Privremena lozinka:
              {' '}
              <code>{createdSecret}</code>
            </p>
          ) : null}
        </section>

        <section className="admin-staff__block" aria-labelledby="ops-title">
          <header className="admin-staff__block-head">
            <span className="admin-staff__index" aria-hidden="true">02</span>
            <div>
              <p className="admin-staff__kicker">Operateri</p>
              <h2 id="ops-title">Djelatnici</h2>
              <p>
                {operators.length === 0
                  ? 'Još nema djelatnika. Dodajte prvog iznad.'
                  : `${operators.length} aktivnih računa.`}
              </p>
            </div>
          </header>

          {operators.length === 0 ? (
            <p className="admin-staff__empty">Još nema djelatnika. Dodajte prvog iznad.</p>
          ) : (
            <ul className="admin-staff__list">
              {operators.map((item, index) => (
                <li key={item.id}>
                  <span className="admin-staff__n" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="admin-staff__identity">
                    <div className="admin-staff__title">
                      <strong>{item.name}</strong>
                      <span className="admin-staff__pill is-staff">Djelatnik</span>
                    </div>
                    <p className="admin-staff__sub">{item.email}</p>
                    {item.phone ? (
                      <p className="admin-staff__sub">{item.phone}</p>
                    ) : null}
                  </div>
                  <div className="admin-staff__side">
                    <p className="admin-staff__joined">
                      <span>Dodan</span>
                      <strong>{formatDate(item.createdAt)}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      disabled={removing}
                    >
                      Uklonite
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-staff__block" aria-labelledby="super-title">
          <header className="admin-staff__block-head">
            <span className="admin-staff__index" aria-hidden="true">03</span>
            <div>
              <p className="admin-staff__kicker">Samo čitanje</p>
              <h2 id="super-title">Super admini</h2>
              <p>
                Dodaju se ručno u MongoDB (`role: &quot;ADMIN&quot;`). API ih ne stvara ni
                ne briše.
              </p>
            </div>
          </header>

          {supers.length === 0 ? (
            <p className="admin-staff__empty">Nema super admina u odgovoru.</p>
          ) : (
            <ul className="admin-staff__list">
              {supers.map((item, index) => (
                <li key={item.id}>
                  <span className="admin-staff__n" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="admin-staff__identity">
                    <div className="admin-staff__title">
                      <strong>{item.name}</strong>
                      <span className="admin-staff__pill is-admin">
                        {roleLabel(item.role)}
                      </span>
                    </div>
                    <p className="admin-staff__sub">{item.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
