import { spawnSync } from 'node:child_process';

const files = [
  'docs/README.md',
  'docs/_sidebar.md',
  'docs/accounts.md',
  'docs/categories.md',
  'docs/index.html',
  'docs/period-balances.md',
  'docs/reconciliation.md',
  'docs/transactions.md',
  'tests/browser/docsify.spec.ts',
  'tests/browser/style-sweep.spec.ts',
  'routes/web.php',
  'feature_list.json',
  'claude-progress.txt',
  'app/Services/Concerns/ResolvesExchangeRate.php',
  'resources/js/locales/en/translation.json',
  'resources/js/locales/es/translation.json',
  'resources/js/pages/balance-sheet-pdf.test.tsx',
  'resources/js/pages/balance-sheet-time-series.tsx',
  'resources/js/pages/dashboard.test.tsx',
  'resources/js/pages/dashboard.tsx',
  'resources/js/pages/exchange-rates.tsx',
  'scripts/serve-docs.mjs',
  'scripts/verify-docsify.mjs',
  'scripts/mark-docsify-features.mjs',
  'scripts/list-all-failing.mjs',
  'scripts/append-session-progress.mjs',
  'scripts/show-json-tail.mjs',
  'scripts/commit-docsify.mjs',
];

const add = spawnSync('git', ['add', ...files], { encoding: 'utf8' });
if (add.status !== 0) {
  console.error(add.stderr);
  process.exit(add.status ?? 1);
}

const message = `Implement Docsify guides and complete the feature list - verified end-to-end

- Added English docsify 4 guides for accounts, categories, transactions, reconciliation, and period balances
- Served docs via /dev/docsify for container Playwright verification; added docsify and style-sweep browser specs
- Cleared residual fallback-rate literals and restored the Year-to-Date Reports title
- Marked features 6, 10, 20, 27, and 74-87 passing (87/87)
`;

const commit = spawnSync('git', ['commit', '-m', message], { encoding: 'utf8' });
console.log(commit.stdout);
console.error(commit.stderr);
if (commit.status !== 0) process.exit(commit.status ?? 1);

const status = spawnSync('git', ['status'], { encoding: 'utf8' });
console.log(status.stdout);
const log = spawnSync('git', ['log', '--oneline', '-3'], { encoding: 'utf8' });
console.log(log.stdout);
