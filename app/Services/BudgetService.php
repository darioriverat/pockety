<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use Illuminate\Support\Collection;

class BudgetService
{
    /**
     * List budgets for a period, optionally filtered by category.
     *
     * @return Collection<int, Budget>
     */
    public function listForPeriod(string $period, ?int $categoryId = null): Collection
    {
        $query = Budget::with('category')
            ->forPeriod($period)
            ->orderBy('category_id');

        if ($categoryId !== null) {
            $query->where('category_id', $categoryId);
        }

        return $query->get();
    }

    /**
     * Create or update a budget for a category and period.
     */
    public function upsert(int $categoryId, string $period, float $amountCad, ?string $notes = null): Budget
    {
        $budget = Budget::updateOrCreate(
            [
                'category_id' => $categoryId,
                'period' => $period,
            ],
            [
                'amount_cad' => $amountCad,
                'notes' => $notes,
            ]
        );

        return $budget->load('category');
    }

    /**
     * Build budget vs actual report for a period.
     *
     * Actuals are computed from transactions (never stored) and converted to CAD
     * using the period's exchange rates.
     *
     * @return array{
     *     period: string,
     *     rows: list<array{
     *         category_id: int,
     *         category_code: string,
     *         category_name_es: string,
     *         category_name_en: string,
     *         budget_cad: float|null,
     *         actual_cad: float,
     *         variance_cad: float|null,
     *         percentage: float|null,
     *         is_over_budget: bool
     *     }>,
     *     totals: array{
     *         budget_cad: float,
     *         actual_cad: float,
     *         variance_cad: float
     *     }
     * }
     */
    public function getBudgetVsActualReport(string $period): array
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $categories = Category::active()->orderBy('code')->get();
        $budgetsByCategory = Budget::forPeriod($period)->get()->keyBy('category_id');
        $actualsByCategory = $this->calculateActualsByCategory($period, $exchangeRate);

        $rows = [];
        $totalBudget = 0.0;
        $totalActual = 0.0;

        foreach ($categories as $category) {
            $budget = $budgetsByCategory->get($category->id);
            $budgetCad = $budget !== null ? (float) $budget->amount_cad : null;
            $actualCad = round($actualsByCategory[$category->id] ?? 0.0, 2);

            $varianceCad = null;
            $percentage = null;
            $isOverBudget = false;

            if ($budgetCad !== null) {
                $varianceCad = round($actualCad - $budgetCad, 2);
                $percentage = $budgetCad > 0
                    ? round(($actualCad / $budgetCad) * 100, 2)
                    : null;
                $isOverBudget = $actualCad > $budgetCad;
                $totalBudget += $budgetCad;
            }

            $totalActual += $actualCad;

            $rows[] = [
                'category_id' => $category->id,
                'category_code' => $category->code,
                'category_name_es' => $category->name_es,
                'category_name_en' => $category->name_en,
                'budget_cad' => $budgetCad,
                'actual_cad' => $actualCad,
                'variance_cad' => $varianceCad,
                'percentage' => $percentage,
                'is_over_budget' => $isOverBudget,
            ];
        }

        return [
            'period' => $period,
            'rows' => $rows,
            'totals' => [
                'budget_cad' => round($totalBudget, 2),
                'actual_cad' => round($totalActual, 2),
                'variance_cad' => round($totalActual - $totalBudget, 2),
            ],
        ];
    }

    /**
     * Sum transaction amounts per category in CAD equivalent.
     *
     * @return array<int, float>
     */
    private function calculateActualsByCategory(string $period, ExchangeRate $exchangeRate): array
    {
        $transactions = Transaction::forPeriod($period)->get();
        $actuals = [];

        foreach ($transactions as $transaction) {
            $categoryId = (int) $transaction->category_id;
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

            $actuals[$categoryId] = ($actuals[$categoryId] ?? 0.0) + $cadEquivalent;
        }

        return $actuals;
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
