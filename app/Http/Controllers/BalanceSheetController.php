<?php

namespace App\Http\Controllers;

use App\Services\BalanceSheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceSheetController extends Controller
{
    public function __construct(
        private readonly BalanceSheetService $balanceSheetService
    ) {}

    /**
     * Balance sheet for a period (Assets / Liabilities / Equity in CAD, USD, COP).
     *
     * GET /api/balance-sheet?period=YYYYMM
     * GET /api/periods/{period}/balance-sheet
     */
    public function show(Request $request, ?string $period = null): JsonResponse
    {
        if ($period === null) {
            $validated = $request->validate([
                'period' => 'required|string|size:6|regex:/^\d{6}$/',
            ]);
            $period = $validated['period'];
        } else {
            if (! preg_match('/^\d{6}$/', $period)) {
                return response()->json([
                    'message' => 'The period must be in YYYYMM format.',
                    'errors' => [
                        'period' => ['The period must be in YYYYMM format.'],
                    ],
                ], 422);
            }
        }

        $sheet = $this->balanceSheetService->getBalanceSheet($period);

        return response()->json([
            'data' => $sheet,
            'links' => [
                'self' => route('balance-sheet.show', ['period' => $period]),
                'by_period' => route('periods.balance-sheet', ['period' => $period]),
            ],
            'meta' => [
                'period' => $period,
                'currencies' => ['CAD', 'USD', 'COP'],
            ],
        ]);
    }
}
