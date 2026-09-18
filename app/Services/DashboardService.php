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
     *     total_income_usd: float,
     *     total_income_cop: float,
     *     total_expenses_cad: float,
     *     total_expenses_usd: float,
     *     total_expenses_cop: float,
     *     net_cad: float,
     *     net_usd: float,
     *     net_cop: float,
     *     total_assets_cad: float,
     *     total_assets_usd: float,
     *     total_assets_cop: float,
     *     total_liabilities_cad: float,
     *     total_liabilities_usd: float,
     *     total_liabilities_cop: float,
     *     equity_cad: float,
     *     equity_usd: float,
     *     equity_cop: float,
     *     exchange_rates: array{usd_cop: float, usd_cad: float, cad_cop: float},
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
            'total_income_usd' => $exchangeRate->cadToUsd($totalIncome),
            'total_income_cop' => $exchangeRate->cadToCop($totalIncome),
            'total_expenses_cad' => round($totalExpenses, 2),
            'total_expenses_usd' => $exchangeRate->cadToUsd($totalExpenses),
            'total_expenses_cop' => $exchangeRate->cadToCop($totalExpenses),
            'net_cad' => round($net, 2),
            'net_usd' => $exchangeRate->cadToUsd($net),
            'net_cop' => $exchangeRate->cadToCop($net),
            'total_assets_cad' => round($totalAssets, 2),
            'total_assets_usd' => $exchangeRate->cadToUsd($totalAssets),
            'total_assets_cop' => $exchangeRate->cadToCop($totalAssets),
            'total_liabilities_cad' => round($totalLiabilities, 2),
            'total_liabilities_usd' => $exchangeRate->cadToUsd($totalLiabilities),
            'total_liabilities_cop' => $exchangeRate->cadToCop($totalLiabilities),
            'equity_cad' => round($equity, 2),
            'equity_usd' => $exchangeRate->cadToUsd($equity),
            'equity_cop' => $exchangeRate->cadToCop($equity),
            'exchange_rates' => [
                'usd_cop' => (float) $exchangeRate->usd_cop,
                'usd_cad' => (float) $exchangeRate->usd_cad,
                'cad_cop' => (float) $exchangeRate->cad_cop,
            ],
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

            $income = $this->calculateTotalIncome($period, $exchangeRate);
            $expenses = $this->calculateTotalExpenses($period, $exchangeRate);

            $periodRows[] = [
                'period' => $period,
                'income_cad' => round($income, 2),
                'income_usd' => $exchangeRate->cadToUsd($income),
                'income_cop' => $exchangeRate->cadToCop($income),
                'expenses_cad' => round($expenses, 2),
                'expenses_usd' => $exchangeRate->cadToUsd($expenses),
                'expenses_cop' => $exchangeRate->cadToCop($expenses),
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
     *         assets_usd: float,
     *         assets_cop: float,
     *         liabilities_cad: float,
     *         liabilities_usd: float,
     *         liabilities_cop: float,
     *         equity_cad: float,
     *         equity_usd: float,
     *         equity_cop: float
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
            $equity = $assets - $liabilities;

            $periodRows[] = [
                'period' => $period,
                'assets_cad' => round($assets, 2),
                'assets_usd' => $exchangeRate->cadToUsd($assets),
                'assets_cop' => $exchangeRate->cadToCop($assets),
                'liabilities_cad' => round($liabilities, 2),
                'liabilities_usd' => $exchangeRate->cadToUsd($liabilities),
                'liabilities_cop' => $exchangeRate->cadToCop($liabilities),
                'equity_cad' => round($equity, 2),
                'equity_usd' => $exchangeRate->cadToUsd($equity),
                'equity_cop' => $exchangeRate->cadToCop($equity),
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
            if ($transaction->amount_cad !== null && (float) $transaction->amount_cad != 0) {
                $total += (float) $transaction->amount_cad;
            }

            if ($transaction->amount_usd !== null && (float) $transaction->amount_usd != 0) {
                $total += $exchangeRate->usdToCad((float) $transaction->amount_usd);
            }

            if ($transaction->amount_cop !== null && (float) $transaction->amount_cop != 0) {
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
                'amount_usd' => $exchangeRate->cadToUsd($aggregates[$categoryId]['amount']),
                'amount_cop' => $exchangeRate->cadToCop($aggregates[$categoryId]['amount']),
                'percentage' => $percentage,
                'transaction_count' => $aggregates[$categoryId]['count'],
            ];
        }

        return [
            'period' => $period,
            'limit' => $limit,
            'total_expenses_cad' => round($totalExpenses, 2),
            'total_expenses_usd' => $exchangeRate->cadToUsd($totalExpenses),
            'total_expenses_cop' => $exchangeRate->cadToCop($totalExpenses),
            'categories' => $categories,
        ];
    }

    /**
     * Recent activity feed: latest transactions and income lines (10–20 items).
     *
     * @return array{
     *     limit: int,
     *     items: list<array{
     *         id: int,
     *         type: string,
     *         date: string,
     *         period: string,
     *         summary: string,
     *         amount_cad: float|null,
     *         amount_usd: float|null,
     *         amount_cop: float|null,
     *         category_code: string|null,
     *         category_name_en: string|null,
     *         category_name_es: string|null,
     *         account_name: string|null,
     *         comments: string|null,
     *         detail_url: string
     *     }>
     * }
     */
    public function getRecentActivity(int $limit = 15): array
    {
        $limit = max(10, min(20, $limit));

        $transactions = Transaction::query()
            ->with(['category', 'account'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $incomeLines = Income::query()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $items = [];

        foreach ($transactions as $transaction) {
            $category = $transaction->category;
            $account = $transaction->account;
            $date = $transaction->date?->format('Y-m-d') ?? '';
            $comments = $transaction->comments ? trim((string) $transaction->comments) : '';
            $categoryLabel = $category
                ? trim($category->name_en.' / '.$category->name_es)
                : 'Expense';
            $summaryParts = array_filter([
                $categoryLabel,
                $account?->name ? 'via '.$account->name : null,
                $comments !== '' ? $comments : null,
            ]);

            $items[] = [
                'id' => (int) $transaction->id,
                'type' => 'expense',
                'date' => $date,
                'period' => (string) $transaction->period,
                'summary' => implode(' · ', $summaryParts),
                'amount_cad' => $transaction->amount_cad !== null ? (float) $transaction->amount_cad : null,
                'amount_usd' => $transaction->amount_usd !== null ? (float) $transaction->amount_usd : null,
                'amount_cop' => $transaction->amount_cop !== null ? (float) $transaction->amount_cop : null,
                'category_code' => $category?->code,
                'category_name_en' => $category?->name_en,
                'category_name_es' => $category?->name_es,
                'account_name' => $account?->name,
                'comments' => $comments !== '' ? $comments : null,
                'detail_url' => '/transactions?period='.urlencode((string) $transaction->period).'&highlight='.$transaction->id,
                'sort_at' => ($transaction->updated_at ?? $transaction->created_at)?->format('Y-m-d H:i:s.u')
                    ?? $date,
            ];
        }

        foreach ($incomeLines as $income) {
            $period = (string) $income->period;
            $date = preg_match('/^\d{6}$/', $period)
                ? Carbon::createFromFormat('Ym', $period)->endOfMonth()->format('Y-m-d')
                : ($income->updated_at?->format('Y-m-d') ?? '');
            $description = trim((string) $income->description);
            $notes = $income->notes ? trim((string) $income->notes) : '';
            $summaryParts = array_filter([
                $description !== '' ? $description : 'Income',
                $notes !== '' ? $notes : null,
            ]);

            $items[] = [
                'id' => (int) $income->id,
                'type' => 'income',
                'date' => $date,
                'period' => $period,
                'summary' => implode(' · ', $summaryParts),
                'amount_cad' => $income->amount_cad !== null ? (float) $income->amount_cad : null,
                'amount_usd' => $income->amount_usd !== null ? (float) $income->amount_usd : null,
                'amount_cop' => $income->amount_cop !== null ? (float) $income->amount_cop : null,
                'category_code' => null,
                'category_name_en' => null,
                'category_name_es' => null,
                'account_name' => null,
                'comments' => $notes !== '' ? $notes : null,
                'detail_url' => '/income',
                'sort_at' => ($income->updated_at ?? $income->created_at)?->format('Y-m-d H:i:s.u')
                    ?? $date,
            ];
        }

        usort($items, fn (array $a, array $b) => strcmp($b['sort_at'], $a['sort_at']));
        $items = array_slice($items, 0, $limit);

        foreach ($items as &$item) {
            unset($item['sort_at']);
        }
        unset($item);

        return [
            'limit' => $limit,
            'items' => array_values($items),
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
