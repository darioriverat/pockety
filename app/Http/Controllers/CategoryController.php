<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\CategoryServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryServiceInterface $service
    ) {}

    /**
     * Get all active categories.
     *
     * GET /api/categories
     */
    public function index(): JsonResponse
    {
        $categories = $this->service->getAllActive();

        $data = array_map(fn ($entity) => $entity->toArray(), $categories);

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('categories.index'),
            ],
            'meta' => [
                'total' => count($data),
            ],
        ]);
    }

    /**
     * Get a category by code.
     *
     * GET /api/categories/{code}
     */
    public function show(string $code): JsonResponse
    {
        $category = $this->service->getByCode($code);

        if (! $category) {
            return response()->json([
                'error' => 'Category not found',
            ], 404);
        }

        return response()->json([
            'data' => $category->toArray(),
            'links' => [
                'self' => route('categories.show', $code),
                'index' => route('categories.index'),
                'transactions' => route('categories.transactions', $code),
            ],
        ]);
    }

    /**
     * Get transactions for a category across periods.
     *
     * GET /api/categories/{code}/transactions
     */
    public function transactions(Request $request, string $code): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|size:6|regex:/^\d{6}$/',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        $period = $validated['period'] ?? null;
        $history = $this->service->getTransactionHistory($code, $period);

        if ($history === null) {
            return response()->json([
                'error' => 'Category not found',
            ], 404);
        }

        $data = array_map(
            fn ($entity) => $entity->toArray(),
            $history['transactions']
        );

        $selfParams = ['code' => $code];
        if ($period !== null && $period !== '') {
            $selfParams['period'] = $period;
        }

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('categories.transactions', $selfParams),
                'category' => route('categories.show', $code),
                'index' => route('categories.index'),
            ],
            'meta' => array_merge($history['meta'], [
                'category' => $history['category']->toArray(),
            ]),
        ]);
    }

    /**
     * Delete a category by code.
     *
     * DELETE /api/categories/{code}
     */
    public function destroy(string $code): JsonResponse
    {
        try {
            $deleted = $this->service->delete($code);

            if (! $deleted) {
                $hasTransactions = $this->service->hasTransactions($code);

                return response()->json([
                    'error' => 'Cannot delete category',
                    'message' => $hasTransactions
                        ? 'This category has associated transactions and cannot be deleted'
                        : 'Category deletion failed',
                    'has_transactions' => $hasTransactions,
                ], 422);
            }

            return response()->json([
                'message' => 'Category deleted successfully',
                'links' => [
                    'index' => route('categories.index'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 404);
        }
    }
}
