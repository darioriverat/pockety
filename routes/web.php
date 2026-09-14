<?php

use App\Http\Middleware\VerifyCsrfToken;
use App\Models\Category;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('accounts', 'accounts')->name('accounts');
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
}

require __DIR__.'/settings.php';
