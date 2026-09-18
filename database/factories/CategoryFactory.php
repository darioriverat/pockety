<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $code = 'C'.str_pad((string) fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT);

        return [
            'code' => $code,
            'name_es' => fake()->words(2, true),
            'name_en' => fake()->words(2, true),
            'is_debt_category' => false,
            'is_income_category' => false,
            'is_active' => true,
            'status' => 'active',
        ];
    }

    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_income_category' => true,
            'is_debt_category' => false,
        ]);
    }

    public function debt(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_debt_category' => true,
            'is_income_category' => false,
        ]);
    }
}
