<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Checking database tables...\n\n";

$tables = ['categories', 'accounts', 'exchange_rates', 'transactions', 'account_balances', 'budgets', 'income', 'fixed_assets'];

foreach ($tables as $table) {
    $exists = Schema::hasTable($table);
    echo "  {$table}: ".($exists ? '✓ EXISTS' : '✗ MISSING')."\n";
}

echo "\n";

// Check migrations table
echo "Checking migrations table:\n";
$migrations = DB::table('migrations')->orderBy('batch')->get();
foreach ($migrations as $migration) {
    echo "  [{$migration->batch}] {$migration->migration}\n";
}
