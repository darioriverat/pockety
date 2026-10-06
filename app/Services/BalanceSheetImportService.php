<?php

namespace App\Services;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\HistoricalBalanceSheet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BalanceSheetImportService
{
    private const FLOAT_NOISE_THRESHOLD = 1e-6;

    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

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

        if (! is_array($rows) || ! array_is_list($rows)) {
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

                if (! array_key_exists('periodo', $row)) {
                    throw new \InvalidArgumentException("Row {$index}: missing periodo");
                }

                $period = (string) $row['periodo'];
                if ($period === '' || ! preg_match('/^\d{6}$/', $period)) {
                    throw new \InvalidArgumentException("Row {$index}: invalid or missing periodo");
                }

                if (! array_key_exists('activo_value', $row)) {
                    throw new \InvalidArgumentException("Row {$index}: missing activo_value");
                }

                if (! array_key_exists('pasivo_value', $row)
                    || ! array_key_exists('patrimonio_value', $row)
                ) {
                    throw new \InvalidArgumentException(
                        "Period {$period}: missing pasivo_value or patrimonio_value"
                    );
                }

                $assets = $this->normalizeAmount($row['activo_value']);
                $liabilities = $this->normalizeAmount($row['pasivo_value']);
                $equity = $this->normalizeAmount($row['patrimonio_value']);

                HistoricalBalanceSheet::updateOrCreate(
                    [
                        'user_id' => $this->owner->id(),
                        'period' => $period,
                    ],
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
        $rows = HistoricalBalanceSheet::query()
            ->forUser($this->owner->id())
            ->orderBy('period')
            ->get();

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
