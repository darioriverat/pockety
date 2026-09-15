<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\CategoryServiceInterface;
use Illuminate\Http\JsonResponse;

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
            ],
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
