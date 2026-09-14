<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\TransactionEntity;

interface TransactionServiceInterface
{
    /**
     * Get all transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int, account_id?: int, quincena?: string, currency?: string, is_recurring?: bool}  $filters  Optional filters
     * @return TransactionEntity[]
     */
    public function getAll(array $filters = []): array;

    /**
     * Get a transaction by its ID.
     */
    public function getById(int $id): ?TransactionEntity;

    /**
     * Create a new transaction.
     *
     * @param  array{date: string, period: string, quincena: string, category_id: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, debt_component?: string|null}  $data  Transaction data
     *
     * @throws \InvalidArgumentException If validation fails
     */
    public function create(array $data): TransactionEntity;

    /**
     * Update an existing transaction.
     *
     * @param  int  $id  Transaction ID
     * @param  array{date?: string, period?: string, quincena?: string, category_id?: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, debt_component?: string|null}  $data  Updated data
     *
     * @throws \InvalidArgumentException If validation fails
     */
    public function update(int $id, array $data): TransactionEntity;

    /**
     * Delete a transaction.
     *
     * @param  int  $id  Transaction ID
     */
    public function delete(int $id): bool;

    /**
     * Get transactions for a specific period.
     *
     * @param  string  $period  Period in YYYYMM format
     * @return TransactionEntity[]
     */
    public function getForPeriod(string $period): array;

    /**
     * Get transactions for a specific category.
     *
     * @param  int  $categoryId  Category ID
     * @return TransactionEntity[]
     */
    public function getForCategory(int $categoryId): array;
}
