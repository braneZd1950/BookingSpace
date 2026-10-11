import { verifyMail, smtpConfigured } from '../src/utils/mail.js';

const result = await verifyMail();
console.log(smtpConfigured() ? 'SMTP_HOST: postavljen' : 'SMTP_HOST: nije postavljen');
console.log(result.message);
process.exit(result.ok ? 0 : 1);
