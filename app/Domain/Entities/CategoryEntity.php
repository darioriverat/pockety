<?php

namespace App\Domain\Entities;

readonly class CategoryEntity
{
    public function __construct(
        public int $id,
        public string $code,
        public string $nameEs,
        public string $nameEn,
        public bool $isDebtCategory,
        public bool $isActive,
        public ?string $status = null,
    ) {}

    /**
     * Create from array (useful for batch creation).
     *
     * @param  array{id: int, code: string, name_es: string, name_en: string, is_debt_category: bool, is_active: bool, status?: string|null}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            code: $data['code'],
            nameEs: $data['name_es'],
            nameEn: $data['name_en'],
            isDebtCategory: $data['is_debt_category'],
            isActive: $data['is_active'],
            status: $data['status'] ?? null,
        );
    }

    /**
     * Convert to array for JSON serialization.
     *
     * @return array{id: int, code: string, name_es: string, name_en: string, is_debt_category: bool, is_active: bool, status: string|null}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name_es' => $this->nameEs,
            'name_en' => $this->nameEn,
            'is_debt_category' => $this->isDebtCategory,
            'is_active' => $this->isActive,
            'status' => $this->status,
        ];
    }
}
