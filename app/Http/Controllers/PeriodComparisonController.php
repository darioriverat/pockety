<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\PeriodComparisonServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodComparisonController extends Controller
{
    public function __construct(
        private readonly PeriodComparisonServiceInterface $periodComparisonService
    ) {}

    /**
     * Compare two periods side-by-side (income, expenses, balances + diffs).
     *
     * GET /api/periods/compare?period_a=YYYYMM&period_b=YYYYMM
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period_a' => 'required|string|size:6|regex:/^\d{6}$/',
            'period_b' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $periodA = $validated['period_a'];
        $periodB = $validated['period_b'];

        $comparison = $this->periodComparisonService->compare($periodA, $periodB);

        return response()->json([
            'data' => $comparison->toArray(),
            'links' => [
                'self' => route('periods.compare', [
                    'period_a' => $periodA,
                    'period_b' => $periodB,
                ]),
            ],
            'meta' => [
                'period_a' => $periodA,
                'period_b' => $periodB,
                'currency' => 'CAD',
            ],
        ]);
    }
}
