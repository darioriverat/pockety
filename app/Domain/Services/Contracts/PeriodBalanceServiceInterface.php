<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Collections\PeriodBalanceHistoryCollection;
use App\Domain\Entities\PeriodBalanceEntity;
use App\Domain\Entities\PeriodBalanceSnapshotEntity;
use App\Domain\Exceptions\PeriodBalanceAlreadyExistsException;

interface PeriodBalanceServiceInterface
{
    /**
     * Figures that would be registered for the period, taken from the
     * reconciliation report's computed totals.
     */
    public function preview(string $period): PeriodBalanceSnapshotEntity;

    public function findRegistered(string $period): ?PeriodBalanceEntity;

    public function historyForPeriod(string $period): PeriodBalanceHistoryCollection;

    /**
     * Register the reconciliation figures as the period balance.
     *
     * @throws PeriodBalanceAlreadyExistsException when a balance exists and overwrite is false
     */
    public function register(string $period, bool $overwrite): PeriodBalanceEntity;
}
