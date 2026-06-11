const { defineConfig } = require('vitest/config');

function getIncludeFromNpmArgs() {
  const argvJSON = process.env.npm_config_argv;
  if (!argvJSON) return null;
  try {
    const argv = JSON.parse(argvJSON);
    const cooked = argv && argv.cooked ? argv.cooked : [];
    const idx = cooked.indexOf('--runTestsByPath');
    if (idx !== -1 && cooked[idx + 1]) {
      let p = cooked[idx + 1];
      // If a repo-relative path is provided (e.g., apps/api/test/...),
      // normalize it to be relative to this workspace (apps/api).
      if (p.startsWith('apps/api/')) {
        p = p.replace(/^apps\/api\//, '');
      }
      return [p];
    }
  } catch {}
  return null;
}

const include = getIncludeFromNpmArgs();

module.exports = defineConfig({
  test: {
    include: include || ['test/**/*.spec.js'],
  },
});
