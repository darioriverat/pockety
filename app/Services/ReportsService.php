<?php

namespace App\Services;

use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
use Carbon\Carbon;

class ReportsService
{
    /**
     * Get year-to-date totals for income and expenses.
     *
     * @return array{
     *     year: int,
     *     from_period: string,
     *     to_period: string,
     *     ytd_income_cad: float,
     *     ytd_expenses_cad: float,
     *     ytd_net_cad: float,
     *     period_count: int,
     * }
     */
    public function getYearToDateTotals(int $year): array
    {
        // Calculate period range for the year
        $fromPeriod = $year.'01';
        $toPeriod = $year.'12';

        // Get current year-month to limit the range if we're in the same year
        $now = Carbon::now();
        if ($year == $now->year) {
            $toPeriod = $now->format('Ym');
        }

        $totalIncome = 0.0;
        $totalExpenses = 0.0;
        $periodCount = 0;

        // Iterate through each month in the range
        $start = Carbon::createFromFormat('Ym', $fromPeriod);
        $end = Carbon::createFromFormat('Ym', $toPeriod);

        while ($start->lessThanOrEqualTo($end)) {
            $period = $start->format('Ym');

            // Get exchange rate for this period
            $exchangeRate = $this->resolveExchangeRate($period);

            // Calculate income for this period
            $totalIncome += $this->calculateTotalIncome($period, $exchangeRate);

            // Calculate expenses for this period
            $totalExpenses += $this->calculateTotalExpenses($period, $exchangeRate);

            $periodCount++;
            $start->addMonth();
        }

        $net = $totalIncome - $totalExpenses;

        return [
            'year' => $year,
            'from_period' => $fromPeriod,
            'to_period' => $toPeriod,
            'ytd_income_cad' => round($totalIncome, 2) + 0.0,
            'ytd_expenses_cad' => round($totalExpenses, 2) + 0.0,
            'ytd_net_cad' => round($net, 2) + 0.0,
            'period_count' => $periodCount,
        ];
    }

    private function resolveExchangeRate(string $period): ExchangeRate
    {
        $exchangeRate = ExchangeRate::forPeriod($period);

        if (! $exchangeRate) {
            return new ExchangeRate([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }

        return $exchangeRate;
    }

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
}
