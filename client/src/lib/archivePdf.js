import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_MODE, IS_LIVE, publicAsset } from './runtimeEnv.js';

/** Finalni vizualni jezik — isti u lokalnom testu i na Renderu. */
const C = {
  brand: [14, 107, 115],
  brandDeep: [10, 82, 88],
  accent: [242, 163, 58],
  ink: [17, 43, 46],
  muted: [90, 112, 115],
  line: [210, 224, 226],
  soft: [236, 245, 246],
  paper: [255, 255, 255],
  chip: [245, 248, 248],
};

const MARGIN = 16;
const FOOTER_H = 18;
const HEADER_BAR = 3.2;

let fontReady;

/** Sustavski / ulogni nadimci — na arhivskom ispisu zamjenjuju se formalnom oznakom. */
const ROLE_LIKE_NAMES = new Set([
  'super admin',
  'superadmin',
  'admin',
  'administrator',
  'platform admin',
  'platform staff',
  'djelatnik',
  'djelatnik platforme',
]);

const FORMAL_OFFICER = 'Administrator platforme';

function formalDisplayName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) return FORMAL_OFFICER;
  const key = name.toLowerCase().replace(/\s+/g, ' ');
  if (ROLE_LIKE_NAMES.has(key)) return FORMAL_OFFICER;
  if (/^(super[-\s]?admin|admin(istrator)?)$/i.test(name)) return FORMAL_OFFICER;
  return name;
}

/** Identitet za PDF: stvarno ime ili formalna oznaka + e-pošta (ne „Super Admin”). */
export function archiveAuthor(me) {
  const email = String(me?.user?.email || '').trim().toLowerCase();
  return {
    name: formalDisplayName(me?.user?.name),
    email,
  };
}

function authorFields(generatedBy) {
  if (!generatedBy) return { name: FORMAL_OFFICER, email: '' };
  if (typeof generatedBy === 'string') {
    const match = generatedBy.match(/^(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
      return {
        name: formalDisplayName(match[1]),
        email: match[2].trim().toLowerCase(),
      };
    }
    if (generatedBy.includes('@')) {
      return { name: FORMAL_OFFICER, email: generatedBy.trim().toLowerCase() };
    }
    return { name: formalDisplayName(generatedBy), email: '' };
  }
  return {
    name: formalDisplayName(generatedBy.name),
    email: String(generatedBy.email || '').trim().toLowerCase(),
  };
}

function authorLine(generatedBy) {
  const { name, email } = authorFields(generatedBy);
  if (name && email) return `${name} · ${email}`;
  return name || email || FORMAL_OFFICER;
}

function stampNow() {
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

function slugify(value) {
  return String(value || 'arhiv')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'arhiv';
}

function cell(value) {
  if (value == null || value === '') return '—';
  return String(value);
}

function pageSize(doc) {
  return {
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
  };
}

function contentBottom(doc) {
  return pageSize(doc).h - FOOTER_H;
}

async function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFonts(doc) {
  if (!fontReady) {
    fontReady = (async () => {
      const [regular, bold] = await Promise.all([
        fetch(publicAsset('fonts/DejaVuSans.ttf')).then((res) => {
          if (!res.ok) throw new Error('DejaVuSans nije dostupan');
          return res.arrayBuffer();
        }),
        fetch(publicAsset('fonts/DejaVuSans-Bold.ttf')).then((res) => {
          if (!res.ok) throw new Error('DejaVuSans-Bold nije dostupan');
          return res.arrayBuffer();
        }),
      ]);
      return {
        regular: await bufferToBase64(regular),
        bold: await bufferToBase64(bold),
      };
    })();
  }

  const fonts = await fontReady;
  doc.addFileToVFS('DejaVuSans.ttf', fonts.regular);
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.bold);
  doc.addFont('DejaVuSans.ttf', 'ArchiveSans', 'normal');
  doc.addFont('DejaVuSans-Bold.ttf', 'ArchiveSans', 'bold');
  doc.setFont('ArchiveSans', 'normal');
}

function drawPageChrome(doc) {
  const { w, h } = pageSize(doc);
  doc.setFillColor(...C.brand);
  doc.rect(0, 0, w, HEADER_BAR, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(0, HEADER_BAR, 28, 1.1, 'F');

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, h - FOOTER_H + 2, w - MARGIN, h - FOOTER_H + 2);
}

function drawSectionLabel(doc, index, title, y) {
  doc.setFont('ArchiveSans', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.brand);
  doc.text(String(index).padStart(2, '0'), MARGIN, y);

  doc.setFontSize(12);
  doc.setTextColor(...C.ink);
  doc.text(title, MARGIN + 9, y);

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  const { w } = pageSize(doc);
  doc.line(MARGIN, y + 3.2, w - MARGIN, y + 3.2);
  return y + 8;
}

function ensureSpace(doc, y, needed = 28) {
  if (y + needed > contentBottom(doc)) {
    doc.addPage();
    drawPageChrome(doc);
    return 14;
  }
  return y;
}

function drawCoverHeader(doc, {
  title,
  subtitle,
  generatedAt,
  generatedBy,
  documentId,
}) {
  const { w } = pageSize(doc);
  drawPageChrome(doc);

  let y = 14;

  // Wordmark + document class
  doc.setFont('ArchiveSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.brand);
  doc.text('AnyMinutes', MARGIN, y);

  doc.setFont('ArchiveSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text('Platformska administracija', MARGIN + 28, y);

  // Status chip — isti stil; tekst se razlikuje samo po okruženju
  const chipLabel = IS_LIVE ? 'SLUŽBENA ARHIVA' : 'PREDPRODUKCIJSKI ISPIS';
  doc.setFont('ArchiveSans', 'bold');
  doc.setFontSize(7);
  const chipW = doc.getTextWidth(chipLabel) + 6;
  const chipX = w - MARGIN - chipW;
  doc.setFillColor(...C.chip);
  doc.setDrawColor(...C.brand);
  doc.setLineWidth(0.35);
  doc.roundedRect(chipX, y - 4.2, chipW, 6, 0.4, 0.4, 'FD');
  doc.setTextColor(...C.brand);
  doc.text(chipLabel, chipX + 3, y);

  y += 8;
  doc.setDrawColor(...C.brand);
  doc.setLineWidth(0.55);
  doc.line(MARGIN, y, w - MARGIN, y);
  doc.setFillColor(...C.accent);
  doc.rect(MARGIN, y, 18, 1.15, 'F');

  y += 10;
  doc.setFont('ArchiveSans', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...C.ink);
  const titleLines = doc.splitTextToSize(title, w - MARGIN * 2);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 7.4 + 2;

  if (subtitle) {
    doc.setFont('ArchiveSans', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.muted);
    const subLines = doc.splitTextToSize(subtitle, w - MARGIN * 2);
    doc.text(subLines, MARGIN, y);
    y += subLines.length * 4.8 + 5;
  } else {
    y += 3;
  }

  // Meta registry — 4 polja u jednoj traci
  const author = authorFields(generatedBy);
  const meta = [
    ['Generirano', generatedAt],
    ['Ovlaštena osoba', author.name || FORMAL_OFFICER],
    ['E-pošta', author.email || '—'],
    ['ID dokumenta', documentId],
  ];
  const gap = 2.5;
  const boxW = (w - MARGIN * 2 - gap * 3) / 4;
  const boxH = 17;

  meta.forEach(([label, value], index) => {
    const x = MARGIN + index * (boxW + gap);
    doc.setFillColor(...C.soft);
    doc.rect(x, y, boxW, boxH, 'F');
    doc.setFillColor(...C.brand);
    doc.rect(x, y, 1.15, boxH, 'F');

    doc.setFont('ArchiveSans', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), x + 3.5, y + 5);

    doc.setFont('ArchiveSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);
    const lines = doc.splitTextToSize(cell(value), boxW - 5.5);
    doc.text(lines.slice(0, 2), x + 3.5, y + 10.2);
  });

  return y + boxH + 10;
}

function drawSummary(doc, summary, startY) {
  if (!summary?.length) return startY;
  const { w } = pageSize(doc);
  let y = ensureSpace(doc, startY, 36);
  y = drawSectionLabel(doc, 1, 'Sažetak', y);

  const cols = Math.min(4, Math.max(2, summary.length >= 4 ? 4 : summary.length));
  const gap = 2.5;
  const boxW = (w - MARGIN * 2 - gap * (cols - 1)) / cols;
  const boxH = 18;
  let col = 0;

  summary.forEach((item) => {
    if (col === 0) y = ensureSpace(doc, y, boxH + 4);

    const x = MARGIN + col * (boxW + gap);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.35);
    doc.setFillColor(...C.paper);
    doc.rect(x, y, boxW, boxH, 'FD');
    doc.setFillColor(...C.accent);
    doc.rect(x, y + boxH - 1.1, boxW, 1.1, 'F');

    doc.setFont('ArchiveSans', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(String(item.label || '').toUpperCase(), x + 3.2, y + 5.5);

    doc.setFontSize(15);
    doc.setTextColor(...C.ink);
    doc.text(cell(item.value), x + 3.2, y + 13.2);

    col += 1;
    if (col >= cols) {
      col = 0;
      y += boxH + gap;
    }
  });

  if (col !== 0) y += boxH + gap;
  return y + 6;
}

function drawSection(doc, section, startY, index) {
  const { w } = pageSize(doc);
  let y = ensureSpace(doc, startY, 34);
  y = drawSectionLabel(doc, index, section.title || 'Podaci', y);

  if (section.lead) {
    doc.setFont('ArchiveSans', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.muted);
    const leadLines = doc.splitTextToSize(section.lead, w - MARGIN * 2);
    y = ensureSpace(doc, y, leadLines.length * 4.2 + 4);
    doc.text(leadLines, MARGIN, y);
    y += leadLines.length * 4.2 + 3;
  }

  const columns = section.columns || [];
  const rows = (section.rows || []).map((row) => row.map(cell));
  const empty = !rows.length;

  autoTable(doc, {
    startY: y,
    head: [columns],
    body: empty ? [columns.map(() => '—')] : rows,
    theme: 'plain',
    styles: {
      font: 'ArchiveSans',
      fontSize: 7.6,
      textColor: C.ink,
      lineColor: C.line,
      lineWidth: 0.2,
      cellPadding: { top: 2.4, right: 2.2, bottom: 2.4, left: 2.2 },
      overflow: 'linebreak',
      valign: 'top',
      minCellHeight: 7,
    },
    headStyles: {
      font: 'ArchiveSans',
      fontStyle: 'bold',
      fillColor: C.brand,
      textColor: [255, 255, 255],
      fontSize: 7,
      cellPadding: { top: 2.8, right: 2.2, bottom: 2.8, left: 2.2 },
    },
    alternateRowStyles: {
      fillColor: C.soft,
    },
    tableLineColor: C.line,
    tableLineWidth: 0.2,
    margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_H + 2 },
    didDrawPage: () => {
      drawPageChrome(doc);
    },
  });

  return (doc.lastAutoTable?.finalY || y) + 9;
}

function drawNotes(doc, notes, startY, index) {
  if (!notes?.length) return startY;
  const { w } = pageSize(doc);
  let y = ensureSpace(doc, startY, 28);
  y = drawSectionLabel(doc, index, 'Napomene i klasifikacija', y);

  doc.setFillColor(...C.soft);
  const blockTop = y;
  let cursor = y + 4;
  const noteLines = [];

  notes.forEach((note) => {
    const lines = doc.splitTextToSize(`•  ${note}`, w - MARGIN * 2 - 8);
    noteLines.push(...lines, '');
  });
  if (noteLines[noteLines.length - 1] === '') noteLines.pop();

  const blockH = noteLines.length * 4.2 + 8;
  y = ensureSpace(doc, blockTop, Math.min(blockH, 60));
  doc.setFillColor(...C.soft);
  doc.rect(MARGIN, y, w - MARGIN * 2, Math.min(blockH, contentBottom(doc) - y - 2), 'F');
  doc.setFillColor(...C.brand);
  doc.rect(MARGIN, y, 1.15, Math.min(blockH, contentBottom(doc) - y - 2), 'F');

  doc.setFont('ArchiveSans', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...C.ink);
  cursor = y + 5.5;
  notes.forEach((note) => {
    const lines = doc.splitTextToSize(`•  ${note}`, w - MARGIN * 2 - 8);
    lines.forEach((line) => {
      if (cursor > contentBottom(doc) - 6) {
        doc.addPage();
        drawPageChrome(doc);
        cursor = 14;
      }
      doc.text(line, MARGIN + 4, cursor);
      cursor += 4.2;
    });
    cursor += 1.2;
  });

  return cursor + 4;
}

function drawAttestation(doc, startY, generatedAt, generatedBy) {
  const { w } = pageSize(doc);
  let y = ensureSpace(doc, startY + 10, 56);
  const author = authorFields(generatedBy);

  y += 6;
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, y, w - MARGIN, y);
  y += 12;

  doc.setFont('ArchiveSans', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.ink);
  doc.text('Izjava o arhivskom ispisu', MARGIN, y);
  y += 6;

  doc.setFont('ArchiveSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const text = IS_LIVE
    ? 'Ovaj dokument izrađen je iz živih podataka AnyMinutes platforme u trenutku generiranja. Namijenjen je tiskanju ili lokalnoj pohrani izvan baze podataka. Nije elektronički potpisan; vjerodostojnost proizlazi iz pristupa ovlaštene osobe i vremenske oznake dokumenta.'
    : 'Ovaj dokument koristi finalni produkcijski predložak. Vizual, tipografija i struktura jednaki su službenoj arhivi. U ovom okruženju ispis služi za provjeru izgleda i sadržaja; klasifikacija ostaje „predprodukcijski ispis” dok se ne generira na produkcijskom buildu.';
  const lines = doc.splitTextToSize(text, w - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  y += lines.length * 4.1 + 12;

  const blocks = [
    ['Ovlaštena osoba', author.name || FORMAL_OFFICER],
    ['E-pošta', author.email || '—'],
    ['Datum i vrijeme', generatedAt],
  ];
  const gap = 8;
  const sigW = (w - MARGIN * 2 - gap * (blocks.length - 1)) / blocks.length;

  blocks.forEach(([label, value], index) => {
    const x = MARGIN + index * (sigW + gap);
    doc.setFont('ArchiveSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);
    const valueLines = doc.splitTextToSize(cell(value), sigW);
    doc.text(valueLines.slice(0, 2), x, y + 8);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(x, y + 11, x + sigW, y + 11);
    doc.setFont('ArchiveSans', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), x, y + 15.5);
  });

  return y + 24;
}

function drawDigitalSeal(doc, seal, startY, index) {
  if (!seal) return startY;
  const { w } = pageSize(doc);
  let y = ensureSpace(doc, startY + 4, 48);
  y = drawSectionLabel(doc, index, 'Digitalni pečat platforme', y);

  doc.setFont('ArchiveSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  const intro = doc.splitTextToSize(
    'Pečat potvrđuje integritet sadržaja u trenutku izvoza (HMAC-SHA256 na strani platforme). '
    + 'Nije kvalificirani eIDAS potpis; služi za internu arhivu i provjeru da dokument nije naknadno mijenjan.',
    w - MARGIN * 2,
  );
  doc.text(intro, MARGIN, y);
  y += intro.length * 4.1 + 4;

  const rows = [
    ['Seal ID', seal.sealId || '—'],
    ['Algoritam', seal.algorithm || 'HMAC-SHA256'],
    ['Content hash (SHA-256)', seal.contentHash || '—'],
    ['Potpis platforme', seal.signature || '—'],
    ['Potpisano', seal.signedAt || '—'],
    ['Potpisnik', seal.signer?.email || '—'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Polje', 'Vrijednost']],
    body: rows,
    theme: 'plain',
    styles: {
      font: 'ArchiveSans',
      fontSize: 7.2,
      textColor: C.ink,
      lineColor: C.line,
      lineWidth: 0.2,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      font: 'ArchiveSans',
      fontStyle: 'bold',
      fillColor: C.brandDeep,
      textColor: [255, 255, 255],
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_H + 2 },
    didDrawPage: () => {
      drawPageChrome(doc);
    },
  });

  return (doc.lastAutoTable?.finalY || y) + 8;
}

function drawFooters(doc, documentId, generatedAt) {
  const pageCount = doc.getNumberOfPages();
  const { w, h } = pageSize(doc);

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('ArchiveSans', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text('AnyMinutes  ·  arhivski ispis  ·  povjerljivo', MARGIN, h - 8);
    doc.text(
      `${documentId}  ·  ${generatedAt}  ·  ${i} / ${pageCount}`,
      w - MARGIN,
      h - 8,
      { align: 'right' },
    );
  }
}

/**
 * Finalni A4 arhivski PDF — isti dizajn lokalno i u produkciji.
 */
export async function downloadArchivePdf(options) {
  const stamp = stampNow();
  const documentId = options.documentId || createArchiveDocumentId();
  const fileStem = slugify(options.fileStem || options.title);
  const fileName = IS_LIVE
    ? `anyminutes-${fileStem}-${stamp.file}.pdf`
    : `anyminutes-${fileStem}-${stamp.file}-provjera.pdf`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  await loadFonts(doc);

  doc.setProperties({
    title: options.title,
    subject: 'AnyMinutes arhivski ispis',
    author: authorLine(options.generatedBy),
    keywords: 'arhiv, ispis, administracija, anyminutes, pecat',
    creator: 'AnyMinutes',
  });

  let y = drawCoverHeader(doc, {
    title: options.title,
    subtitle: options.subtitle,
    generatedAt: stamp.date,
    generatedBy: options.generatedBy,
    documentId,
  });

  let sectionIndex = 1;
  if (options.summary?.length) {
    y = drawSummary(doc, options.summary, y);
    sectionIndex = 2;
  }

  for (const section of options.sections || []) {
    y = drawSection(doc, section, y, sectionIndex);
    sectionIndex += 1;
  }

  const classificationNotes = [
    ...(options.notes || []),
    `Vrijeme snimanja (ISO): ${stamp.iso}`,
    `Način rada: ${APP_MODE}${IS_LIVE ? ' (produkcija)' : ' (provjera predloška — dizajn je finalan)'}`,
    options.seal
      ? `Digitalni pečat: ${options.seal.sealId} · hash ${String(options.seal.contentHash || '').slice(0, 16)}…`
      : 'Digitalni pečat nije primijenjen (API pečata trenutno nedostupan).',
  ];

  y = drawNotes(doc, classificationNotes, y, sectionIndex);
  sectionIndex += 1;
  y = drawDigitalSeal(doc, options.seal, y, sectionIndex);
  if (options.seal) sectionIndex += 1;
  y = drawAttestation(doc, y, stamp.date, options.generatedBy);

  drawFooters(doc, documentId, stamp.date);
  doc.save(fileName);

  return { fileName, documentId, seal: options.seal || null };
}
