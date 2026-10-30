import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const keys = webpush.generateVAPIDKeys();
const write = process.argv.includes('--write');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(root, '.env');

console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('VAPID_SUBJECT=mailto:kontakt@anyminutes.hr');

if (!write) {
  console.log('\nDodaj u .env u rootu repoa ili pokreni: npm run generate:vapid -- --write');
  process.exit(0);
}

let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const lines = {
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: 'mailto:kontakt@anyminutes.hr',
};

for (const [key, value] of Object.entries(lines)) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, `${key}=${value}`);
  else text = `${text.trimEnd()}\n${key}=${value}\n`;
}

fs.writeFileSync(envPath, text.endsWith('\n') ? text : `${text}\n`);
console.log(`\nUpisano u ${envPath}`);
