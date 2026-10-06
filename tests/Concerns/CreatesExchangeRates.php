<?php

namespace Tests\Concerns;

use App\Models\ExchangeRate;
use App\Models\ExchangeRateSnapshot;
use App\Models\User;
use Illuminate\Support\Carbon;

trait CreatesExchangeRates
{
    /**
     * Create a manual snapshot and assign it to a period.
     *
     * Accepts either the new quote keys (cad_per_usd, cop_per_usd) or the
     * legacy column names (usd_cad → cad_per_usd, usd_cop → cop_per_usd).
     * Legacy cad_cop is ignored (derived).
     *
     * @param  array{
     *     period: string,
     *     user_id?: int,
     *     cad_per_usd?: float|int|string,
     *     cop_per_usd?: float|int|string,
     *     usd_cad?: float|int|string,
     *     usd_cop?: float|int|string,
     *     cad_cop?: float|int|string,
     *     rate_date?: string
     * }  $attributes
     */
    protected function seedExchangeRate(array $attributes): ExchangeRate
    {
        $period = (string) $attributes['period'];
        $userId = $attributes['user_id'] ?? auth()->id() ?? User::factory()->create()->id;

        $cadPerUsd = $attributes['cad_per_usd'] ?? $attributes['usd_cad'] ?? 1.36;
        $copPerUsd = $attributes['cop_per_usd'] ?? $attributes['usd_cop'] ?? 4000;

        $rateDate = $attributes['rate_date']
            ?? Carbon::createFromFormat('Ym', $period)->endOfMonth()->toDateString();

        $snapshot = ExchangeRateSnapshot::query()->create([
            'rate_date' => $rateDate,
            'source' => ExchangeRateSnapshot::SOURCE_MANUAL,
            'user_id' => $userId,
            'cad_per_usd' => $cadPerUsd,
            'cop_per_usd' => $copPerUsd,
        ]);

        return ExchangeRate::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'period' => $period,
            ],
            [
                'snapshot_id' => $snapshot->id,
            ]
        );
    }
}
