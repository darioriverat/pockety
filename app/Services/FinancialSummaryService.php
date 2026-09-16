<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;

class FinancialSummaryService
{
    public const DEPRECIATION_CATEGORY_CODE = 'C045';

    public const DEBT_PAYMENT_CATEGORY_CODES = [
        'C009',
        'C010',
        'C027',
        'C038',
        'C039',
        'C044',
        'C046',
    ];

    /**
     * Build financial summary for a period.
     *
     * Total Recorded Disbursements (Gasto Total): sum of every expense category
     * total for the month, including debt/credit-card payment categories.
     *
     * Net Operating Expenses (Gasto Real): Total Recorded Disbursements
     * minus debt PRINCIPAL payments minus depreciation (C045).
     * Debt INTEREST remains included.
     *
     * @return array{
     *     period: string,
     *     total_income_cad: float,
     *     total_recorded_disbursements_cad: float,
     *     net_operating_expenses_cad: float,
     *     net_cad: float,
     *     debt_principal_excluded_cad: float,
     *     depreciation_excluded_cad: float,
     *     debt_interest_included_cad: float,
     *     income_lines: list<array{
     *         id: int,
     *         description: string,
     *         line_number: int,
     *         amount_cad: float,
     *         amount_usd: float,
     *         amount_cop: float,
     *         total_cad_equivalent: float
     *     }>,
     *     category_totals: list<array{
     *         category_id: int,
     *         category_code: string,
     *         category_name_es: string,
     *         category_name_en: string,
     *         is_debt_category: bool,
     *         is_depreciation: bool,
     *         total_cad: float,
     *         principal_cad: float,
     *         interest_cad: float,
     *         other_cad: float
     *     }>
     * }
     */
    public function getSummary(string $period): array
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $incomeLines = $this->buildIncomeLines($period, $exchangeRate);
        $totalIncome = 0.0;
        foreach ($incomeLines as $line) {
            $totalIncome += $line['total_cad_equivalent'];
        }
        $totalIncome = round($totalIncome, 2);

        $categories = Category::active()->orderBy('code')->get()->keyBy('id');
        $transactions = Transaction::forPeriod($period)->with('category')->get();

        $totalsByCategory = [];

        foreach ($categories as $category) {
            $totalsByCategory[$category->id] = [
                'category_id' => $category->id,
                'category_code' => $category->code,
                'category_name_es' => $category->name_es,
                'category_name_en' => $category->name_en,
                'is_debt_category' => (bool) $category->is_debt_category,
                'is_depreciation' => $category->code === self::DEPRECIATION_CATEGORY_CODE,
                'total_cad' => 0.0,
                'principal_cad' => 0.0,
                'interest_cad' => 0.0,
                'other_cad' => 0.0,
            ];
        }

        foreach ($transactions as $transaction) {
            $categoryId = (int) $transaction->category_id;

            if (! isset($totalsByCategory[$categoryId])) {
                $category = $transaction->category;
                if ($category === null) {
                    continue;
                }

                $totalsByCategory[$categoryId] = [
                    'category_id' => $category->id,
                    'category_code' => $category->code,
                    'category_name_es' => $category->name_es,
                    'category_name_en' => $category->name_en,
                    'is_debt_category' => (bool) $category->is_debt_category,
                    'is_depreciation' => $category->code === self::DEPRECIATION_CATEGORY_CODE,
                    'total_cad' => 0.0,
                    'principal_cad' => 0.0,
                    'interest_cad' => 0.0,
                    'other_cad' => 0.0,
                ];
            }

            $cadEquivalent = $this->transactionCadEquivalent($transaction, $exchangeRate);
            $totalsByCategory[$categoryId]['total_cad'] += $cadEquivalent;

            if ($transaction->debt_component === 'principal') {
                $totalsByCategory[$categoryId]['principal_cad'] += $cadEquivalent;
            } elseif ($transaction->debt_component === 'interest') {
                $totalsByCategory[$categoryId]['interest_cad'] += $cadEquivalent;
            } else {
                $totalsByCategory[$categoryId]['other_cad'] += $cadEquivalent;
            }
        }

        $categoryTotals = [];
        $totalRecordedDisbursements = 0.0;
        $debtPrincipalExcluded = 0.0;
        $depreciationExcluded = 0.0;
        $debtInterestIncluded = 0.0;

        foreach ($totalsByCategory as $row) {
            $row['total_cad'] = round($row['total_cad'], 2);
            $row['principal_cad'] = round($row['principal_cad'], 2);
            $row['interest_cad'] = round($row['interest_cad'], 2);
            $row['other_cad'] = round($row['other_cad'], 2);

            $totalRecordedDisbursements += $row['total_cad'];
            $debtPrincipalExcluded += $row['principal_cad'];
            $debtInterestIncluded += $row['interest_cad'];

            if ($row['is_depreciation']) {
                $depreciationExcluded += $row['total_cad'];
            }

            $categoryTotals[] = $row;
        }

        usort(
            $categoryTotals,
            fn (array $a, array $b): int => strcmp($a['category_code'], $b['category_code'])
        );

        $netOperatingExpenses = $totalRecordedDisbursements
            - $debtPrincipalExcluded
            - $depreciationExcluded;
        $netOperatingExpenses = round($netOperatingExpenses, 2);

        return [
            'period' => $period,
            'total_income_cad' => $totalIncome,
            'total_recorded_disbursements_cad' => round($totalRecordedDisbursements, 2),
            'net_operating_expenses_cad' => $netOperatingExpenses,
            'net_cad' => round($totalIncome - $netOperatingExpenses, 2),
            'debt_principal_excluded_cad' => round($debtPrincipalExcluded, 2),
            'depreciation_excluded_cad' => round($depreciationExcluded, 2),
            'debt_interest_included_cad' => round($debtInterestIncluded, 2),
            'income_lines' => $incomeLines,
            'category_totals' => $categoryTotals,
        ];
    }

    /**
     * @return list<array{
     *     id: int,
     *     description: string,
     *     line_number: int,
     *     amount_cad: float,
     *     amount_usd: float,
     *     amount_cop: float,
     *     total_cad_equivalent: float
     * }>
     */
    private function buildIncomeLines(string $period, ExchangeRate $exchangeRate): array
    {
        $lines = [];

        foreach (
            Income::forPeriod($period)
                ->orderBy('line_number')
                ->orderBy('id')
                ->get() as $income
        ) {
            $lines[] = [
                'id' => (int) $income->id,
                'description' => (string) $income->description,
                'line_number' => (int) $income->line_number,
                'amount_cad' => (float) $income->amount_cad,
                'amount_usd' => (float) $income->amount_usd,
                'amount_cop' => (float) $income->amount_cop,
                'total_cad_equivalent' => round(
                    $income->getTotalCadEquivalent($exchangeRate),
                    2
                ),
            ];
        }

        return $lines;
    }

    private function transactionCadEquivalent(Transaction $transaction, ExchangeRate $exchangeRate): float
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

    private function resolveExchangeRate(string $period): ExchangeRate
    {
        return ExchangeRate::forPeriod($period) ?? new ExchangeRate([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }
}
