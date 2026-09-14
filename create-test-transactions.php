<?php

use App\Models\Transaction;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

// Create transaction 1: Period 202501, Q1, CAD, Groceries
Transaction::create([
    'date' => '2025-01-15',
    'period' => '202501',
    'quincena' => 'Q1',
    'category_id' => 1,
    'amount_cad' => 150.00,
    'amount_usd' => null,
    'amount_cop' => null,
    'comments' => 'Groceries from Walmart',
    'is_recurring' => false,
]);

// Create transaction 2: Period 202501, Q2, USD, Transportation
Transaction::create([
    'date' => '2025-01-20',
    'period' => '202501',
    'quincena' => 'Q2',
    'category_id' => 4,
    'amount_cad' => null,
    'amount_usd' => 75.50,
    'amount_cop' => null,
    'comments' => 'Gas for car',
    'is_recurring' => false,
]);

// Create transaction 3: Period 202602, Q1, COP, Dining Out (recurring)
Transaction::create([
    'date' => '2026-02-05',
    'period' => '202602',
    'quincena' => 'Q1',
    'category_id' => 6,
    'amount_cad' => null,
    'amount_usd' => null,
    'amount_cop' => 50000,
    'comments' => 'Monthly lunch subscription',
    'is_recurring' => true,
]);

// Create transaction 4: Period 202602, Q2, CAD, Household
Transaction::create([
    'date' => '2026-02-18',
    'period' => '202602',
    'quincena' => 'Q2',
    'category_id' => 5,
    'amount_cad' => 89.99,
    'amount_usd' => null,
    'amount_cop' => null,
    'comments' => 'Cleaning supplies',
    'is_recurring' => false,
]);

// Create transaction 5: Period 202501, Q1, CAD, Groceries (recurring)
Transaction::create([
    'date' => '2025-01-10',
    'period' => '202501',
    'quincena' => 'Q1',
    'category_id' => 1,
    'amount_cad' => 200.00,
    'amount_usd' => null,
    'amount_cop' => null,
    'comments' => 'Weekly groceries',
    'is_recurring' => true,
]);

echo "✅ Created 5 test transactions successfully\n";
