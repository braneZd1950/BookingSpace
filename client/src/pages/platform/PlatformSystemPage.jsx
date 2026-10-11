import { useGetPlatformSystemQuery } from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

function StatusPill({ ok, label }) {
  return (
    <span className={`analytics__pill${ok ? ' is-ok' : ' is-off'}`}>
      {label}
    </span>
  );
}

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

export default function PlatformSystemPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetPlatformSystemQuery();

  if (isLoading) {
    return (
      <PlatformSection title="Sustav" lead="Provjeravamo zdravlje platforme…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Sustav" lead="Status trenutno nije dostupan.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  const env = data.environment || {};
  const db = data.database || {};
  const mail = data.mail || {};
  const inventory = data.inventory || {};

  return (
    <PlatformSection
      title="Sustav"
      lead={`Zdravlje platforme · provjera ${formatWhen(data.checkedAt)}. Bez tajnih ključeva.`}
    >
      <div className="analytics__toolbar">
        <p className="analytics__toolbar-note">
          {isFetching ? 'Osvježavamo…' : 'Status servisa'}
        </p>
        <button type="button" className="analytics__refresh" onClick={() => refetch()}>
          Osvježi status
        </button>
      </div>

      <div className="analytics__stats analytics__stats--wide" aria-label="Status">
        <article>
          <span>Baza</span>
          <strong>
            <StatusPill ok={db.ok} label={db.ok ? 'Spojeno' : 'Nedostupno'} />
          </strong>
        </article>
        <article>
          <span>E-pošta</span>
          <strong>
            <StatusPill ok={mail.ok} label={mail.ok ? 'OK' : 'Provjeri'} />
          </strong>
        </article>
        <article>
          <span>Cloudinary</span>
          <strong>
            <StatusPill
              ok={Boolean(data.cloudinary?.configured)}
              label={data.cloudinary?.configured ? 'Postavljeno' : 'Nije'}
            />
          </strong>
        </article>
        <article>
          <span>Okruženje</span>
          <strong className="analytics__env">{env.nodeEnv || '—'}</strong>
        </article>
      </div>

      <section className="analytics__block">
        <h2>Servisi</h2>
        <ul className="analytics__kv">
          <li>
            <span>MongoDB</span>
            <strong>
              {db.ok ? 'Spojeno' : 'Nije spojeno'}
              {db.host ? ` · ${db.host}` : ''}
              {db.name ? ` / ${db.name}` : ''}
            </strong>
          </li>
          <li>
            <span>SMTP</span>
            <strong>
              {mail.configured ? (mail.host || 'konfiguriran') : 'nije konfiguriran'}
              {' · '}
              {mail.message || mail.mode || '—'}
            </strong>
          </li>
          <li>
            <span>EMAIL_FROM</span>
            <strong>{mail.fromSet ? 'postavljen' : 'nije postavljen'}</strong>
          </li>
          <li>
            <span>CLIENT_ORIGIN</span>
            <strong>{env.clientOrigin || '—'}</strong>
          </li>
          <li>
            <span>API port</span>
            <strong>{env.port || '—'}</strong>
          </li>
          <li>
            <span>ADMIN_EMAILS</span>
            <strong>
              {env.adminEmailsConfigured || 0}
              {' '}
              adresa
            </strong>
          </li>
        </ul>
      </section>

      <section className="analytics__block">
        <h2>Inventar</h2>
        <div className="analytics__stats analytics__stats--wide">
          <article>
            <span>Studiji</span>
            <strong>{inventory.tenants || 0}</strong>
          </article>
          <article>
            <span>Korisnici</span>
            <strong>{inventory.users || 0}</strong>
          </article>
          <article>
            <span>Aktivne članarine</span>
            <strong>{inventory.activeMemberships || 0}</strong>
          </article>
          <article>
            <span>Potvrđene rezervacije</span>
            <strong>{inventory.confirmedBookings || 0}</strong>
          </article>
          <article>
            <span>Usage eventi</span>
            <strong>{inventory.events || 0}</strong>
          </article>
        </div>
      </section>
    </PlatformSection>
  );
}
