<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AccountBalanceController extends Controller
{
    /**
     * Get all balances for an account.
     *
     * GET /api/accounts/{accountId}/balances
     * Optional query params: period (YYYYMM)
     */
    public function index(Request $request, int $accountId): JsonResponse
    {
        $account = Account::find($accountId);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        $query = $account->balances();

        if ($period = $request->query('period')) {
            $query->where('period', $period);
        }

        $balances = $query->orderBy('period', 'desc')->get();

        return response()->json([
            'data' => $balances->map(fn ($balance) => [
                'id' => $balance->id,
                'account_id' => $balance->account_id,
                'period' => $balance->period,
                'recorded_balance_cad' => $balance->recorded_balance_cad ? (float) $balance->recorded_balance_cad : 0,
                'recorded_balance_usd' => $balance->recorded_balance_usd ? (float) $balance->recorded_balance_usd : 0,
                'recorded_balance_cop' => $balance->recorded_balance_cop ? (float) $balance->recorded_balance_cop : 0,
                'notes' => $balance->notes,
                'created_at' => $balance->created_at,
                'updated_at' => $balance->updated_at,
            ]),
            'links' => [
                'self' => route('accounts.balances.index', $accountId),
                'account' => route('accounts.show', $accountId),
            ],
            'meta' => [
                'total' => $balances->count(),
                'account_name' => $account->name,
            ],
        ]);
    }

    /**
     * Create or update a balance for an account and period.
     *
     * POST /api/accounts/{accountId}/balances
     */
    public function store(Request $request, int $accountId): JsonResponse
    {
        $account = Account::find($accountId);

        if (! $account) {
            return response()->json([
                'error' => 'Account not found',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'period' => 'required|string|regex:/^\d{6}$/', // YYYYMM format
                'recorded_balance_cad' => 'nullable|numeric|min:0',
                'recorded_balance_usd' => 'nullable|numeric|min:0',
                'recorded_balance_cop' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            // Update or create balance for this period
            $balance = AccountBalance::updateOrCreate(
                [
                    'account_id' => $accountId,
                    'period' => $validated['period'],
                ],
                [
                    'recorded_balance_cad' => $validated['recorded_balance_cad'] ?? 0,
                    'recorded_balance_usd' => $validated['recorded_balance_usd'] ?? 0,
                    'recorded_balance_cop' => $validated['recorded_balance_cop'] ?? 0,
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            return response()->json([
                'data' => [
                    'id' => $balance->id,
                    'account_id' => $balance->account_id,
                    'period' => $balance->period,
                    'recorded_balance_cad' => (float) $balance->recorded_balance_cad,
                    'recorded_balance_usd' => (float) $balance->recorded_balance_usd,
                    'recorded_balance_cop' => (float) $balance->recorded_balance_cop,
                    'notes' => $balance->notes,
                    'created_at' => $balance->created_at,
                    'updated_at' => $balance->updated_at,
                ],
                'links' => [
                    'self' => route('accounts.balances.index', $accountId),
                    'account' => route('accounts.show', $accountId),
                ],
                'meta' => [
                    'message' => 'Balance saved successfully',
                ],
            ], $balance->wasRecentlyCreated ? 201 : 200);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Get a specific balance by ID.
     *
     * GET /api/accounts/{accountId}/balances/{id}
     */
    public function show(int $accountId, int $id): JsonResponse
    {
        $balance = AccountBalance::where('account_id', $accountId)->find($id);

        if (! $balance) {
            return response()->json([
                'error' => 'Balance not found',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $balance->id,
                'account_id' => $balance->account_id,
                'period' => $balance->period,
                'recorded_balance_cad' => (float) $balance->recorded_balance_cad,
                'recorded_balance_usd' => (float) $balance->recorded_balance_usd,
                'recorded_balance_cop' => (float) $balance->recorded_balance_cop,
                'notes' => $balance->notes,
                'created_at' => $balance->created_at,
                'updated_at' => $balance->updated_at,
            ],
            'links' => [
                'self' => route('accounts.balances.show', [$accountId, $id]),
                'account' => route('accounts.show', $accountId),
            ],
        ]);
    }

    /**
     * Delete a balance record.
     *
     * DELETE /api/accounts/{accountId}/balances/{id}
     */
    public function destroy(int $accountId, int $id): JsonResponse
    {
        $balance = AccountBalance::where('account_id', $accountId)->find($id);

        if (! $balance) {
            return response()->json([
                'error' => 'Balance not found',
            ], 404);
        }

        $balance->delete();

        return response()->json([
            'meta' => [
                'message' => 'Balance deleted successfully',
            ],
            'links' => [
                'account' => route('accounts.show', $accountId),
            ],
        ]);
    }
}
