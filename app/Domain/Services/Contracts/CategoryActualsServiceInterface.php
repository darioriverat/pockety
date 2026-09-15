<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Collections\CategoryActualCollection;

interface CategoryActualsServiceInterface
{
    /**
     * Aggregate actual spending per active category for a period.
     *
     * Totals are computed by querying the transaction ledger (category + period),
     * never via hardcoded row references.
     */
    public function getReport(string $period): CategoryActualCollection;
}
