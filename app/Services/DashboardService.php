<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    public function __construct(
        private ReconciliationService $reconciliationService
    ) {}

    /**
     * Get dashboard summary for a given period.
     *
     * @return array{
     *     period: string,
     *     total_income_cad: float,
     *     total_expenses_cad: float,
     *     net_cad: float,
     *     total_assets_cad: float,
     *     total_liabilities_cad: float,
     *     equity_cad: float,
     *     reconciliation_status: string,
     *     reconciliation_summary: array{balanced_count: int, unbalanced_count: int, total_count: int}
     * }
     */
    public function getSummary(string $period): array
    {
        $exchangeRate = $this->resolveExchangeRate($period);

        $totalIncome = $this->calculateTotalIncome($period, $exchangeRate);
        $totalExpenses = $this->calculateTotalExpenses($period, $exchangeRate);
        $net = $totalIncome - $totalExpenses;

        [$totalAssets, $totalLiabilities] = $this->calculateAssetsAndLiabilities($period, $exchangeRate);
        $equity = $totalAssets - $totalLiabilities;

        $reconciliation = $this->reconciliationService->reconcileForPeriod($period);
        $reconciliationSummary = $this->summarizeReconciliation($reconciliation);

        return [
            'period' => $period,
            'total_income_cad' => round($totalIncome, 2),
            'total_expenses_cad' => round($totalExpenses, 2),
            'net_cad' => round($net, 2),
            'total_assets_cad' => round($totalAssets, 2),
            'total_liabilities_cad' => round($totalLiabilities, 2),
            'equity_cad' => round($equity, 2),
            'reconciliation_status' => $reconciliation['status'],
            'reconciliation_summary' => $reconciliationSummary,
        ];
    }

    /**
     * Income vs expenses trend for the last N months ending at $endPeriod.
     *
     * @return array{
     *     months: int,
     *     from: string,
     *     to: string,
     *     periods: list<array{period: string, income_cad: float, expenses_cad: float}>
     * }
     */
    public function getIncomeExpenseTrend(string $endPeriod, int $months = 12): array
    {
        $months = max(6, min(12, $months));

        $end = Carbon::createFromFormat('Ym', $endPeriod)->startOfMonth();
        $periodRows = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $period = $end->copy()->subMonths($i)->format('Ym');
            $exchangeRate = $this->resolveExchangeRate($period);

            $periodRows[] = [
                'period' => $period,
                'income_cad' => round($this->calculateTotalIncome($period, $exchangeRate), 2),
                'expenses_cad' => round($this->calculateTotalExpenses($period, $exchangeRate), 2),
            ];
        }

        return [
            'months' => $months,
            'from' => $periodRows[0]['period'],
            'to' => $periodRows[count($periodRows) - 1]['period'],
            'periods' => $periodRows,
        ];
    }

    /**
     * Assets vs liabilities (and equity) trend for the last N months ending at $endPeriod.
     *
     * @return array{
     *     months: int,
     *     from: string,
     *     to: string,
     *     periods: list<array{
     *         period: string,
     *         assets_cad: float,
     *         liabilities_cad: float,
     *         equity_cad: float
     *     }>
     * }
     */
    public function getAssetsLiabilitiesTrend(string $endPeriod, int $months = 12): array
    {
        $months = max(6, min(12, $months));

        $end = Carbon::createFromFormat('Ym', $endPeriod)->startOfMonth();
        $periodRows = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $period = $end->copy()->subMonths($i)->format('Ym');
            $exchangeRate = $this->resolveExchangeRate($period);
            [$assets, $liabilities] = $this->calculateAssetsAndLiabilities($period, $exchangeRate);

            $periodRows[] = [
                'period' => $period,
                'assets_cad' => round($assets, 2),
                'liabilities_cad' => round($liabilities, 2),
                'equity_cad' => round($assets - $liabilities, 2),
            ];
        }

        return [
            'months' => $months,
            'from' => $periodRows[0]['period'],
            'to' => $periodRows[count($periodRows) - 1]['period'],
            'periods' => $periodRows,
        ];
    }

    private function resolveExchangeRate(string $period): ExchangeRate
    {
        $exchangeRate = ExchangeRate::forPeriod($period);

        if (! $exchangeRate) {
            Log::warning("No exchange rate found for period {$period}, using defaults");

            return new ExchangeRate([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }

        return $exchangeRate;
    }

    /**
     * Calculate total income for a period in CAD equivalent.
     */
    private function calculateTotalIncome(string $period, ExchangeRate $exchangeRate): float
    {
        $incomeLines = Income::forPeriod($period)->get();

        $total = 0.0;

        foreach ($incomeLines as $income) {
            $total += (float) $income->amount_cad;

            if ($income->amount_usd > 0) {
                $total += $exchangeRate->usdToCad((float) $income->amount_usd);
            }

            if ($income->amount_cop > 0) {
                $total += $exchangeRate->copToCad((float) $income->amount_cop);
            }
        }

        return $total;
    }

    /**
     * Calculate total expenses for a period in CAD equivalent.
     */
    private function calculateTotalExpenses(string $period, ExchangeRate $exchangeRate): float
    {
        $transactions = Transaction::where('period', $period)->get();

        $total = 0.0;

        foreach ($transactions as $transaction) {
            if ($transaction->amount_cad > 0) {
                $total += (float) $transaction->amount_cad;
            }

            if ($transaction->amount_usd > 0) {
                $total += $exchangeRate->usdToCad((float) $transaction->amount_usd);
            }

            if ($transaction->amount_cop > 0) {
                $total += $exchangeRate->copToCad((float) $transaction->amount_cop);
            }
        }

        return $total;
    }

    /**
     * Calculate total assets and liabilities for a period in CAD equivalent.
     *
     * @return array{0: float, 1: float} [totalAssets, totalLiabilities]
     */
    private function calculateAssetsAndLiabilities(string $period, ExchangeRate $exchangeRate): array
    {
        $totalAssets = 0.0;
        $totalLiabilities = 0.0;

        $accounts = Account::active()->get();

        foreach ($accounts as $account) {
            $balance = AccountBalance::where('account_id', $account->id)
                ->where('period', $period)
                ->first();

            if (! $balance) {
                continue;
            }

            $cadEquivalent = 0.0;

            if ($balance->recorded_balance_cad) {
                $cadEquivalent += (float) $balance->recorded_balance_cad;
            }

            if ($balance->recorded_balance_usd) {
                $cadEquivalent += $exchangeRate->usdToCad((float) $balance->recorded_balance_usd);
            }

            if ($balance->recorded_balance_cop) {
                $cadEquivalent += $exchangeRate->copToCad((float) $balance->recorded_balance_cop);
            }

            if ($account->isAsset()) {
                $totalAssets += $cadEquivalent;
            } elseif ($account->isLiability()) {
                $totalLiabilities += abs($cadEquivalent); // Liabilities are typically stored as negative
            }
        }

        return [$totalAssets, $totalLiabilities];
    }

    /**
     * Top spending categories for a period (by CAD equivalent), with share of total expenses.
     *
     * @return array{
     *     period: string,
     *     limit: int,
     *     total_expenses_cad: float,
     *     categories: list<array{
     *         category_id: int,
     *         category_code: string,
     *         category_name_es: string,
     *         category_name_en: string,
     *         amount_cad: float,
     *         percentage: float,
     *         transaction_count: int
     *     }>
     * }
     */
    public function getTopSpendingCategories(string $period, int $limit = 10): array
    {
        $limit = max(5, min(10, $limit));
        $exchangeRate = $this->resolveExchangeRate($period);

        /** @var array<int, array{amount: float, count: int}> $aggregates */
        $aggregates = [];

        $transactions = Transaction::forPeriod($period)->get();

        foreach ($transactions as $transaction) {
            $categoryId = (int) $transaction->category_id;
            $cadEquivalent = $this->transactionToCad($transaction, $exchangeRate);

            if ($cadEquivalent <= 0) {
                continue;
            }

            if (! isset($aggregates[$categoryId])) {
                $aggregates[$categoryId] = ['amount' => 0.0, 'count' => 0];
            }

            $aggregates[$categoryId]['amount'] += $cadEquivalent;
            $aggregates[$categoryId]['count']++;
        }

        $totalExpenses = array_sum(array_column($aggregates, 'amount'));

        arsort($aggregates);
        $topIds = array_slice(array_keys($aggregates), 0, $limit, true);

        $categoriesById = Category::query()
            ->whereIn('id', $topIds)
            ->get()
            ->keyBy('id');

        $categories = [];

        foreach ($topIds as $categoryId) {
            $category = $categoriesById->get($categoryId);

            if (! $category) {
                continue;
            }

            $amount = round($aggregates[$categoryId]['amount'], 2);
            $percentage = $totalExpenses > 0
                ? round(($aggregates[$categoryId]['amount'] / $totalExpenses) * 100, 1)
                : 0.0;

            $categories[] = [
                'category_id' => (int) $category->id,
                'category_code' => (string) $category->code,
                'category_name_es' => (string) $category->name_es,
                'category_name_en' => (string) $category->name_en,
                'amount_cad' => $amount,
                'percentage' => $percentage,
                'transaction_count' => $aggregates[$categoryId]['count'],
            ];
        }

        return [
            'period' => $period,
            'limit' => $limit,
            'total_expenses_cad' => round($totalExpenses, 2),
            'categories' => $categories,
        ];
    }

    private function transactionToCad(Transaction $transaction, ExchangeRate $exchangeRate): float
    {
        $cadEquivalent = 0.0;

        if ($transaction->amount_cad !== null && (float) $transaction->amount_cad != 0) {
            $cadEquivalent += (float) $transaction->amount_cad;
        }

        if ($transaction->amount_usd !== null && (float) $transaction->amount_usd != 0) {
            $cadEquivalent += $exchangeRate->usdToCad((float) $transaction->amount_usd);
        }

        if ($transaction->amount_cop !== null && (float) $transaction->amount_cop != 0) {
            $cadEquivalent += $exchangeRate->copToCad((float) $transaction->amount_cop);
        }

        return $cadEquivalent;
    }

    /**
     * Summarize reconciliation results.
     *
     * @param  array{accounts: array}  $reconciliation
     * @return array{balanced_count: int, unbalanced_count: int, total_count: int}
     */
    private function summarizeReconciliation(array $reconciliation): array
    {
        $totalCount = count($reconciliation['accounts']);
        $balancedCount = collect($reconciliation['accounts'])
            ->filter(fn ($account) => $account['is_balanced'])
            ->count();
        $unbalancedCount = $totalCount - $balancedCount;

        return [
            'balanced_count' => $balancedCount,
            'unbalanced_count' => $unbalancedCount,
            'total_count' => $totalCount,
        ];
    }
}
