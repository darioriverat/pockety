<?php

namespace Database\Factories;

use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FixedAssetValuation>
 */
class FixedAssetValuationFactory extends Factory
{
    protected $model = FixedAssetValuation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'fixed_asset_id' => FixedAsset::factory(),
            'period' => now()->format('Ym'),
            'book_value_cad' => fake()->randomFloat(2, 1000, 50000),
            'depreciation_cad' => fake()->randomFloat(2, 0, 1000),
        ];
    }

    /**
     * Set a specific period.
     */
    public function period(string $period): static
    {
        return $this->state(fn (array $attributes) => [
            'period' => $period,
        ]);
    }

    /**
     * Set a specific book value.
     */
    public function bookValue(float $value): static
    {
        return $this->state(fn (array $attributes) => [
            'book_value_cad' => $value,
        ]);
    }
}
