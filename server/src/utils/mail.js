import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;
let verified = false;

export function smtpConfigured() {
  return Boolean(env.smtp.host);
}

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? {
        user: env.smtp.user,
        pass: env.smtp.pass,
      } : undefined,
    });
  }
  return transporter;
}

export async function verifyMail() {
  const transport = getTransporter();
  if (!transport) {
    return {
      ok: env.nodeEnv !== 'production',
      mode: env.nodeEnv === 'production' ? 'unconfigured' : 'console',
      message: env.nodeEnv === 'production'
        ? 'SMTP_HOST nije postavljen.'
        : 'SMTP nije postavljen — u developmentu poruke idu u konzolu.',
    };
  }

  try {
    await transport.verify();
    verified = true;
    return {
      ok: true,
      mode: 'smtp',
      message: `SMTP spreman (${env.smtp.host}:${env.smtp.port}).`,
    };
  } catch (error) {
    verified = false;
    return {
      ok: false,
      mode: 'smtp-error',
      message: error?.message || 'SMTP provjera nije uspjela.',
    };
  }
}

export async function sendMail({ to, subject, text, html }) {
  const from = env.smtp.from || 'anyminutes <noreply@anyminutes.local>';
  const transport = getTransporter();

  if (!transport) {
    if (env.nodeEnv === 'production') {
      console.error('[mail] SMTP nije konfiguriran — poruka nije poslana:', { to, subject });
      return { delivered: false, mode: 'unconfigured' };
    }
    console.info('[mail:dev]', { from, to, subject, text });
    return { delivered: true, mode: 'console' };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { delivered: true, mode: 'smtp', verified };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function detailRow(label, value, { last = false, mono = false } = {}) {
  const border = last ? '' : 'border-bottom:1px solid #dce5e8';
  const valueStyle = mono
    ? 'margin:0;font-size:22px;letter-spacing:0.08em;color:#0b3d4a;font-weight:700;font-family:Consolas,\'Courier New\',monospace'
    : 'margin:4px 0 0;font-weight:700;color:#0b3d4a';
  return `
              <tr>
                <td style="padding:14px 20px;${border}">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">${label}</p>
                  <p style="${valueStyle}">${value}</p>
                </td>
              </tr>`;
}

function detailCard(rowsHtml) {
  return `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              ${rowsHtml}
            </table>`;
}

function ctaButton(href, label) {
  return `
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px">
              <tr>
                <td style="background:#0b3d4a;border-radius:999px">
                  <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    ${label}
                  </a>
                </td>
              </tr>
            </table>`;
}

function renderEmailShell({ brandTitle, eyebrow, bodyHtml, footerLabel }) {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef1f4">
  <tr>
    <td align="center" style="padding:28px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:560px;width:100%;background:#ffffff">
        <tr>
          <td style="height:6px;background:#0b3d4a;font-size:0;line-height:0">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 36px 18px;border-bottom:1px solid #e6ebef">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;letter-spacing:-0.02em;color:#0b3d4a;font-weight:700">
              ${brandTitle}
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              ${eyebrow}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              ${footerLabel}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

function greeting(name) {
  return `<p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${name},</p>`;
}

function bodyParagraph(html, { marginBottom = 18 } = {}) {
  return `<p style="margin:0 0 ${marginBottom}px;font-size:15px;line-height:1.6;color:#314046">${html}</p>`;
}

function mutedNote(html) {
  return `<p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">${html}</p>`;
}

function formatWhen(date, startTime, endTime) {
  return `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
}

export async function sendMemberInviteEmail({
  to,
  memberName,
  studioName,
  studioSlug,
  password,
}) {
  const origin = env.clientOrigin.replace(/\/$/, '');
  const loginUrl = `${origin}/login`;
  const siteUrl = `${origin}/s/${studioSlug}`;
  const siteLabel = siteUrl.replace(/^https?:\/\//, '');
  const subject = `Vaša prijava — ${studioName}`;
  const text = [
    `Pozdrav ${memberName},`,
    '',
    `Otvoren vam je račun za rezervaciju termina u studiju ${studioName}.`,
    'Ispod su podaci za prvu prijavu — lozinku je automatski generirao sustav.',
    '',
    `E-pošta: ${to}`,
    `Privremena lozinka: ${password}`,
    '',
    `Prijava: ${loginUrl}`,
    `Stranica studija: ${siteUrl}`,
    '',
    'Ako niste očekivali ovu poruku, zanemarite je ili javite studiju.',
    'Lozinku nemojte dijeliti — namijenjena je samo vama.',
  ].join('\n');

  const safeName = escapeHtml(memberName);
  const safeStudio = escapeHtml(studioName);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(password);
  const safeLogin = escapeAttr(loginUrl);
  const safeSite = escapeAttr(siteUrl);
  const safeSiteLabel = escapeHtml(siteLabel);

  const html = renderEmailShell({
    brandTitle: safeStudio,
    eyebrow: 'Pristup članu',
    footerLabel: 'anyminutes · rezervacije za studio',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(`Otvoren vam je račun za rezervaciju termina u studiju
              <strong style="color:#0b3d4a">${safeStudio}</strong>.
              Ispod su podaci za prvu prijavu — lozinku je automatski generirao sustav.`, { marginBottom: 22 })}
            ${detailCard(`
              ${detailRow('E-pošta', safeEmail)}
              ${detailRow('Privremena lozinka', safePassword, { last: true, mono: true })}
            `)}
            ${ctaButton(safeLogin, 'Prijavite se')}
            <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#314046">
              Nakon prijave otvorite stranicu studija i rezervirajte termin:
            </p>
            <p style="margin:0 0 26px">
              <a href="${safeSite}" style="font-size:14px;font-weight:700;color:#0e6b73;text-decoration:underline">
                ${safeSiteLabel}
              </a>
            </p>
            ${mutedNote('Ako niste očekivali ovu poruku, zanemarite je ili javite studiju. Lozinku nemojte dijeliti — namijenjena je samo vama.')}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendPlatformStaffInviteEmail({
  to,
  memberName,
  password,
}) {
  const origin = env.clientOrigin.replace(/\/$/, '');
  const loginUrl = `${origin}/login`;
  const adminUrl = `${origin}/admin`;
  const subject = 'Vaša prijava — anyminutes platforma';
  const text = [
    `Pozdrav ${memberName},`,
    '',
    'Otvoren vam je račun djelatnika na anyminutes platformi.',
    'Ispod su podaci za prvu prijavu — lozinku je automatski generirao sustav.',
    '',
    `E-pošta: ${to}`,
    `Privremena lozinka: ${password}`,
    '',
    `Prijava: ${loginUrl}`,
    `Admin: ${adminUrl}`,
    '',
    'Ako niste očekivali ovu poruku, zanemarite je ili javite administratoru.',
    'Lozinku nemojte dijeliti — namijenjena je samo vama.',
  ].join('\n');

  const safeName = escapeHtml(memberName);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(password);
  const safeLogin = escapeAttr(loginUrl);
  const safeAdmin = escapeAttr(adminUrl);

  const html = renderEmailShell({
    brandTitle: 'anyminutes',
    eyebrow: 'Pristup platformi',
    footerLabel: 'anyminutes · platform staff',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph('Otvoren vam je račun djelatnika na anyminutes platformi.')}
            ${detailCard(`
              ${detailRow('E-pošta', safeEmail)}
              ${detailRow('Privremena lozinka', safePassword, { last: true, mono: true })}
            `)}
            ${ctaButton(safeLogin, 'Prijavite se')}
            <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#314046">
              Admin:
              <a href="${safeAdmin}" style="font-weight:700;color:#0e6b73">otvorite konzolu</a>
            </p>
            ${mutedNote('Ako niste očekivali ovu poruku, zanemarite je ili javite administratoru. Lozinku nemojte dijeliti — namijenjena je samo vama.')}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendPasswordResetEmail({
  to,
  memberName,
  resetUrl,
}) {
  const subject = 'Oporavak lozinke — anyminutes';
  const text = [
    `Pozdrav ${memberName},`,
    '',
    'Zatražen je oporavak lozinke za vaš anyminutes račun (član ili studio).',
    'Link vrijedi 60 minuta.',
    '',
    'Postavite novu lozinku:',
    resetUrl,
    '',
    'Ako gumb u mailu ne radi, kopirajte i otvorite isti link u pregledniku.',
    '',
    'Ako niste tražili promjenu, zanemarite ovu poruku — lozinka ostaje ista.',
  ].join('\n');

  const safeName = escapeHtml(memberName);
  const safeUrl = escapeAttr(resetUrl);
  const safeUrlText = escapeHtml(resetUrl);

  const html = renderEmailShell({
    brandTitle: 'anyminutes',
    eyebrow: 'Oporavak lozinke',
    footerLabel: 'anyminutes · sigurnost računa',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(`Zatražen je oporavak lozinke za vaš račun (član ili studio).
              Link vrijedi <strong style="color:#0b3d4a">60 minuta</strong>.`, { marginBottom: 22 })}
            ${ctaButton(safeUrl, 'Postavite novu lozinku')}
            ${detailCard(`
              <tr>
                <td style="padding:18px 20px">
                  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a7880;font-weight:700">
                    Ako gumb ne radi
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#314046">
                    Kopirajte i otvorite ovaj direktni link u pregledniku:
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all">
                    <a href="${safeUrl}" style="color:#0e6b73;font-weight:700;text-decoration:underline">${safeUrlText}</a>
                  </p>
                </td>
              </tr>
            `)}
            ${mutedNote('Ako niste tražili promjenu, zanemarite poruku — lozinka ostaje ista.')}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendSubscriptionWarningEmail({
  to,
  contactName,
  studioName,
  validUntil,
  daysLeft,
  plan,
  amount,
  currency,
}) {
  const subject = `Obnova pretplate — ${studioName}`;
  const when = validUntil || 'uskoro';
  const leftText = daysLeft == null
    ? 'uskoro ističe'
    : daysLeft < 0
      ? `istekla je prije ${Math.abs(daysLeft)} dana`
      : daysLeft === 0
        ? 'ističe danas'
        : `ističe za ${daysLeft} dana`;

  const text = [
    `Pozdrav ${contactName},`,
    '',
    `Pretplata za studio ${studioName} ${leftText} (${when}).`,
    `Plan: ${plan || 'pilot'}`,
    amount ? `Iznos: ${amount} ${currency || 'EUR'}` : '',
    '',
    'Molimo obnovite pretplatu kako bi rezervacije i članovi ostali dostupni bez prekida.',
    'Ako ste već platili, zanemarite ovu poruku ili nam javite potvrdu uplate.',
  ].filter(Boolean).join('\n');

  const safeName = escapeHtml(contactName);
  const safeStudio = escapeHtml(studioName);
  const safeWhen = escapeHtml(when);
  const safePlan = escapeHtml(plan || 'pilot');
  const planValue = `${safePlan}${amount ? ` · ${escapeHtml(String(amount))} ${escapeHtml(currency || 'EUR')}` : ''}`;

  const html = renderEmailShell({
    brandTitle: 'anyminutes',
    eyebrow: 'Obnova pretplate',
    footerLabel: 'anyminutes · pretplata partnera',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(`Pretplata za studio <strong style="color:#0b3d4a">${safeStudio}</strong> ${escapeHtml(leftText)}.`)}
            ${detailCard(`
              ${detailRow('Vrijedi do', safeWhen)}
              ${detailRow('Plan', planValue, { last: true })}
            `)}
            <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#314046">
              Obnovite pretplatu na vrijeme kako bi rezervacije i članovi ostali dostupni bez prekida.
            </p>
            ${mutedNote('Ako ste već platili, zanemarite ovu poruku ili nam pošaljite potvrdu uplate.')}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendSubscriptionInvoiceEmail({
  to,
  contactName,
  studioName,
  validUntil,
  plan,
  amount,
  currency,
  draft = true,
}) {
  const subject = draft
    ? `E-račun (priprema) — ${studioName}`
    : `E-račun — ${studioName}`;
  const text = [
    `Pozdrav ${contactName},`,
    '',
    draft
      ? 'Ovo je pripremna obavijest o e-računu. Puni e-račun bit će uveden nakon završetka testiranja.'
      : 'U prilogu / ispod su podaci e-računa za pretplatu anyminutes.',
    '',
    `Studio: ${studioName}`,
    `Plan: ${plan || 'pilot'}`,
    `Iznos: ${amount || 0} ${currency || 'EUR'}`,
    `Pretplata do: ${validUntil || '—'}`,
    '',
    'Hvala što koristite anyminutes.',
  ].join('\n');

  const safeName = escapeHtml(contactName);
  const safeStudio = escapeHtml(studioName);

  const html = renderEmailShell({
    brandTitle: 'anyminutes',
    eyebrow: draft ? 'E-račun · priprema' : 'E-račun',
    footerLabel: 'anyminutes · naplata partnera',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(draft
    ? 'Ovo je <strong>pripremni</strong> e-račun za pretplatu. Puni fiskalni e-račun bit će uveden nakon završetka testiranja.'
    : `E-račun za pretplatu studija <strong style="color:#0b3d4a">${safeStudio}</strong>.`)}
            ${detailCard(`
              ${detailRow('Studio', safeStudio)}
              ${detailRow('Plan / iznos', `${escapeHtml(plan || 'pilot')} · ${escapeHtml(String(amount || 0))} ${escapeHtml(currency || 'EUR')}`)}
              ${detailRow('Pretplata do', escapeHtml(validUntil || '—'), { last: true })}
            `)}
            ${mutedNote(draft ? 'Ovaj dokument nije fiskalni račun.' : 'Hvala što koristite anyminutes.')}
`,
  });

  return sendMail({ to, subject, text, html });
}

async function sendStaffBookingEmail({
  kind,
  to,
  contactName,
  studioName,
  memberName,
  serviceName,
  date,
  startTime,
  endTime,
  cancelledBy,
}) {
  const when = formatWhen(date, startTime, endTime);
  const cancelled = kind === 'cancelled';
  const subject = cancelled
    ? `Otkaz termina — ${studioName}`
    : `Nova rezervacija — ${studioName}`;
  const text = [
    `Pozdrav ${contactName},`,
    '',
    cancelled
      ? `Rezervacija u studiju ${studioName} je otkazana.`
      : `Nova rezervacija u studiju ${studioName}.`,
    '',
    `Član: ${memberName || '—'}`,
    `Usluga: ${serviceName || 'Termin'}`,
    `Termin: ${when}`,
    cancelled && cancelledBy ? `Otkazao: ${cancelledBy}` : '',
    '',
    cancelled
      ? 'Provjerite kalendar u aplikaciji anyminutes.'
      : 'Vidite je u kalendaru aplikacije anyminutes.',
  ].filter(Boolean).join('\n');

  const safeName = escapeHtml(contactName);
  const safeStudio = escapeHtml(studioName);
  const safeMember = escapeHtml(memberName || '—');
  const safeService = escapeHtml(serviceName || 'Termin');
  const safeWhen = escapeHtml(when);
  const safeBy = cancelled && cancelledBy ? escapeHtml(cancelledBy) : '';

  const rows = [
    detailRow('Član', safeMember),
    detailRow('Usluga', safeService),
    detailRow('Termin', safeWhen, { last: !safeBy }),
  ];
  if (safeBy) rows.push(detailRow('Otkazao', safeBy, { last: true }));

  const html = renderEmailShell({
    brandTitle: 'anyminutes',
    eyebrow: cancelled ? 'Otkaz termina' : 'Nova rezervacija',
    footerLabel: 'anyminutes · obavijest studija',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(cancelled
    ? `Rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong> je otkazana.`
    : `Nova rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong>.`)}
            ${detailCard(rows.join(''))}
            ${cancelled ? mutedNote('Provjerite kalendar u aplikaciji anyminutes.') : ''}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendStaffBookingCancelledEmail(payload) {
  return sendStaffBookingEmail({ kind: 'cancelled', ...payload });
}

export async function sendStaffBookingCreatedEmail(payload) {
  return sendStaffBookingEmail({ kind: 'created', ...payload });
}

async function sendMemberBookingEmail({
  kind,
  to,
  memberName,
  studioName,
  studioSlug,
  serviceName,
  date,
  startTime,
  endTime,
  cancelWindowMinutes,
}) {
  const origin = env.clientOrigin.replace(/\/$/, '');
  const bookUrl = studioSlug ? `${origin}/s/${studioSlug}/termini` : `${origin}/login`;
  const when = formatWhen(date, startTime, endTime);
  const confirmed = kind === 'confirmed';
  const windowLabel = Number(cancelWindowMinutes) > 0
    ? `Otkaz najkasnije ${cancelWindowMinutes} min prije početka.`
    : 'Pravila otkazivanja određuje studio.';

  const subject = confirmed
    ? `Potvrda termina — ${studioName}`
    : `Otkaz termina — ${studioName}`;
  const text = confirmed
    ? [
      `Pozdrav ${memberName},`,
      '',
      `Rezervacija u studiju ${studioName} je potvrđena.`,
      '',
      `Usluga: ${serviceName || 'Termin'}`,
      `Termin: ${when}`,
      windowLabel,
      '',
      `Upravljajte terminima: ${bookUrl}`,
      '',
      'Ovo nije marketplace — rezervacija je izravno kod vašeg studija.',
    ].join('\n')
    : [
      `Pozdrav ${memberName},`,
      '',
      `Rezervacija u studiju ${studioName} je otkazana.`,
      '',
      `Usluga: ${serviceName || 'Termin'}`,
      `Termin: ${when}`,
      '',
      `Novi termin: ${bookUrl}`,
    ].join('\n');

  const safeName = escapeHtml(memberName);
  const safeStudio = escapeHtml(studioName);
  const safeService = escapeHtml(serviceName || 'Termin');
  const safeWhen = escapeHtml(when);
  const safeUrl = escapeAttr(bookUrl);
  const safeWindow = escapeHtml(windowLabel);

  const html = renderEmailShell({
    brandTitle: safeStudio,
    eyebrow: confirmed ? 'Potvrda termina' : 'Otkaz termina',
    footerLabel: confirmed ? 'anyminutes · potvrda članu' : 'anyminutes · obavijest članu',
    bodyHtml: `
            ${greeting(safeName)}
            ${bodyParagraph(confirmed
    ? 'Rezervacija je potvrđena. Ovo nije marketplace — termin je izravno kod vašeg studija.'
    : `Rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong> je otkazana.`)}
            ${detailCard(`
              ${detailRow('Usluga', safeService)}
              ${detailRow('Termin', safeWhen, { last: true })}
            `)}
            ${confirmed ? `<p style="margin:0 0 18px;font-size:13px;line-height:1.55;color:#314046">${safeWindow}</p>` : ''}
            ${ctaButton(safeUrl, confirmed ? 'Moji termini' : 'Odaberite novi termin')}
`,
  });

  return sendMail({ to, subject, text, html });
}

export async function sendMemberBookingConfirmedEmail(payload) {
  return sendMemberBookingEmail({ kind: 'confirmed', ...payload });
}

export async function sendMemberBookingCancelledEmail(payload) {
  return sendMemberBookingEmail({ kind: 'cancelled', ...payload });
}
