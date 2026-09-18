<?php

namespace App\Services;

use App\Domain\Collections\CategoryActualCollection;
use App\Domain\Entities\CategoryActualEntity;
use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;

class CategoryActualsService implements CategoryActualsServiceInterface
{
    public function getReport(string $period): CategoryActualCollection
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $categories = Category::active()->orderBy('code')->get();

        /** @var array<int, array{actual: float, count: int}> $aggregates */
        $aggregates = [];

        // Query ledger by period — never hardcoded row references
        $transactions = Transaction::forPeriod($period)->get();

        foreach ($transactions as $transaction) {
            $categoryId = (int) $transaction->category_id;
            $cadEquivalent = $this->transactionToCad($transaction, $exchangeRate);

            if (! isset($aggregates[$categoryId])) {
                $aggregates[$categoryId] = ['actual' => 0.0, 'count' => 0];
            }

            $aggregates[$categoryId]['actual'] += $cadEquivalent;
            $aggregates[$categoryId]['count']++;
        }

        $collection = new CategoryActualCollection;

        foreach ($categories as $category) {
            $stats = $aggregates[$category->id] ?? ['actual' => 0.0, 'count' => 0];

            $collection->add(new CategoryActualEntity(
                categoryId: (int) $category->id,
                categoryCode: (string) $category->code,
                categoryNameEs: (string) $category->name_es,
                categoryNameEn: (string) $category->name_en,
                isDebtCategory: (bool) $category->is_debt_category,
                actualCad: round($stats['actual'], 2),
                transactionCount: $stats['count'],
                isIncomeCategory: (bool) $category->is_income_category,
            ));
        }

        return $collection;
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
