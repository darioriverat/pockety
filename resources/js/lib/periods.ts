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

export function currentPeriod(date = new Date()): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${year}${month}`;
}

/**
 * Inclusive month range from `from` through `to` (YYYYMM).
 * Returns the end month alone when the start is missing or later than the end.
 */
export function generatePeriods(from: string, to: string): string[] {
    if (!isCalendarPeriod(to)) {
        return [];
    }

    if (!isCalendarPeriod(from) || from > to) {
        return [to];
    }

    const periods: string[] = [];
    let year = Number(from.slice(0, 4));
    let month = Number(from.slice(4, 6));
    const endYear = Number(to.slice(0, 4));
    const endMonth = Number(to.slice(4, 6));

    while (year < endYear || (year === endYear && month <= endMonth)) {
        periods.push(`${year}${month.toString().padStart(2, '0')}`);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }

    return periods;
}

function isCalendarPeriod(period: string): boolean {
    if (!/^\d{6}$/.test(period)) {
        return false;
    }

    const month = Number(period.slice(4, 6));

    return month >= 1 && month <= 12;
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
    return isCalendarPeriod(period);
}

/**
 * Checks that a period string uses the YYYYMM format (six digits).
 * Does not restrict the value to the app's supported period range.
 */
export function isPeriodFormatValid(period: string): boolean {
    return /^\d{6}$/.test(period);
}

/**
 * Derives an accounting period (YYYYMM) from a transaction date (YYYY-MM-DD).
 * Returns null when the date is incomplete or invalid.
 */
export function periodFromDate(date: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== year ||
        parsed.getMonth() + 1 !== month ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return `${match[1]}${match[2]}`;
}
