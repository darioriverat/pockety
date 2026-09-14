<?php

namespace App\Services;

use App\Domain\Entities\AccountEntity;
use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Models\Account;
use Illuminate\Database\Eloquent\Collection;

class AccountService implements AccountServiceInterface
{
    /**
     * Get all active accounts.
     *
     * @return AccountEntity[]
     */
    public function getAllActive(): array
    {
        $accounts = Account::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return $this->mapToEntities($accounts);
    }

    /**
     * Get all accounts (including inactive).
     *
     * @return AccountEntity[]
     */
    public function getAll(): array
    {
        $accounts = Account::orderBy('type')
            ->orderBy('name')
            ->get();

        return $this->mapToEntities($accounts);
    }

    /**
     * Get asset accounts only.
     *
     * @return AccountEntity[]
     */
    public function getAssets(): array
    {
        $accounts = Account::assets()
            ->active()
            ->orderBy('name')
            ->get();

        return $this->mapToEntities($accounts);
    }

    /**
     * Get liability accounts only.
     *
     * @return AccountEntity[]
     */
    public function getLiabilities(): array
    {
        $accounts = Account::liabilities()
            ->active()
            ->orderBy('name')
            ->get();

        return $this->mapToEntities($accounts);
    }

    /**
     * Get an account by ID.
     */
    public function getById(int $id): ?AccountEntity
    {
        $account = Account::find($id);

        if (! $account) {
            return null;
        }

        return $this->mapToEntity($account);
    }

    /**
     * Create a new account.
     *
     * @param  array{name: string, type: string, primary_currency?: string|null, notes?: string|null}  $data
     */
    public function create(array $data): AccountEntity
    {
        $account = Account::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'primary_currency' => $data['primary_currency'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => true,
        ]);

        return $this->mapToEntity($account);
    }

    /**
     * Update an account.
     *
     * @param  array{name?: string, type?: string, primary_currency?: string|null, notes?: string|null, is_active?: bool}  $data
     */
    public function update(int $id, array $data): AccountEntity
    {
        $account = Account::findOrFail($id);
        $account->update($data);

        return $this->mapToEntity($account->fresh());
    }

    /**
     * Delete (soft delete) an account.
     */
    public function delete(int $id): bool
    {
        $account = Account::findOrFail($id);
        $account->is_active = false;
        $account->save();

        return true;
    }

    /**
     * Map a single Account model to AccountEntity.
     */
    private function mapToEntity(Account $account): AccountEntity
    {
        return new AccountEntity(
            id: $account->id,
            name: $account->name,
            type: $account->type,
            primaryCurrency: $account->primary_currency,
            notes: $account->notes,
            isActive: $account->is_active,
            createdAt: $account->created_at->toIso8601String(),
            updatedAt: $account->updated_at->toIso8601String(),
        );
    }

    /**
     * Map a collection of Account models to AccountEntity array.
     *
     * @param  Collection<int, Account>  $accounts
     * @return AccountEntity[]
     */
    private function mapToEntities($accounts): array
    {
        return $accounts->map(fn (Account $account) => $this->mapToEntity($account))->all();
    }
}
