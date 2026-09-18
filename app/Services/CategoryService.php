<?php

namespace App\Services;

use App\Domain\Entities\CategoryEntity;
use App\Domain\Entities\TransactionEntity;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Models\Category;
use App\Models\Transaction;

class CategoryService implements CategoryServiceInterface
{
    /**
     * Get all active categories.
     *
     * @return CategoryEntity[]
     */
    public function getAllActive(): array
    {
        $categories = Category::active()
            ->orderBy('code')
            ->get();

        return $categories->map(fn (Category $category) => $this->toEntity($category))->all();
    }

    /**
     * Get all categories (including inactive).
     *
     * @return CategoryEntity[]
     */
    public function getAll(): array
    {
        $categories = Category::orderBy('code')->get();

        return $categories->map(fn (Category $category) => $this->toEntity($category))->all();
    }

    /**
     * Get a category by its code.
     */
    public function getByCode(string $code): ?CategoryEntity
    {
        $category = Category::where('code', $code)->first();

        if (! $category) {
            return null;
        }

        return $this->toEntity($category);
    }

    /**
     * Get all debt categories.
     *
     * @return CategoryEntity[]
     */
    public function getDebtCategories(): array
    {
        $categories = Category::debtCategories()
            ->active()
            ->orderBy('code')
            ->get();

        return $categories->map(fn (Category $category) => $this->toEntity($category))->all();
    }

    /**
     * Delete a category by its code.
     * Returns true if deleted successfully, false if category has transactions.
     *
     * @throws \Exception if category not found
     */
    public function delete(string $code): bool
    {
        $category = Category::where('code', $code)->first();

        if (! $category) {
            throw new \Exception("Category with code {$code} not found");
        }

        // Check if category has associated transactions
        if ($category->transactions()->exists()) {
            return false;
        }

        // Safe to delete
        $category->delete();

        return true;
    }

    /**
     * Check if a category has associated transactions.
     */
    public function hasTransactions(string $code): bool
    {
        $category = Category::where('code', $code)->first();

        if (! $category) {
            return false;
        }

        return $category->transactions()->exists();
    }

    /**
     * Get transaction history for a category, optionally filtered by period.
     *
     * @return array{
     *     category: CategoryEntity,
     *     transactions: list<TransactionEntity>,
     *     meta: array{
     *         total_spending_cad: float,
     *         total_spending_usd: float,
     *         total_spending_cop: float,
     *         total_count: int,
     *         period_count: int,
     *         average_per_period_cad: float,
     *         available_periods: list<string>,
     *         is_filtered: bool,
     *         filters: array{period: string|null}
     *     }
     * }|null
     */
    public function getTransactionHistory(string $code, ?string $period = null): ?array
    {
        $category = Category::where('code', $code)->first();

        if (! $category) {
            return null;
        }

        $categoryEntity = $this->toEntity($category);

        /** @var list<string> $availablePeriods */
        $availablePeriods = Transaction::query()
            ->where('category_id', $category->id)
            ->distinct()
            ->orderByDesc('period')
            ->pluck('period')
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();

        $query = Transaction::query()
            ->with('account')
            ->where('category_id', $category->id)
            ->orderByDesc('date')
            ->orderByDesc('id');

        $isFiltered = $period !== null && $period !== '';
        if ($isFiltered) {
            $query->where('period', $period);
        }

        $transactions = $query->get();

        $totalCad = 0.0;
        $totalUsd = 0.0;
        $totalCop = 0.0;
        $periodsInResult = [];
        $entities = [];

        foreach ($transactions as $transaction) {
            $totalCad += (float) ($transaction->amount_cad ?? 0);
            $totalUsd += (float) ($transaction->amount_usd ?? 0);
            $totalCop += (float) ($transaction->amount_cop ?? 0);
            $periodsInResult[$transaction->period] = true;

            $data = [
                'id' => $transaction->id,
                'date' => $transaction->date,
                'period' => $transaction->period,
                'quincena' => $transaction->quincena,
                'category_id' => $transaction->category_id,
                'account_id' => $transaction->account_id,
                'amount_cad' => $transaction->amount_cad !== null ? (float) $transaction->amount_cad : null,
                'amount_usd' => $transaction->amount_usd !== null ? (float) $transaction->amount_usd : null,
                'amount_cop' => $transaction->amount_cop !== null ? (float) $transaction->amount_cop : null,
                'comments' => $transaction->comments,
                'is_recurring' => $transaction->is_recurring,
                'is_credit' => (bool) $transaction->is_credit,
                'debt_component' => $transaction->debt_component,
            ];

            if ($transaction->relationLoaded('account') && $transaction->account) {
                $data['account'] = [
                    'id' => $transaction->account->id,
                    'name' => $transaction->account->name,
                    'type' => $transaction->account->type,
                ];
            }

            $entities[] = TransactionEntity::fromArray($data);
        }

        $periodCount = count($periodsInResult);
        $totalCad = round($totalCad, 2);
        $averagePerPeriodCad = $periodCount > 0
            ? round($totalCad / $periodCount, 2)
            : 0.0;

        return [
            'category' => $categoryEntity,
            'transactions' => $entities,
            'meta' => [
                'total_spending_cad' => $totalCad,
                'total_spending_usd' => round($totalUsd, 2),
                'total_spending_cop' => round($totalCop, 2),
                'total_count' => count($entities),
                'period_count' => $periodCount,
                'average_per_period_cad' => $averagePerPeriodCad,
                'available_periods' => $availablePeriods,
                'is_filtered' => $isFiltered,
                'filters' => [
                    'period' => $isFiltered ? $period : null,
                ],
            ],
        ];
    }

    private function toEntity(Category $category): CategoryEntity
    {
        return new CategoryEntity(
            id: $category->id,
            code: $category->code,
            nameEs: $category->name_es,
            nameEn: $category->name_en,
            isDebtCategory: (bool) $category->is_debt_category,
            isActive: (bool) $category->is_active,
            status: $category->status,
            isIncomeCategory: (bool) $category->is_income_category,
        );
    }
}
