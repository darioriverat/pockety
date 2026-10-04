<?php

namespace App\Services;

use App\Domain\Services\Contracts\AvailablePeriodServiceInterface;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Transaction;

class AvailablePeriodService implements AvailablePeriodServiceInterface
{
    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    public function selectable(): array
    {
        $current = now()->format('Ym');
        $earliest = Transaction::query()
            ->forUser($this->owner->id())
            ->min('period');

        if (! is_string($earliest) || ! $this->isPeriod($earliest) || $earliest > $current) {
            return [$current];
        }

        return $this->monthsBetween($earliest, $current);
    }

    private function isPeriod(string $period): bool
    {
        if (preg_match('/^\d{6}$/', $period) !== 1) {
            return false;
        }

        $month = (int) substr($period, 4, 2);

        return $month >= 1 && $month <= 12;
    }

    /**
     * @return list<string>
     */
    private function monthsBetween(string $from, string $to): array
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
