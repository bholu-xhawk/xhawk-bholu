const { execSync } = require('node:child_process');

function normalizePath(p) {
  if (!p) return p;
  if (p.startsWith('apps/api/')) return p.replace(/^apps\/api\//, '');
  return p;
}

(function run() {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf('--runTestsByPath');
  let pathArg = null;
  if (idx !== -1 && argv[idx + 1]) {
    pathArg = normalizePath(argv[idx + 1]);
  }
  const cmd = `vitest run${pathArg ? ' ' + pathArg : ''}`;
  execSync(cmd, { stdio: 'inherit', env: process.env });
})();
