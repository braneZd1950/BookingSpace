import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  PLATFORM_POLL,
  useGetPlatformBillingQuery,
  useSendBillingInvoiceMutation,
  useSendBillingWarningMutation,
  useUpdatePlatformBillingMutation,
} from '../../api/analyticsApi.js';
import ArchiveExportButton from '../../components/ArchiveExportButton.jsx';
import { archiveAuthor } from '../../lib/archivePdf.js';
import './PlatformBillingPage.scss';

const planLabel = {
  pilot: 'Pilot',
  standard: 'Standard',
};

function formatDate(value) {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${Number(d)}.${Number(m)}.${y}.`;
  }
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

function daysLabel(daysLeft) {
  if (daysLeft == null) return '—';
  if (daysLeft < 0) return `${Math.abs(daysLeft)} d. kasni`;
  if (daysLeft === 0) return 'Danas';
  return `${daysLeft} d.`;
}

function pillClass(bucket) {
  if (bucket === 'paid') return 'is-ok';
  if (bucket === 'trial') return 'is-trial';
  if (bucket === 'expiring') return 'is-warn';
  if (bucket === 'unpaid' || bucket === 'expired') return 'is-off';
  return '';
}

export default function PlatformBillingPage() {
  const { me } = useOutletContext() || {};
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [flash, setFlash] = useState('');
  const { data, isLoading, isError, isFetching, refetch } = useGetPlatformBillingQuery(
    undefined,
    PLATFORM_POLL.billing,
  );
  const [updateBilling] = useUpdatePlatformBillingMutation();
  const [sendWarning] = useSendBillingWarningMutation();
  const [sendInvoice] = useSendBillingInvoiceMutation();

  const studios = data?.studios || [];
  const summary = data?.summary || {
    total: 0,
    paid: 0,
    trial: 0,
    expiring: 0,
    unpaid: 0,
    expired: 0,
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return studios.filter((item) => {
      if (filter !== 'all' && item.bucket !== filter) return false;
      if (!needle) return true;
      const hay = [item.name, item.slug, item.email, item.ownerEmail, item.ownerName]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [studios, query, filter]);

  async function runAction(id, label, action) {
    setBusyId(id);
    setFlash('');
    try {
      const result = await action();
      const to = result?.to ? ` → ${result.to}` : '';
      setFlash(`${label}${to}`);
      await refetch();
    } catch (error) {
      const message = error?.data?.message || error?.error || 'Akcija nije uspjela.';
      setFlash(message);
    } finally {
      setBusyId('');
    }
  }

  if (isLoading) {
    return (
      <main className="platform-billing">
        <div className="platform-billing__stage">
          <p className="platform-billing__lede">Učitavamo pretplate…</p>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="platform-billing">
        <div className="platform-billing__stage">
          <header className="platform-billing__head">
            <div>
              <p className="platform-billing__eyebrow">Platforma</p>
              <h1>Plaćanja</h1>
              <p className="platform-billing__lede">Podaci trenutno nisu dostupni.</p>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="platform-billing">
      <div className="platform-billing__atmosphere" aria-hidden="true">
        <span className="platform-billing__wash" />
        <span className="platform-billing__grain" />
      </div>

      <div className="platform-billing__stage">
        <header className="platform-billing__head">
          <div>
            <p className="platform-billing__eyebrow">Platforma</p>
            <h1>Plaćanja</h1>
            <p className="platform-billing__lede">
              Pretplate partnera · stanje na
              {' '}
              {formatDate(data.today)}
              . Upozorenja i pripremni e-računi idu na e-poštu studija.
            </p>
          </div>
          <div className="platform-billing__head-actions">
            <p className={`platform-billing__live${isFetching ? ' is-busy' : ''}`}>
              uživo
            </p>
            <ArchiveExportButton
              build={() => ({
                title: 'Pretplate i plaćanja partnera',
                subtitle: `Stanje na ${formatDate(data.today)}. Financijski pregled pretplata studija.`,
                fileStem: 'placanja',
                generatedBy: archiveAuthor(me),
                summary: [
                  { label: 'Ukupno', value: formatCount(summary.total) },
                  { label: 'Plaćeno', value: formatCount(summary.paid) },
                  { label: 'Probni', value: formatCount(summary.trial) },
                  { label: 'Pred istek', value: formatCount(summary.expiring) },
                  { label: 'Neplaćeno', value: formatCount(summary.unpaid) },
                  { label: 'Isteklo', value: formatCount(summary.expired) },
                ],
                sections: [{
                  title: 'Pretplate',
                  lead: `Ispisano ${studios.length} studija.`,
                  columns: ['Studio', 'Slug', 'Kontakt', 'Stanje', 'Plan', 'Vrijedi do', 'Preostalo', 'Iznos', 'Upozorenje', 'E-račun'],
                  rows: studios.map((item) => [
                    item.name || '—',
                    item.slug ? `/s/${item.slug}` : '—',
                    item.email || '—',
                    item.label || item.bucket || '—',
                    planLabel[item.plan] || item.plan || '—',
                    formatDate(item.validUntil),
                    daysLabel(item.daysLeft),
                    item.amount > 0 ? `${item.amount} ${item.currency || 'EUR'}` : '—',
                    formatDate(item.lastWarningSentAt),
                    formatDate(item.lastInvoiceSentAt),
                  ]),
                }],
                notes: [
                  'Dokument je namijenjen knjigovodstvenoj / ugovornoj arhivi izvan baze.',
                  'E-računi i upozorenja šalju se na e-poštu studija; ovdje je samo trag stanja.',
                ],
              })}
            />
          </div>
        </header>

        <section className="platform-billing__metrics" aria-label="Sažetak plaćanja">
          <article>
            <span>Ukupno</span>
            <strong>{formatCount(summary.total)}</strong>
          </article>
          <article>
            <span>Plaćeno</span>
            <strong>{formatCount(summary.paid)}</strong>
          </article>
          <article>
            <span>Probni</span>
            <strong>{formatCount(summary.trial)}</strong>
          </article>
          <article>
            <span>Pred istek</span>
            <strong>{formatCount(summary.expiring)}</strong>
          </article>
          <article>
            <span>Neplaćeno</span>
            <strong>{formatCount(summary.unpaid)}</strong>
          </article>
          <article>
            <span>Isteklo</span>
            <strong>{formatCount(summary.expired)}</strong>
          </article>
        </section>

        <section className="platform-billing__block" aria-labelledby="billing-list-title">
          <header className="platform-billing__block-head">
            <span className="platform-billing__index" aria-hidden="true">01</span>
            <div>
              <p className="platform-billing__kicker">Pretplate</p>
              <h2 id="billing-list-title">Popis partnera</h2>
              <p>
                Prikazano
                {' '}
                {visible.length}
                {' '}
                od
                {' '}
                {summary.total}
                .
              </p>
            </div>
          </header>

          <div className="platform-billing__toolbar">
            <label className="platform-billing__search">
              <span className="visually-hidden">Pretraži pretplate</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Traži studio ili kontakt…"
              />
            </label>
            <div className="platform-billing__filters" role="tablist" aria-label="Filter plaćanja">
              {[
                ['all', `Svi (${summary.total})`],
                ['paid', `Plaćeno (${summary.paid})`],
                ['trial', `Probni (${summary.trial})`],
                ['expiring', `Pred istek (${summary.expiring})`],
                ['unpaid', `Neplaćeno (${summary.unpaid})`],
                ['expired', `Isteklo (${summary.expired})`],
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

          {flash ? (
            <p className="platform-billing__flash" role="status">{flash}</p>
          ) : null}

          {visible.length === 0 ? (
            <p className="platform-billing__empty">Nema studija za ovaj filter.</p>
          ) : (
            <ul className="platform-billing__list">
              {visible.map((item, index) => {
                const busy = busyId === item.id;
                const amount = item.amount > 0
                  ? `${item.amount} ${item.currency || 'EUR'}`
                  : '—';
                return (
                  <li key={item.id}>
                    <div className="platform-billing__row-top">
                      <span className="platform-billing__n" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="platform-billing__identity">
                        <div className="platform-billing__title">
                          <strong>{item.name}</strong>
                          <span className={`platform-billing__pill ${pillClass(item.bucket)}`.trim()}>
                            {item.label}
                          </span>
                        </div>
                        <p className="platform-billing__sub">
                          <Link to={`/s/${item.slug}`}>
                            /s/
                            {item.slug}
                          </Link>
                          {item.email ? ` · ${item.email}` : ''}
                        </p>
                      </div>
                      <p className="platform-billing__until">
                        <span>Vrijedi do</span>
                        <strong>{formatDate(item.validUntil)}</strong>
                      </p>
                    </div>

                    <dl className="platform-billing__meta">
                      <div>
                        <dt>Plan</dt>
                        <dd>{planLabel[item.plan] || item.plan}</dd>
                      </div>
                      <div>
                        <dt>Preostalo</dt>
                        <dd>{daysLabel(item.daysLeft)}</dd>
                      </div>
                      <div>
                        <dt>Iznos</dt>
                        <dd>{amount}</dd>
                      </div>
                    </dl>

                    <div className="platform-billing__actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(
                          item.id,
                          'Označeno kao plaćeno',
                          () => updateBilling({
                            tenantId: item.id,
                            body: { markPaid: true },
                          }).unwrap(),
                        )}
                      >
                        Plaćeno
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(
                          item.id,
                          'Upozorenje poslano',
                          () => sendWarning(item.id).unwrap(),
                        )}
                      >
                        Upozorenje
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(
                          item.id,
                          'Pripremni e-račun poslan',
                          () => sendInvoice(item.id).unwrap(),
                        )}
                      >
                        E-račun
                      </button>
                      {(item.bucket === 'trial' || item.bucket === 'paid') ? null : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction(
                            item.id,
                            'Označeno kao neplaćeno',
                            () => updateBilling({
                              tenantId: item.id,
                              body: { status: 'UNPAID' },
                            }).unwrap(),
                          )}
                        >
                          Neplaćeno
                        </button>
                      )}
                    </div>

                    {(item.lastWarningSentAt || item.lastInvoiceSentAt) ? (
                      <p className="platform-billing__note">
                        {item.lastWarningSentAt
                          ? `Upozorenje: ${formatDate(item.lastWarningSentAt)}`
                          : ''}
                        {item.lastWarningSentAt && item.lastInvoiceSentAt ? ' · ' : ''}
                        {item.lastInvoiceSentAt
                          ? `E-račun: ${formatDate(item.lastInvoiceSentAt)}`
                          : ''}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
