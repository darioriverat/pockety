<?php

namespace App\Http\Requests\PeriodBalance;

use App\Domain\Requests\Contracts\PeriodBalance\ShowPeriodBalanceRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class ShowPeriodBalanceRequest extends FormRequest implements ShowPeriodBalanceRequestInterface
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
}
