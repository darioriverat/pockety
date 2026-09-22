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
        public bool $isCredit,
        public bool $isDebtPayment,
        public ?string $debtComponent,
        public ?CategoryEntity $category = null,
        /** @var array{id: int, name: string, type: string}|null */
        public ?array $account = null,
    ) {}

    /**
     * Create from array (useful for batch creation).
     *
     * @param  array{id: int, date: DateTimeInterface|string, period: string, quincena: string, category_id: int, account_id?: int|null, amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null, comments?: string|null, is_recurring?: bool, is_credit?: bool, is_debt_payment?: bool, debt_component?: string|null, category?: array<string, mixed>}  $data
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
            amountCad: isset($data['amount_cad']) && $data['amount_cad'] !== null ? (float) $data['amount_cad'] : null,
            amountUsd: isset($data['amount_usd']) && $data['amount_usd'] !== null ? (float) $data['amount_usd'] : null,
            amountCop: isset($data['amount_cop']) && $data['amount_cop'] !== null ? (float) $data['amount_cop'] : null,
            comments: $data['comments'] ?? null,
            isRecurring: (bool) ($data['is_recurring'] ?? false),
            isCredit: (bool) ($data['is_credit'] ?? false),
            isDebtPayment: (bool) ($data['is_debt_payment'] ?? false),
            debtComponent: $data['debt_component'] ?? null,
            category: isset($data['category']) && is_array($data['category']) ? CategoryEntity::fromArray($data['category']) : null,
            account: $data['account'] ?? null,
        );
    }

    /**
     * Convert to array for JSON serialization.
     *
     * @return array{id: int, date: string, period: string, quincena: string, category_id: int, account_id: int|null, amount_cad: float|null, amount_usd: float|null, amount_cop: float|null, currency: string|null, amount: float|null, comments: string|null, is_recurring: bool, is_credit: bool, is_debt_payment: bool, debt_component: string|null, category?: array<string, mixed>}
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
            'is_credit' => $this->isCredit,
            'is_debt_payment' => $this->isDebtPayment,
            'debt_component' => $this->debtComponent,
        ];

        if ($this->category !== null) {
            $data['category'] = $this->category->toArray();
        }

        if ($this->account !== null) {
            $data['account'] = $this->account;
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

    /**
     * Whether this transaction is a debt principal (down) payment.
     */
    public function isPrincipal(): bool
    {
        return $this->debtComponent === 'principal';
    }

    /**
     * Whether this transaction increases an account balance (deposit, refund, or income).
     */
    public function isInflow(): bool
    {
        return $this->isCredit || $this->isIncome();
    }

    public function isIncome(): bool
    {
        return $this->category?->isIncomeCategory ?? false;
    }

    /**
     * Direction this transaction moves an account's displayed balance.
     * +1 increases it, -1 decreases it.
     *
     * Asset accounts: income and credits increase cash; spend and principal decrease it.
     * Liability accounts: regular charges increase the amount owed; principal
     * payments and credits decrease it.
     */
    public function balanceSign(bool $isLiability): int
    {
        if ($isLiability) {
            if ($this->isPrincipal() || $this->isInflow()) {
                return -1;
            }

            return 1;
        }

        return $this->isInflow() ? 1 : -1;
    }
}
