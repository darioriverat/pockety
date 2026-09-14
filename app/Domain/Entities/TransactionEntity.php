<?php

namespace App\Domain\Entities;

use DateTimeInterface;

readonly class TransactionEntity
{
    public function __construct(
        public int $id,
        public DateTimeInterface $date,
        public string $period,
        public string $quincena,
        public int $categoryId,
        public ?int $accountId,
        public ?float $amountCad,
        public ?float $amountUsd,
        public ?float $amountCop,
        public ?string $comments,
        public bool $isRecurring,
        public ?string $debtComponent,
        public ?CategoryEntity $category = null,
    ) {}

    /**
     * Create from array (useful for batch creation).
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            date: $data['date'] instanceof DateTimeInterface ? $data['date'] : new \DateTime($data['date']),
            period: $data['period'],
            quincena: $data['quincena'],
            categoryId: $data['category_id'],
            accountId: $data['account_id'] ?? null,
            amountCad: $data['amount_cad'] !== null ? (float) $data['amount_cad'] : null,
            amountUsd: $data['amount_usd'] !== null ? (float) $data['amount_usd'] : null,
            amountCop: $data['amount_cop'] !== null ? (float) $data['amount_cop'] : null,
            comments: $data['comments'] ?? null,
            isRecurring: (bool) ($data['is_recurring'] ?? false),
            debtComponent: $data['debt_component'] ?? null,
            category: isset($data['category']) ? CategoryEntity::fromArray($data['category']) : null,
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function toArray(): array
    {
        $data = [
            'id' => $this->id,
            'date' => $this->date->format('Y-m-d'),
            'period' => $this->period,
            'quincena' => $this->quincena,
            'category_id' => $this->categoryId,
            'account_id' => $this->accountId,
            'amount_cad' => $this->amountCad,
            'amount_usd' => $this->amountUsd,
            'amount_cop' => $this->amountCop,
            'currency' => $this->getCurrency(),
            'amount' => $this->getAmount(),
            'comments' => $this->comments,
            'is_recurring' => $this->isRecurring,
            'debt_component' => $this->debtComponent,
        ];

        if ($this->category !== null) {
            $data['category'] = $this->category->toArray();
        }

        return $data;
    }

    /**
     * Get the currency used in this transaction.
     */
    public function getCurrency(): ?string
    {
        if ($this->amountCad !== null && $this->amountCad != 0) {
            return 'CAD';
        }
        if ($this->amountUsd !== null && $this->amountUsd != 0) {
            return 'USD';
        }
        if ($this->amountCop !== null && $this->amountCop != 0) {
            return 'COP';
        }

        return null;
    }

    /**
     * Get the amount for this transaction (in its currency).
     */
    public function getAmount(): ?float
    {
        return match ($this->getCurrency()) {
            'CAD' => $this->amountCad,
            'USD' => $this->amountUsd,
            'COP' => $this->amountCop,
            default => null,
        };
    }
}
