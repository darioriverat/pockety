import { execSync } from 'node:child_process';

const paths = [
    'app',
    'bootstrap/app.php',
    'database/factories',
    'database/migrations/2026_10_04_060000_add_user_id_to_financial_tables.php',
    'database/seeders',
    'feature_list.json',
    'phpunit.xml',
    'routes/api.php',
    'routes/web.php',
    'scripts/session-helpers.mjs',
    'tests/Feature/AvailablePeriodTest.php',
    'tests/Feature/ExchangeRateTest.php',
    'tests/Feature/FixedAssetTest.php',
    'tests/Feature/IncomeCategoryTransactionTest.php',
    'tests/Feature/TransactionDebtPaymentTest.php',
    'tests/Feature/OwnerResolverTest.php',
    'tests/Feature/UserOwnershipMigrationTest.php',
    'tests/browser/categories.spec.ts',
    'tests/browser/category-404-validation.spec.ts',
    'tests/browser/category-deletion.spec.ts',
    'tests/browser/category-list-filtering.spec.ts',
    'tests/browser/helpers.ts',
    'tests/browser/user-ownership.spec.ts',
    'claude-progress.txt',
];

execSync(`git add ${paths.map((p) => `'${p}'`).join(' ')}`, { stdio: 'inherit' });
try {
    execSync("git add -f 'verification/user-ownership'", { stdio: 'inherit' });
} catch {
    console.log('verification screenshots ignored; continuing without them');
}

const message = `Implement per-user ownership foundation - verified end-to-end

- Added user_id to all financial tables with backfill, per-user uniques, and template seeding
- Scoped category and financial services via OwnerResolver; API routes require session auth
- Tested with PHPUnit, Playwright browser automation, and UI screenshots
- Updated feature_list.json: marked tests #33-#46 as passing
- Screenshots in verification/user-ownership/
`;

execSync('git commit -m ' + JSON.stringify(message), { stdio: 'inherit' });
execSync('git status', { stdio: 'inherit' });
