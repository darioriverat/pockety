<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    protected $model = Account::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company().' Account',
            'type' => fake()->randomElement(['bank', 'investment', 'liability', 'receivable']),
            'primary_currency' => fake()->randomElement(['CAD', 'USD', 'COP', null]),
            'notes' => null,
            'is_active' => true,
        ];
    }
}
