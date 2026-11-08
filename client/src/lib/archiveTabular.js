import ExcelJS from 'exceljs';
import { IS_LIVE } from './runtimeEnv.js';

function stampFile() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
}

function slugify(value) {
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

function cell(value) {
  if (value == null || value === '') return '';
  return String(value);
}

function fileBase(options) {
  const stem = slugify(options.fileStem || options.title);
  const stamp = stampFile();
  return IS_LIVE ? `anyminutes-${stem}-${stamp}` : `anyminutes-${stem}-${stamp}-provjera`;
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function csvEscape(value) {
  const text = cell(value);
  if (/[",\n\r;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildSheets(options) {
  const sheets = [];

  if (options.summary?.length) {
    sheets.push({
      name: 'Sazetak',
      columns: ['Metrika', 'Vrijednost'],
      rows: options.summary.map((item) => [item.label, item.value]),
    });
  }

  (options.sections || []).forEach((section, index) => {
    sheets.push({
      name: String(section.title || `Podaci ${index + 1}`).slice(0, 28),
      columns: section.columns || [],
      rows: (section.rows || []).map((row) => row.map(cell)),
    });
  });

  if (options.seal) {
    sheets.push({
      name: 'Digitalni pecat',
      columns: ['Polje', 'Vrijednost'],
      rows: [
        ['Seal ID', options.seal.sealId],
        ['Algoritam', options.seal.algorithm],
        ['Content hash', options.seal.contentHash],
        ['Potpis', options.seal.signature],
        ['Potpisano', options.seal.signedAt],
        ['Potpisnik', options.seal.signer?.email || ''],
        ['Napomena', options.seal.note || ''],
      ],
    });
  }

  return sheets;
}

/** UTF-8 CSV (Excel-friendly with BOM). Multiple sections separated. */
export function downloadArchiveCsv(options) {
  const sheets = buildSheets(options);
  const chunks = [
    `# AnyMinutes arhivski izvoz`,
    `# ${options.title || ''}`,
    `# ${new Date().toISOString()}`,
    '',
  ];

  sheets.forEach((sheet) => {
    chunks.push(`## ${sheet.name}`);
    chunks.push(sheet.columns.map(csvEscape).join(','));
    sheet.rows.forEach((row) => {
      chunks.push(row.map(csvEscape).join(','));
    });
    chunks.push('');
  });

  const blob = new Blob([`\uFEFF${chunks.join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const fileName = `${fileBase(options)}.csv`;
  triggerDownload(blob, fileName);
  return { fileName };
}

/** Excel (.xlsx) workbook — one sheet per section. */
export async function downloadArchiveExcel(options) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'anyminutes';
  const sheets = buildSheets(options);

  if (!sheets.length) {
    const ws = workbook.addWorksheet('Prazno');
    ws.addRow(['Nema podataka']);
  } else {
    sheets.forEach((sheet) => {
      const safeName = sheet.name.replace(/[\\/?*[\]]/g, ' ').slice(0, 31) || 'Podaci';
      const ws = workbook.addWorksheet(safeName);
      ws.addRow(sheet.columns);
      sheet.rows.forEach((row) => ws.addRow(row));
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${fileBase(options)}.xlsx`;
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
  return { fileName };
}

/** Canonical SHA-256 of export body (for platform seal). */
export async function hashArchivePayload(options) {
  const canonical = JSON.stringify({
    title: options.title || '',
    subtitle: options.subtitle || '',
    summary: options.summary || [],
    sections: (options.sections || []).map((section) => ({
      title: section.title || '',
      columns: section.columns || [],
      rows: section.rows || [],
    })),
  });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
