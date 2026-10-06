<?php

namespace Database\Factories;

use App\Models\ExchangeRate;
use App\Models\ExchangeRateSnapshot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

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
        ];
    }

    /** @var array{cad_per_usd?: float|int|string, cop_per_usd?: float|int|string} */
    private array $quoteOverrides = [];

    public function withQuotes(float|int|string $cadPerUsd, float|int|string $copPerUsd): static
    {
        return $this->state(function () use ($cadPerUsd, $copPerUsd) {
            $this->quoteOverrides = [
                'cad_per_usd' => $cadPerUsd,
                'cop_per_usd' => $copPerUsd,
            ];

            return [];
        });
    }

    public function configure(): static
    {
        return $this->afterMaking(function (ExchangeRate $rate): void {
            if ($rate->snapshot_id) {
                return;
            }

            $userId = $rate->user_id;
            $period = (string) $rate->period;
            $rateDate = Carbon::createFromFormat('Ym', $period)->endOfMonth()->toDateString();

            // Legacy factory attributes passed via create([...]) land on the model
            // as dynamic attributes when not fillable; map them to snapshot quotes.
            $cadPerUsd = $rate->getAttributes()['usd_cad']
                ?? $this->quoteOverrides['cad_per_usd']
                ?? 1.36;
            $copPerUsd = $rate->getAttributes()['usd_cop']
                ?? $this->quoteOverrides['cop_per_usd']
                ?? 4000;

            unset($rate->usd_cad, $rate->usd_cop, $rate->cad_cop);

            $snapshot = ExchangeRateSnapshot::factory()->manual(
                is_numeric($userId) ? (int) $userId : null
            )->create([
                'user_id' => $userId,
                'rate_date' => $rateDate,
                'cad_per_usd' => $cadPerUsd,
                'cop_per_usd' => $copPerUsd,
            ]);

            $rate->snapshot_id = $snapshot->id;
            $this->quoteOverrides = [];
        });
    }
}
