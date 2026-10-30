import { useOutletContext } from 'react-router-dom';
import { PLATFORM_POLL, useGetPlatformSystemQuery } from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformSystemPage.scss';

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCount(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value) || 0);
}

export default function PlatformSystemPage() {
  const { me } = useOutletContext() || {};
  const { data, isLoading, isError, refetch, isFetching } = useGetPlatformSystemQuery(
    undefined,
    PLATFORM_POLL.system,
  );

  if (isLoading) {
    return (
      <main className="platform-system">
        <div className="platform-system__stage">
          <p className="platform-system__lede">Provjeravamo zdravlje platforme…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-system">
        <div className="platform-system__stage">
          <header className="platform-system__head">
            <div>
              <p className="platform-system__eyebrow">Platforma</p>
              <h1>Sustav</h1>
              <p className="platform-system__lede">Status trenutno nije dostupan.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  const env = data.environment || {};
  const db = data.database || {};
  const mail = data.mail || {};
  const inventory = data.inventory || {};
  const cloudinaryOk = Boolean(data.cloudinary?.configured);

  const services = [
    {
      key: 'mongo',
      label: 'MongoDB',
      value: [
        db.ok ? 'Spojeno' : 'Nije spojeno',
        db.host || null,
        db.name ? `/ ${db.name}` : null,
      ].filter(Boolean).join(' · ').replace(' · / ', ' / '),
      ok: Boolean(db.ok),
    },
    {
      key: 'smtp',
      label: 'SMTP',
      value: [
        mail.configured ? (mail.host || 'konfiguriran') : 'nije konfiguriran',
        mail.message || mail.mode || '—',
      ].join(' · '),
      ok: Boolean(mail.ok),
    },
    {
      key: 'from',
      label: 'EMAIL_FROM',
      value: mail.fromSet ? 'postavljen' : 'nije postavljen',
      ok: Boolean(mail.fromSet),
    },
    {
      key: 'origin',
      label: 'CLIENT_ORIGIN',
      value: env.clientOrigin || '—',
      ok: Boolean(env.clientOrigin),
    },
    {
      key: 'port',
      label: 'API port',
      value: String(env.port || '—'),
      ok: Boolean(env.port),
    },
    {
      key: 'admins',
      label: 'ADMIN_EMAILS',
      value: `${env.adminEmailsConfigured || 0} adresa`,
      ok: Number(env.adminEmailsConfigured) > 0,
    },
  ];

  return (
    <main className="platform-system">
      <div className="platform-system__atmosphere" aria-hidden="true">
        <span className="platform-system__wash" />
        <span className="platform-system__grain" />
      </div>

      <div className="platform-system__stage">
        <header className="platform-system__head">
          <div>
            <p className="platform-system__eyebrow">Platforma</p>
            <h1>Sustav</h1>
            <p className="platform-system__lede">
              Zdravlje platforme · provjera
              {' '}
              {formatWhen(data.checkedAt)}
              . Bez tajnih ključeva.
            </p>
          </div>
          <div className="platform-system__head-actions">
            <p className={`platform-system__live${isFetching ? ' is-busy' : ''}`}>
              {isFetching ? 'osvježavanje' : 'uživo'}
            </p>
            <button
              type="button"
              className="platform-system__refresh"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Osvježi status
            </button>
            <ArchiveExportButton
              build={() => ({
                title: 'Status sustava platforme',
                subtitle: `Provjera ${formatWhen(data.checkedAt)}. Bez tajnih ključeva.`,
                fileStem: 'sustav',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Baza', value: db.ok ? 'Spojeno' : 'Nedostupno' },
                  { label: 'E-pošta', value: mail.ok ? 'OK' : 'Provjeri' },
                  { label: 'Cloudinary', value: cloudinaryOk ? 'Postavljeno' : 'Nije' },
                  { label: 'Okruženje', value: env.nodeEnv || '—' },
                ],
                sections: [
                  {
                    title: 'Servisi',
                    columns: ['Servis', 'Status', 'Detalj'],
                    rows: services.map((item) => [
                      item.label,
                      item.ok ? 'OK' : 'Provjeri',
                      item.value,
                    ]),
                  },
                  {
                    title: 'Inventar',
                    columns: ['Stavka', 'Vrijednost'],
                    rows: [
                      ['Studiji', formatCount(inventory.tenants)],
                      ['Korisnici', formatCount(inventory.users)],
                      ['Aktivne članarine', formatCount(inventory.activeMemberships)],
                      ['Potvrđene rezervacije', formatCount(inventory.confirmedBookings)],
                      ['Usage eventi', formatCount(inventory.events)],
                    ],
                  },
                ],
                notes: [
                  'Operativni snimak zdravlja sustava za internu arhivu.',
                  'Tajni ključevi i lozinke nisu uključeni.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-system__metrics" aria-label="Status">
          <article>
            <span>Baza</span>
            <strong>
              <span className={`platform-system__pill${db.ok ? ' is-ok' : ' is-off'}`}>
                {db.ok ? 'Spojeno' : 'Nedostupno'}
              </span>
            </strong>
          </article>
          <article>
            <span>E-pošta</span>
            <strong>
              <span className={`platform-system__pill${mail.ok ? ' is-ok' : ' is-off'}`}>
                {mail.ok ? 'OK' : 'Provjeri'}
              </span>
            </strong>
          </article>
          <article>
            <span>Cloudinary</span>
            <strong>
              <span className={`platform-system__pill${cloudinaryOk ? ' is-ok' : ' is-off'}`}>
                {cloudinaryOk ? 'Postavljeno' : 'Nije'}
              </span>
            </strong>
          </article>
          <article>
            <span>Okruženje</span>
            <strong className="platform-system__env">{env.nodeEnv || '—'}</strong>
          </article>
        </section>

        <section className="platform-system__block" aria-labelledby="services-title">
          <header className="platform-system__block-head">
            <span className="platform-system__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-system__kicker">Infrastruktura</p>
              <h2 id="services-title">Servisi</h2>
              <p>Konfiguracija bez tajnih vrijednosti.</p>
            </div>
          </header>

          <ul className="platform-system__services">
            {services.map((item, index) => (
              <li key={item.key}>
                <span className="platform-system__n" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="platform-system__service-body">
                  <div className="platform-system__title">
                    <strong>{item.label}</strong>
                    <span className={`platform-system__pill${item.ok ? ' is-ok' : ' is-off'}`}>
                      {item.ok ? 'OK' : 'Provjeri'}
                    </span>
                  </div>
                  <p className="platform-system__value">{item.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="platform-system__block" aria-labelledby="inventory-title">
          <header className="platform-system__block-head">
            <span className="platform-system__index" aria-hidden="true">02</span>
            <div>
              <p className="platform-system__kicker">Podaci</p>
              <h2 id="inventory-title">Inventar</h2>
              <p>Trenutni brojevi na platformi.</p>
            </div>
          </header>

          <section className="platform-system__inventory" aria-label="Inventar">
            <article>
              <span>Studiji</span>
              <strong>{formatCount(inventory.tenants)}</strong>
            </article>
            <article>
              <span>Korisnici</span>
              <strong>{formatCount(inventory.users)}</strong>
            </article>
            <article>
              <span>Aktivne članarine</span>
              <strong>{formatCount(inventory.activeMemberships)}</strong>
            </article>
            <article>
              <span>Potvrđene rezervacije</span>
              <strong>{formatCount(inventory.confirmedBookings)}</strong>
            </article>
            <article>
              <span>Usage eventi</span>
              <strong>{formatCount(inventory.events)}</strong>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}
