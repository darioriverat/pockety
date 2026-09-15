<?php

use App\Http\Controllers\AccountBalanceController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ReconciliationController;
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

// Accounts API
Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index');
Route::get('/accounts/{id}', [AccountController::class, 'show'])->name('accounts.show');
Route::post('/accounts', [AccountController::class, 'store'])->name('accounts.store');
Route::put('/accounts/{id}', [AccountController::class, 'update'])->name('accounts.update');
Route::patch('/accounts/{id}', [AccountController::class, 'update'])->name('accounts.patch');
Route::delete('/accounts/{id}', [AccountController::class, 'destroy'])->name('accounts.destroy');

// Account Balances API
Route::get('/accounts/{accountId}/balances', [AccountBalanceController::class, 'index'])->name('accounts.balances.index');
Route::post('/accounts/{accountId}/balances', [AccountBalanceController::class, 'store'])->name('accounts.balances.store');
Route::get('/accounts/{accountId}/balances/{id}', [AccountBalanceController::class, 'show'])->name('accounts.balances.show');
Route::delete('/accounts/{accountId}/balances/{id}', [AccountBalanceController::class, 'destroy'])->name('accounts.balances.destroy');

// Categories API
Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/categories/{code}', [CategoryController::class, 'show'])->name('categories.show');

// Transactions API
Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
Route::get('/transactions/{id}', [TransactionController::class, 'show'])->name('transactions.show');
Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
Route::put('/transactions/{id}', [TransactionController::class, 'update'])->name('transactions.update');
Route::patch('/transactions/{id}', [TransactionController::class, 'update'])->name('transactions.patch');
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy'])->name('transactions.destroy');

// Reconciliation API
Route::get('/periods/{period}/reconciliation', [ReconciliationController::class, 'show'])->name('periods.reconciliation');

// Transaction Import API
Route::post('/transactions/import', [TransactionImportController::class, 'import'])->name('transactions.import');
Route::get('/transactions/import/statistics', [TransactionImportController::class, 'statistics'])->name('transactions.import.statistics');
Route::post('/transactions/import/clear', [TransactionImportController::class, 'clear'])->name('transactions.import.clear');
