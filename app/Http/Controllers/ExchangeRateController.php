<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\ExchangeRate;
use App\Models\ExchangeRateSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    /**
     * Get exchange rates for a specific period (query param).
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        return $this->rateForPeriod($request->input('period'));
    }

    /**
     * Get exchange rates for a specific period (path param).
     *
     * GET /api/exchange-rates/{period}
     */
    public function showByPeriod(string $period): JsonResponse
    {
        $validator = validator(
            ['period' => $period],
            ['period' => 'required|string|size:6|regex:/^\d{6}$/']
        );

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid period format. Expected YYYYMM.',
                'errors' => $validator->errors(),
            ], 422);
        }

        return $this->rateForPeriod($period);
    }

    private function rateForPeriod(string $period): JsonResponse
    {
        $rate = ExchangeRate::forPeriod($period);

        if (! $rate || ! $rate->hasSnapshot()) {
            return response()->json([
                'message' => 'Exchange rates not found for period '.$period,
                'missing_exchange_rate' => true,
                'data' => null,
            ], 404);
        }

        return response()->json([
            'data' => $rate,
        ]);
    }

    /**
     * List all exchange rates.
     */
    public function index(): JsonResponse
    {
        $rates = ExchangeRate::query()
            ->forUser($this->owner->id())
            ->orderBy('period')
            ->get();

        return response()->json([
            'data' => $rates,
        ]);
    }

    /**
     * Assign a snapshot to a period (create or replace assignment).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
            'snapshot_id' => 'required|integer|exists:exchange_rate_snapshots,id',
            'usd_cop' => 'prohibited',
            'usd_cad' => 'prohibited',
            'cad_cop' => 'prohibited',
        ]);

        $snapshot = ExchangeRateSnapshot::query()->findOrFail((int) $validated['snapshot_id']);

        $allowed = (
            $snapshot->source === ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES
            && $snapshot->user_id === null
        ) || (
            $snapshot->source === ExchangeRateSnapshot::SOURCE_MANUAL
            && (int) $snapshot->user_id === (int) $this->owner->id()
        );

        if (! $allowed) {
            return response()->json([
                'message' => 'You cannot assign this exchange rate snapshot.',
            ], 403);
        }

        $rate = ExchangeRate::updateOrCreate(
            [
                'user_id' => $this->owner->id(),
                'period' => $validated['period'],
            ],
            [
                'snapshot_id' => $snapshot->id,
            ]
        );

        return response()->json([
            'message' => 'Exchange rates saved successfully',
            'data' => $rate->fresh()->load('snapshot'),
        ]);
    }
}
