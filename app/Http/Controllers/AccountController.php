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
                'name' => 'required|string|max:255|unique:accounts,name',
                'type' => 'required|in:bank,investment,liability,receivable',
                'primary_currency' => 'nullable|in:CAD,USD,COP',
                'notes' => 'nullable|string|max:1000',
            ], [
                'name.unique' => 'An account with this name already exists.',
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
                'name' => "sometimes|required|string|max:255|unique:accounts,name,{$id}",
                'type' => 'sometimes|required|in:bank,investment,liability,receivable',
                'primary_currency' => 'nullable|in:CAD,USD,COP',
                'notes' => 'nullable|string|max:1000',
                'is_active' => 'sometimes|boolean',
            ], [
                'name.unique' => 'An account with this name already exists.',
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
     * Query params: start_date (Y-m-d), end_date (Y-m-d)
     *
     * Expense amounts are stored as positive values. The signed amount applied
     * to the running balance depends on account type:
     * - Assets: spend/principal decrease the balance; income and credits increase it.
     * - Liabilities: regular charges increase the amount owed; principal payments
     *   and credits decrease it.
     * Running balance after each transaction is anchored so the newest balance
     * equals the account's current recorded balance when one exists; otherwise
     * the ledger starts at 0.
     *
     * When a date range filter is applied, starting_balance is the balance just
     * before the first in-range transaction (ledger balance at start_date), and
     * current_balance is the balance after the last in-range transaction.
     */
    public function transactions(Request $request, int $id): JsonResponse
    {
        $account = $this->service->getById($id);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'start_date' => 'nullable|date_format:Y-m-d',
                'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

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
        $ledgerCurrentBalance = $hasRecordedBalance
            ? round((float) $latestBalance->{$balanceColumn}, 2)
            : null;

        // Oldest → newest for running balance calculation (full ledger)
        $transactions = Transaction::forAccount($id)
            ->with('category')
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $isLiability = $account->isLiability();

        $totalNetChange = round(
            (float) $transactions->sum(
                fn (Transaction $tx): float => $tx->signedAmountFor($isLiability)
            ),
            2
        );

        // If no recorded balance, treat the ledger as starting at 0 and ending at net change.
        if ($ledgerCurrentBalance === null) {
            $ledgerStartingBalance = 0.0;
            $ledgerCurrentBalance = $totalNetChange;
        } else {
            $ledgerStartingBalance = round($ledgerCurrentBalance - $totalNetChange, 2);
        }

        $transactionsWithBalance = [];
        $runningBalance = $ledgerStartingBalance;
        $filteredStartingBalance = $ledgerStartingBalance;
        $filteredStartingCaptured = false;
        $filteredEndingBalance = $ledgerStartingBalance;
        $hasInRangeTransaction = false;

        foreach ($transactions as $transaction) {
            $txDate = $transaction->date->format('Y-m-d');
            $inRange = ($startDate === null || $txDate >= $startDate)
                && ($endDate === null || $txDate <= $endDate);

            if ($inRange && ! $filteredStartingCaptured) {
                $filteredStartingBalance = $runningBalance;
                $filteredStartingCaptured = true;
            }

            $signedAmount = $transaction->signedAmountFor($isLiability);
            $runningBalance = round($runningBalance + $signedAmount, 2);

            if (! $inRange) {
                continue;
            }

            $hasInRangeTransaction = true;
            $filteredEndingBalance = $runningBalance;

            /** @var Category|null $category */
            $category = $transaction->category;

            $transactionsWithBalance[] = [
                'id' => $transaction->id,
                'date' => $txDate,
                'period' => $transaction->period,
                'category_code' => $category?->code,
                'category_name' => $category?->name_en,
                'amount' => $transaction->amount,
                'signed_amount' => $signedAmount,
                'is_credit' => $transaction->isInflow(),
                'is_income' => $transaction->isIncome(),
                'currency' => $transaction->currency ?? $currency,
                'comments' => $transaction->comments,
                'running_balance' => $runningBalance,
            ];
        }

        // Empty filtered range with a start_date: starting balance is still
        // the ledger balance at that date (after all prior transactions).
        if (! $hasInRangeTransaction && $startDate !== null) {
            $balanceAtStart = $ledgerStartingBalance;
            foreach ($transactions as $transaction) {
                $txDate = $transaction->date->format('Y-m-d');
                if ($txDate >= $startDate) {
                    break;
                }
                $priorSigned = $transaction->signedAmountFor($isLiability);
                $balanceAtStart = round($balanceAtStart + $priorSigned, 2);
            }
            $filteredStartingBalance = $balanceAtStart;
            $filteredEndingBalance = $balanceAtStart;
        }

        $isFiltered = $startDate !== null || $endDate !== null;
        $startingBalance = $isFiltered ? $filteredStartingBalance : $ledgerStartingBalance;
        $currentBalance = $isFiltered ? $filteredEndingBalance : $ledgerCurrentBalance;

        // Newest first for the UI
        $transactionsWithBalance = array_reverse($transactionsWithBalance);

        $query = array_filter([
            'start_date' => $startDate,
            'end_date' => $endDate,
        ], fn ($value) => $value !== null);

        return response()->json([
            'data' => $transactionsWithBalance,
            'meta' => [
                'account_id' => $id,
                'account_name' => $account->name,
                'currency' => $currency,
                'starting_balance' => $startingBalance,
                'current_balance' => $currentBalance,
                'has_recorded_balance' => $hasRecordedBalance,
                'is_liability' => $isLiability,
                'total_count' => count($transactionsWithBalance),
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'is_filtered' => $isFiltered,
            ],
            'links' => [
                'self' => route('accounts.transactions', array_merge(['id' => $id], $query)),
                'account' => route('accounts.show', $id),
            ],
        ]);
    }
}
