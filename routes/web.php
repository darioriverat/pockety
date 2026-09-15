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
}

require __DIR__.'/settings.php';
