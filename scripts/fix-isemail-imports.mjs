import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  ['client/src/pages/owner/SettingsPage.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
  ['client/src/pages/owner/MembersPage.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
  ['client/src/pages/owner/SetupPage.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
  ['client/src/pages/public/LoginPage.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
  ['client/src/pages/public/BusinessSignupForm.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
  ['client/src/pages/public/ForgotPasswordPage.jsx', "import { isEmail } from '../../lib/isEmail.js';"],
];

for (const [rel, imp] of files) {
  const p = path.join(root, rel);
  let c = fs.readFileSync(p, 'utf8');
  // Drop every existing isEmail import (including broken mid-block ones).
  c = c.replace(/^import \{ isEmail \} from '[^']+';\r?\n/gm, '');

  if (!c.includes('isEmail(')) {
    console.log('skip (no usage)', rel);
    continue;
  }

  const lines = c.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith('import ')) break;
    if (line.includes(' from ') || line.trim().endsWith(';')) {
      i += 1;
      continue;
    }
    i += 1;
    while (i < lines.length && !/ from ['"]/.test(lines[i])) i += 1;
    i += 1;
  }
  lines.splice(i, 0, imp);
  fs.writeFileSync(p, lines.join('\n'));
  console.log('fixed', rel);
}
