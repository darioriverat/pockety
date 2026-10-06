<?php

namespace App\Services;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionImportService
{
    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    /**
     * Import transactions from a JSON file (array of transaction objects).
     *
     * @param  string  $filePath  Path to the JSON file
     * @return array{imported: int, skipped: int, errors: array<string>}
     */
    public function importFromJson(string $filePath): array
    {
        if (! file_exists($filePath)) {
            throw new \InvalidArgumentException("File not found: {$filePath}");
        }

        $jsonContent = file_get_contents($filePath);
        if ($jsonContent === false) {
            throw new \InvalidArgumentException("Failed to read file: {$filePath}");
        }
        $transactions = json_decode($jsonContent, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('Invalid JSON file: '.json_last_error_msg());
        }

        if (! is_array($transactions) || ! array_is_list($transactions)) {
            throw new \InvalidArgumentException('Transactions JSON must be an array of objects');
        }

        return $this->importTransactions($transactions);
    }

    /**
     * Import transactions from a CSV file.
     *
     * Required header columns: fecha, periodo, concepto_code, cad, usd, cop, comentarios.
     * Extra columns are ignored. cad/usd/cop map onto nested value fields.
     *
     * @return array{imported: int, skipped: int, errors: array<string>}
     */
    public function importFromCsv(string $filePath): array
    {
        if (! file_exists($filePath)) {
            throw new \InvalidArgumentException("File not found: {$filePath}");
        }

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new \InvalidArgumentException("Failed to read file: {$filePath}");
        }

        try {
            $header = fgetcsv($handle);
            if ($header === false || $header === [null]) {
                throw new \InvalidArgumentException('CSV file is empty or missing a header row');
            }

            $header = array_map(
                static fn ($column) => strtolower(trim((string) $column)),
                $header
            );

            $required = ['fecha', 'periodo', 'concepto_code', 'cad', 'usd', 'cop', 'comentarios'];
            foreach ($required as $column) {
                if (! in_array($column, $header, true)) {
                    throw new \InvalidArgumentException("CSV is missing required header: {$column}");
                }
            }

            $indexByColumn = array_flip($header);
            $transactions = [];

            while (($row = fgetcsv($handle)) !== false) {
                if ($row === [null]) {
                    continue;
                }

                $get = static function (string $column) use ($row, $indexByColumn): ?string {
                    $index = $indexByColumn[$column];
                    $value = $row[$index] ?? null;
                    if ($value === null) {
                        return null;
                    }
                    $trimmed = trim((string) $value);

                    return $trimmed === '' ? null : $trimmed;
                };

                $transactions[] = [
                    'fecha' => $get('fecha'),
                    'periodo' => $get('periodo'),
                    'concepto_code' => $get('concepto_code'),
                    'cad' => ['value' => $this->parseCsvAmount($get('cad'))],
                    'usd' => ['value' => $this->parseCsvAmount($get('usd'))],
                    'cop' => ['value' => $this->parseCsvAmount($get('cop'))],
                    'comentarios' => $get('comentarios'),
                ];
            }
        } finally {
            fclose($handle);
        }

        return $this->importTransactions($transactions);
    }

    private function parseCsvAmount(?string $value): ?float
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
     * Import an array of transaction data.
     *
     * @param  array<array<string, mixed>>  $transactions
     * @return array{imported: int, skipped: int, errors: array<string>}
     */
    public function importTransactions(array $transactions): array
    {
        $imported = 0;
        $skipped = 0;
        $errors = [];

        // Get category mapping (C040 -> C031)
        $categoryMapping = $this->getCategoryMapping();

        DB::beginTransaction();

        try {
            foreach ($transactions as $index => $transaction) {
                // Skip template rows (no date or period)
                if (empty($transaction['fecha']) || empty($transaction['periodo'])) {
                    $skipped++;

                    continue;
                }

                try {
                    $this->importTransaction($transaction, $categoryMapping);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$index}: {$e->getMessage()}";
                    Log::error("Failed to import transaction at index {$index}", [
                        'transaction' => $transaction,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Import a single transaction.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, int>  $categoryMapping
     */
    private function importTransaction(array $data, array $categoryMapping): void
    {
        // Map C040 to C031
        $categoryCode = $data['concepto_code'];
        if ($categoryCode === 'C040') {
            $categoryCode = 'C031';
        }

        // Get category ID
        $categoryId = $categoryMapping[$categoryCode] ?? null;
        if (! $categoryId) {
            throw new \InvalidArgumentException("Category not found: {$categoryCode}");
        }

        // Parse date
        $date = new \DateTime($data['fecha']);

        // Get amounts
        $amountCad = $data['cad']['value'] ?? null;
        $amountUsd = $data['usd']['value'] ?? null;
        $amountCop = $data['cop']['value'] ?? null;

        // Get comments
        $comments = $data['comentarios'] ?? null;

        // Detect debt component from comments
        $debtComponent = $this->detectDebtComponent($comments, $categoryCode);

        // Link known Ford Escape payments to Personal LOAN CIBC when that account exists
        $accountId = $this->resolveAccountId($categoryCode, $comments);

        // Create transaction
        Transaction::create([
            'user_id' => $this->owner->id(),
            'date' => $date->format('Y-m-d'),
            'period' => (string) $data['periodo'],
            'category_id' => $categoryId,
            'account_id' => $accountId,
            'amount_cad' => $amountCad,
            'amount_usd' => $amountUsd,
            'amount_cop' => $amountCop,
            'comments' => $comments,
            'is_recurring' => false, // Default to false for historical data
            'debt_component' => $debtComponent,
        ]);
    }

    /**
     * Resolve account_id for historical rows when a reliable mapping exists.
     */
    private function resolveAccountId(string $categoryCode, ?string $comments): ?int
    {
        if ($categoryCode !== 'C044' || $comments === null) {
            return null;
        }

        if (! preg_match('/FORD\s*ESC/i', $comments)) {
            return null;
        }

        return Account::query()
            ->forUser($this->owner->id())
            ->where('name', 'Personal LOAN CIBC')
            ->value('id');
    }

    /**
     * Get category code to ID mapping.
     *
     * @return array<string, int>
     */
    private function getCategoryMapping(): array
    {
        return Category::query()
            ->forUser($this->owner->id())
            ->pluck('id', 'code')
            ->toArray();
    }

    /**
     * Detect debt component (principal or interest) from comments.
     */
    private function detectDebtComponent(?string $comments, string $categoryCode): ?string
    {
        if (! $comments) {
            return null;
        }

        $comments = strtolower($comments);

        // Check if this is a debt category
        $category = Category::query()
            ->forUser($this->owner->id())
            ->where('code', $categoryCode)
            ->first();
        if (! $category || ! $category->is_debt_category) {
            return null;
        }

        // Detect principal payments
        if (str_contains($comments, 'capital') ||
            str_contains($comments, 'principal') ||
            str_contains($comments, 'abono capital')) {
            return 'principal';
        }

        // Detect interest payments
        if (str_contains($comments, 'interes') ||
            str_contains($comments, 'intereses') ||
            str_contains($comments, 'interest')) {
            return 'interest';
        }

        return null;
    }

    /**
     * Clear all transactions (for testing purposes).
     */
    public function clearAllTransactions(): void
    {
        Transaction::query()->forUser($this->owner->id())->delete();
    }

    /**
     * Get import statistics.
     *
     * @return array{total: int, by_period: array<string, int>, by_currency: array{cad: int, usd: int, cop: int}}
     */
    public function getImportStatistics(): array
    {
        $owned = Transaction::query()->forUser($this->owner->id());
        $total = (clone $owned)->count();

        $byPeriod = (clone $owned)
            ->select('period', DB::raw('count(*) as count'))
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('count', 'period')
            ->toArray();

        $byCurrency = [
            'cad' => (clone $owned)->whereNotNull('amount_cad')->where('amount_cad', '!=', 0)->count(),
            'usd' => (clone $owned)->whereNotNull('amount_usd')->where('amount_usd', '!=', 0)->count(),
            'cop' => (clone $owned)->whereNotNull('amount_cop')->where('amount_cop', '!=', 0)->count(),
        ];

        return [
            'total' => $total,
            'by_period' => $byPeriod,
            'by_currency' => $byCurrency,
        ];
    }
}
