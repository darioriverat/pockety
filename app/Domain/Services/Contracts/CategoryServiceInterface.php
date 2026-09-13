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
}
