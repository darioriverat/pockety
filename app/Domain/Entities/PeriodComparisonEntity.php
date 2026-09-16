<?php

namespace App\Domain\Entities;

readonly class PeriodComparisonEntity
{
    /**
     * @param  list<PeriodComparisonMetricEntity>  $metrics
     * @param  array{
     *     period: string,
     *     total_income_cad: float,
     *     total_expenses_cad: float,
     *     net_cad: float,
     *     total_assets_cad: float,
     *     total_liabilities_cad: float,
     *     equity_cad: float
     * }  $periodASummary
     * @param  array{
     *     period: string,
     *     total_income_cad: float,
     *     total_expenses_cad: float,
     *     net_cad: float,
     *     total_assets_cad: float,
     *     total_liabilities_cad: float,
     *     equity_cad: float
     * }  $periodBSummary
     */
    public function __construct(
        public string $periodA,
        public string $periodB,
        public array $periodASummary,
        public array $periodBSummary,
        public array $metrics,
    ) {}

    /**
     * @return array{
     *     period_a: string,
     *     period_b: string,
     *     period_a_summary: array{
     *         period: string,
     *         total_income_cad: float,
     *         total_expenses_cad: float,
     *         net_cad: float,
     *         total_assets_cad: float,
     *         total_liabilities_cad: float,
     *         equity_cad: float
     *     },
     *     period_b_summary: array{
     *         period: string,
     *         total_income_cad: float,
     *         total_expenses_cad: float,
     *         net_cad: float,
     *         total_assets_cad: float,
     *         total_liabilities_cad: float,
     *         equity_cad: float
     *     },
     *     metrics: list<array{
     *         key: string,
     *         label: string,
     *         period_a_cad: float,
     *         period_b_cad: float,
     *         difference_cad: float,
     *         percent_change: float|null
     *     }>
     * }
     */
    public function toArray(): array
    {
        return [
            'period_a' => $this->periodA,
            'period_b' => $this->periodB,
            'period_a_summary' => $this->periodASummary,
            'period_b_summary' => $this->periodBSummary,
            'metrics' => array_map(
                static fn (PeriodComparisonMetricEntity $metric) => $metric->toArray(),
                $this->metrics
            ),
        ];
    }
}
