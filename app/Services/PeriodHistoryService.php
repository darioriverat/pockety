<?php

namespace App\Services;

use App\Domain\Collections\PeriodSummaryCollection;
use App\Domain\Entities\PeriodSummaryEntity;
use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Domain\Services\Contracts\PeriodHistoryServiceInterface;
use App\Models\Transaction;

class PeriodHistoryService implements PeriodHistoryServiceInterface
{
    public function __construct(
        private readonly IncomeServiceInterface $incomeService,
        private readonly FinancialSummaryService $financialSummaryService,
    ) {}

    public function getHistory(string $from = '202501', string $to = '202609'): PeriodSummaryCollection
    {
        $periods = $this->periodsBetween($from, $to);
        $collection = new PeriodSummaryCollection;

        /** @var array<string, int> $counts */
        $counts = Transaction::query()
            ->whereIn('period', $periods)
            ->selectRaw('period, COUNT(*) as transaction_count')
            ->groupBy('period')
            ->pluck('transaction_count', 'period')
            ->map(fn ($count) => (int) $count)
            ->all();

        foreach ($periods as $period) {
            $incomeTotal = $this->incomeService->getTotalCadEquivalent($period);
            $expensesTotal = $this->financialSummaryService->getSummary($period)['total_recorded_disbursements_cad'];

            $collection->add(new PeriodSummaryEntity(
                period: $period,
                transactionCount: $counts[$period] ?? 0,
                incomeTotalCad: round($incomeTotal, 2),
                expensesTotalCad: round((float) $expensesTotal, 2),
            ));
        }

        return $collection;
    }

    /**
     * @return list<string>
     */
    private function periodsBetween(string $from, string $to): array
    {
        $periods = [];
        $year = (int) substr($from, 0, 4);
        $month = (int) substr($from, 4, 2);
        $endYear = (int) substr($to, 0, 4);
        $endMonth = (int) substr($to, 4, 2);

        while ($year < $endYear || ($year === $endYear && $month <= $endMonth)) {
            $periods[] = sprintf('%04d%02d', $year, $month);
            $month++;
            if ($month > 12) {
                $month = 1;
                $year++;
            }
        }

        return $periods;
    }
}
