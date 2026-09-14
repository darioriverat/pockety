<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo "Fixing account_id column to be nullable...\n";

try {
    DB::statement('ALTER TABLE transactions MODIFY COLUMN account_id BIGINT UNSIGNED NULL');
    echo "✓ account_id is now nullable\n";
} catch (Exception $e) {
    echo '✗ Error: '.$e->getMessage()."\n";
}
