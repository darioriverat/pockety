import { describe, expect, it } from 'vitest';
import {
    DEFAULT_PERIOD,
    currentPeriod,
    formatPeriod,
    generatePeriods,
    isPeriodFormatValid,
    isValidPeriod,
    periodFromDate,
} from '@/lib/periods';

describe('generatePeriods', () => {
    it('returns every month from the start through the end, including gaps', () => {
        const periods = generatePeriods('202508', '202610');

        expect(periods[0]).toBe('202508');
        expect(periods.at(-1)).toBe('202610');
        expect(periods).toContain('202512');
        expect(periods).toContain('202601');
        expect(periods).toContain('202609');
        expect(periods).not.toContain('202507');
        expect(periods).not.toContain('202611');
        expect(periods).toHaveLength(15);
    });

    it('returns the end month when the start is later or missing', () => {
        expect(generatePeriods('202611', '202610')).toEqual(['202610']);
        expect(generatePeriods('', '202610')).toEqual(['202610']);
    });
});

describe('currentPeriod', () => {
    it('formats a date as YYYYMM', () => {
        expect(currentPeriod(new Date(2026, 9, 3, 12))).toBe('202610');
    });
});

describe('formatPeriod', () => {
    it('formats YYYYMM into a readable month and year', () => {
        expect(formatPeriod('202501')).toBe('January 2025');
        expect(formatPeriod('202502')).toBe('February 2025');
        expect(formatPeriod('202612')).toBe('December 2026');
    });

    it('returns the original value for invalid formats', () => {
        expect(formatPeriod('2025')).toBe('2025');
        expect(formatPeriod('202513')).toBe('202513');
        expect(formatPeriod('abc')).toBe('abc');
    });
});

describe('isValidPeriod', () => {
    it('accepts any calendar month and rejects malformed values', () => {
        expect(isValidPeriod(DEFAULT_PERIOD)).toBe(true);
        expect(isValidPeriod('202502')).toBe(true);
        expect(isValidPeriod('202609')).toBe(true);
        expect(isValidPeriod('202610')).toBe(true);
        expect(isValidPeriod('202613')).toBe(false);
        expect(isValidPeriod('2024')).toBe(false);
        expect(isValidPeriod('invalid')).toBe(false);
    });
});

describe('isPeriodFormatValid', () => {
    it('accepts YYYYMM and rejects other formats', () => {
        expect(isPeriodFormatValid('202501')).toBe(true);
        expect(isPeriodFormatValid('202612')).toBe(true);
        expect(isPeriodFormatValid('2025-01')).toBe(false);
        expect(isPeriodFormatValid('01/2025')).toBe(false);
        expect(isPeriodFormatValid('2025')).toBe(false);
        expect(isPeriodFormatValid('2025010')).toBe(false);
        expect(isPeriodFormatValid('abcdef')).toBe(false);
        expect(isPeriodFormatValid('')).toBe(false);
    });
});

describe('periodFromDate', () => {
    it('derives YYYYMM from a valid YYYY-MM-DD date', () => {
        expect(periodFromDate('2025-01-15')).toBe('202501');
        expect(periodFromDate('2026-02-20')).toBe('202602');
        expect(periodFromDate('2025-12-31')).toBe('202512');
    });

    it('returns null for incomplete or invalid dates', () => {
        expect(periodFromDate('2025-01')).toBeNull();
        expect(periodFromDate('2025-01-1')).toBeNull();
        expect(periodFromDate('01/15/2025')).toBeNull();
        expect(periodFromDate('2025-13-01')).toBeNull();
        expect(periodFromDate('2025-02-30')).toBeNull();
        expect(periodFromDate('')).toBeNull();
        expect(periodFromDate('not-a-date')).toBeNull();
    });
});
