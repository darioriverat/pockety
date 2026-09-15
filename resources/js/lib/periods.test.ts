import { describe, expect, it } from 'vitest';
import {
    DEFAULT_PERIOD,
    formatPeriod,
    generatePeriods,
    isValidPeriod,
} from '@/lib/periods';

describe('generatePeriods', () => {
    it('returns periods from January 2025 through September 2026', () => {
        const periods = generatePeriods();

        expect(periods[0]).toBe('202501');
        expect(periods.at(-1)).toBe('202609');
        expect(periods).toContain('202512');
        expect(periods).toContain('202601');
        expect(periods).not.toContain('202610');
        expect(periods).toHaveLength(21);
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
    it('accepts generated periods and rejects others', () => {
        expect(isValidPeriod(DEFAULT_PERIOD)).toBe(true);
        expect(isValidPeriod('202502')).toBe(true);
        expect(isValidPeriod('202609')).toBe(true);
        expect(isValidPeriod('202610')).toBe(false);
        expect(isValidPeriod('2024')).toBe(false);
        expect(isValidPeriod('invalid')).toBe(false);
    });
});
