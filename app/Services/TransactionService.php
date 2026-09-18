<?php

namespace App\Services;

use App\Domain\Collections\TransactionCollection;
use App\Domain\Entities\TransactionEntity;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TransactionService implements TransactionServiceInterface
{
    public const ALLOWED_PER_PAGE = [25, 50, 100];

    public const DEFAULT_PER_PAGE = 50;

    public const ALLOWED_SORT_BY = ['date', 'amount', 'category'];

    public const DEFAULT_SORT_BY = 'date';

    public const DEFAULT_SORT_DIR = 'desc';

    /**
     * Get all transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int|string, category?: string, account_id?: int|string, quincena?: string, currency?: string, is_recurring?: bool|string, search?: mixed, sort_by?: string, sort_dir?: string}  $filters
     * @return TransactionEntity[]
     */
    public function getAll(array $filters = []): array
    {
        $query = $this->buildFilteredQuery($filters);

        if ($query === null) {
            return [];
        }

        $this->applySorting($query, $filters);

        $transactions = $query->get();

        return $transactions->map(function (Transaction $transaction) {
            return $this->toEntity($transaction);
        })->toArray();
    }

    /**
     * Get a paginated page of transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int|string, category?: string, account_id?: int|string, quincena?: string, currency?: string, is_recurring?: bool|string, search?: mixed, sort_by?: string, sort_dir?: string}  $filters
     * @return array{data: TransactionEntity[], total: int, page: int, per_page: int, last_page: int}
     */
    public function getPaginated(array $filters = [], int $page = 1, int $perPage = self::DEFAULT_PER_PAGE): array
    {
        $page = max(1, $page);
        if (! in_array($perPage, self::ALLOWED_PER_PAGE, true)) {
            $perPage = self::DEFAULT_PER_PAGE;
        }

        $query = $this->buildFilteredQuery($filters);

        if ($query === null) {
            return [
                'data' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => 1,
            ];
        }

        $total = (clone $query)->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        if ($page > $lastPage) {
            $page = $lastPage;
        }

        $this->applySorting($query, $filters);

        $transactions = $query
            ->forPage($page, $perPage)
            ->get();

        return [
            'data' => $transactions->map(fn (Transaction $transaction) => $this->toEntity($transaction))->toArray(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
        ];
    }

    /**
     * Apply sort_by / sort_dir from filters onto the query.
     *
     * @param  Builder<Transaction>  $query
     * @param  array{sort_by?: mixed, sort_dir?: mixed}  $filters
     */
    private function applySorting(Builder $query, array $filters): void
    {
        $sortBy = isset($filters['sort_by']) && is_string($filters['sort_by'])
            ? strtolower($filters['sort_by'])
            : self::DEFAULT_SORT_BY;

        if (! in_array($sortBy, self::ALLOWED_SORT_BY, true)) {
            $sortBy = self::DEFAULT_SORT_BY;
        }

        $sortDir = isset($filters['sort_dir']) && is_string($filters['sort_dir'])
            ? strtolower($filters['sort_dir'])
            : self::DEFAULT_SORT_DIR;

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = self::DEFAULT_SORT_DIR;
        }

        match ($sortBy) {
            'amount' => $query->orderByRaw(
                'COALESCE(NULLIF(amount_cad, 0), NULLIF(amount_usd, 0), NULLIF(amount_cop, 0), 0) '.$sortDir
            )->orderBy('id', $sortDir),
            'category' => $query
                ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
                ->select('transactions.*')
                ->orderBy('categories.name_en', $sortDir)
                ->orderBy('categories.code', $sortDir)
                ->orderBy('transactions.id', $sortDir),
            default => $query->orderBy('date', $sortDir)->orderBy('id', $sortDir),
        };
    }

    /**
     * Build a filtered transactions query, or null when filters guarantee no results.
     *
     * @param  array{period?: string, category_id?: int|string, category?: string, account_id?: int|string, quincena?: string, currency?: string, is_recurring?: bool|string, search?: mixed}  $filters
     * @return Builder<Transaction>|null
     */
    private function buildFilteredQuery(array $filters): ?Builder
    {
        $query = Transaction::with(['category', 'account']);

        if (isset($filters['period']) && $filters['period'] !== '') {
            $query->forPeriod($filters['period']);
        }

        if (isset($filters['category_id']) && $filters['category_id'] !== '') {
            $query->forCategory((int) $filters['category_id']);
        } elseif (isset($filters['category']) && $filters['category'] !== '') {
            $categoryId = DB::table('categories')
                ->where('code', $filters['category'])
                ->value('id');

            if ($categoryId === null) {
                return null;
            }

            $query->forCategory((int) $categoryId);
        }

        if (isset($filters['account_id']) && $filters['account_id'] !== '' && $filters['account_id'] !== 0) {
            $query->forAccount((int) $filters['account_id']);
        }

        if (isset($filters['quincena']) && $filters['quincena'] !== '') {
            $query->forQuincena($filters['quincena']);
        }

        if (isset($filters['currency']) && $filters['currency'] !== '') {
            $query->forCurrency(strtolower($filters['currency']));
        }

        if (isset($filters['is_recurring'])) {
            $query->where('is_recurring', filter_var($filters['is_recurring'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['search']) && is_string($filters['search']) && trim($filters['search']) !== '') {
            $search = trim($filters['search']);
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('comments', 'like', '%'.$search.'%')
                    ->orWhereHas('category', function (Builder $categoryQuery) use ($search) {
                        $categoryQuery
                            ->where('code', 'like', '%'.$search.'%')
                            ->orWhere('name_en', 'like', '%'.$search.'%')
                            ->orWhere('name_es', 'like', '%'.$search.'%');
                    });
            });
        }

        return $query;
    }

    /**
     * Get a transaction by its ID.
     */
    public function getById(int $id): ?TransactionEntity
    {
        $transaction = Transaction::with(['category', 'account'])->find($id);

        if (! $transaction) {
            return null;
        }

        return $this->toEntity($transaction);
    }

    /**
     * Create a new transaction.
     *
     * @param  array{date: string, period: string, quincena: string, category_id: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, is_credit?: bool, debt_component?: string|null}  $data
     */
    public function create(array $data): TransactionEntity
    {
        // Validate that only one currency is set
        $this->validateSingleCurrency($data);

        // Validate category exists
        $this->validateCategory($data['category_id']);
        $this->validateIncomeRequiresAccount($data);

        $data['is_credit'] = (bool) ($data['is_credit'] ?? false);

        $transaction = Transaction::create($data);
        $transaction->load(['category', 'account']);

        return $this->toEntity($transaction);
    }

    /**
     * Update an existing transaction.
     *
     * @param  array{date?: string, period?: string, quincena?: string, category_id?: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, is_credit?: bool, debt_component?: string|null}  $data
     */
    public function update(int $id, array $data): TransactionEntity
    {
        $transaction = Transaction::findOrFail($id);

        // Validate that only one currency is set
        $this->validateSingleCurrency($data);

        // Validate category if being updated
        if (isset($data['category_id'])) {
            $this->validateCategory($data['category_id']);
        }

        $this->validateIncomeRequiresAccount($data, $transaction);

        if (array_key_exists('is_credit', $data)) {
            $data['is_credit'] = (bool) $data['is_credit'];
        }

        $transaction->update($data);
        $transaction->load(['category', 'account']);

        return $this->toEntity($transaction);
    }

    /**
     * Delete a transaction.
     */
    public function delete(int $id): bool
    {
        $transaction = Transaction::findOrFail($id);

        return $transaction->delete();
    }

    /**
     * Bulk-update multiple transactions.
     *
     * @param  list<int>  $ids
     * @param  array{category_id?: int, account_id?: int|null, is_recurring?: bool}  $data
     */
    public function bulkUpdate(array $ids, array $data): TransactionCollection
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        $collection = new TransactionCollection;

        if ($ids === []) {
            return $collection;
        }

        $allowed = array_intersect_key($data, array_flip([
            'category_id',
            'account_id',
            'is_recurring',
        ]));

        if ($allowed === []) {
            throw new \InvalidArgumentException('No bulk-updatable fields provided');
        }

        if (isset($allowed['category_id'])) {
            $this->validateCategory((int) $allowed['category_id']);
            $this->validateBulkIncomeRequiresAccount($ids, $allowed);
        }

        DB::transaction(function () use ($ids, $allowed) {
            Transaction::query()
                ->whereIn('id', $ids)
                ->update($allowed);
        });

        $transactions = Transaction::query()
            ->with(['category', 'account'])
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->get();

        foreach ($transactions as $transaction) {
            $collection->add($this->toEntity($transaction));
        }

        return $collection;
    }

    /**
     * Duplicate an existing transaction.
     *
     * @param  array{date?: string, period?: string, quincena?: string}  $overrides
     */
    public function duplicate(int $id, array $overrides = []): TransactionEntity
    {
        $source = Transaction::query()->findOrFail($id);

        $data = [
            'date' => $overrides['date'] ?? $source->date,
            'period' => $overrides['period'] ?? $source->period,
            'quincena' => $overrides['quincena'] ?? $source->quincena,
            'category_id' => $source->category_id,
            'account_id' => $source->account_id,
            'amount_cad' => $source->amount_cad,
            'amount_usd' => $source->amount_usd,
            'amount_cop' => $source->amount_cop,
            'comments' => $source->comments,
            'is_recurring' => $source->is_recurring,
            'is_credit' => (bool) $source->is_credit,
            'debt_component' => $source->debt_component,
        ];

        return $this->create($data);
    }

    /**
     * Get transactions for a specific period.
     */
    public function getForPeriod(string $period): array
    {
        return $this->getAll(['period' => $period]);
    }

    /**
     * Get transactions for a specific account and period, applying roll-forward rules.
     *
     * @param  Account  $account
     * @param  string  $period
     * @return TransactionEntity[]
     */
    public function getRollForwardTransactionsForAccount(Account $account, string $period): array
    {
        $transactions = Transaction::where('account_id', $account->id)
            ->where('period', $period)
            ->with('category')
            ->get();

        $isLiability = $account->isLiability();

        $transactionEntities = [];

        foreach ($transactions as $transaction) {
            $category = $transaction->category;

            // Asset accounts omit debts from the roll-forward.
            if (
                ! $isLiability
                && $category?->is_debt_category
            ) {
                continue;
            }

            // Liabilities omit interest charges from the roll-forward.
            if (
                $isLiability
                && $category?->is_debt_category
                && ! $transaction->isPrincipal()
            ) {
                continue;
            }

            $transactionEntities[] = $this->toEntity($transaction);
        }

        return $transactionEntities;
    }

    /**
     * Sum the amounts of roll-forward transactions for a specific account and period.
     */
    public function sumRollForwardAmountsForAccount(Account $account, string $period): array
    {
        $transactions = $this->getRollForwardTransactionsForAccount($account, $period);

        $isLiability = $account->isLiability();
        $computedCad = 0.0;
        $computedUsd = 0.0;
        $computedCop = 0.0;

        foreach ($transactions as $transaction) {
            $sign = $transaction->balanceSign($isLiability);
            $computedCad += $sign * (float) ($transaction->amountCad ?? 0);
            $computedUsd += $sign * (float) ($transaction->amountUsd ?? 0);
            $computedCop += $sign * (float) ($transaction->amountCop ?? 0);
        }

        return [
            'cad' => $computedCad,
            'usd' => $computedUsd,
            'cop' => $computedCop,
        ];
    }

    /**
     * Get transactions for a specific category.
     */
    public function getForCategory(int $categoryId): array
    {
        return $this->getAll(['category_id' => $categoryId]);
    }

    /**
     * Convert a Transaction model to a TransactionEntity.
     */
    private function toEntity(Transaction $transaction): TransactionEntity
    {
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

        if ($transaction->relationLoaded('category') && $transaction->category) {
            $data['category'] = [
                'id' => $transaction->category->id,
                'code' => $transaction->category->code,
                'name_es' => $transaction->category->name_es,
                'name_en' => $transaction->category->name_en,
                'is_debt_category' => $transaction->category->is_debt_category,
                'is_income_category' => (bool) $transaction->category->is_income_category,
                'is_active' => $transaction->category->is_active,
                'status' => $transaction->category->status,
            ];
        }

        if ($transaction->relationLoaded('account') && $transaction->account) {
            $data['account'] = [
                'id' => $transaction->account->id,
                'name' => $transaction->account->name,
                'type' => $transaction->account->type,
            ];
        }

        return TransactionEntity::fromArray($data);
    }

    /**
     * Validate that only one currency amount is set.
     *
     * @param  array{amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null}  $data
     *
     * @throws \InvalidArgumentException
     */
    private function validateSingleCurrency(array $data): void
    {
        $currencies = [];

        if (isset($data['amount_cad']) && $data['amount_cad'] !== null && $data['amount_cad'] != 0) {
            $currencies[] = 'CAD';
        }
        if (isset($data['amount_usd']) && $data['amount_usd'] !== null && $data['amount_usd'] != 0) {
            $currencies[] = 'USD';
        }
        if (isset($data['amount_cop']) && $data['amount_cop'] !== null && $data['amount_cop'] != 0) {
            $currencies[] = 'COP';
        }

        if (count($currencies) === 0) {
            throw new \InvalidArgumentException('At least one currency amount must be provided');
        }

        if (count($currencies) > 1) {
            throw new \InvalidArgumentException('Only one currency amount can be provided per transaction');
        }
    }

    /**
     * Validate that the category exists.
     *
     * @throws \InvalidArgumentException
     */
    private function validateCategory(int $categoryId): void
    {
        $exists = DB::table('categories')->where('id', $categoryId)->exists();

        if (! $exists) {
            throw new \InvalidArgumentException("Category with ID {$categoryId} does not exist");
        }
    }

    /**
     * Income-category transactions must be assigned to the account that received the deposit.
     *
     * @param  array{category_id?: int, account_id?: int|null}  $data
     *
     * @throws \InvalidArgumentException
     */
    private function validateIncomeRequiresAccount(array $data, ?Transaction $existing = null): void
    {
        $categoryId = $data['category_id'] ?? $existing?->category_id;
        if (! $categoryId) {
            return;
        }

        $category = Category::find($categoryId);
        if (! $category?->is_income_category) {
            return;
        }

        $accountId = array_key_exists('account_id', $data)
            ? $data['account_id']
            : $existing?->account_id;

        if ($accountId === null) {
            throw new \InvalidArgumentException('Income transactions must be assigned to a deposit account.');
        }
    }

    /**
     * @param  list<int>  $ids
     * @param  array{category_id?: int, account_id?: int|null}  $allowed
     *
     * @throws \InvalidArgumentException
     */
    private function validateBulkIncomeRequiresAccount(array $ids, array $allowed): void
    {
        $category = Category::find($allowed['category_id'] ?? null);
        if (! $category?->is_income_category) {
            return;
        }

        $transactions = Transaction::query()->whereIn('id', $ids)->get();
        foreach ($transactions as $transaction) {
            $accountId = array_key_exists('account_id', $allowed)
                ? $allowed['account_id']
                : $transaction->account_id;

            if ($accountId === null) {
                throw new \InvalidArgumentException('Income transactions must be assigned to a deposit account.');
            }
        }
    }
}
