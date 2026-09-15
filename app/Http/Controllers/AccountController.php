<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\AccountServiceInterface;
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
     * Get transactions for an account.
     *
     * GET /api/accounts/{id}/transactions
     */
    public function transactions(int $id): JsonResponse
    {
        $account = $this->service->getById($id);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        // Get all transactions for this account, ordered by date descending (newest first)
        $transactions = Transaction::forAccount($id)
            ->with('category')
            ->orderBy('date', 'desc')
            ->get();

        // Calculate running balance for each transaction
        // Start with the oldest transaction and work forward
        $transactionsWithBalance = [];
        $runningBalance = 0.0;

        // Reverse to start from oldest
        $reversed = $transactions->reverse();

        foreach ($reversed as $transaction) {
            $runningBalance += $transaction->amount ?? 0;

            /** @var Category|null $category */
            $category = $transaction->category;

            $transactionsWithBalance[] = [
                'id' => $transaction->id,
                'date' => $transaction->date->format('Y-m-d'),
                'period' => $transaction->period,
                'category_code' => $category?->code,
                'category_name' => $category?->name_en,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'comments' => $transaction->comments,
                'running_balance' => $runningBalance,
            ];
        }

        // Reverse back to newest first
        $transactionsWithBalance = array_reverse($transactionsWithBalance);

        return response()->json([
            'data' => $transactionsWithBalance,
            'meta' => [
                'account_id' => $id,
                'account_name' => $account->name,
                'total_count' => count($transactionsWithBalance),
            ],
            'links' => [
                'self' => route('accounts.transactions', $id),
                'account' => route('accounts.show', $id),
            ],
        ]);
    }
}
