<?php

namespace App\Console\Commands;

use App\Models\ExchangeRateSnapshot;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class FetchExchangeRatesCommand extends Command
{
    protected $signature = 'exchange-rates:fetch';

    protected $description = 'Fetch the latest USD-base CAD and COP quotes from Open Exchange Rates';

    public function handle(): int
    {
        $appId = config('services.openexchangerates.app_id');

        if (! is_string($appId) || $appId === '') {
            Log::warning('OPENEXCHANGERATES_APP_ID is missing; skipping exchange-rates:fetch');
            $this->warn('OPENEXCHANGERATES_APP_ID is missing; skipping fetch.');

            return self::SUCCESS;
        }

        try {
            $response = Http::acceptJson()->get('https://openexchangerates.org/api/latest.json', [
                'app_id' => $appId,
            ]);
        } catch (Throwable $e) {
            Log::error('exchange-rates:fetch HTTP request failed', [
                'message' => $e->getMessage(),
            ]);
            $this->error('Failed to reach Open Exchange Rates: '.$e->getMessage());

            return self::FAILURE;
        }

        if (! $response->successful()) {
            Log::error('exchange-rates:fetch HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            $this->error('Open Exchange Rates returned HTTP '.$response->status());

            return self::FAILURE;
        }

        $payload = $response->json();
        $cad = data_get($payload, 'rates.CAD');
        $cop = data_get($payload, 'rates.COP');
        $timestamp = data_get($payload, 'timestamp');

        if (! is_numeric($cad) || ! is_numeric($cop) || ! is_numeric($timestamp)) {
            Log::error('exchange-rates:fetch invalid payload', [
                'has_cad' => is_numeric($cad),
                'has_cop' => is_numeric($cop),
                'has_timestamp' => is_numeric($timestamp),
            ]);
            $this->error('Open Exchange Rates payload is missing rates.CAD, rates.COP, or timestamp.');

            return self::FAILURE;
        }

        $rateDate = Carbon::createFromTimestamp((int) $timestamp, 'UTC')->toDateString();

        $existing = ExchangeRateSnapshot::query()
            ->whereDate('rate_date', $rateDate)
            ->where('source', ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES)
            ->whereNull('user_id')
            ->first();

        if ($existing) {
            $existing->forceFill([
                'cad_per_usd' => (float) $cad,
                'cop_per_usd' => (float) $cop,
            ])->save();
            $this->info("Updated global snapshot for {$rateDate}");
        } else {
            ExchangeRateSnapshot::query()->create([
                'rate_date' => $rateDate,
                'source' => ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES,
                'user_id' => null,
                'cad_per_usd' => (float) $cad,
                'cop_per_usd' => (float) $cop,
            ]);
            $this->info("Created global snapshot for {$rateDate}");
        }

        return self::SUCCESS;
    }
}
