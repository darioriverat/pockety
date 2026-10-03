<?php

namespace App\Http\Controllers;

use App\Domain\Exceptions\PeriodBalanceAlreadyExistsException;
use App\Domain\Requests\Contracts\PeriodBalance\ShowPeriodBalanceRequestInterface;
use App\Domain\Requests\Contracts\PeriodBalance\StorePeriodBalanceRequestInterface;
use App\Domain\Services\Contracts\PeriodBalanceServiceInterface;
use Illuminate\Http\JsonResponse;

class PeriodBalanceController extends Controller
{
    public function __construct(
        private readonly PeriodBalanceServiceInterface $periodBalanceService
    ) {}

    /**
     * Proposed reconciliation figures, the registered balance, and prior versions.
     *
     * GET /api/period-balances?period=YYYYMM
     */
    public function show(ShowPeriodBalanceRequestInterface $request): JsonResponse
    {
        $period = $request->getPeriod();
        $registered = $this->periodBalanceService->findRegistered($period);
        $history = $this->periodBalanceService->historyForPeriod($period);

        return response()->json([
            'data' => [
                'period' => $period,
                'proposed' => $this->periodBalanceService->preview($period)->toArray(),
                'registered' => $registered?->toArray(),
                'history' => array_map(
                    static fn ($entity) => $entity->toArray(),
                    $history->all()
                ),
            ],
            'links' => [
                'self' => route('period-balances.show', ['period' => $period]),
                'register' => route('period-balances.store'),
                'reconciliation' => route('periods.reconciliation', $period),
            ],
            'meta' => [
                'period' => $period,
                'has_registered_balance' => $registered !== null,
                'history_count' => $history->count(),
                'currency' => 'CAD',
            ],
        ]);
    }

    /**
     * Register the period balance from reconciliation figures.
     *
     * POST /api/period-balances
     */
    public function store(StorePeriodBalanceRequestInterface $request): JsonResponse
    {
        $period = $request->getPeriod();
        $overwrite = $request->shouldOverwrite();
        $existing = $this->periodBalanceService->findRegistered($period);

        try {
            $entity = $this->periodBalanceService->register($period, $overwrite);
        } catch (PeriodBalanceAlreadyExistsException $exception) {
            return response()->json([
                'error' => 'A balance already exists for this period.',
                'data' => [
                    'existing' => $exception->existing->toArray(),
                    'proposed' => $exception->proposed->toArray(),
                ],
                'links' => [
                    'self' => route('period-balances.show', ['period' => $period]),
                    'register' => route('period-balances.store'),
                ],
            ], 409);
        }

        $overwritten = $existing !== null;

        return response()->json([
            'data' => $entity->toArray(),
            'links' => [
                'self' => route('period-balances.show', ['period' => $entity->period]),
                'register' => route('period-balances.store'),
            ],
            'meta' => [
                'message' => $overwritten
                    ? 'Balance overwritten successfully'
                    : 'Balance registered successfully',
                'overwritten' => $overwritten,
                'currency' => 'CAD',
            ],
        ], $overwritten ? 200 : 201);
    }
}
