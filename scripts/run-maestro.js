/**
 * Run Maestro flows with a PATH-safe lookup (Windows npm scripts often miss User PATH).
 *
 * Usage: node scripts/run-maestro.js [extra maestro args...]
 * Default: test mobile/.maestro
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extra = process.argv.slice(2);
const args = extra.length ? extra : ['test', path.join(root, 'mobile', '.maestro')];

const candidates = [
  process.env.MAESTRO_BIN,
  process.platform === 'win32'
    ? path.join(os.homedir(), 'Downloads', 'maestro', 'maestro', 'bin', 'maestro.bat')
    : null,
  process.platform === 'win32' ? 'C:\\maestro\\bin\\maestro.bat' : null,
  process.platform === 'win32' ? 'maestro.bat' : 'maestro',
  'maestro',
].filter(Boolean);

function resolveCmd() {
  for (const candidate of candidates) {
    if (candidate === 'maestro' || candidate === 'maestro.bat') return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const cmd = resolveCmd();
if (!cmd) {
  console.error('Maestro CLI not found. Install it or set MAESTRO_BIN to maestro.bat');
  process.exit(1);
}

function resolveJavaHome() {
  const candidates = [
    process.env.MAESTRO_JAVA_HOME,
    process.env.JAVA_HOME,
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    path.join(os.homedir(), 'Desktop', 'Projekti', 'MobileDev', 'Java', 'jdk-17'),
    'C:\\Projekti\\MobileDev\\Java\\jdk-17',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const javaExe = path.join(
      candidate,
      'bin',
      process.platform === 'win32' ? 'java.exe' : 'java',
    );
    if (fs.existsSync(javaExe)) return candidate;
  }
  return null;
}

const javaHome = resolveJavaHome();
if (!javaHome) {
  console.error('Valid JAVA_HOME not found. Install JDK 17+ or set MAESTRO_JAVA_HOME.');
  process.exit(1);
}

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  Path: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.Path || process.env.PATH || ''}`,
};

const result = spawnSync(cmd, args, {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env,
});

process.exit(result.status ?? 1);
