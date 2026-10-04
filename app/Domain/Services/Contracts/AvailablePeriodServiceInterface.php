<?php

namespace App\Domain\Services\Contracts;

interface AvailablePeriodServiceInterface
{
    /**
     * Months the period picker can offer, from the earliest transaction
     * period through the current month. The current month is always included.
     *
     * @return list<string> YYYYMM values in ascending order
     */
    public function selectable(): array;
}
