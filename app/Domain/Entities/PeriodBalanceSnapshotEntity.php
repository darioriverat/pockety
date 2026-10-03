<?php

namespace App\Domain\Entities;

readonly class PeriodBalanceSnapshotEntity
{
    public function __construct(
        public string $period,
        public float $assetsCad,
        public float $liabilitiesCad,
        public float $equityCad,
        public float $incomeCad,
        public float $netOperatingExpensesCad,
        public float $recordsCheckResultCad,
        public string $reconciliationStatus,
    ) {}

    /**
     * @return array{
     *     period: string,
     *     assets_cad: float,
     *     liabilities_cad: float,
     *     equity_cad: float,
     *     income_cad: float,
     *     net_operating_expenses_cad: float,
     *     records_check_result_cad: float,
     *     reconciliation_status: string
     * }
     */
    public function toArray(): array
    {
        return [
            'period' => $this->period,
            'assets_cad' => $this->assetsCad,
            'liabilities_cad' => $this->liabilitiesCad,
            'equity_cad' => $this->equityCad,
            'income_cad' => $this->incomeCad,
            'net_operating_expenses_cad' => $this->netOperatingExpensesCad,
            'records_check_result_cad' => $this->recordsCheckResultCad,
            'reconciliation_status' => $this->reconciliationStatus,
        ];
    }
}
