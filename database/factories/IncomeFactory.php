<?php

namespace Database\Factories;

use App\Models\Income;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Income>
 */
class IncomeFactory extends Factory
{
    protected $model = Income::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'period' => '202601',
            'description' => fake()->words(3, true),
            'line_number' => fake()->numberBetween(1, 6),
            'amount_cad' => fake()->randomFloat(2, 100, 5000),
            'amount_usd' => 0,
            'amount_cop' => 0,
            'notes' => null,
        ];
    }
}
