<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Collections\TransactionCollection;
use App\Domain\Entities\TransactionEntity;

interface TransactionServiceInterface
{
    /**
     * Get all transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int|string, category?: string, account_id?: int, quincena?: string, currency?: string, is_recurring?: bool, search?: string, sort_by?: string, sort_dir?: string}  $filters  Optional filters
     * @return TransactionEntity[]
     */
    public function getAll(array $filters = []): array;

    /**
     * Get a paginated page of transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int|string, category?: string, account_id?: int, quincena?: string, currency?: string, is_recurring?: bool, search?: string, sort_by?: string, sort_dir?: string}  $filters
     * @return array{data: TransactionEntity[], total: int, page: int, per_page: int, last_page: int}
     */
    public function getPaginated(array $filters = [], int $page = 1, int $perPage = 50): array;

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
     * Bulk-update multiple transactions (e.g. change category).
     *
     * @param  list<int>  $ids
     * @param  array{category_id?: int, account_id?: int|null, is_recurring?: bool}  $data
     */
    public function bulkUpdate(array $ids, array $data): TransactionCollection;

    /**
     * Duplicate an existing transaction, optionally overriding date/period.
     *
     * @param  array{date?: string, period?: string, quincena?: string}  $overrides
     */
    public function duplicate(int $id, array $overrides = []): TransactionEntity;

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
