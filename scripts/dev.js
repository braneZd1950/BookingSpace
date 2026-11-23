import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(args, cwd) {
  // Prefer npm.cmd on Windows so we can keep shell:false (no shell injection surface).
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npmCmd, args, {
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
