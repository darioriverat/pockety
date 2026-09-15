<?php

namespace App\Services;

use App\Models\ExchangeRate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExchangeRateImportService
{
    /**
     * Import exchange rates from month_sheets JSON files.
     *
     * @return array{
     *     rates_imported: int,
     *     periods: list<string>,
     *     errors: list<string>
     * }
     */
    public function importFromMonthSheets(string $directory): array
    {
        if (!is_dir($directory)) {
            throw new \InvalidArgumentException("Directory not found: {$directory}");
        }

        $files = glob(rtrim($directory, '/').'/*.json') ?: [];
        if ($files === []) {
            throw new \InvalidArgumentException("No month sheet JSON files found in: {$directory}");
        }

        sort($files);

        $imported = 0;
        $periods = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($files as $file) {
                try {
                    $data = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

                    if (!isset($data['header'])) {
                        $errors[] = basename($file).': Missing header';
                        continue;
                    }

                    $header = $data['header'];

                    // Extract period
                    $period = $header['period']['value'] ?? null;
                    if (!$period || !preg_match('/^\d{6}$/', $period)) {
                        $errors[] = basename($file).': Invalid or missing period';
                        continue;
                    }

                    // Extract exchange rates
                    $usdCop = $header['fx_usd_cop']['rate']['value'] ?? null;
                    $usdCad = $header['fx_usd_cad']['rate']['value'] ?? null;
                    $cadCop = $header['fx_cad_cop']['rate']['value'] ?? null;

                    if ($usdCop === null || $usdCad === null || $cadCop === null) {
                        $errors[] = basename($file).': Missing exchange rate data';
                        continue;
                    }

                    // Create or update exchange rate
                    ExchangeRate::updateOrCreate(
                        ['period' => $period],
                        [
                            'usd_cop' => $usdCop,
                            'usd_cad' => $usdCad,
                            'cad_cop' => $cadCop,
                        ]
                    );

                    $imported++;
                    $periods[] = $period;
                } catch (\Throwable $e) {
                    $errors[] = basename($file).': '.$e->getMessage();
                    Log::error('Failed to parse month sheet for exchange rate import', [
                        'file' => $file,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            return [
                'rates_imported' => $imported,
                'periods' => $periods,
                'errors' => $errors,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get import statistics.
     *
     * @return array{
     *     total_rates: int,
     *     periods_covered: array{min: ?string, max: ?string},
     *     rates_by_month: array<string, array{usd_cop: string, usd_cad: string, cad_cop: string}>
     * }
     */
    public function getImportStatistics(): array
    {
        $rates = ExchangeRate::orderBy('period')->get();

        $ratesByMonth = [];
        foreach ($rates as $rate) {
            $ratesByMonth[$rate->period] = [
                'usd_cop' => $rate->usd_cop,
                'usd_cad' => $rate->usd_cad,
                'cad_cop' => $rate->cad_cop,
            ];
        }

        return [
            'total_rates' => $rates->count(),
            'periods_covered' => [
                'min' => $rates->first()?->period,
                'max' => $rates->last()?->period,
            ],
            'rates_by_month' => $ratesByMonth,
        ];
    }
}
