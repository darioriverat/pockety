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
     * Get all active categories, or all categories if include_inactive=1.
     *
     * GET /api/categories
     * GET /api/categories?include_inactive=1
     */
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->query('include_inactive') === '1';

        $categories = $includeInactive
            ? $this->service->getAll()
            : $this->service->getAllActive();

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
     * Create a new category.
     *
     * POST /api/categories
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'is_debt_category' => 'required|boolean',
                'is_income_category' => 'required|boolean',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        try {
            $category = $this->service->create(
                name: $validated['name'],
                isDebtCategory: $validated['is_debt_category'],
                isIncomeCategory: $validated['is_income_category']
            );

            return response()->json([
                'data' => $category->toArray(),
                'links' => [
                    'self' => route('categories.show', $category->code),
                ],
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a category by code.
     *
     * PUT/PATCH /api/categories/{code}
     */
    public function update(Request $request, string $code): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'is_debt_category' => 'sometimes|boolean',
                'is_income_category' => 'sometimes|boolean',
                'is_active' => 'sometimes|boolean',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        // Require at least one field
        if (empty($validated)) {
            return response()->json([
                'error' => 'At least one field must be provided',
            ], 422);
        }

        try {
            $category = $this->service->update(
                code: $code,
                name: $validated['name'] ?? null,
                isDebtCategory: $validated['is_debt_category'] ?? null,
                isIncomeCategory: $validated['is_income_category'] ?? null,
                isActive: $validated['is_active'] ?? null
            );

            if (! $category) {
                return response()->json([
                    'error' => 'Category not found',
                ], 404);
            }

            return response()->json([
                'data' => $category->toArray(),
                'links' => [
                    'self' => route('categories.show', $category->code),
                    'index' => route('categories.index'),
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'message' => $e->getMessage(),
            ], 422);
        }
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
                $hasBudgets = $this->service->hasBudgets($code);

                if ($hasTransactions) {
                    return response()->json([
                        'error' => 'Cannot delete category',
                        'message' => 'This category has associated transactions and cannot be deleted',
                        'has_transactions' => true,
                    ], 422);
                }

                if ($hasBudgets) {
                    return response()->json([
                        'error' => 'Cannot delete category',
                        'message' => 'This category has associated budgets and cannot be deleted',
                        'has_budgets' => true,
                    ], 422);
                }

                return response()->json([
                    'error' => 'Category deletion failed',
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
