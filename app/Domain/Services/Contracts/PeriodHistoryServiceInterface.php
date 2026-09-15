<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Collections\PeriodSummaryCollection;

interface PeriodHistoryServiceInterface
{
    /**
     * Build chronological period summaries from $from through $to (inclusive).
     *
     * @param  string  $from  YYYYMM
     * @param  string  $to  YYYYMM
     */
    public function getHistory(string $from = '202501', string $to = '202609'): PeriodSummaryCollection;
}
