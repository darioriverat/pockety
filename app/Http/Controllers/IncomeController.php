<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Services\IncomeService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class IncomeController extends Controller
{
    public function __construct(
        private readonly IncomeServiceInterface $service
    ) {}

    /**
     * List income line items for a period.
     *
     * GET /api/income?period=202501
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => ['required', 'string', 'regex:/^\d{6}$/'],
        ]);

        $period = $validated['period'];
        $collection = $this->service->getForPeriod($period);
        $data = array_map(
            fn ($entity) => $entity->toArray(),
            $collection->all()
        );

        return response()->json([
            'data' => $data,
            'meta' => [
                'period' => $period,
                'total' => $collection->count(),
                'max_lines' => IncomeService::MAX_LINES_PER_PERIOD,
                'total_cad_equivalent' => $this->service->getTotalCadEquivalent($period),
            ],
            'links' => [
                'self' => route('income.index', ['period' => $period]),
            ],
        ]);
    }

    /**
     * Get a single income line item.
     *
     * GET /api/income/{id}
     */
    public function show(int $id): JsonResponse
    {
        $income = $this->service->getById($id);

        if (! $income) {
            return response()->json([
                'error' => 'Income line item not found',
            ], 404);
        }

        return response()->json([
            'data' => $income->toArray(),
            'links' => [
                'self' => route('income.show', $id),
                'index' => route('income.index', ['period' => $income->period]),
            ],
        ]);
    }

    /**
     * Create an income line item.
     *
     * POST /api/income
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => ['required', 'string', 'regex:/^\d{6}$/'],
                'description' => ['required', 'string', 'max:255'],
                'amount_cad' => ['nullable', 'numeric'],
                'amount_usd' => ['nullable', 'numeric'],
                'amount_cop' => ['nullable', 'numeric'],
                'notes' => ['nullable', 'string', 'max:1000'],
                'line_number' => ['nullable', 'integer', 'min:1', 'max:6'],
            ]);

            $income = $this->service->create($validated);

            return response()->json([
                'data' => $income->toArray(),
                'links' => [
                    'self' => route('income.show', $income->id),
                    'index' => route('income.index', ['period' => $income->period]),
                ],
                'meta' => [
                    'message' => 'Income line item created successfully',
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
     * Update an income line item.
     *
     * PUT/PATCH /api/income/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'description' => ['sometimes', 'required', 'string', 'max:255'],
                'amount_cad' => ['nullable', 'numeric'],
                'amount_usd' => ['nullable', 'numeric'],
                'amount_cop' => ['nullable', 'numeric'],
                'notes' => ['nullable', 'string', 'max:1000'],
                'line_number' => ['nullable', 'integer', 'min:1', 'max:6'],
            ]);

            $income = $this->service->update($id, $validated);

            return response()->json([
                'data' => $income->toArray(),
                'links' => [
                    'self' => route('income.show', $id),
                    'index' => route('income.index', ['period' => $income->period]),
                ],
                'meta' => [
                    'message' => 'Income line item updated successfully',
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Income line item not found',
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], 422);
        }
    }

    /**
     * Delete an income line item.
     *
     * DELETE /api/income/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'meta' => [
                    'message' => 'Income line item deleted successfully',
                ],
                'links' => [
                    'index' => route('income.index'),
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Income line item not found',
            ], 404);
        }
    }
}
