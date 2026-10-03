<?php

namespace App\Domain\Entities;

readonly class PeriodBalanceHistoryEntity
{
    public function __construct(
        public int $id,
        public string $period,
        public float $assetsCad,
        public float $liabilitiesCad,
        public float $equityCad,
        public float $incomeCad,
        public float $netOperatingExpensesCad,
        public float $recordsCheckResultCad,
        public string $reconciliationStatus,
        public \DateTimeImmutable $recordedAt,
        public \DateTimeImmutable $replacedAt,
    ) {}

    /**
     * @return array{
     *     id: int,
     *     period: string,
     *     assets_cad: float,
     *     liabilities_cad: float,
     *     equity_cad: float,
     *     income_cad: float,
     *     net_operating_expenses_cad: float,
     *     records_check_result_cad: float,
     *     reconciliation_status: string,
     *     recorded_at: string,
     *     replaced_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period,
            'assets_cad' => $this->assetsCad,
            'liabilities_cad' => $this->liabilitiesCad,
            'equity_cad' => $this->equityCad,
            'income_cad' => $this->incomeCad,
            'net_operating_expenses_cad' => $this->netOperatingExpensesCad,
            'records_check_result_cad' => $this->recordsCheckResultCad,
            'reconciliation_status' => $this->reconciliationStatus,
            'recorded_at' => $this->recordedAt->format('Y-m-d\TH:i:s.u\Z'),
            'replaced_at' => $this->replacedAt->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
