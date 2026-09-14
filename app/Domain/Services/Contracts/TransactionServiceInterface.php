<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\TransactionEntity;

interface TransactionServiceInterface
{
    /**
     * Get all transactions with optional filtering.
     *
     * @param  array  $filters  Optional filters (period, category_id, account_id, quincena, currency)
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
     * @param  array  $data  Transaction data
     *
     * @throws \InvalidArgumentException If validation fails
     */
    public function create(array $data): TransactionEntity;

    /**
     * Update an existing transaction.
     *
     * @param  int  $id  Transaction ID
     * @param  array  $data  Updated data
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
