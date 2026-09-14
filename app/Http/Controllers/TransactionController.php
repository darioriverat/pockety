<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\TransactionServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function __construct(
        private readonly TransactionServiceInterface $service
    ) {}

    /**
     * Get all transactions with optional filtering.
     *
     * GET /api/transactions
     * Query params: period, category_id, account_id, quincena, currency, is_recurring
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'period',
            'category_id',
            'account_id',
            'quincena',
            'currency',
            'is_recurring',
        ]);

        $transactions = $this->service->getAll($filters);

        $data = array_map(fn ($entity) => $entity->toArray(), $transactions);

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('transactions.index'),
            ],
            'meta' => [
                'total' => count($data),
                'filters' => $filters,
            ],
        ]);
    }

    /**
     * Get a transaction by ID.
     *
     * GET /api/transactions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $transaction = $this->service->getById($id);

        if (! $transaction) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'data' => $transaction->toArray(),
            'links' => [
                'self' => route('transactions.show', $id),
                'index' => route('transactions.index'),
            ],
        ]);
    }

    /**
     * Create a new transaction.
     *
     * POST /api/transactions
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'period' => 'required|string|size:6|regex:/^\d{6}$/',
                'quincena' => 'required|in:Q1,Q2',
                'category_id' => 'required|integer|exists:categories,id',
                'account_id' => 'nullable|integer|exists:accounts,id',
                'amount_cad' => 'nullable|numeric|min:0',
                'amount_usd' => 'nullable|numeric|min:0',
                'amount_cop' => 'nullable|numeric|min:0',
                'comments' => 'nullable|string|max:1000',
                'is_recurring' => 'nullable|boolean',
                'debt_component' => 'nullable|in:principal,interest',
            ]);

            $transaction = $this->service->create($validated);

            return response()->json([
                'data' => $transaction->toArray(),
                'links' => [
                    'self' => route('transactions.show', $transaction->id),
                    'index' => route('transactions.index'),
                ],
                'message' => 'Transaction created successfully',
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    /**
     * Update an existing transaction.
     *
     * PUT/PATCH /api/transactions/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'sometimes|required|date',
                'period' => 'sometimes|required|string|size:6|regex:/^\d{6}$/',
                'quincena' => 'sometimes|required|in:Q1,Q2',
                'category_id' => 'sometimes|required|integer|exists:categories,id',
                'account_id' => 'nullable|integer|exists:accounts,id',
                'amount_cad' => 'nullable|numeric|min:0',
                'amount_usd' => 'nullable|numeric|min:0',
                'amount_cop' => 'nullable|numeric|min:0',
                'comments' => 'nullable|string|max:1000',
                'is_recurring' => 'nullable|boolean',
                'debt_component' => 'nullable|in:principal,interest',
            ]);

            $transaction = $this->service->update($id, $validated);

            return response()->json([
                'data' => $transaction->toArray(),
                'links' => [
                    'self' => route('transactions.show', $transaction->id),
                    'index' => route('transactions.index'),
                ],
                'message' => 'Transaction updated successfully',
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }
    }

    /**
     * Delete a transaction.
     *
     * DELETE /api/transactions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'message' => 'Transaction deleted successfully',
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }
    }
}
