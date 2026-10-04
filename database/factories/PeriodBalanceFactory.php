<?php

namespace Database\Factories;

use App\Models\PeriodBalance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PeriodBalance>
 */
class PeriodBalanceFactory extends Factory
{
    protected $model = PeriodBalance::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'period' => '202601',
            'assets_cad' => 1000,
            'liabilities_cad' => 200,
            'equity_cad' => 800,
            'income_cad' => 500,
            'net_operating_expenses_cad' => 300,
            'records_check_result_cad' => 0,
            'reconciliation_status' => 'balanced',
        ];
    }
}
