<?php

use App\Http\Controllers\AccountBalanceController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AccountImportController;
use App\Http\Controllers\BalanceSheetController;
use App\Http\Controllers\BalanceSheetImportController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryActualsController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\ExchangeRateImportController;
use App\Http\Controllers\FinancialSummaryController;
use App\Http\Controllers\FixedAssetController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\PeriodComparisonController;
use App\Http\Controllers\PeriodHistoryController;
use App\Http\Controllers\ReconciliationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionImportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Global search API
Route::get('/search', [SearchController::class, 'index'])->name('search.index');

// Accounts API
Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
Route::post('/accounts/import', [AccountImportController::class, 'import'])->name('accounts.import');
Route::get('/accounts/import/statistics', [AccountImportController::class, 'statistics'])->name('accounts.import.statistics');
Route::get('/accounts/{id}', [AccountController::class, 'show'])->name('accounts.show')->whereNumber('id');
Route::get('/accounts/{id}/transactions', [AccountController::class, 'transactions'])->name('accounts.transactions')->whereNumber('id');
Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');
Route::put('/accounts/{id}', [AccountController::class, 'update'])->name('accounts.update')->whereNumber('id');
Route::patch('/accounts/{id}', [AccountController::class, 'update'])->name('accounts.patch')->whereNumber('id');
Route::delete('/accounts/{id}', [AccountController::class, 'destroy'])->name('accounts.destroy')->whereNumber('id');

// Account Balances API
Route::get('/accounts/{accountId}/balances', [AccountBalanceController::class, 'index'])->name('accounts.balances.index')->whereNumber('accountId');
Route::post('/accounts/{accountId}/balances', [AccountBalanceController::class, 'store'])->name('accounts.balances.store')->whereNumber('accountId');
Route::get('/accounts/{accountId}/balances/{id}', [AccountBalanceController::class, 'show'])->name('accounts.balances.show')->whereNumber(['accountId', 'id']);
Route::delete('/accounts/{accountId}/balances/{id}', [AccountBalanceController::class, 'destroy'])->name('accounts.balances.destroy')->whereNumber(['accountId', 'id']);

// Fixed Assets API
Route::get('/fixed-assets', [FixedAssetController::class, 'index'])->name('fixed-assets.index');
Route::get('/fixed-assets/{id}', [FixedAssetController::class, 'show'])->name('fixed-assets.show')->whereNumber('id');
Route::post('/fixed-assets', [FixedAssetController::class, 'store'])->name('fixed-assets.store');
Route::put('/fixed-assets/{id}', [FixedAssetController::class, 'update'])->name('fixed-assets.update')->whereNumber('id');
Route::patch('/fixed-assets/{id}', [FixedAssetController::class, 'update'])->name('fixed-assets.patch')->whereNumber('id');
Route::delete('/fixed-assets/{id}', [FixedAssetController::class, 'destroy'])->name('fixed-assets.destroy')->whereNumber('id');
Route::get('/fixed-assets/{id}/valuations', [FixedAssetController::class, 'valuations'])->name('fixed-assets.valuations')->whereNumber('id');
Route::post('/fixed-assets/{id}/valuations', [FixedAssetController::class, 'storeValuation'])->name('fixed-assets.valuations.store')->whereNumber('id');

// Categories API
Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/categories/{code}/transactions', [CategoryController::class, 'transactions'])->name('categories.transactions');
Route::get('/categories/{code}', [CategoryController::class, 'show'])->name('categories.show');
Route::delete('/categories/{code}', [CategoryController::class, 'destroy'])->name('categories.destroy');

// Transactions API
Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
Route::get('/transactions/export', [TransactionController::class, 'export'])->name('transactions.export');
Route::post('/transactions/bulk', [TransactionController::class, 'bulkUpdate'])->name('transactions.bulk');
Route::get('/transactions/{id}', [TransactionController::class, 'show'])->name('transactions.show');
Route::post('/transactions/{id}/duplicate', [TransactionController::class, 'duplicate'])->name('transactions.duplicate')->whereNumber('id');
Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
Route::put('/transactions/{id}', [TransactionController::class, 'update'])->name('transactions.update');
Route::patch('/transactions/{id}', [TransactionController::class, 'update'])->name('transactions.patch');
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy'])->name('transactions.destroy');

// Income API
Route::get('/income', [IncomeController::class, 'index'])->name('income.index');
Route::get('/income/{id}', [IncomeController::class, 'show'])->name('income.show');
Route::post('/income', [IncomeController::class, 'store'])->name('income.store');
Route::put('/income/{id}', [IncomeController::class, 'update'])->name('income.update');
Route::patch('/income/{id}', [IncomeController::class, 'update'])->name('income.patch');
Route::delete('/income/{id}', [IncomeController::class, 'destroy'])->name('income.destroy');

// Periods history / comparison APIs (must be registered before /periods/{period}/...)
Route::get('/periods/history', [PeriodHistoryController::class, 'index'])->name('periods.history');
Route::get('/periods/compare', [PeriodComparisonController::class, 'show'])->name('periods.compare');

// Category actuals report (ledger aggregation by category + period)
Route::get('/category-actuals', [CategoryActualsController::class, 'index'])->name('category-actuals.index');

// Reconciliation API
Route::get('/periods/{period}/reconciliation', [ReconciliationController::class, 'show'])->name('periods.reconciliation');
Route::post('/periods/{period}/reconciliation/{accountId}/acknowledge', [ReconciliationController::class, 'acknowledge'])
    ->name('periods.reconciliation.acknowledge')
    ->whereNumber('accountId');

// Balance Sheet API
Route::get('/balance-sheet/time-series', [BalanceSheetController::class, 'timeSeries'])->name('balance-sheet.time-series');
Route::get('/balance-sheet/export', [BalanceSheetController::class, 'exportPdf'])->name('balance-sheet.export-pdf');
Route::get('/balance-sheet', [BalanceSheetController::class, 'show'])->name('balance-sheet.show');
Route::get('/periods/{period}/balance-sheet', [BalanceSheetController::class, 'show'])->name('periods.balance-sheet');
Route::post('/balance-sheet/import', [BalanceSheetImportController::class, 'import'])->name('balance-sheet.import');
Route::get('/balance-sheet/import/statistics', [BalanceSheetImportController::class, 'statistics'])->name('balance-sheet.import.statistics');

// Transaction Import API
Route::post('/transactions/import', [TransactionImportController::class, 'import'])->name('transactions.import');
Route::get('/transactions/import/statistics', [TransactionImportController::class, 'statistics'])->name('transactions.import.statistics');
Route::post('/transactions/import/clear', [TransactionImportController::class, 'clear'])->name('transactions.import.clear');

// Exchange Rates API
Route::get('/exchange-rates', [ExchangeRateController::class, 'index'])->name('exchange-rates.index');
Route::get('/exchange-rates/show', [ExchangeRateController::class, 'show'])->name('exchange-rates.show');
Route::post('/exchange-rates', [ExchangeRateController::class, 'store'])->name('exchange-rates.store');
Route::post('/exchange-rates/import', [ExchangeRateImportController::class, 'import'])->name('exchange-rates.import');
Route::get('/exchange-rates/import/statistics', [ExchangeRateImportController::class, 'statistics'])->name('exchange-rates.import.statistics');

// Budgets API
Route::get('/budgets', [BudgetController::class, 'index'])->name('budgets.index');
Route::post('/budgets', [BudgetController::class, 'store'])->name('budgets.store');
Route::get('/budgets/report', [BudgetController::class, 'report'])->name('budgets.report');
Route::get('/budgets/report/export', [BudgetController::class, 'exportReport'])->name('budgets.report.export');

// Financial Summary API
Route::get('/financial-summary', [FinancialSummaryController::class, 'show'])->name('financial-summary.show');
