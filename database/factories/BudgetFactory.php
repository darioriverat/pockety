<?php

namespace Database\Factories;

use App\Models\Budget;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    protected $model = Budget::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'category_id' => null,
            'period' => '202601',
            'amount_cad' => fake()->randomFloat(2, 10, 1000),
            'notes' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Budget $budget): void {
            if ($budget->category_id !== null) {
                return;
            }

            $userId = $budget->user_id instanceof User ? $budget->user_id->id : $budget->user_id;
            $budget->category_id = Category::factory()->create(['user_id' => $userId])->id;
        });
    }
}
