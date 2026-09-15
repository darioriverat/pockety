<?php

namespace App\Domain\Entities;

readonly class PeriodSummaryEntity
{
    public function __construct(
        public string $period,
        public int $transactionCount,
        public float $incomeTotalCad,
        public float $expensesTotalCad,
    ) {}

    /**
     * @return array{
     *     period: string,
     *     transaction_count: int,
     *     income_total_cad: float,
     *     expenses_total_cad: float
     * }
     */
    public function toArray(): array
    {
        return [
            'period' => $this->period,
            'transaction_count' => $this->transactionCount,
            'income_total_cad' => $this->incomeTotalCad,
            'expenses_total_cad' => $this->expensesTotalCad,
        ];
    }
}
