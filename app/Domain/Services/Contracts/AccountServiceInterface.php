<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\AccountEntity;

interface AccountServiceInterface
{
    /**
     * Get all active accounts.
     *
     * @return AccountEntity[]
     */
    public function getAllActive(): array;

    /**
     * Get all accounts (including inactive).
     *
     * @return AccountEntity[]
     */
    public function getAll(): array;

    /**
     * Get asset accounts only.
     *
     * @return AccountEntity[]
     */
    public function getAssets(): array;

    /**
     * Get liability accounts only.
     *
     * @return AccountEntity[]
     */
    public function getLiabilities(): array;

    /**
     * Get an account by ID.
     */
    public function getById(int $id): ?AccountEntity;

    /**
     * Create a new account.
     *
     * @param  array{name: string, type: string, primary_currency?: string|null, notes?: string|null}  $data
     */
    public function create(array $data): AccountEntity;

    /**
     * Update an account.
     *
     * @param  array{name?: string, type?: string, primary_currency?: string|null, notes?: string|null, is_active?: bool}  $data
     */
    public function update(int $id, array $data): AccountEntity;

    /**
     * Delete (soft delete) an account.
     */
    public function delete(int $id): bool;
}
