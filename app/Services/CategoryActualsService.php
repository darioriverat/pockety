<?php

namespace App\Services;

use App\Domain\Collections\CategoryActualCollection;
use App\Domain\Entities\CategoryActualEntity;
use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use App\Services\Concerns\ResolvesExchangeRate;

class CategoryActualsService implements CategoryActualsServiceInterface
{
    use ResolvesExchangeRate;

    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    public function getReport(string $period): CategoryActualCollection
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $userId = $this->owner->id();

        /** @var array<int, array{actual: float, count: int}> $aggregates */
        $aggregates = [];

        // Query ledger by period — never hardcoded row references
        $transactions = Transaction::query()
            ->forUser($userId)
            ->forPeriod($period)
            ->get();

        foreach ($transactions as $transaction) {
            $categoryId = (int) $transaction->category_id;
            $cadEquivalent = $this->transactionToCad($transaction, $exchangeRate);

            if (! isset($aggregates[$categoryId])) {
                $aggregates[$categoryId] = ['actual' => 0.0, 'count' => 0];
            }

            $aggregates[$categoryId]['actual'] += $cadEquivalent;
            $aggregates[$categoryId]['count']++;
        }

        // Activity in this month determines inclusion, regardless of active status.
        $categories = Category::query()
            ->forUser($userId)
            ->whereIn('id', array_keys($aggregates))
            ->orderBy('code')
            ->get();
        $collection = new CategoryActualCollection;

        foreach ($categories as $category) {
            $stats = $aggregates[$category->id];

            $collection->add(new CategoryActualEntity(
                categoryId: (int) $category->id,
                categoryCode: (string) $category->code,
                categoryName: (string) $category->name,
                isDebtCategory: (bool) $category->is_debt_category,
                actualCad: round($stats['actual'], 2),
                transactionCount: $stats['count'],
                isIncomeCategory: (bool) $category->is_income_category,
            ));
        }

        return $collection;
    }

    private function transactionToCad(Transaction $transaction, ?ExchangeRate $exchangeRate): float
    {
        $cadEquivalent = 0.0;

        if ($transaction->amount_cad !== null && (float) $transaction->amount_cad != 0) {
            $cadEquivalent += (float) $transaction->amount_cad;
        }

        if ($exchangeRate === null) {
            return $cadEquivalent;
        }

        if ($transaction->amount_usd !== null && (float) $transaction->amount_usd != 0) {
            $cadEquivalent += $exchangeRate->usdToCad((float) $transaction->amount_usd);
        }

        if ($transaction->amount_cop !== null && (float) $transaction->amount_cop != 0) {
            $cadEquivalent += $exchangeRate->copToCad((float) $transaction->amount_cop);
        }

        return $cadEquivalent;
    }
}
