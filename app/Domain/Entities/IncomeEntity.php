<?php

namespace App\Domain\Entities;

readonly class IncomeEntity
{
    public function __construct(
        public int $id,
        public string $period,
        public string $description,
        public int $lineNumber,
        public float $amountCad,
        public float $amountUsd,
        public float $amountCop,
        public ?string $notes,
        public string $createdAt,
        public string $updatedAt,
        public ?float $totalCadEquivalent = null,
    ) {}

    /**
     * @param  array{
     *     id: int,
     *     period: string,
     *     description: string,
     *     line_number: int,
     *     amount_cad: float|string|null,
     *     amount_usd: float|string|null,
     *     amount_cop: float|string|null,
     *     notes: string|null,
     *     created_at: string,
     *     updated_at: string,
     *     total_cad_equivalent?: float|null
     * }  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            period: $data['period'],
            description: $data['description'],
            lineNumber: (int) $data['line_number'],
            amountCad: (float) ($data['amount_cad'] ?? 0),
            amountUsd: (float) ($data['amount_usd'] ?? 0),
            amountCop: (float) ($data['amount_cop'] ?? 0),
            notes: $data['notes'] ?? null,
            createdAt: $data['created_at'],
            updatedAt: $data['updated_at'],
            totalCadEquivalent: $data['total_cad_equivalent'] ?? null,
        );
    }

    /**
     * @return array{
     *     id: int,
     *     period: string,
     *     description: string,
     *     line_number: int,
     *     amount_cad: float,
     *     amount_usd: float,
     *     amount_cop: float,
     *     notes: string|null,
     *     total_cad_equivalent: float|null,
     *     created_at: string,
     *     updated_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period,
            'description' => $this->description,
            'line_number' => $this->lineNumber,
            'amount_cad' => $this->amountCad,
            'amount_usd' => $this->amountUsd,
            'amount_cop' => $this->amountCop,
            'notes' => $this->notes,
            'total_cad_equivalent' => $this->totalCadEquivalent,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
