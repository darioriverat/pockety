<?php

namespace App\Http\Requests\Category;

use App\Domain\Requests\Contracts\Category\UpdateCategoryRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest implements UpdateCategoryRequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'is_debt_category' => 'sometimes|boolean',
            'is_income_category' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function getName(): ?string
    {
        return $this->input('name');
    }

    public function isDebtCategory(): ?bool
    {
        return $this->input('is_debt_category');
    }

    public function isIncomeCategory(): ?bool
    {
        return $this->input('is_income_category');
    }

    public function isActive(): ?bool
    {
        return $this->input('is_active');
    }

    public function hasAnyField(): bool
    {
        return $this->has('name') 
            || $this->has('is_debt_category') 
            || $this->has('is_income_category') 
            || $this->has('is_active');
    }
}
