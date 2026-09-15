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
        $command = 'export HOME=/tmp && cd '.escapeshellarg($cwd).' && PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test'.$grep.' 2>&1';
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
}

require __DIR__.'/settings.php';
