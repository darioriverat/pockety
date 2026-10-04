<?php

namespace App\Services;

use App\Domain\Entities\CategoryEntity;
use App\Domain\Entities\TransactionEntity;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Category;
use App\Models\Transaction;

class CategoryService implements CategoryServiceInterface
{
    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    /**
     * Get all active categories.
     *
     * @return CategoryEntity[]
     */
    public function getAllActive(): array
    {
        $categories = $this->ownedCategories()
            ->active()
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
        $categories = $this->ownedCategories()
            ->orderBy('code')
            ->get();

        return $categories->map(fn (Category $category) => $this->toEntity($category))->all();
    }

    /**
     * Get a category by its code.
     */
    public function getByCode(string $code): ?CategoryEntity
    {
        $category = $this->findOwnedByCode($code);

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
        $categories = $this->ownedCategories()
            ->debtCategories()
            ->active()
            ->orderBy('code')
            ->get();

        return $categories->map(fn (Category $category) => $this->toEntity($category))->all();
    }

    /**
     * Delete a category by its code.
     * Returns true if deleted successfully, false if category has transactions or budgets.
     *
     * @throws \Exception if category not found
     */
    public function delete(string $code): bool
    {
        $category = $this->findOwnedByCode($code);

        if (! $category) {
            throw new \Exception("Category with code {$code} not found");
        }

        if ($category->transactions()->exists()) {
            return false;
        }

        if ($category->budgets()->exists()) {
            return false;
        }

        $category->delete();

        return true;
    }

    /**
     * Check if a category has associated transactions.
     */
    public function hasTransactions(string $code): bool
    {
        $category = $this->findOwnedByCode($code);

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
        $category = $this->findOwnedByCode($code);

        if (! $category) {
            return null;
        }

        $categoryEntity = $this->toEntity($category);
        $userId = $this->owner->id();

        /** @var list<string> $availablePeriods */
        $availablePeriods = Transaction::query()
            ->forUser($userId)
            ->where('category_id', $category->id)
            ->distinct()
            ->orderByDesc('period')
            ->pluck('period')
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();

        $query = Transaction::query()
            ->with('account')
            ->forUser($userId)
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
                'category_id' => $transaction->category_id,
                'account_id' => $transaction->account_id,
                'amount_cad' => $transaction->amount_cad !== null ? (float) $transaction->amount_cad : null,
                'amount_usd' => $transaction->amount_usd !== null ? (float) $transaction->amount_usd : null,
                'amount_cop' => $transaction->amount_cop !== null ? (float) $transaction->amount_cop : null,
                'comments' => $transaction->comments,
                'is_recurring' => $transaction->is_recurring,
                'is_credit' => (bool) $transaction->is_credit,
                'is_debt_payment' => (bool) $transaction->is_debt_payment,
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

    /**
     * Create a new category.
     * Server assigns code unique for the user: C### for expense/debt, I## for income.
     *
     * @throws \InvalidArgumentException if both flags are true
     */
    public function create(
        string $name,
        bool $isDebtCategory,
        bool $isIncomeCategory
    ): CategoryEntity {
        if ($isDebtCategory && $isIncomeCategory) {
            throw new \InvalidArgumentException('A category cannot be both debt and income');
        }

        $name = trim($name);
        if ($name === '') {
            throw new \InvalidArgumentException('Category name cannot be empty');
        }

        $userId = $this->owner->id();
        $code = $this->generateNextCode($isIncomeCategory, $userId);

        $category = Category::create([
            'user_id' => $userId,
            'code' => $code,
            'name' => $name,
            'is_debt_category' => $isDebtCategory,
            'is_income_category' => $isIncomeCategory,
            'is_active' => true,
            'status' => null,
        ]);

        return $this->toEntity($category);
    }

    /**
     * Update an existing category.
     * Returns null if category not found.
     *
     * @throws \InvalidArgumentException if both debt and income flags would be true
     * @throws \RuntimeException if attempting to change debt/income flags when transactions exist
     */
    public function update(
        string $code,
        ?string $name = null,
        ?bool $isDebtCategory = null,
        ?bool $isIncomeCategory = null,
        ?bool $isActive = null
    ): ?CategoryEntity {
        $category = $this->findOwnedByCode($code);

        if (! $category) {
            return null;
        }

        $updates = [];

        if ($name !== null) {
            $trimmed = trim($name);
            if ($trimmed === '') {
                throw new \InvalidArgumentException('Category name cannot be empty');
            }
            $updates['name'] = $trimmed;
        }

        $finalIsDebt = $isDebtCategory ?? $category->is_debt_category;
        $finalIsIncome = $isIncomeCategory ?? $category->is_income_category;

        if ($finalIsDebt && $finalIsIncome) {
            throw new \InvalidArgumentException('A category cannot be both debt and income');
        }

        $debtChanging = $isDebtCategory !== null && $isDebtCategory !== $category->is_debt_category;
        $incomeChanging = $isIncomeCategory !== null && $isIncomeCategory !== $category->is_income_category;

        if (($debtChanging || $incomeChanging) && $category->transactions()->exists()) {
            throw new \RuntimeException(
                'Debt and income settings cannot be changed because this category has transactions'
            );
        }

        if ($isDebtCategory !== null) {
            $updates['is_debt_category'] = $isDebtCategory;
        }

        if ($isIncomeCategory !== null) {
            $updates['is_income_category'] = $isIncomeCategory;
        }

        if ($isActive !== null) {
            $updates['is_active'] = $isActive;
        }

        if (! empty($updates)) {
            $category->update($updates);
            $category->refresh();
        }

        return $this->toEntity($category);
    }

    /**
     * Check if a category has associated budgets.
     */
    public function hasBudgets(string $code): bool
    {
        $category = $this->findOwnedByCode($code);

        if (! $category) {
            return false;
        }

        return $category->budgets()->exists();
    }

    /**
     * Generate the next available code for a category for one user.
     */
    private function generateNextCode(bool $isIncome, int $userId): string
    {
        if ($isIncome) {
            $lastIncomeCode = Category::query()
                ->forUser($userId)
                ->where('code', 'LIKE', 'I%')
                ->orderByRaw('CAST(SUBSTRING(code, 2) AS UNSIGNED) DESC')
                ->value('code');

            if (! $lastIncomeCode) {
                return 'I01';
            }

            $number = (int) substr($lastIncomeCode, 1);

            return 'I'.str_pad((string) ($number + 1), 2, '0', STR_PAD_LEFT);
        }

        $lastCCode = Category::query()
            ->forUser($userId)
            ->where('code', 'LIKE', 'C%')
            ->orderByRaw('CAST(SUBSTRING(code, 2) AS UNSIGNED) DESC')
            ->value('code');

        if (! $lastCCode) {
            return 'C001';
        }

        $number = (int) substr($lastCCode, 1);

        return 'C'.str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
    }

    private function ownedCategories()
    {
        return Category::query()->forUser($this->owner->id());
    }

    private function findOwnedByCode(string $code): ?Category
    {
        return $this->ownedCategories()->where('code', $code)->first();
    }

    private function toEntity(Category $category): CategoryEntity
    {
        return new CategoryEntity(
            id: $category->id,
            code: $category->code,
            name: $category->name,
            isDebtCategory: (bool) $category->is_debt_category,
            isActive: (bool) $category->is_active,
            status: $category->status,
            isIncomeCategory: (bool) $category->is_income_category,
        );
    }
}
