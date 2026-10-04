<?php

namespace App\Http\Requests\Category;

use App\Domain\Requests\Contracts\Category\StoreCategoryRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest implements StoreCategoryRequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'is_debt_category' => 'required|boolean',
            'is_income_category' => 'required|boolean',
        ];
    }

    public function getName(): string
    {
        return $this->input('name');
    }

    public function isDebtCategory(): bool
    {
        return $this->input('is_debt_category');
    }

    public function isIncomeCategory(): bool
    {
        return $this->input('is_income_category');
    }
}
