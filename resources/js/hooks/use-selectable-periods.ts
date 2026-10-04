import { usePage } from '@inertiajs/react';
import { currentPeriod } from '@/lib/periods';

function readPeriods(value: unknown): string[] {
    if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((period) => typeof period === 'string')
    ) {
        return value;
    }

    return [currentPeriod()];
}

/**
 * Months the period picker can offer. The server sends every month from the
 * earliest transaction through the current month, or the current month alone
 * when nothing has been recorded.
 */
export function useSelectablePeriods(): string[] {
    const { availablePeriods } = usePage().props;

    return readPeriods(availablePeriods);
}
