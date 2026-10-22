import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(args, cwd) {
  return spawn('npm', args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
}

const children = [
  run(['run', 'dev'], path.join(root, 'client-mobile')),
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
