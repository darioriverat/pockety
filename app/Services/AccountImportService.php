<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountImportService
{
    /**
     * Labels that are section totals / placeholders, not real accounts.
     *
     * @var list<string>
     */
    private const SKIP_LABELS = ['Total', '-', ''];

    /**
     * Stale source labels remapped to their real identity.
     *
     * @var array<string, string>
     */
    private const RENAME_MAP = [
        'Crédito Móvil **6174' => 'Personal LOAN CIBC',
        'Credito Movil **6174' => 'Personal LOAN CIBC',
    ];

    /**
     * Notes applied when a renamed account is created/updated.
     *
     * @var array<string, string>
     */
    private const ACCOUNT_NOTES = [
        'Personal LOAN CIBC' => 'CIBC personal loan funding the Ford Escape vehicle',
        'Éxito' => 'Éxito store card (CRÉDITO ÉXITO) — liability tracked for Colombian credit payments',
    ];

    /**
     * Import accounts (and recorded balances) from month_sheets JSON files.
     *
     * @return array{
     *     accounts_created: int,
     *     accounts_updated: int,
     *     balances_imported: int,
     *     transactions_linked: int,
     *     accounts: list<string>,
     *     errors: list<string>
     * }
     */
    public function importFromMonthSheets(string $directory): array
    {
        if (! is_dir($directory)) {
            throw new \InvalidArgumentException("Directory not found: {$directory}");
        }

        $files = glob(rtrim($directory, '/').'/*.json') ?: [];
        if ($files === []) {
            throw new \InvalidArgumentException("No month sheet JSON files found in: {$directory}");
        }

        sort($files);

        /** @var array<string, array{type: string, currencies: array<string, bool>, notes: ?string}> $catalog */
        $catalog = [];
        /** @var array<string, array<string, array{cad: ?float, usd: ?float, cop: ?float}>> $balancesByAccount */
        $balancesByAccount = [];
        $errors = [];

        foreach ($files as $file) {
            try {
                $this->collectFromMonthSheet($file, $catalog, $balancesByAccount);
            } catch (\Throwable $e) {
                $errors[] = basename($file).': '.$e->getMessage();
                Log::error('Failed to parse month sheet for account import', [
                    'file' => $file,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Ensure Colombian Éxito liability exists even when absent from balance-sheet rows
        if (! isset($catalog['Éxito'])) {
            $catalog['Éxito'] = [
                'type' => 'liability',
                'currencies' => ['COP' => true],
                'notes' => self::ACCOUNT_NOTES['Éxito'],
            ];
        }

        $created = 0;
        $updated = 0;
        $balancesImported = 0;
        $accountNames = [];

        DB::beginTransaction();

        try {
            foreach ($catalog as $name => $meta) {
                $primaryCurrency = $this->resolvePrimaryCurrency($meta['currencies']);
                $notes = $meta['notes'] ?? (self::ACCOUNT_NOTES[$name] ?? null);

                $account = Account::query()->where('name', $name)->first();

                if ($account) {
                    $account->update([
                        'type' => $meta['type'],
                        'primary_currency' => $primaryCurrency,
                        'notes' => $notes ?? $account->notes,
                        'is_active' => true,
                    ]);
                    $updated++;
                } else {
                    $account = Account::create([
                        'name' => $name,
                        'type' => $meta['type'],
                        'primary_currency' => $primaryCurrency,
                        'notes' => $notes,
                        'is_active' => true,
                    ]);
                    $created++;
                }

                $accountNames[] = $name;

                foreach ($balancesByAccount[$name] ?? [] as $period => $amounts) {
                    $cad = $this->normalizeBalance($amounts['cad']);
                    $usd = $this->normalizeBalance($amounts['usd']);
                    $cop = $this->normalizeBalance($amounts['cop']);

                    AccountBalance::query()->updateOrCreate(
                        [
                            'account_id' => $account->id,
                            'period' => $period,
                        ],
                        [
                            'recorded_balance_cad' => $cad ?? 0,
                            'recorded_balance_usd' => $usd ?? 0,
                            'recorded_balance_cop' => $cop ?? 0,
                        ]
                    );
                    $balancesImported++;
                }
            }

            $transactionsLinked = $this->linkFordEscapeTransactions();

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        sort($accountNames);

        return [
            'accounts_created' => $created,
            'accounts_updated' => $updated,
            'balances_imported' => $balancesImported,
            'transactions_linked' => $transactionsLinked,
            'accounts' => $accountNames,
            'errors' => $errors,
        ];
    }

    /**
     * Import using the default extracted month_sheets directory.
     *
     * @return array{
     *     accounts_created: int,
     *     accounts_updated: int,
     *     balances_imported: int,
     *     transactions_linked: int,
     *     accounts: list<string>,
     *     errors: list<string>
     * }
     */
    public function importFromDefaultPath(): array
    {
        return $this->importFromMonthSheets(base_path('plan/extracted/month_sheets'));
    }

    /**
     * @param  array<string, array{type: string, currencies: array<string, bool>, notes: ?string}>  $catalog
     * @param  array<string, array<string, array{cad: ?float, usd: ?float, cop: ?float}>>  $balancesByAccount
     */
    private function collectFromMonthSheet(string $file, array &$catalog, array &$balancesByAccount): void
    {
        $json = file_get_contents($file);
        if ($json === false) {
            throw new \InvalidArgumentException("Failed to read file: {$file}");
        }

        $data = json_decode($json, true);
        if (! is_array($data)) {
            throw new \InvalidArgumentException('Invalid JSON: '.json_last_error_msg());
        }

        $period = (string) ($data['header']['period']['value'] ?? '');
        if ($period === '' || ! preg_match('/^\d{6}$/', $period)) {
            throw new \InvalidArgumentException('Missing or invalid period in month sheet');
        }

        $sections = $data['sections'] ?? [];

        $this->collectSectionItems(
            $sections['Cuentas']['items'] ?? [],
            'bank',
            $period,
            $catalog,
            $balancesByAccount
        );

        $this->collectSectionItems(
            $sections['CREDITOS Y DEUDAS']['items'] ?? [],
            'liability',
            $period,
            $catalog,
            $balancesByAccount
        );
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @param  array<string, array{type: string, currencies: array<string, bool>, notes: ?string}>  $catalog
     * @param  array<string, array<string, array{cad: ?float, usd: ?float, cop: ?float}>>  $balancesByAccount
     */
    private function collectSectionItems(
        array $items,
        string $type,
        string $period,
        array &$catalog,
        array &$balancesByAccount
    ): void {
        foreach ($items as $item) {
            $rawLabel = trim((string) ($item['label'] ?? ''));
            if (in_array($rawLabel, self::SKIP_LABELS, true)) {
                continue;
            }

            $name = $this->canonicalizeLabel($rawLabel);
            $recorded = $item['recorded'] ?? [];

            $cad = $this->extractAmount($recorded['cad']['value'] ?? null);
            $usd = $this->extractAmount($recorded['usd']['value'] ?? null);
            $cop = $this->extractAmount($recorded['cop']['value'] ?? null);

            if (! isset($catalog[$name])) {
                $catalog[$name] = [
                    'type' => $type,
                    'currencies' => [],
                    'notes' => self::ACCOUNT_NOTES[$name] ?? null,
                ];
            }

            // Prefer liability type if the same name appears in both sections
            if ($type === 'liability') {
                $catalog[$name]['type'] = 'liability';
            }

            if ($cad !== null) {
                $catalog[$name]['currencies']['CAD'] = true;
            }
            if ($usd !== null) {
                $catalog[$name]['currencies']['USD'] = true;
            }
            if ($cop !== null) {
                $catalog[$name]['currencies']['COP'] = true;
            }

            $balancesByAccount[$name][$period] = [
                'cad' => $cad,
                'usd' => $usd,
                'cop' => $cop,
            ];
        }
    }

    private function canonicalizeLabel(string $label): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($label)) ?? $label;

        // Collapse spaces around ** markers (e.g. "Crédito Móvil ** 6191")
        $normalized = preg_replace('/\*\*\s+/', '**', $normalized) ?? $normalized;

        foreach (self::RENAME_MAP as $from => $to) {
            if (strcasecmp($normalized, $from) === 0) {
                return $to;
            }
        }

        // Fuzzy match for the stale Ford Escape loan label with spacing variants
        if (preg_match('/cr[eé]dito\s+m[oó]vil\s*\*\*6174/iu', $normalized)) {
            return 'Personal LOAN CIBC';
        }

        return $normalized;
    }

    private function extractAmount(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    /**
     * Round floating-point noise near zero to exact 0.
     */
    private function normalizeBalance(?float $value): ?float
    {
        if ($value === null) {
            return null;
        }

        if (abs($value) < 1e-6) {
            return 0.0;
        }

        return round($value, 2);
    }

    /**
     * @param  array<string, bool>  $currencies
     */
    private function resolvePrimaryCurrency(array $currencies): ?string
    {
        foreach (['CAD', 'COP', 'USD'] as $code) {
            if (isset($currencies[$code])) {
                return $code;
            }
        }

        return null;
    }

    /**
     * Link Ford Escape principal/interest transactions to Personal LOAN CIBC.
     */
    public function linkFordEscapeTransactions(): int
    {
        $account = Account::query()->where('name', 'Personal LOAN CIBC')->first();
        if (! $account) {
            return 0;
        }

        $categoryIds = Category::query()
            ->where('code', 'C044')
            ->pluck('id');

        if ($categoryIds->isEmpty()) {
            return 0;
        }

        return Transaction::query()
            ->whereIn('category_id', $categoryIds)
            ->where(function ($query) {
                $query->where('comments', 'like', '%FORD ESC%')
                    ->orWhere('comments', 'like', '%Ford Escape%')
                    ->orWhere('comments', 'like', '%FORD ESCAPE%');
            })
            ->where(function ($query) use ($account) {
                $query->whereNull('account_id')
                    ->orWhere('account_id', '!=', $account->id);
            })
            ->update(['account_id' => $account->id]);
    }

    /**
     * @return array{total: int, by_type: array<string, int>}
     */
    public function getImportStatistics(): array
    {
        $total = Account::query()->active()->count();
        $byType = Account::query()
            ->active()
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        return [
            'total' => $total,
            'by_type' => $byType,
        ];
    }
}
