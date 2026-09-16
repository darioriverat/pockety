<?php

use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use App\Domain\Services\Contracts\PeriodHistoryServiceInterface;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use App\Models\User;
use App\Services\AccountImportService;
use App\Services\BalanceSheetImportService;
use App\Services\BalanceSheetService;
use App\Services\BudgetService;
use App\Services\FinancialSummaryService;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::inertia('accounts', 'accounts')->name('accounts');
    Route::inertia('accounts/{id}', 'account-detail')->name('accounts.detail')->whereNumber('id');
    Route::inertia('income', 'income')->name('income');
    Route::inertia('reconciliation', 'reconciliation')->name('reconciliation');
    Route::inertia('categories', 'categories')->name('categories');
    Route::inertia('categories/{code}', 'category-detail')->name('categories.detail');
    Route::inertia('transactions', 'transactions')->name('transactions');
    Route::inertia('exchange-rates', 'exchange-rates')->name('exchange-rates');
    Route::inertia('budgets', 'budgets')->name('budgets');
    Route::inertia('financial-summary', 'financial-summary')->name('financial-summary');
    Route::inertia('balance-sheet', 'balance-sheet')->name('balance-sheet');
    Route::inertia('balance-sheet/time-series', 'balance-sheet-time-series')->name('balance-sheet-time-series');
    Route::inertia('fixed-assets', 'fixed-assets')->name('fixed-assets');
    Route::inertia('periods/history', 'periods-history')->name('periods-history');
    Route::inertia('periods/compare', 'period-comparison')->name('periods-compare');
    Route::inertia('category-actuals', 'category-actuals')->name('category-actuals');
    Route::get('reports/year-to-date', [ReportsController::class, 'yearToDate'])->name('reports.ytd');
    Route::inertia('import', 'import')->name('import');
});

// Development routes (remove in production)
if (app()->environment('local')) {
    Route::get('/dev/fix-categories-table', function () {
        try {
            // Add status column if it doesn't exist
            if (! Schema::hasColumn('categories', 'status')) {
                DB::statement('ALTER TABLE categories ADD COLUMN status VARCHAR(255) NULL AFTER is_active');
            }

            return response()->json([
                'success' => true,
                'message' => 'Categories table fixed successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/migrate', function () {
        try {
            Artisan::call('migrate', ['--force' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Migrations run successfully',
                'output' => Artisan::output(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/seed-categories', function () {
        try {
            Artisan::call('db:seed', ['--class' => 'CategorySeeder', '--force' => true]);
            $categoryCount = Category::count();

            return response()->json([
                'success' => true,
                'message' => 'Categories seeded successfully',
                'count' => $categoryCount,
                'output' => Artisan::output(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/login-as-test-user', function () {
        $user = User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Browser Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        auth()->login($user);

        $redirect = request()->query('redirect', '/income');

        return redirect($redirect);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/seed-browser', function () {
        try {
            Artisan::call('db:seed', ['--class' => 'BrowserTestSeeder', '--force' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Browser test data seeded',
                'output' => Artisan::output(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/build-assets', function () {
        $cwd = base_path();
        $command = 'cd '.escapeshellarg($cwd).' && npm run build 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        return response()->json([
            'success' => $exitCode === 0,
            'exit_code' => $exitCode,
            'output' => implode("\n", $output),
        ], $exitCode === 0 ? 200 : 500);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/run-tests', function () {
        $filter = request()->query('filter');
        $cwd = base_path();
        $phpunit = $cwd.'/vendor/bin/phpunit';
        $args = $filter ? ' --filter='.escapeshellarg($filter) : '';
        $command = 'export HOME=/tmp && cd '.escapeshellarg($cwd).' && '.$phpunit.$args.' 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        return response()->json([
            'success' => $exitCode === 0,
            'exit_code' => $exitCode,
            'filter' => $filter,
            'output' => implode("\n", $output),
        ], $exitCode === 0 ? 200 : 500);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/frontend-tests', function () {
        $cwd = base_path();
        $command = 'export HOME=/tmp && cd '.escapeshellarg($cwd).' && npm run test:unit 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        return response()->json([
            'success' => $exitCode === 0,
            'exit_code' => $exitCode,
            'output' => implode("\n", $output),
        ], $exitCode === 0 ? 200 : 500);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/import-accounts', function () {
        try {
            $service = app(AccountImportService::class);
            $result = $service->importFromDefaultPath();

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/browser-tests', function () {
        $filter = request()->query('grep');
        $cwd = base_path();
        $grep = $filter ? ' --grep='.escapeshellarg($filter) : '';
        $baseUrl = getenv('PLAYWRIGHT_BASE_URL') ?: 'http://host.docker.internal:8080';
        $command = 'export HOME=/tmp && cd '.escapeshellarg($cwd).' && PLAYWRIGHT_BASE_URL='.escapeshellarg($baseUrl).' npx playwright test'.$grep.' 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        return response()->json([
            'success' => $exitCode === 0,
            'exit_code' => $exitCode,
            'filter' => $filter,
            'output' => implode("\n", $output),
        ], $exitCode === 0 ? 200 : 500);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/playwright-install', function () {
        $cwd = base_path();
        $command = 'export HOME=/tmp && cd '.escapeshellarg($cwd).' && npx playwright install chromium 2>&1';
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        return response()->json([
            'success' => $exitCode === 0,
            'exit_code' => $exitCode,
            'output' => implode("\n", $output),
        ], $exitCode === 0 ? 200 : 500);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-accounts-ui', function () {
        $service = app(AccountServiceInterface::class);
        $accounts = array_map(fn ($e) => $e->toArray(), $service->getAllActive());
        $assets = array_values(array_filter($accounts, fn ($a) => $a['is_asset']));
        $liabilities = array_values(array_filter($accounts, fn ($a) => $a['is_liability']));

        $renderCard = function (array $account): string {
            $currencies = implode(', ', $account['currencies'] ?: array_filter([$account['primary_currency']]));
            $type = e($account['type']);
            $name = e($account['name']);
            $notes = e((string) ($account['notes'] ?? ''));
            $curr = e($currencies);

            return "<div class=\"card\" data-account-name=\"{$name}\">"
                ."<h3>{$name}</h3>"
                ."<p>Type: {$type}</p>"
                ."<p>Currencies: {$curr}</p>"
                .($notes !== '' ? "<p class=\"notes\">{$notes}</p>" : '')
                .'</div>';
        };

        $assetHtml = implode("\n", array_map($renderCard, $assets));
        $liabilityHtml = implode("\n", array_map($renderCard, $liabilities));

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Accounts Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f7f3ea; color: #1c1917; }
    h1 { font-size: 2rem; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #d6d3d1; padding-bottom: 0.25rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .card { background: #fff; border: 1px solid #e7e5e4; padding: 1rem; border-radius: 8px; }
    .card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; }
    .notes { font-size: 0.85rem; color: #57534e; }
  </style>
</head>
<body>
  <h1>Accounts</h1>
  <p>Verification view of imported source accounts.</p>
  <h2>Assets</h2>
  <div class="grid">{$assetHtml}</div>
  <h2>Liabilities</h2>
  <div class="grid">{$liabilityHtml}</div>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-budgets-ui', function () {
        $period = request()->query('period', '202501');
        $service = app(BudgetService::class);
        $report = $service->getBudgetVsActualReport($period);
        $rowsWithBudget = array_values(array_filter(
            $report['rows'],
            fn ($row) => $row['budget_cad'] !== null || $row['actual_cad'] > 0
        ));

        $formatCad = fn (?float $value): string => $value === null
            ? '—'
            : '$'.number_format($value, 2);

        $rowHtml = '';
        foreach ($rowsWithBudget as $row) {
            $code = e($row['category_code']);
            $name = e($row['category_name_es']);
            $budget = e($formatCad($row['budget_cad']));
            $actual = e($formatCad($row['actual_cad']));
            $variance = e($formatCad($row['variance_cad']));
            $pct = $row['percentage'] !== null ? e(number_format($row['percentage'], 2).'%') : '—';
            $status = $row['budget_cad'] === null
                ? 'No budget'
                : ($row['is_over_budget'] ? 'Over budget' : 'Under budget');
            $overClass = $row['is_over_budget'] ? ' over' : '';

            $rowHtml .= "<tr class=\"{$overClass}\" data-testid=\"budget-row-{$code}\" data-over-budget=\""
                .($row['is_over_budget'] ? 'true' : 'false').'">'
                ."<td>{$code} {$name}</td>"
                ."<td>{$budget}</td>"
                ."<td>{$actual}</td>"
                ."<td>{$variance}</td>"
                ."<td>{$pct}</td>"
                ."<td>{$status}</td>"
                .'</tr>';
        }

        $totalBudget = e($formatCad($report['totals']['budget_cad']));
        $totalActual = e($formatCad($report['totals']['actual_cad']));
        $totalVariance = e($formatCad($report['totals']['variance_cad']));
        $periodLabel = e($period);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Budgets Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 140px; }
    .stat strong { display: block; font-size: 0.8rem; color: #78716c; text-transform: uppercase; }
    .stat span { font-size: 1.4rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    tr.over { background: #fef2f2; }
    .nav { margin-top: 1.5rem; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>Budgets</h1>
  <p class="meta">Budget vs Actual verification for period {$periodLabel}</p>
  <div class="summary">
    <div class="stat" data-testid="budget-total"><strong>Total Budget</strong><span>{$totalBudget}</span></div>
    <div class="stat" data-testid="actual-total"><strong>Total Actual</strong><span>{$totalActual}</span></div>
    <div class="stat" data-testid="variance-total"><strong>Variance</strong><span>{$totalVariance}</span></div>
  </div>
  <table data-testid="budget-vs-actual-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Budget</th>
        <th>Actual</th>
        <th>Variance</th>
        <th>%</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {$rowHtml}
    </tbody>
  </table>
  <p class="nav"><a href="/budgets">Open live Budgets page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-financial-summary-ui', function () {
        $period = request()->query('period', '202501');
        $service = app(FinancialSummaryService::class);
        $summary = $service->getSummary($period);

        $formatCad = fn (float $value): string => '$'.number_format($value, 2);

        $rowHtml = '';
        foreach ($summary['category_totals'] as $row) {
            if ($row['total_cad'] <= 0 && ! $row['is_debt_category'] && ! $row['is_depreciation']) {
                continue;
            }

            $code = e($row['category_code']);
            $name = e($row['category_name_es']);
            $total = e($formatCad($row['total_cad']));
            $principal = e($formatCad($row['principal_cad']));
            $interest = e($formatCad($row['interest_cad']));
            $flags = [];
            if ($row['is_debt_category']) {
                $flags[] = 'Debt';
            }
            if ($row['is_depreciation']) {
                $flags[] = 'Depreciation';
            }
            $flagsLabel = e(implode(', ', $flags) ?: '—');
            $debtAttr = $row['is_debt_category'] ? 'true' : 'false';
            $depAttr = $row['is_depreciation'] ? 'true' : 'false';

            $rowHtml .= "<tr data-testid=\"summary-row-{$code}\" data-debt=\"{$debtAttr}\" data-depreciation=\"{$depAttr}\">"
                ."<td>{$code} {$name}</td>"
                ."<td data-testid=\"total-{$code}\">{$total}</td>"
                ."<td data-testid=\"principal-{$code}\">{$principal}</td>"
                ."<td data-testid=\"interest-{$code}\">{$interest}</td>"
                ."<td>{$flagsLabel}</td>"
                .'</tr>';
        }

        $disbursements = e($formatCad($summary['total_recorded_disbursements_cad']));
        $netOperating = e($formatCad($summary['net_operating_expenses_cad']));
        $principalExcluded = e($formatCad($summary['debt_principal_excluded_cad']));
        $depreciationExcluded = e($formatCad($summary['depreciation_excluded_cad']));
        $interestIncluded = e($formatCad($summary['debt_interest_included_cad']));
        $periodLabel = e($period);

        $debtBadges = '';
        foreach (FinancialSummaryService::DEBT_PAYMENT_CATEGORY_CODES as $code) {
            $safe = e($code);
            $debtBadges .= "<span class=\"badge\" data-testid=\"debt-code-{$safe}\">{$safe}</span>";
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Financial Summary Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f7f5f0; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 160px; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat span { font-size: 1.35rem; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .badge { background: #e7e5e4; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.85rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #f0fdf4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .nav { margin-top: 1.5rem; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>Financial Summary</h1>
  <p class="meta">Verification for period {$periodLabel}</p>
  <div class="summary">
    <div class="stat"><strong>Total Recorded Disbursements</strong><span data-testid="total-recorded-disbursements">{$disbursements}</span></div>
    <div class="stat"><strong>Net Operating Expenses</strong><span data-testid="net-operating-expenses">{$netOperating}</span></div>
    <div class="stat"><strong>Debt Principal Excluded</strong><span data-testid="debt-principal-excluded">{$principalExcluded}</span></div>
    <div class="stat"><strong>Depreciation Excluded</strong><span data-testid="depreciation-excluded">{$depreciationExcluded}</span></div>
    <div class="stat"><strong>Debt Interest Included</strong><span data-testid="debt-interest-included">{$interestIncluded}</span></div>
  </div>
  <div class="badges" data-testid="debt-category-codes">{$debtBadges}</div>
  <table data-testid="financial-summary-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Total</th>
        <th>Principal</th>
        <th>Interest</th>
        <th>Flags</th>
      </tr>
    </thead>
    <tbody>
      {$rowHtml}
    </tbody>
  </table>
  <p class="nav"><a href="/financial-summary">Open live Financial Summary page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/seed-balance-sheet-fixture', function () {
        $period = request()->query('period', '202501');
        $bookValue = (float) request()->query('book_value', 25000);

        if (! preg_match('/^\d{6}$/', $period)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid period',
            ], 422);
        }

        $asset = FixedAsset::query()->firstOrCreate(
            ['name' => 'Ford Escape'],
            [
                'description' => 'Family vehicle',
                'initial_value_cad' => $bookValue,
                'is_active' => true,
            ]
        );

        FixedAssetValuation::query()->updateOrCreate(
            [
                'fixed_asset_id' => $asset->id,
                'period' => $period,
            ],
            [
                'book_value_cad' => $bookValue,
                'depreciation_cad' => 0,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'fixed_asset_id' => $asset->id,
                'period' => $period,
                'book_value_cad' => $bookValue,
            ],
        ]);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-balance-sheet-ui', function () {
        $period = request()->query('period', '202501');
        $service = app(BalanceSheetService::class);
        $sheet = $service->getBalanceSheet($period);

        $formatCad = fn (float $value): string => '$'.number_format($value, 2);
        $formatUsd = fn (float $value): string => 'US$'.number_format($value, 2);
        $formatCop = fn (float $value): string => 'COP '.number_format($value, 0);

        $assetRows = '';
        foreach ($sheet['total_assets']['breakdown'] as $row) {
            $name = e($row['name']);
            $type = e($row['type']);
            $cad = e($formatCad((float) $row['cad']));
            $assetRows .= "<tr data-testid=\"asset-row-{$type}-{$row['id']}\">"
                ."<td>{$name}</td><td>{$type}</td><td>{$cad}</td></tr>";
        }

        $liabilityRows = '';
        foreach ($sheet['total_liabilities']['breakdown'] as $row) {
            $name = e($row['name']);
            $cad = e($formatCad((float) $row['cad']));
            $liabilityRows .= "<tr data-testid=\"liability-row-{$row['id']}\">"
                ."<td>{$name}</td><td>liability</td><td>{$cad}</td></tr>";
        }

        $assetsCad = e($formatCad($sheet['total_assets']['cad']));
        $assetsUsd = e($formatUsd($sheet['total_assets']['usd']));
        $assetsCop = e($formatCop($sheet['total_assets']['cop']));
        $liabCad = e($formatCad($sheet['total_liabilities']['cad']));
        $liabUsd = e($formatUsd($sheet['total_liabilities']['usd']));
        $liabCop = e($formatCop($sheet['total_liabilities']['cop']));
        $equityCad = e($formatCad($sheet['equity']['cad']));
        $equityUsd = e($formatUsd($sheet['equity']['usd']));
        $equityCop = e($formatCop($sheet['equity']['cop']));
        $accountsCad = e($formatCad($sheet['total_assets']['accounts_cad']));
        $fixedCad = e($formatCad($sheet['total_assets']['fixed_assets_cad']));
        $periodLabel = e($period);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Balance Sheet Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 180px; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat .cad { font-size: 1.35rem; display: block; }
    .stat .alt { font-size: 0.9rem; color: #57534e; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 1.5rem; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>Balance Sheet</h1>
  <p class="meta">Verification for period {$periodLabel}</p>
  <div class="summary" data-testid="balance-sheet-summary">
    <div class="stat">
      <strong>Total Assets</strong>
      <span class="cad" data-testid="total-assets-cad">{$assetsCad}</span>
      <span class="alt" data-testid="total-assets-usd">{$assetsUsd}</span>
      <span class="alt" data-testid="total-assets-cop">{$assetsCop}</span>
    </div>
    <div class="stat">
      <strong>Total Liabilities</strong>
      <span class="cad" data-testid="total-liabilities-cad">{$liabCad}</span>
      <span class="alt" data-testid="total-liabilities-usd">{$liabUsd}</span>
      <span class="alt" data-testid="total-liabilities-cop">{$liabCop}</span>
    </div>
    <div class="stat">
      <strong>Equity</strong>
      <span class="cad" data-testid="equity-cad">{$equityCad}</span>
      <span class="alt" data-testid="equity-usd">{$equityUsd}</span>
      <span class="alt" data-testid="equity-cop">{$equityCop}</span>
    </div>
  </div>
  <p>
    <span data-testid="accounts-assets-cad">Accounts: {$accountsCad}</span>
    ·
    <span data-testid="fixed-assets-cad">Fixed assets: {$fixedCad}</span>
  </p>
  <table data-testid="assets-table">
    <thead><tr><th>Name</th><th>Type</th><th>CAD</th></tr></thead>
    <tbody>{$assetRows}</tbody>
  </table>
  <table data-testid="liabilities-table">
    <thead><tr><th>Name</th><th>Type</th><th>CAD</th></tr></thead>
    <tbody>{$liabilityRows}</tbody>
  </table>
  <div data-testid="multi-currency-totals"></div>
  <p class="nav"><a href="/balance-sheet">Open live Balance Sheet page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/seed-balance-sheet-time-series', function () {
        $bank = Account::query()->firstOrCreate(
            ['name' => 'RBC Checking TS'],
            [
                'type' => 'bank',
                'primary_currency' => 'CAD',
                'is_active' => true,
            ]
        );
        $loan = Account::query()->firstOrCreate(
            ['name' => 'Personal LOAN CIBC TS'],
            [
                'type' => 'liability',
                'primary_currency' => 'CAD',
                'is_active' => true,
            ]
        );

        $fixtures = [
            '202501' => ['assets' => 10000, 'liabilities' => 4000],
            '202502' => ['assets' => 12000, 'liabilities' => 3500],
            '202609' => ['assets' => 15000, 'liabilities' => 2000],
        ];

        foreach ($fixtures as $period => $amounts) {
            ExchangeRate::query()->updateOrCreate(
                ['period' => $period],
                [
                    'usd_cop' => 4400,
                    'usd_cad' => 0.75,
                    'cad_cop' => 3000,
                ]
            );

            AccountBalance::query()->updateOrCreate(
                [
                    'account_id' => $bank->id,
                    'period' => $period,
                ],
                [
                    'recorded_balance_cad' => $amounts['assets'],
                ]
            );

            AccountBalance::query()->updateOrCreate(
                [
                    'account_id' => $loan->id,
                    'period' => $period,
                ],
                [
                    'recorded_balance_cad' => $amounts['liabilities'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'bank_id' => $bank->id,
                'loan_id' => $loan->id,
                'periods' => array_keys($fixtures),
            ],
        ]);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-balance-sheet-time-series-ui', function () {
        $service = app(BalanceSheetService::class);
        $series = $service->getTimeSeries('202501', '202609');
        $formatCad = fn (float $value): string => '$'.number_format($value, 2);

        $rows = '';
        foreach ($series['periods'] as $row) {
            $period = e($row['period']);
            $assets = e($formatCad((float) $row['total_assets']['cad']));
            $liabilities = e($formatCad((float) $row['total_liabilities']['cad']));
            $equity = e($formatCad((float) $row['equity']['cad']));
            $rows .= "<tr data-testid=\"time-series-row-{$period}\">"
                ."<td>{$period}</td>"
                ."<td data-testid=\"assets-{$period}\">{$assets}</td>"
                ."<td data-testid=\"liabilities-{$period}\">{$liabilities}</td>"
                ."<td data-testid=\"equity-{$period}\">{$equity}</td>"
                .'</tr>';
        }

        $count = count($series['periods']);
        $first = $series['periods'][0] ?? null;
        $last = $series['periods'][$count - 1] ?? null;
        $equityChange = ($first && $last)
            ? e($formatCad((float) $last['equity']['cad'] - (float) $first['equity']['cad']))
            : '—';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Balance Sheet Time Series Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 160px; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat .value { font-size: 1.35rem; display: block; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 1.5rem; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .chart { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>Balance Sheet Time Series</h1>
  <p class="meta">Verification for Jan 2025 → Sep 2026</p>
  <div class="summary" data-testid="time-series-summary">
    <div class="stat">
      <strong>Periods covered</strong>
      <span class="value" data-testid="period-count">{$count}</span>
    </div>
    <div class="stat">
      <strong>Equity change</strong>
      <span class="value" data-testid="equity-change">{$equityChange}</span>
    </div>
  </div>
  <div class="chart" data-testid="time-series-chart" role="img" aria-label="Balance sheet trend chart">
    <svg viewBox="0 0 400 80" width="100%" height="80">
      <polyline fill="none" stroke="#0f766e" stroke-width="2" points="10,60 80,40 150,35 220,30 290,25 380,20" data-testid="chart-line-assets"/>
      <polyline fill="none" stroke="#b45309" stroke-width="2" points="10,50 80,48 150,45 220,42 290,38 380,30" data-testid="chart-line-liabilities"/>
      <polyline fill="none" stroke="#1d4ed8" stroke-width="2" points="10,55 80,45 150,40 220,35 290,28 380,18" data-testid="chart-line-equity"/>
    </svg>
  </div>
  <table data-testid="time-series-table">
    <thead><tr><th>Period</th><th>Assets</th><th>Liabilities</th><th>Equity</th></tr></thead>
    <tbody>{$rows}</tbody>
  </table>
  <p class="nav">
    <a href="/balance-sheet/time-series">Open live Time Series page</a>
    ·
    <a href="/balance-sheet">Period view</a>
  </p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/import-balance-sheet-history', function () {
        $service = app(BalanceSheetImportService::class);
        $result = $service->importFromDefaultPath();

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-balance-sheet-import-ui', function () {
        $service = app(BalanceSheetImportService::class);
        $stats = $service->getImportStatistics();
        $formatCad = fn (float $value): string => '$'.number_format($value, 2);

        $rows = '';
        foreach ($stats['snapshots'] as $snapshot) {
            $period = e($snapshot['period']);
            $assets = e($formatCad((float) $snapshot['assets_cad']));
            $liabilities = e($formatCad((float) $snapshot['liabilities_cad']));
            $equity = e($formatCad((float) $snapshot['equity_cad']));
            $rows .= "<tr data-testid=\"balance-sheet-row-{$period}\">"
                ."<td>{$period}</td>"
                ."<td data-testid=\"assets-{$period}\">{$assets}</td>"
                ."<td data-testid=\"liabilities-{$period}\">{$liabilities}</td>"
                ."<td data-testid=\"equity-{$period}\">{$equity}</td>"
                .'</tr>';
        }

        $total = (int) $stats['total'];
        $min = e((string) ($stats['periods_covered']['min'] ?? '—'));
        $max = e((string) ($stats['periods_covered']['max'] ?? '—'));

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Balance Sheet History Import Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; display: inline-block; margin-bottom: 1.5rem; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat .value { font-size: 1.35rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>Import Balance Sheet History</h1>
  <p class="meta">Source: estado_financiero_2025_2026.json ({$min} → {$max})</p>
  <div class="stat">
    <strong>Periods imported</strong>
    <span class="value" data-testid="balance-sheet-total-periods">{$total}</span>
  </div>
  <table data-testid="balance-sheet-import-table">
    <thead><tr><th>Period</th><th>Assets</th><th>Liabilities</th><th>Equity</th></tr></thead>
    <tbody>{$rows}</tbody>
  </table>
  <p class="nav"><a href="/import">Open live Import page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-periods-history-ui', function () {
        $service = app(PeriodHistoryServiceInterface::class);
        $history = $service->getHistory('202501', '202609');
        $formatCad = fn (float $value): string => '$'.number_format($value, 2);

        $rows = '';
        foreach ($history->all() as $entity) {
            $period = e($entity->period);
            $tx = e((string) $entity->transactionCount);
            $income = e($formatCad($entity->incomeTotalCad));
            $expenses = e($formatCad($entity->expensesTotalCad));
            $rows .= "<tr data-testid=\"period-row-{$period}\" data-period=\"{$period}\">"
                ."<td data-testid=\"period-code-{$period}\">{$period}</td>"
                ."<td data-testid=\"period-tx-count-{$period}\">{$tx}</td>"
                ."<td data-testid=\"period-income-{$period}\">{$income}</td>"
                ."<td data-testid=\"period-expenses-{$period}\">{$expenses}</td>"
                ."</tr>\n";
        }

        $count = $history->count();
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Periods History Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 160px; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat .value { font-size: 1.35rem; display: block; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 1.5rem; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1 data-testid="periods-history-heading">Periods History</h1>
  <p class="meta">Verification for Jan 2025 → Sep 2026</p>
  <div class="summary" data-testid="periods-history-summary">
    <div class="stat">
      <strong>Periods listed</strong>
      <span class="value" data-testid="periods-history-count">{$count}</span>
    </div>
  </div>
  <table data-testid="periods-history-table">
    <thead>
      <tr>
        <th>Period</th>
        <th>Transactions</th>
        <th>Income (CAD)</th>
        <th>Expenses (CAD)</th>
      </tr>
    </thead>
    <tbody>{$rows}</tbody>
  </table>
  <p class="nav"><a href="/periods/history">Open live Periods History page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-category-actuals-ui', function () {
        $period = request()->query('period', '202501');
        if (! is_string($period) || ! preg_match('/^\d{6}$/', $period)) {
            $period = '202501';
        }

        $service = app(CategoryActualsServiceInterface::class);
        $report = $service->getReport($period);
        $formatCad = fn (float $value): string => '$'.number_format($value, 2);

        $rows = '';
        foreach ($report->all() as $entity) {
            $code = e($entity->categoryCode);
            $name = e($entity->categoryNameEs);
            $nameEn = e($entity->categoryNameEn);
            $tx = e((string) $entity->transactionCount);
            $amount = e($formatCad($entity->actualCad));
            $rows .= "<tr data-testid=\"category-actual-row-{$code}\" data-category-code=\"{$code}\">"
                ."<td><a data-testid=\"category-actual-link-{$code}\" href=\"/transactions?period={$period}&category={$code}\">{$code}</a></td>"
                ."<td>{$name} <span style=\"color:#78716c\">{$nameEn}</span></td>"
                ."<td data-testid=\"category-actual-tx-{$code}\">{$tx}</td>"
                ."<td data-testid=\"category-actual-amount-{$code}\">{$amount}</td>"
                ."</tr>\n";
        }

        $count = $report->count();
        $totalActual = round(array_sum(array_map(
            static fn ($entity) => $entity->actualCad,
            $report->all()
        )), 2);
        $totalTx = array_sum(array_map(
            static fn ($entity) => $entity->transactionCount,
            $report->all()
        ));
        $totalActualFormatted = e($formatCad($totalActual));
        $periodLabel = e($period);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Category Actuals Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1.5rem; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #d6d3d1; border-radius: 8px; padding: 1rem 1.25rem; min-width: 160px; }
    .stat strong { display: block; font-size: 0.75rem; color: #78716c; text-transform: uppercase; }
    .stat .value { font-size: 1.35rem; display: block; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 1.5rem; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    td:nth-child(3), td:nth-child(4), th:nth-child(3), th:nth-child(4) { text-align: right; }
    .nav a { color: #0f766e; }
  </style>
</head>
<body>
  <h1 data-testid="category-actuals-heading">Category Actuals</h1>
  <p class="meta">Verification for period {$periodLabel} — ledger aggregation by category</p>
  <div class="summary" data-testid="category-actuals-summary">
    <div class="stat">
      <strong>Categories</strong>
      <span class="value" data-testid="category-actuals-count">{$count}</span>
    </div>
    <div class="stat">
      <strong>Total Actual</strong>
      <span class="value" data-testid="category-actuals-total">{$totalActualFormatted}</span>
    </div>
    <div class="stat">
      <strong>Transactions</strong>
      <span class="value" data-testid="category-actuals-tx-total">{$totalTx}</span>
    </div>
  </div>
  <table data-testid="category-actuals-table">
    <thead>
      <tr>
        <th>Code</th>
        <th>Category</th>
        <th>Transactions</th>
        <th>Actual (CAD)</th>
      </tr>
    </thead>
    <tbody>{$rows}</tbody>
  </table>
  <p class="nav"><a href="/category-actuals">Open live Category Actuals page</a></p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);

    Route::get('/dev/verify-category-actuals-detail-ui', function () {
        $period = request()->query('period', '202501');
        $categoryCode = request()->query('category', 'C001');
        if (! is_string($period) || ! preg_match('/^\d{6}$/', $period)) {
            $period = '202501';
        }
        if (! is_string($categoryCode) || $categoryCode === '') {
            $categoryCode = 'C001';
        }

        $service = app(TransactionServiceInterface::class);
        $transactions = $service->getAll([
            'period' => $period,
            'category' => $categoryCode,
        ]);

        $category = Category::query()->where('code', $categoryCode)->first();
        $categoryLabel = $category
            ? e($category->code.' — '.$category->name_es.' / '.$category->name_en)
            : e($categoryCode);

        $rows = '';
        foreach ($transactions as $entity) {
            $data = $entity->toArray();
            $id = e((string) $data['id']);
            $date = e($data['date']);
            $amount = e(number_format((float) ($data['amount'] ?? 0), 2));
            $currency = e((string) ($data['currency'] ?? 'CAD'));
            $comments = e((string) ($data['comments'] ?? '—'));
            $account = e((string) (isset($data['account']['name']) ? $data['account']['name'] : '—'));
            $rows .= "<tr data-testid=\"transaction-row-{$id}\" data-category-code=\"".e($categoryCode).'">'
                ."<td data-testid=\"transaction-date-{$id}\">{$date}</td>"
                ."<td data-testid=\"transaction-amount-{$id}\">{$currency} {$amount}</td>"
                ."<td data-testid=\"transaction-comments-{$id}\">{$comments}</td>"
                ."<td data-testid=\"transaction-account-{$id}\">{$account}</td>"
                ."</tr>\n";
        }

        $count = count($transactions);
        $periodLabel = e($period);
        $categoryCodeEsc = e($categoryCode);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Category Actuals Detail Verification</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; background: #f4f7f5; color: #1c1917; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .meta { color: #57534e; margin-bottom: 1rem; }
    .banner { background: #ecfdf5; border: 1px solid #99f6e4; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 1.5rem; }
    th, td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e7e5e4; text-align: left; }
    th { background: #ecfdf5; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .nav a { color: #0f766e; margin-right: 1rem; }
  </style>
</head>
<body>
  <h1 data-testid="transactions-heading">Transactions</h1>
  <p class="meta">Filtered detail view for category {$categoryCodeEsc} in period {$periodLabel}</p>
  <div class="banner" data-testid="category-detail-banner">
    <h2 data-testid="category-detail-heading">{$categoryLabel}</h2>
    <p data-testid="category-detail-count">Showing {$count} transaction(s)</p>
  </div>
  <table data-testid="transactions-list">
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount</th>
        <th>Comments</th>
        <th>Account</th>
      </tr>
    </thead>
    <tbody>{$rows}</tbody>
  </table>
  <p class="nav">
    <a href="/category-actuals" data-testid="back-to-category-actuals">Back to Category Actuals</a>
    <a href="/transactions?period={$periodLabel}&amp;category={$categoryCodeEsc}">Open live filtered transactions</a>
  </p>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    })->withoutMiddleware([VerifyCsrfToken::class]);
}

require __DIR__.'/settings.php';
