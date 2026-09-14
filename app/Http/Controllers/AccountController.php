<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\AccountServiceInterface;
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
            'assets' => array_filter($data, fn ($account) => $account['is_asset']),
            'liabilities' => array_filter($data, fn ($account) => $account['is_liability']),
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
}
