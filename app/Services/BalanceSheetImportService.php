<?php

namespace App\Services;

use App\Models\HistoricalBalanceSheet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BalanceSheetImportService
{
    private const FLOAT_NOISE_THRESHOLD = 1e-6;

    /**
     * Import historical balance sheet snapshots from estado_financiero JSON.
     *
     * @return array{
     *     periods_imported: int,
     *     periods: list<string>,
     *     snapshots: list<array{
     *         period: string,
     *         assets_cad: float,
     *         liabilities_cad: float,
     *         equity_cad: float
     *     }>,
     *     errors: list<string>
     * }
     */
    public function importFromFile(string $filePath): array
    {
        if (! is_file($filePath)) {
            throw new \InvalidArgumentException("File not found: {$filePath}");
        }

        $raw = file_get_contents($filePath);
        if ($raw === false) {
            throw new \RuntimeException("Unable to read file: {$filePath}");
        }

        try {
            $rows = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new \InvalidArgumentException('Invalid JSON: '.$e->getMessage(), 0, $e);
        }

        if (! is_array($rows)) {
            throw new \InvalidArgumentException('Expected a JSON array of balance sheet rows');
        }

        $imported = 0;
        $periods = [];
        $snapshots = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($rows as $index => $row) {
                if (! is_array($row)) {
                    $errors[] = "Row {$index}: expected an object";

                    continue;
                }

                $period = isset($row['periodo']) ? (string) $row['periodo'] : null;
                if ($period === null || ! preg_match('/^\d{6}$/', $period)) {
                    $errors[] = "Row {$index}: invalid or missing periodo";

                    continue;
                }

                if (! array_key_exists('activo_value', $row)
                    || ! array_key_exists('pasivo_value', $row)
                    || ! array_key_exists('patrimonio_value', $row)
                ) {
                    $errors[] = "Period {$period}: missing activo/pasivo/patrimonio values";

                    continue;
                }

                $assets = $this->normalizeAmount($row['activo_value']);
                $liabilities = $this->normalizeAmount($row['pasivo_value']);
                $equity = $this->normalizeAmount($row['patrimonio_value']);

                HistoricalBalanceSheet::updateOrCreate(
                    ['period' => $period],
                    [
                        'assets_cad' => $assets,
                        'liabilities_cad' => $liabilities,
                        'equity_cad' => $equity,
                        'source_row' => isset($row['row']) ? (int) $row['row'] : null,
                    ]
                );

                $imported++;
                $periods[] = $period;
                $snapshots[] = [
                    'period' => $period,
                    'assets_cad' => $assets,
                    'liabilities_cad' => $liabilities,
                    'equity_cad' => $equity,
                ];
            }

            DB::commit();

            return [
                'periods_imported' => $imported,
                'periods' => $periods,
                'snapshots' => $snapshots,
                'errors' => $errors,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Balance sheet history import failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Import from the default extracted source path.
     *
     * @return array{
     *     periods_imported: int,
     *     periods: list<string>,
     *     snapshots: list<array{
     *         period: string,
     *         assets_cad: float,
     *         liabilities_cad: float,
     *         equity_cad: float
     *     }>,
     *     errors: list<string>
     * }
     */
    public function importFromDefaultPath(): array
    {
        return $this->importFromFile(
            base_path('plan/extracted/estado_financiero_2025_2026.json')
        );
    }

    /**
     * @return array{
     *     total: int,
     *     periods_covered: array{min: ?string, max: ?string},
     *     snapshots: list<array{
     *         period: string,
     *         assets_cad: float,
     *         liabilities_cad: float,
     *         equity_cad: float
     *     }>
     * }
     */
    public function getImportStatistics(): array
    {
        $rows = HistoricalBalanceSheet::query()->orderBy('period')->get();

        $snapshots = $rows->map(fn (HistoricalBalanceSheet $row): array => [
            'period' => $row->period,
            'assets_cad' => (float) $row->assets_cad,
            'liabilities_cad' => (float) $row->liabilities_cad,
            'equity_cad' => (float) $row->equity_cad,
        ])->all();

        return [
            'total' => $rows->count(),
            'periods_covered' => [
                'min' => $rows->first()?->period,
                'max' => $rows->last()?->period,
            ],
            'snapshots' => $snapshots,
        ];
    }

    private function normalizeAmount(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        $amount = (float) $value;

        if (abs($amount) < self::FLOAT_NOISE_THRESHOLD) {
            return 0.0;
        }

        return round($amount, 6);
    }
}
