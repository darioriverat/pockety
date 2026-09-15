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
                'time_series' => route('balance-sheet.time-series'),
            ],
            'meta' => [
                'period' => $period,
                'currencies' => ['CAD', 'USD', 'COP'],
            ],
        ]);
    }

    /**
     * Balance sheet time series across periods (Estado Financiero trend).
     *
     * GET /api/balance-sheet/time-series?from=YYYYMM&to=YYYYMM
     */
    public function timeSeries(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'sometimes|string|size:6|regex:/^\d{6}$/',
            'to' => 'sometimes|string|size:6|regex:/^\d{6}$/',
        ]);

        $from = $validated['from'] ?? '202501';
        $to = $validated['to'] ?? '202609';

        if ($from > $to) {
            return response()->json([
                'message' => 'The from period must be less than or equal to the to period.',
                'errors' => [
                    'from' => ['The from period must be less than or equal to the to period.'],
                ],
            ], 422);
        }

        $series = $this->balanceSheetService->getTimeSeries($from, $to);

        return response()->json([
            'data' => $series,
            'links' => [
                'self' => route('balance-sheet.time-series', [
                    'from' => $from,
                    'to' => $to,
                ]),
            ],
            'meta' => [
                'from' => $from,
                'to' => $to,
                'period_count' => count($series['periods']),
                'currencies' => ['CAD', 'USD', 'COP'],
            ],
        ]);
    }
}
