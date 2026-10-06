<?php

namespace Database\Factories;

use App\Models\ExchangeRateSnapshot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExchangeRateSnapshot>
 */
class ExchangeRateSnapshotFactory extends Factory
{
    protected $model = ExchangeRateSnapshot::class;

    public function definition(): array
    {
        return [
            'rate_date' => '2026-01-31',
            'source' => ExchangeRateSnapshot::SOURCE_MANUAL,
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ];
    }

    public function globalFeed(): static
    {
        return $this->state(fn () => [
            'source' => ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES,
            'user_id' => null,
        ]);
    }

    public function manual(?int $userId = null): static
    {
        return $this->state(fn () => [
            'source' => ExchangeRateSnapshot::SOURCE_MANUAL,
            'user_id' => $userId ?? (auth()->id() ?? User::factory()),
        ]);
    }
}
