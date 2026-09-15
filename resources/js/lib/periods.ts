export const DEFAULT_PERIOD = '202501';

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
] as const;

export function generatePeriods(): string[] {
    const periods: string[] = [];
    for (let year = 2025; year <= 2026; year++) {
        const maxMonth = year === 2026 ? 9 : 12;
        for (let month = 1; month <= maxMonth; month++) {
            periods.push(`${year}${month.toString().padStart(2, '0')}`);
        }
    }
    return periods;
}

export function formatPeriod(period: string): string {
    if (!/^\d{6}$/.test(period)) {
        return period;
    }
    const year = period.substring(0, 4);
    const month = parseInt(period.substring(4, 6), 10);
    if (month < 1 || month > 12) {
        return period;
    }
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function isValidPeriod(period: string): boolean {
    return generatePeriods().includes(period);
}

/**
 * Checks that a period string uses the YYYYMM format (six digits).
 * Does not restrict the value to the app's supported period range.
 */
export function isPeriodFormatValid(period: string): boolean {
    return /^\d{6}$/.test(period);
}
