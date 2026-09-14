<?php

namespace App\Domain\Entities;

readonly class AccountEntity
{
    public function __construct(
        public int $id,
        public string $name,
        public string $type,
        public ?string $primaryCurrency,
        public ?string $notes,
        public bool $isActive,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    /**
     * Create from array (useful for batch creation).
     *
     * @param  array{id: int, name: string, type: string, primary_currency: string|null, notes: string|null, is_active: bool, created_at: string, updated_at: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            type: $data['type'],
            primaryCurrency: $data['primary_currency'] ?? null,
            notes: $data['notes'] ?? null,
            isActive: $data['is_active'],
            createdAt: $data['created_at'],
            updatedAt: $data['updated_at'],
        );
    }

    /**
     * Convert to array for JSON serialization.
     *
     * @return array{id: int, name: string, type: string, primary_currency: string|null, notes: string|null, is_active: bool, is_asset: bool, is_liability: bool, created_at: string, updated_at: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'primary_currency' => $this->primaryCurrency,
            'notes' => $this->notes,
            'is_active' => $this->isActive,
            'is_asset' => $this->isAsset(),
            'is_liability' => $this->isLiability(),
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    /**
     * Check if account is an asset.
     */
    public function isAsset(): bool
    {
        return in_array($this->type, ['bank', 'investment', 'receivable']);
    }

    /**
     * Check if account is a liability.
     */
    public function isLiability(): bool
    {
        return $this->type === 'liability';
    }
}
