<?php

namespace Database\Factories;

use App\Models\FixedAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FixedAsset>
 */
class FixedAssetFactory extends Factory
{
    protected $model = FixedAsset::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Ford Escape', 'Honda Civic', 'Toyota Camry', 'Office Equipment', 'Computer']),
            'description' => fake()->optional()->sentence(),
            'acquisition_date' => fake()->optional()->dateTimeBetween('-5 years', 'now'),
            'initial_value_cad' => fake()->randomFloat(2, 5000, 50000),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the fixed asset is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
