<?php

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Category;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::inertia('accounts', 'accounts')->name('accounts');
    Route::inertia('income', 'income')->name('income');
    Route::inertia('reconciliation', 'reconciliation')->name('reconciliation');
    Route::inertia('categories', 'categories')->name('categories');
    Route::inertia('transactions', 'transactions')->name('transactions');
    Route::inertia('exchange-rates', 'exchange-rates')->name('exchange-rates');
    Route::inertia('budgets', 'budgets')->name('budgets');
    Route::inertia('financial-summary', 'financial-summary')->name('financial-summary');
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
        $user = \App\Models\User::query()->updateOrCreate(
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
            $service = app(\App\Services\AccountImportService::class);
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
        $service = app(\App\Domain\Services\Contracts\AccountServiceInterface::class);
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
        $service = app(\App\Services\BudgetService::class);
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
                .($row['is_over_budget'] ? 'true' : 'false')."\">"
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
        $service = app(\App\Services\FinancialSummaryService::class);
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
        foreach (\App\Services\FinancialSummaryService::DEBT_PAYMENT_CATEGORY_CODES as $code) {
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
}

require __DIR__.'/settings.php';
