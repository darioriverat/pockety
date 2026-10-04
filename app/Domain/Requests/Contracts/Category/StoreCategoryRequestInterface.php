<?php

namespace App\Domain\Requests\Contracts\Category;

interface StoreCategoryRequestInterface
{
    public function getName(): string;

    public function isDebtCategory(): bool;

    public function isIncomeCategory(): bool;
}
