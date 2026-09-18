<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryActualsController extends Controller
{
    public function __construct(
        private readonly CategoryActualsServiceInterface $categoryActualsService
    ) {}

    /**
     * Category actuals report for a period (ledger query by category + period).
     *
     * GET /api/category-actuals?period=YYYYMM
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ], [
            'period.regex' => 'The period must be in YYYYMM format.',
            'period.size' => 'The period must be in YYYYMM format.',
        ]);

        $period = $validated['period'];
        $report = $this->categoryActualsService->getReport($period);
        $rows = array_map(
            static fn ($entity) => $entity->toArray(),
            $report->all()
        );

        $totalActual = round(
            array_sum(array_map(
                static fn (array $row): float => ! empty($row['is_income_category'])
                    ? 0.0
                    : (float) $row['actual_cad'],
                $rows
            )),
            2
        );
        $totalTransactions = (int) array_sum(array_column($rows, 'transaction_count'));

        return response()->json([
            'data' => [
                'period' => $period,
                'categories' => $rows,
            ],
            'links' => [
                'self' => route('category-actuals.index', ['period' => $period]),
            ],
            'meta' => [
                'period' => $period,
                'category_count' => $report->count(),
                'total_actual_cad' => $totalActual,
                'total_transactions' => $totalTransactions,
                'currency' => 'CAD',
            ],
        ]);
    }
}
