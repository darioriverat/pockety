<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionImportService
{
    /**
     * Import transactions from the historical JSON file.
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

        return $this->importTransactions($transactions);
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
            'date' => $date->format('Y-m-d'),
            'period' => (string) $data['periodo'],
            'quincena' => $data['quincena'],
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
        return Category::pluck('id', 'code')->toArray();
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

        // Check if this is a debt category (categories starting with CRÉDITO or CREDITO)
        $category = Category::where('code', $categoryCode)->first();
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
        Transaction::truncate();
    }

    /**
     * Get import statistics.
     *
     * @return array{total: int, by_period: array<string, int>, by_currency: array{cad: int, usd: int, cop: int}}
     */
    public function getImportStatistics(): array
    {
        $total = Transaction::count();

        $byPeriod = Transaction::select('period', DB::raw('count(*) as count'))
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('count', 'period')
            ->toArray();

        $byCurrency = [
            'cad' => Transaction::whereNotNull('amount_cad')->where('amount_cad', '!=', 0)->count(),
            'usd' => Transaction::whereNotNull('amount_usd')->where('amount_usd', '!=', 0)->count(),
            'cop' => Transaction::whereNotNull('amount_cop')->where('amount_cop', '!=', 0)->count(),
        ];

        return [
            'total' => $total,
            'by_period' => $byPeriod,
            'by_currency' => $byCurrency,
        ];
    }
}
