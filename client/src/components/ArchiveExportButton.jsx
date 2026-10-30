import { useState } from 'react';
import { useSealPlatformExportMutation } from '../api/analyticsApi.js';
import {
  createArchiveDocumentId,
  downloadArchivePdf,
} from '../lib/archivePdf.js';
import {
  downloadArchiveCsv,
  downloadArchiveExcel,
  hashArchivePayload,
} from '../lib/archiveTabular.js';
import { IS_LIVE } from '../lib/runtimeEnv.js';
import './ArchiveExportButton.scss';

const FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'xlsx', label: 'Excel' },
  { id: 'csv', label: 'CSV' },
];

export default function ArchiveExportButton({
  disabled = false,
  build,
  className = '',
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sealExport] = useSealPlatformExportMutation();

  async function withSeal(payload) {
    const documentId = createArchiveDocumentId();
    const contentHash = await hashArchivePayload(payload);
    let seal = null;
    try {
      const result = await sealExport({
        documentId,
        contentHash,
        title: payload.title,
        fileStem: payload.fileStem,
      }).unwrap();
      seal = result.seal || null;
    } catch {
      seal = null;
    }
    return { ...payload, documentId, seal, contentHash };
  }

  async function onExport(format) {
    if (busy || disabled || typeof build !== 'function') return;
    setBusy(format);
    setError('');
    try {
      const raw = await build();
      if (!raw) {
        setError('Nema podataka za izvoz.');
        return;
      }
      const payload = await withSeal(raw);
      if (format === 'pdf') await downloadArchivePdf(payload);
      else if (format === 'xlsx') downloadArchiveExcel(payload);
      else downloadArchiveCsv(payload);
    } catch (err) {
      console.error(err);
      setError('Izvoz nije uspio. Pokušajte ponovno.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className={`archive-export ${className}`.trim()}>
      <div className="archive-export__row" role="group" aria-label="Izvoz arhive">
        {FORMATS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`archive-export__btn${item.id === 'pdf' ? ' is-primary' : ''}`}
            onClick={() => onExport(item.id)}
            disabled={disabled || Boolean(busy)}
          >
            {busy === item.id ? '…' : item.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="archive-export__error" role="alert">{error}</p>
      ) : (
        <p className="archive-export__hint">
          {IS_LIVE
            ? 'PDF (ispis) · Excel / CSV (obrada) · pečat integriteta platforme.'
            : 'Isti formati kao u produkciji. PDF dobiva digitalni pečat kad je API dostupan.'}
        </p>
      )}
    </div>
  );
}
