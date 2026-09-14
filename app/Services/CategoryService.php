<?php

namespace App\Services;

use App\Domain\Entities\CategoryEntity;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Models\Category;

class CategoryService implements CategoryServiceInterface
{
    /**
     * Get all active categories.
     *
     * @return CategoryEntity[]
     */
    public function getAllActive(): array
    {
        $categories = Category::active()
            ->orderBy('code')
            ->get();

        return $categories->map(function (Category $category) {
            return new CategoryEntity(
                id: $category->id,
                code: $category->code,
                nameEs: $category->name_es,
                nameEn: $category->name_en,
                isDebtCategory: $category->is_debt_category,
                isActive: $category->is_active,
                status: $category->status,
            );
        })->all();
    }

    /**
     * Get all categories (including inactive).
     *
     * @return CategoryEntity[]
     */
    public function getAll(): array
    {
        $categories = Category::orderBy('code')->get();

        return $categories->map(function (Category $category) {
            return new CategoryEntity(
                id: $category->id,
                code: $category->code,
                nameEs: $category->name_es,
                nameEn: $category->name_en,
                isDebtCategory: $category->is_debt_category,
                isActive: $category->is_active,
                status: $category->status,
            );
        })->all();
    }

    /**
     * Get a category by its code.
     */
    public function getByCode(string $code): ?CategoryEntity
    {
        $category = Category::where('code', $code)->first();

        if (! $category) {
            return null;
        }

        return new CategoryEntity(
            id: $category->id,
            code: $category->code,
            nameEs: $category->name_es,
            nameEn: $category->name_en,
            isDebtCategory: $category->is_debt_category,
            isActive: $category->is_active,
            status: $category->status,
        );
    }

    /**
     * Get all debt categories.
     *
     * @return CategoryEntity[]
     */
    public function getDebtCategories(): array
    {
        $categories = Category::debtCategories()
            ->active()
            ->orderBy('code')
            ->get();

        return $categories->map(function (Category $category) {
            return new CategoryEntity(
                id: $category->id,
                code: $category->code,
                nameEs: $category->name_es,
                nameEn: $category->name_en,
                isDebtCategory: $category->is_debt_category,
                isActive: $category->is_active,
                status: $category->status,
            );
        })->all();
    }
}
