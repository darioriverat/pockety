<?php

namespace App\Services\Concerns;

use App\Models\ExchangeRate;

trait ResolvesExchangeRate
{
    /**
     * Resolve the owner's assigned rate for a period.
     * Returns null when no assignment exists or the linked snapshot is missing.
     * Does not invent fallback quotes (4400 / 0.75 / 3000).
     */
    private function resolveExchangeRate(string $period): ?ExchangeRate
    {
        $exchangeRate = ExchangeRate::forPeriod($period);

        if (! $exchangeRate || ! $exchangeRate->hasSnapshot()) {
            return null;
        }

        return $exchangeRate;
    }

    /**
     * @return array{usd_cop: float|null, usd_cad: float|null, cad_cop: float|null}
     */
    private function exchangeRatesForResponse(?ExchangeRate $exchangeRate): array
    {
        if ($exchangeRate === null) {
            return [
                'usd_cop' => null,
                'usd_cad' => null,
                'cad_cop' => null,
            ];
        }

        return [
            'usd_cop' => $exchangeRate->usd_cop !== null ? (float) $exchangeRate->usd_cop : null,
            'usd_cad' => $exchangeRate->usd_cad !== null ? (float) $exchangeRate->usd_cad : null,
            'cad_cop' => $exchangeRate->cad_cop !== null ? (float) $exchangeRate->cad_cop : null,
        ];
    }
}
