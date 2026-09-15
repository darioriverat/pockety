<?php

namespace App\Services;

use App\Domain\Entities\TransactionEntity;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class TransactionService implements TransactionServiceInterface
{
    /**
     * Get all transactions with optional filtering.
     *
     * @param  array{period?: string, category_id?: int, account_id?: int, quincena?: string, currency?: string, is_recurring?: bool}  $filters
     * @return TransactionEntity[]
     */
    public function getAll(array $filters = []): array
    {
        $query = Transaction::with(['category', 'account']);

        // Apply filters
        if (isset($filters['period'])) {
            $query->forPeriod($filters['period']);
        }

        if (isset($filters['category_id'])) {
            $query->forCategory($filters['category_id']);
        }

        if (isset($filters['account_id'])) {
            $query->forAccount($filters['account_id']);
        }

        if (isset($filters['quincena'])) {
            $query->forQuincena($filters['quincena']);
        }

        if (isset($filters['currency'])) {
            $query->forCurrency(strtolower($filters['currency']));
        }

        if (isset($filters['is_recurring'])) {
            $query->where('is_recurring', (bool) $filters['is_recurring']);
        }

        $transactions = $query->orderBy('date', 'desc')->get();

        return $transactions->map(function ($transaction) {
            return $this->toEntity($transaction);
        })->toArray();
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
     * @param  array{date: string, period: string, quincena: string, category_id: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, debt_component?: string|null}  $data
     */
    public function create(array $data): TransactionEntity
    {
        // Validate that only one currency is set
        $this->validateSingleCurrency($data);

        // Validate category exists
        $this->validateCategory($data['category_id']);

        $transaction = Transaction::create($data);
        $transaction->load(['category', 'account']);

        return $this->toEntity($transaction);
    }

    /**
     * Update an existing transaction.
     *
     * @param  array{date?: string, period?: string, quincena?: string, category_id?: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, debt_component?: string|null}  $data
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
     * Get transactions for a specific period.
     */
    public function getForPeriod(string $period): array
    {
        return $this->getAll(['period' => $period]);
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
            'debt_component' => $transaction->debt_component,
        ];

        if ($transaction->relationLoaded('category') && $transaction->category) {
            $data['category'] = [
                'id' => $transaction->category->id,
                'code' => $transaction->category->code,
                'name_es' => $transaction->category->name_es,
                'name_en' => $transaction->category->name_en,
                'is_debt_category' => $transaction->category->is_debt_category,
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
}
