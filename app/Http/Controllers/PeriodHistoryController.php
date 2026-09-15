<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\PeriodHistoryServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodHistoryController extends Controller
{
    public function __construct(
        private readonly PeriodHistoryServiceInterface $periodHistoryService
    ) {}

    /**
     * List period summaries (transaction count, income, expenses) chronologically.
     *
     * GET /api/periods/history?from=YYYYMM&to=YYYYMM
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'sometimes|string|size:6|regex:/^\d{6}$/',
            'to' => 'sometimes|string|size:6|regex:/^\d{6}$/',
        ]);

        $from = $validated['from'] ?? '202501';
        $to = $validated['to'] ?? '202609';

        $history = $this->periodHistoryService->getHistory($from, $to);
        $rows = array_map(
            static fn ($entity) => $entity->toArray(),
            $history->all()
        );

        return response()->json([
            'data' => [
                'from' => $from,
                'to' => $to,
                'periods' => $rows,
            ],
            'links' => [
                'self' => route('periods.history', [
                    'from' => $from,
                    'to' => $to,
                ]),
            ],
            'meta' => [
                'from' => $from,
                'to' => $to,
                'period_count' => $history->count(),
                'currency' => 'CAD',
            ],
        ]);
    }
}
