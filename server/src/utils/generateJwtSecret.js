import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomString } from './randomString.js';

const envFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../.env.development',
);

const secret = randomString(32);
const write = process.argv.includes('--write');

if (!write) {
  process.stdout.write(`${secret}\n`);
  process.exit(0);
}

let text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
if (text && !text.endsWith('\n')) text += '\n';

if (/^JWT_SECRET=.*$/m.test(text)) {
  text = text.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
} else {
  text += `\n# JWT\nJWT_SECRET=${secret}\n`;
}

if (!/^JWT_EXPIRES_IN=.*$/m.test(text)) {
  text += 'JWT_EXPIRES_IN=7d\n';
}

fs.writeFileSync(envFile, text);
process.stdout.write('JWT_SECRET written to .env.development\n');
