<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\CategoryEntity;

interface CategoryServiceInterface
{
    /**
     * Get all active categories.
     *
     * @return CategoryEntity[]
     */
    public function getAllActive(): array;

    /**
     * Get all categories (including inactive).
     *
     * @return CategoryEntity[]
     */
    public function getAll(): array;

    /**
     * Get a category by its code.
     */
    public function getByCode(string $code): ?CategoryEntity;

    /**
     * Get all debt categories.
     *
     * @return CategoryEntity[]
     */
    public function getDebtCategories(): array;

    /**
     * Delete a category by its code.
     * Returns true if deleted successfully, false if category has transactions.
     *
     * @throws \Exception if category not found
     */
    public function delete(string $code): bool;

    /**
     * Check if a category has associated transactions.
     */
    public function hasTransactions(string $code): bool;

    /**
     * Get transaction history for a category, optionally filtered by period.
     *
     * @return array{
     *     category: CategoryEntity,
     *     transactions: list<\App\Domain\Entities\TransactionEntity>,
     *     meta: array{
     *         total_spending_cad: float,
     *         total_spending_usd: float,
     *         total_spending_cop: float,
     *         total_count: int,
     *         period_count: int,
     *         average_per_period_cad: float,
     *         available_periods: list<string>,
     *         is_filtered: bool,
     *         filters: array{period: string|null}
     *     }
     * }|null
     */
    public function getTransactionHistory(string $code, ?string $period = null): ?array;
}
