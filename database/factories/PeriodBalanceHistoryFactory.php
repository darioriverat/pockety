<?php

namespace Database\Factories;

use App\Models\PeriodBalanceHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PeriodBalanceHistory>
 */
class PeriodBalanceHistoryFactory extends Factory
{
    protected $model = PeriodBalanceHistory::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'period' => '202601',
            'assets_cad' => 900,
            'liabilities_cad' => 200,
            'equity_cad' => 700,
            'income_cad' => 400,
            'net_operating_expenses_cad' => 250,
            'records_check_result_cad' => 0,
            'reconciliation_status' => 'balanced',
            'recorded_at' => now()->subDay(),
            'replaced_at' => now(),
        ];
    }
}
