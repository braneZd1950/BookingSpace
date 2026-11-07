import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const clientFiles = [
  'client/src/pages/public/ForgotPasswordPage.jsx',
  'client/src/pages/public/LoginPage.jsx',
  'client/src/pages/public/BusinessSignupForm.jsx',
  'client/src/pages/owner/MembersPage.jsx',
  'client/src/pages/owner/SettingsPage.jsx',
  'client/src/pages/owner/SetupPage.jsx',
];

const re = /!?\/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\/\.test\(([^)]+)\)/g;

function patch(rel, importPath) {
  const p = path.join(root, rel);
  let c = fs.readFileSync(p, 'utf8');
  const next = c.replace(re, (m, arg) => (m.startsWith('!') ? `!isEmail(${arg})` : `isEmail(${arg})`));
  if (next === c) {
    console.log('no match', rel);
    return;
  }
  let out = next;
  if (!out.includes('isEmail')) {
    console.log('replace failed?', rel);
    return;
  }
  if (!out.includes(importPath) && !out.includes('lib/isEmail')) {
    const lines = out.split('\n');
    let insertAt = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].startsWith('import ')) insertAt = i + 1;
      else if (insertAt && !lines[i].startsWith('import ')) break;
    }
    lines.splice(insertAt, 0, `import { isEmail } from '${importPath}';`);
    out = lines.join('\n');
  }
  fs.writeFileSync(p, out);
  console.log('ok', rel);
}

for (const rel of clientFiles) patch(rel, '../../lib/isEmail.js');
