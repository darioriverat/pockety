<?php

namespace Database\Factories;

use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExchangeRate>
 */
class ExchangeRateFactory extends Factory
{
    protected $model = ExchangeRate::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'period' => '202601',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ];
    }
}
