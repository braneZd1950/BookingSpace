import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Resolve npm's JS entry so Windows Node 22+ can spawn without shell (npm.cmd → EINVAL). */
function resolveNpmCli() {
  const candidates = [
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('npm-cli.js not found next to the Node.js install; cannot start dev processes.');
}

function run(args, cwd) {
  return spawn(process.execPath, [resolveNpmCli(), ...args], {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: process.env,
    windowsHide: true,
  });
}

const children = [
  run(['run', 'dev'], path.join(root, 'client')),
  run(['start'], path.join(root, 'server')),
];

function stop() {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});
