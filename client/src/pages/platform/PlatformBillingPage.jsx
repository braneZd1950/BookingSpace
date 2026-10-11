import { useMemo, useState } from 'react';
import {
  useGetPlatformBillingQuery,
  useSendBillingInvoiceMutation,
  useSendBillingWarningMutation,
  useUpdatePlatformBillingMutation,
} from '../../api/analyticsApi.js';
import PlatformSection from './PlatformSection.jsx';
import '../public/AnalyticsPage.scss';

const planLabel = {
  pilot: 'Pilot',
  standard: 'Standard',
};

const bucketClass = {
  paid: 'is-ok',
  trial: 'is-trial',
  expiring: 'is-warn',
  unpaid: 'is-off',
  expired: 'is-off',
  unknown: '',
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

function daysLabel(daysLeft) {
  if (daysLeft == null) return '—';
  if (daysLeft < 0) return `${Math.abs(daysLeft)} d. kasni`;
  if (daysLeft === 0) return 'Danas';
  return `${daysLeft} d.`;
}

export default function PlatformBillingPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [flash, setFlash] = useState('');
  const { data, isLoading, isError, refetch } = useGetPlatformBillingQuery();
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
      <PlatformSection title="Plaćanja" lead="Učitavamo pretplate…">
        <p className="analytics__lead">Trenutak.</p>
      </PlatformSection>
    );
  }

  if (isError || !data) {
    return (
      <PlatformSection title="Plaćanja" lead="Podaci trenutno nisu dostupni.">
        <p className="analytics__lead">Pokušajte osvježiti stranicu.</p>
      </PlatformSection>
    );
  }

  return (
    <PlatformSection
      title="Plaćanja"
      lead={`Pretplate partnera · stanje na ${formatDate(data.today)}. Upozorenja i pripremni e-računi idu na e-poštu studija.`}
    >
      <div className="analytics__stats" aria-label="Sažetak plaćanja">
        <article>
          <span>Ukupno</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Plaćeno</span>
          <strong>{summary.paid}</strong>
        </article>
        <article>
          <span>Probni</span>
          <strong>{summary.trial}</strong>
        </article>
        <article>
          <span>Pred istek</span>
          <strong>{summary.expiring}</strong>
        </article>
        <article>
          <span>Neplaćeno</span>
          <strong>{summary.unpaid}</strong>
        </article>
        <article>
          <span>Isteklo</span>
          <strong>{summary.expired}</strong>
        </article>
      </div>

      <div className="analytics__toolbar">
        <label className="analytics__search">
          <span className="visually-hidden">Pretraži pretplate</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Traži studio ili kontakt…"
          />
        </label>
        <div className="analytics__filters" role="tablist" aria-label="Filter plaćanja">
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

      {flash ? <p className="analytics__flash" role="status">{flash}</p> : null}

      {visible.length === 0 ? (
        <p className="analytics__lead">Nema studija za ovaj filter.</p>
      ) : (
        <div className="analytics__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Studio</th>
                <th>Stanje</th>
                <th>Plan</th>
                <th>Vrijedi do</th>
                <th>Preostalo</th>
                <th>Iznos</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const busy = busyId === item.id;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="analytics__sub">
                        /s/
                        {item.slug}
                        {item.email ? ` · ${item.email}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`analytics__pill ${bucketClass[item.bucket] || ''}`.trim()}>
                        {item.label}
                      </span>
                    </td>
                    <td>{planLabel[item.plan] || item.plan}</td>
                    <td>{formatDate(item.validUntil)}</td>
                    <td>{daysLabel(item.daysLeft)}</td>
                    <td>
                      {item.amount > 0
                        ? `${item.amount} ${item.currency || 'EUR'}`
                        : '—'}
                    </td>
                    <td>
                      <div className="analytics__row-actions">
                        <button
                          type="button"
                          className="analytics__refresh"
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
                          className="analytics__refresh"
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
                          className="analytics__refresh"
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
                            className="analytics__refresh"
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
                        <div className="analytics__sub">
                          {item.lastWarningSentAt
                            ? `Upozorenje: ${formatDate(item.lastWarningSentAt)}`
                            : ''}
                          {item.lastWarningSentAt && item.lastInvoiceSentAt ? ' · ' : ''}
                          {item.lastInvoiceSentAt
                            ? `E-račun: ${formatDate(item.lastInvoiceSentAt)}`
                            : ''}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PlatformSection>
  );
}
