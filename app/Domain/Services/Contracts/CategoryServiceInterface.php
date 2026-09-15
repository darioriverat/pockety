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
}
