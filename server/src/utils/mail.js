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

  const html = `
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
              ${safeStudio}
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Pristup članu
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">
              Pozdrav ${safeName},
            </p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#314046">
              Otvoren vam je račun za rezervaciju termina u studiju
              <strong style="color:#0b3d4a">${safeStudio}</strong>.
              Ispod su podaci za prvu prijavu — lozinku je automatski generirao sustav.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:18px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a7880;font-weight:700">
                    E-pošta
                  </p>
                  <p style="margin:0;font-size:16px;color:#0b3d4a;font-weight:700">
                    ${safeEmail}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 20px">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a7880;font-weight:700">
                    Privremena lozinka
                  </p>
                  <p style="margin:0;font-size:22px;letter-spacing:0.08em;color:#0b3d4a;font-weight:700;font-family:Consolas,'Courier New',monospace">
                    ${safePassword}
                  </p>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px">
              <tr>
                <td style="background:#0b3d4a;border-radius:999px">
                  <a href="${safeLogin}" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    Prijavite se
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#314046">
              Nakon prijave otvorite stranicu studija i rezervirajte termin:
            </p>
            <p style="margin:0 0 26px">
              <a href="${safeSite}" style="font-size:14px;font-weight:700;color:#0e6b73;text-decoration:underline">
                ${safeSiteLabel}
              </a>
            </p>
            <p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">
              Ako niste očekivali ovu poruku, zanemarite je ili javite studiju.
              Lozinku nemojte dijeliti — namijenjena je samo vama.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · rezervacije za studio
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

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

  const html = `
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
              anyminutes
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Oporavak lozinke
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">
              Pozdrav ${safeName},
            </p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#314046">
              Zatražen je oporavak lozinke za vaš račun (član ili studio).
              Link vrijedi <strong style="color:#0b3d4a">60 minuta</strong>.
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px">
              <tr>
                <td style="background:#0b3d4a;border-radius:999px">
                  <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    Postavite novu lozinku
                  </a>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 26px;background:#f4f7f8;border:1px solid #dce5e8">
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
            </table>
            <p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">
              Ako niste tražili promjenu, zanemarite poruku — lozinka ostaje ista.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · sigurnost računa
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

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

  const html = `
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
              anyminutes
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Obnova pretplate
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              Pretplata za studio <strong style="color:#0b3d4a">${safeStudio}</strong> ${escapeHtml(leftText)}.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a7880;font-weight:700">Vrijedi do</p>
                  <p style="margin:0;font-size:18px;color:#0b3d4a;font-weight:700">${safeWhen}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6a7880;font-weight:700">Plan</p>
                  <p style="margin:0;font-size:15px;color:#0b3d4a;font-weight:700">${safePlan}${amount ? ` · ${escapeHtml(String(amount))} ${escapeHtml(currency || 'EUR')}` : ''}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#314046">
              Obnovite pretplatu na vrijeme kako bi rezervacije i članovi ostali dostupni bez prekida.
            </p>
            <p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">
              Ako ste već platili, zanemarite ovu poruku ili nam pošaljite potvrdu uplate.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · pretplata partnera
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

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

  const html = `
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
              anyminutes
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              ${draft ? 'E-račun · priprema' : 'E-račun'}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              ${draft
    ? 'Ovo je <strong>pripremni</strong> e-račun za pretplatu. Puni fiskalni e-račun bit će uveden nakon završetka testiranja.'
    : `E-račun za pretplatu studija <strong style="color:#0b3d4a">${safeStudio}</strong>.`}
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Studio</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeStudio}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Plan / iznos</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${escapeHtml(plan || 'pilot')} · ${escapeHtml(String(amount || 0))} ${escapeHtml(currency || 'EUR')}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Pretplata do</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${escapeHtml(validUntil || '—')}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">
              ${draft ? 'Ovaj dokument nije fiskalni račun.' : 'Hvala što koristite anyminutes.'}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · naplata partnera
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

  return sendMail({ to, subject, text, html });
}

export async function sendStaffBookingCancelledEmail({
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
  const subject = `Otkaz termina — ${studioName}`;
  const when = `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
  const text = [
    `Pozdrav ${contactName},`,
    '',
    `Rezervacija u studiju ${studioName} je otkazana.`,
    '',
    `Član: ${memberName || '—'}`,
    `Usluga: ${serviceName || 'Termin'}`,
    `Termin: ${when}`,
    cancelledBy ? `Otkazao: ${cancelledBy}` : '',
    '',
    'Provjerite kalendar u aplikaciji anyminutes.',
  ].filter(Boolean).join('\n');

  const safeName = escapeHtml(contactName);
  const safeStudio = escapeHtml(studioName);
  const safeMember = escapeHtml(memberName || '—');
  const safeService = escapeHtml(serviceName || 'Termin');
  const safeWhen = escapeHtml(when);
  const safeBy = cancelledBy ? escapeHtml(cancelledBy) : '';

  const html = `
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
              anyminutes
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Otkaz termina
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              Rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong> je otkazana.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Član</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeMember}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Usluga</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeService}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px${safeBy ? ';border-bottom:1px solid #dce5e8' : ''}">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Termin</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeWhen}</p>
                </td>
              </tr>
              ${safeBy ? `<tr>
                <td style="padding:14px 20px">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Otkazao</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeBy}</p>
                </td>
              </tr>` : ''}
            </table>
            <p style="margin:0;padding-top:18px;border-top:1px solid #e6ebef;font-size:12px;line-height:1.55;color:#6a7880">
              Provjerite kalendar u aplikaciji anyminutes.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · obavijest studija
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

  return sendMail({ to, subject, text, html });
}

export async function sendStaffBookingCreatedEmail({
  to,
  contactName,
  studioName,
  memberName,
  serviceName,
  date,
  startTime,
  endTime,
}) {
  const subject = `Nova rezervacija — ${studioName}`;
  const when = `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
  const text = [
    `Pozdrav ${contactName},`,
    '',
    `Nova rezervacija u studiju ${studioName}.`,
    '',
    `Član: ${memberName || '—'}`,
    `Usluga: ${serviceName || 'Termin'}`,
    `Termin: ${when}`,
    '',
    'Vidite je u kalendaru aplikacije anyminutes.',
  ].join('\n');

  const safeName = escapeHtml(contactName);
  const safeStudio = escapeHtml(studioName);
  const safeMember = escapeHtml(memberName || '—');
  const safeService = escapeHtml(serviceName || 'Termin');
  const safeWhen = escapeHtml(when);

  const html = `
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
              anyminutes
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Nova rezervacija
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              Nova rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong>.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Član</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeMember}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Usluga</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeService}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Termin</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeWhen}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · obavijest studija
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

  return sendMail({ to, subject, text, html });
}

export async function sendMemberBookingConfirmedEmail({
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
  const when = `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
  const windowLabel = Number(cancelWindowMinutes) > 0
    ? `Otkaz najkasnije ${cancelWindowMinutes} min prije početka.`
    : 'Pravila otkazivanja određuje studio.';

  const subject = `Potvrda termina — ${studioName}`;
  const text = [
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
  ].join('\n');

  const safeName = escapeHtml(memberName);
  const safeStudio = escapeHtml(studioName);
  const safeService = escapeHtml(serviceName || 'Termin');
  const safeWhen = escapeHtml(when);
  const safeUrl = escapeAttr(bookUrl);
  const safeWindow = escapeHtml(windowLabel);

  const html = `
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
              ${safeStudio}
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Potvrda termina
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              Rezervacija je potvrđena. Ovo nije marketplace — termin je izravno kod vašeg studija.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Usluga</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeService}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Termin</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeWhen}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.55;color:#314046">${safeWindow}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px">
              <tr>
                <td style="background:#0b3d4a;border-radius:999px">
                  <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    Moji termini
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · potvrda članu
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

  return sendMail({ to, subject, text, html });
}

export async function sendMemberBookingCancelledEmail({
  to,
  memberName,
  studioName,
  studioSlug,
  serviceName,
  date,
  startTime,
  endTime,
}) {
  const origin = env.clientOrigin.replace(/\/$/, '');
  const bookUrl = studioSlug ? `${origin}/s/${studioSlug}/termini` : `${origin}/login`;
  const when = `${date} · ${startTime}${endTime ? `–${endTime}` : ''}`;
  const subject = `Otkaz termina — ${studioName}`;
  const text = [
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

  const html = `
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
              ${safeStudio}
            </p>
            <p style="margin:8px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6a7880;font-weight:700">
              Otkaz termina
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#1a262b">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.55">Pozdrav ${safeName},</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#314046">
              Rezervacija u studiju <strong style="color:#0b3d4a">${safeStudio}</strong> je otkazana.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f4f7f8;border:1px solid #dce5e8">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #dce5e8">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Usluga</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeService}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px">
                  <p style="margin:0;font-size:12px;color:#6a7880;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">Termin</p>
                  <p style="margin:4px 0 0;font-weight:700;color:#0b3d4a">${safeWhen}</p>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 8px">
              <tr>
                <td style="background:#0b3d4a;border-radius:999px">
                  <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
                    Odaberite novi termin
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
            <p style="margin:0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a969c">
              anyminutes · obavijest članu
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

  return sendMail({ to, subject, text, html });
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
