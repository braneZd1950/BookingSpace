import { IS_LIVE } from './runtimeEnv.js';

/** Timestamp pieces for archive file names and PDF headers. */
export function stampNow() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
  const file = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  return { date, file, iso: now.toISOString() };
}

export function createArchiveDocumentId() {
  const stamp = stampNow();
  return `AM-${stamp.file}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function slugifyArchive(value) {
  let text = String(value || 'arhiv')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 48);
  while (text.startsWith('-')) text = text.slice(1);
  while (text.endsWith('-')) text = text.slice(0, -1);
  return text || 'arhiv';
}

/** @param {unknown} value
 *  @param {string} [empty=''] */
export function archiveCell(value, empty = '') {
  if (value == null || value === '') return empty;
  return String(value);
}

/** Base file name without extension: anyminutes-{stem}-{stamp}[-provjera] */
export function archiveFileBase(options, stampFile = stampNow().file) {
  const stem = slugifyArchive(options.fileStem || options.title);
  return IS_LIVE
    ? `anyminutes-${stem}-${stampFile}`
    : `anyminutes-${stem}-${stampFile}-provjera`;
}

export function triggerArchiveDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Label/value rows for the digital seal block (PDF, CSV, Excel). */
export function sealFieldRows(seal, empty = '') {
  if (!seal) return [];
  return [
    ['Seal ID', archiveCell(seal.sealId, empty)],
    ['Algoritam', archiveCell(seal.algorithm || 'HMAC-SHA256', empty)],
    ['Content hash', archiveCell(seal.contentHash, empty)],
    ['Potpis', archiveCell(seal.signature, empty)],
    ['Potpisano', archiveCell(seal.signedAt, empty)],
    ['Potpisnik', archiveCell(seal.signer?.email, empty)],
    ['Napomena', archiveCell(seal.note, empty)],
  ];
}
