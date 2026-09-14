<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\Transaction;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Schema;

echo "Transaction table structure:\n";
$columns = Schema::getColumns('transactions');
foreach ($columns as $column) {
    echo "  - {$column['name']}: {$column['type_name']}".($column['nullable'] ? ' (nullable)' : '')."\n";
}

echo "\nTransaction count: ".Transaction::count()."\n";

if (Transaction::count() > 0) {
    echo "\nFirst few transactions:\n";
    foreach (Transaction::with('category')->limit(3)->get() as $transaction) {
        echo "  - {$transaction->date->format('Y-m-d')} | {$transaction->category->code} | ";
        echo "{$transaction->currency}: {$transaction->amount}\n";
    }
}
