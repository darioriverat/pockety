<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\PeriodComparisonEntity;

interface PeriodComparisonServiceInterface
{
    /**
     * Compare income, expenses, and balances for two periods side-by-side.
     *
     * @param  string  $periodA  YYYYMM
     * @param  string  $periodB  YYYYMM
     */
    public function compare(string $periodA, string $periodB): PeriodComparisonEntity;
}
