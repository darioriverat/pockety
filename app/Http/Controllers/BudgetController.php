<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        ], [
            'amount_cad.gt' => 'Budget amount must be a positive number.',
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

    /**
     * Export budget vs actual report to CSV.
     *
     * GET /api/budgets/report/export
     * Query params: period (required)
     */
    public function exportReport(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $report = $this->budgetService->getBudgetVsActualReport($validated['period']);

        $filename = 'budget_vs_actual_'.$validated['period'].'_'.date('Y-m-d').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        $callback = function () use ($report) {
            $file = fopen('php://output', 'w');

            if ($file === false) {
                return;
            }

            // CSV header
            fputcsv($file, [
                'Category Code',
                'Category Name (Spanish)',
                'Category Name (English)',
                'Budget (CAD)',
                'Actual (CAD)',
                'Variance (CAD)',
                'Percentage (%)',
                'Over Budget',
            ]);

            // CSV rows
            foreach ($report['rows'] as $row) {
                fputcsv($file, [
                    $row['category_code'],
                    $row['category_name_es'],
                    $row['category_name_en'],
                    $row['budget_cad'] !== null ? number_format($row['budget_cad'], 2, '.', '') : '',
                    number_format($row['actual_cad'], 2, '.', ''),
                    $row['variance_cad'] !== null ? number_format($row['variance_cad'], 2, '.', '') : '',
                    $row['percentage'] !== null ? number_format($row['percentage'], 2, '.', '') : '',
                    $row['is_over_budget'] ? 'Yes' : 'No',
                ]);
            }

            // Add totals row
            fputcsv($file, [
                'TOTAL',
                '',
                '',
                number_format($report['totals']['budget_cad'], 2, '.', ''),
                number_format($report['totals']['actual_cad'], 2, '.', ''),
                number_format($report['totals']['variance_cad'], 2, '.', ''),
                '',
                '',
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
