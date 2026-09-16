<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\SearchServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchServiceInterface $searchService,
    ) {}

    /**
     * Global search across accounts, transactions, and categories.
     *
     * GET /api/search?q=RBC
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'q' => 'required|string|min:1|max:100',
                'limit' => 'sometimes|integer|min:1|max:25',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }

        $query = trim($validated['q']);
        $limit = (int) ($validated['limit'] ?? 10);
        $results = $this->searchService->search($query, $limit);

        return response()->json([
            'data' => $results->toArray(),
            'links' => [
                'self' => route('search.index', [
                    'q' => $query,
                    'limit' => $limit,
                ]),
            ],
            'meta' => [
                'query' => $query,
                'limit' => $limit,
                'account_count' => $results->accounts->count(),
                'transaction_count' => $results->transactions->count(),
                'category_count' => $results->categories->count(),
                'total' => $results->toArray()['total'],
            ],
        ]);
    }
}
