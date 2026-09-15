<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function __construct(
        private readonly BudgetService $budgetService
    ) {}

    /**
     * List budgets for a period.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $budgets = $this->budgetService->listForPeriod(
            $validated['period'],
            isset($validated['category_id']) ? (int) $validated['category_id'] : null
        );

        return response()->json([
            'data' => $budgets,
            'links' => [
                'self' => route('budgets.index', ['period' => $validated['period']]),
                'report' => route('budgets.report', ['period' => $validated['period']]),
            ],
            'meta' => [
                'period' => $validated['period'],
                'total' => $budgets->count(),
            ],
        ]);
    }

    /**
     * Create or update a budget for a category and period.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
            'category_id' => 'nullable|integer|exists:categories,id',
            'category_code' => 'nullable|string|exists:categories,code',
            'amount_cad' => 'required|numeric|gt:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (empty($validated['category_id']) && empty($validated['category_code'])) {
            return response()->json([
                'message' => 'Either category_id or category_code is required.',
                'errors' => [
                    'category_id' => ['Either category_id or category_code is required.'],
                ],
            ], 422);
        }

        $categoryId = $validated['category_id'] ?? null;

        if ($categoryId === null) {
            $category = Category::where('code', $validated['category_code'])->firstOrFail();
            $categoryId = $category->id;
        }

        $budget = $this->budgetService->upsert(
            categoryId: (int) $categoryId,
            period: $validated['period'],
            amountCad: (float) $validated['amount_cad'],
            notes: $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Budget saved successfully',
            'data' => $budget,
            'links' => [
                'self' => route('budgets.index', ['period' => $budget->period]),
                'report' => route('budgets.report', ['period' => $budget->period]),
            ],
        ]);
    }

    /**
     * Budget vs actual report for a period.
     */
    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $report = $this->budgetService->getBudgetVsActualReport($validated['period']);

        return response()->json([
            'data' => $report['rows'],
            'links' => [
                'self' => route('budgets.report', ['period' => $validated['period']]),
                'budgets' => route('budgets.index', ['period' => $validated['period']]),
            ],
            'meta' => [
                'period' => $report['period'],
                'totals' => $report['totals'],
                'currency' => 'CAD',
            ],
        ]);
    }
}
