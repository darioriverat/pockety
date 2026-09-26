<?php

namespace App\Http\Controllers;

use App\Services\ReconciliationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ReconciliationController extends Controller
{
    public function __construct(
        private readonly ReconciliationService $service
    ) {}

    /**
     * Get the account reconciliation report for a period.
     *
     * GET /api/periods/{period}/reconciliation
     */
    public function show(string $period): JsonResponse
    {
        $validator = Validator::make(['period' => $period], [
            'period' => 'required|string|regex:/^\d{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid period format. Expected YYYYMM.',
            ], 422);
        }

        $report = $this->service->reconcileForPeriod($period);

        return response()->json([
            'data' => $report,
            'links' => [
                'self' => route('periods.reconciliation', $period),
            ],
            'meta' => [
                'period' => $period,
                'status' => $report['status'],
                'account_count' => count($report['accounts']),
            ],
        ]);
    }
}
