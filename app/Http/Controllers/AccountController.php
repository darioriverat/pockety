<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function __construct(
        private readonly AccountServiceInterface $service
    ) {}

    /**
     * Get all accounts with optional filtering.
     *
     * GET /api/accounts
     * Query params: type (bank, investment, liability, receivable)
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');

        $accounts = match ($type) {
            'asset' => $this->service->getAssets(),
            'liability' => $this->service->getLiabilities(),
            default => $this->service->getAllActive(),
        };

        $data = array_map(fn ($entity) => $entity->toArray(), $accounts);

        // Group by type for easier frontend display
        $grouped = [
            'assets' => array_values(array_filter($data, fn ($account) => $account['is_asset'])),
            'liabilities' => array_values(array_filter($data, fn ($account) => $account['is_liability'])),
        ];

        return response()->json([
            'data' => $data,
            'grouped' => $grouped,
            'links' => [
                'self' => route('accounts.index'),
            ],
            'meta' => [
                'total' => count($data),
                'filters' => ['type' => $type],
            ],
        ]);
    }

    /**
     * Get an account by ID.
     *
     * GET /api/accounts/{id}
     */
    public function show(int $id): JsonResponse
    {
        $account = $this->service->getById($id);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        return response()->json([
            'data' => $account->toArray(),
            'links' => [
                'self' => route('accounts.show', $id),
                'index' => route('accounts.index'),
            ],
        ]);
    }

    /**
     * Create a new account.
     *
     * POST /api/accounts
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|in:bank,investment,liability,receivable',
                'primary_currency' => 'nullable|in:CAD,USD,COP',
                'notes' => 'nullable|string|max:1000',
            ]);

            $account = $this->service->create($validated);

            return response()->json([
                'data' => $account->toArray(),
                'links' => [
                    'self' => route('accounts.show', $account->id),
                    'index' => route('accounts.index'),
                ],
                'meta' => [
                    'message' => 'Account created successfully',
                ],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Update an account.
     *
     * PUT/PATCH /api/accounts/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|in:bank,investment,liability,receivable',
                'primary_currency' => 'nullable|in:CAD,USD,COP',
                'notes' => 'nullable|string|max:1000',
                'is_active' => 'sometimes|boolean',
            ]);

            $account = $this->service->update($id, $validated);

            return response()->json([
                'data' => $account->toArray(),
                'links' => [
                    'self' => route('accounts.show', $id),
                    'index' => route('accounts.index'),
                ],
                'meta' => [
                    'message' => 'Account updated successfully',
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Delete (deactivate) an account.
     *
     * DELETE /api/accounts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'meta' => [
                    'message' => 'Account deactivated successfully',
                ],
                'links' => [
                    'index' => route('accounts.index'),
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }
    }

    /**
     * Get transactions for an account with running balances.
     *
     * GET /api/accounts/{id}/transactions
     *
     * Expense amounts are stored as positive values and reduce the account balance
     * (same convention as reconciliation). Running balance after each transaction
     * is anchored so the newest balance equals the account's current recorded balance
     * when one exists; otherwise the ledger starts at 0.
     */
    public function transactions(int $id): JsonResponse
    {
        $account = $this->service->getById($id);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        $currency = $account->primaryCurrency ?? 'CAD';
        $balanceColumn = match ($currency) {
            'USD' => 'recorded_balance_usd',
            'COP' => 'recorded_balance_cop',
            default => 'recorded_balance_cad',
        };

        /** @var AccountBalance|null $latestBalance */
        $latestBalance = AccountBalance::query()
            ->where('account_id', $id)
            ->orderByDesc('period')
            ->first();

        $hasRecordedBalance = $latestBalance !== null;
        $currentBalance = $hasRecordedBalance
            ? round((float) $latestBalance->{$balanceColumn}, 2)
            : null;

        // Oldest → newest for running balance calculation
        $transactions = Transaction::forAccount($id)
            ->with('category')
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $totalExpenses = round(
            (float) $transactions->sum(fn (Transaction $tx) => (float) ($tx->amount ?? 0)),
            2
        );

        // If no recorded balance, treat the ledger as starting at 0 and ending at -expenses.
        if ($currentBalance === null) {
            $startingBalance = 0.0;
            $currentBalance = round(0.0 - $totalExpenses, 2);
        } else {
            // Expenses reduce balance: starting = current + sum(expenses)
            $startingBalance = round($currentBalance + $totalExpenses, 2);
        }

        $transactionsWithBalance = [];
        $runningBalance = $startingBalance;

        foreach ($transactions as $transaction) {
            $amount = (float) ($transaction->amount ?? 0);
            $runningBalance = round($runningBalance - $amount, 2);

            /** @var Category|null $category */
            $category = $transaction->category;

            $transactionsWithBalance[] = [
                'id' => $transaction->id,
                'date' => $transaction->date->format('Y-m-d'),
                'period' => $transaction->period,
                'category_code' => $category?->code,
                'category_name' => $category?->name_en,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency ?? $currency,
                'comments' => $transaction->comments,
                'running_balance' => $runningBalance,
            ];
        }

        // Newest first for the UI
        $transactionsWithBalance = array_reverse($transactionsWithBalance);

        return response()->json([
            'data' => $transactionsWithBalance,
            'meta' => [
                'account_id' => $id,
                'account_name' => $account->name,
                'currency' => $currency,
                'starting_balance' => $startingBalance,
                'current_balance' => $currentBalance,
                'has_recorded_balance' => $hasRecordedBalance,
                'total_count' => count($transactionsWithBalance),
            ],
            'links' => [
                'self' => route('accounts.transactions', $id),
                'account' => route('accounts.show', $id),
            ],
        ]);
    }
}
