<?php

namespace App\Domain\Entities;

readonly class CategoryActualEntity
{
    public function __construct(
        public int $categoryId,
        public string $categoryCode,
        public string $categoryName,
        public bool $isDebtCategory,
        public float $actualCad,
        public int $transactionCount,
        public bool $isIncomeCategory = false,
    ) {}

    /**
     * @return array{
     *     category_id: int,
     *     category_code: string,
     *     category_name: string,
     *     is_debt_category: bool,
     *     is_income_category: bool,
     *     actual_cad: float,
     *     transaction_count: int
     * }
     */
    public function toArray(): array
    {
        return [
            'category_id' => $this->categoryId,
            'category_code' => $this->categoryCode,
            'category_name' => $this->categoryName,
            'is_debt_category' => $this->isDebtCategory,
            'is_income_category' => $this->isIncomeCategory,
            'actual_cad' => $this->actualCad,
            'transaction_count' => $this->transactionCount,
        ];
    }
}
