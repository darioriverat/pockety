<?php

namespace App\Services;

use App\Domain\Entities\PeriodComparisonEntity;
use App\Domain\Entities\PeriodComparisonMetricEntity;
use App\Domain\Services\Contracts\PeriodComparisonServiceInterface;
use InvalidArgumentException;

class PeriodComparisonService implements PeriodComparisonServiceInterface
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function compare(string $periodA, string $periodB): PeriodComparisonEntity
    {
        $this->assertPeriodFormat($periodA);
        $this->assertPeriodFormat($periodB);

        $summaryA = $this->extractComparableSummary($this->dashboardService->getSummary($periodA));
        $summaryB = $this->extractComparableSummary($this->dashboardService->getSummary($periodB));

        $metrics = [
            $this->buildMetric('income', 'Income', $summaryA['total_income_cad'], $summaryB['total_income_cad']),
            $this->buildMetric('expenses', 'Expenses', $summaryA['total_expenses_cad'], $summaryB['total_expenses_cad']),
            $this->buildMetric('net', 'Net', $summaryA['net_cad'], $summaryB['net_cad']),
            $this->buildMetric('assets', 'Assets', $summaryA['total_assets_cad'], $summaryB['total_assets_cad']),
            $this->buildMetric('liabilities', 'Liabilities', $summaryA['total_liabilities_cad'], $summaryB['total_liabilities_cad']),
            $this->buildMetric('equity', 'Equity', $summaryA['equity_cad'], $summaryB['equity_cad']),
        ];

        return new PeriodComparisonEntity(
            periodA: $periodA,
            periodB: $periodB,
            periodASummary: $summaryA,
            periodBSummary: $summaryB,
            metrics: $metrics,
        );
    }

    /**
     * @param  array{
     *     period: string,
     *     total_income_cad: float,
     *     total_expenses_cad: float,
     *     net_cad: float,
     *     total_assets_cad: float,
     *     total_liabilities_cad: float,
     *     equity_cad: float,
     *     reconciliation_status?: string,
     *     reconciliation_summary?: array{balanced_count: int, unbalanced_count: int, total_count: int}
     * }  $summary
     * @return array{
     *     period: string,
     *     total_income_cad: float,
     *     total_expenses_cad: float,
     *     net_cad: float,
     *     total_assets_cad: float,
     *     total_liabilities_cad: float,
     *     equity_cad: float
     * }
     */
    private function extractComparableSummary(array $summary): array
    {
        return [
            'period' => $summary['period'],
            'total_income_cad' => (float) $summary['total_income_cad'],
            'total_expenses_cad' => (float) $summary['total_expenses_cad'],
            'net_cad' => (float) $summary['net_cad'],
            'total_assets_cad' => (float) $summary['total_assets_cad'],
            'total_liabilities_cad' => (float) $summary['total_liabilities_cad'],
            'equity_cad' => (float) $summary['equity_cad'],
        ];
    }

    private function buildMetric(string $key, string $label, float $periodA, float $periodB): PeriodComparisonMetricEntity
    {
        $difference = round($periodB - $periodA, 2);
        $percentChange = null;

        if (abs($periodA) > 0.00001) {
            $percentChange = round(($difference / abs($periodA)) * 100, 2);
        }

        return new PeriodComparisonMetricEntity(
            key: $key,
            label: $label,
            periodACad: round($periodA, 2),
            periodBCad: round($periodB, 2),
            differenceCad: $difference,
            percentChange: $percentChange,
        );
    }

    private function assertPeriodFormat(string $period): void
    {
        if (! preg_match('/^\d{6}$/', $period)) {
            throw new InvalidArgumentException("Invalid period format: {$period}");
        }
    }
}
