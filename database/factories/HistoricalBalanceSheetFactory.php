<?php

namespace Database\Factories;

use App\Models\HistoricalBalanceSheet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HistoricalBalanceSheet>
 */
class HistoricalBalanceSheetFactory extends Factory
{
    protected $model = HistoricalBalanceSheet::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'period' => '202601',
            'assets_cad' => 1000,
            'liabilities_cad' => 200,
            'equity_cad' => 800,
            'source_row' => null,
        ];
    }
}
