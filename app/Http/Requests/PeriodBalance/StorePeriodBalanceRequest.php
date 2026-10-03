<?php

namespace App\Http\Requests\PeriodBalance;

use App\Domain\Requests\Contracts\PeriodBalance\StorePeriodBalanceRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class StorePeriodBalanceRequest extends FormRequest implements StorePeriodBalanceRequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'period' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
            'overwrite' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'period.regex' => 'The period must be in YYYYMM format.',
            'period.size' => 'The period must be in YYYYMM format.',
        ];
    }

    public function getPeriod(): string
    {
        return (string) $this->input('period');
    }

    public function shouldOverwrite(): bool
    {
        return $this->boolean('overwrite');
    }
}
