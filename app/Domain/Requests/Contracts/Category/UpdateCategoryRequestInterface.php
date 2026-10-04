<?php

namespace App\Domain\Requests\Contracts\Category;

interface UpdateCategoryRequestInterface
{
    public function getName(): ?string;

    public function isDebtCategory(): ?bool;

    public function isIncomeCategory(): ?bool;

    public function isActive(): ?bool;

    public function hasAnyField(): bool;
}
