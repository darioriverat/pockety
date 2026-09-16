<?php

namespace App\Http\Controllers;

use App\Services\ReconciliationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

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

    /**
     * Acknowledge / mark a variance as reviewed for an account in a period.
     *
     * POST /api/periods/{period}/reconciliation/{accountId}/acknowledge
     */
    public function acknowledge(Request $request, string $period, int $accountId): JsonResponse
    {
        $validator = Validator::make(
            array_merge($request->all(), [
                'period' => $period,
                'account_id' => $accountId,
            ]),
            [
                'period' => 'required|string|regex:/^\d{6}$/',
                'account_id' => 'required|integer|min:1',
                'note' => 'nullable|string|max:1000',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $acknowledgment = $this->service->acknowledgeVariance(
                $accountId,
                $period,
                $request->input('note')
            );
        } catch (InvalidArgumentException $e) {
            $status = str_contains($e->getMessage(), 'not found') ? 404 : 422;

            return response()->json([
                'error' => $e->getMessage(),
            ], $status);
        } catch (\RuntimeException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 503);
        }

        return response()->json([
            'data' => $acknowledgment,
            'links' => [
                'self' => route('periods.reconciliation.acknowledge', [$period, $accountId]),
                'reconciliation' => route('periods.reconciliation', $period),
            ],
        ], 200);
    }
}
