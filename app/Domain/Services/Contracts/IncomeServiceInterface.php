<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Collections\IncomeCollection;
use App\Domain\Entities\IncomeEntity;

interface IncomeServiceInterface
{
    /**
     * Get income line items for a period, ordered by line number.
     */
    public function getForPeriod(string $period): IncomeCollection;

    /**
     * Get a single income line by ID.
     */
    public function getById(int $id): ?IncomeEntity;

    /**
     * Create a new income line item for a period.
     *
     * @param  array{
     *     period: string,
     *     description: string,
     *     amount_cad?: float|null,
     *     amount_usd?: float|null,
     *     amount_cop?: float|null,
     *     notes?: string|null,
     *     line_number?: int|null
     * }  $data
     */
    public function create(array $data): IncomeEntity;

    /**
     * Update an income line item.
     *
     * @param  array{
     *     description?: string,
     *     amount_cad?: float|null,
     *     amount_usd?: float|null,
     *     amount_cop?: float|null,
     *     notes?: string|null,
     *     line_number?: int|null
     * }  $data
     */
    public function update(int $id, array $data): IncomeEntity;

    /**
     * Delete an income line item.
     */
    public function delete(int $id): bool;

    /**
     * Total CAD-equivalent income for a period using that period's exchange rates.
     */
    public function getTotalCadEquivalent(string $period): float;
}
