<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
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
        $exchangeRate = ExchangeRate::forPeriod($period);

        // If no exchange rate exists for this period, use defaults or return zeros
        if (! $exchangeRate) {
            Log::warning("No exchange rate found for period {$period}, using defaults");
            $exchangeRate = new ExchangeRate([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }

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
