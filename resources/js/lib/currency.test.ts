import { describe, expect, it } from 'vitest';
import {
    currencySymbol,
    formatCurrencyAmount,
    formatDisplayCurrency,
} from '@/lib/currency';

describe('currencySymbol', () => {
    it('returns distinguishable symbols for CAD, USD, and COP', () => {
        expect(currencySymbol('CAD')).toBe('$');
        expect(currencySymbol('USD')).toBe('US$');
        expect(currencySymbol('COP')).toBe('COP');

        const symbols = [
            currencySymbol('CAD'),
            currencySymbol('USD'),
            currencySymbol('COP'),
        ];
        expect(new Set(symbols).size).toBe(3);
    });
});

describe('formatDisplayCurrency', () => {
    it('formats CAD with $ prefix, two decimals, and comma separators', () => {
        const formatted = formatDisplayCurrency(1234.56, 'CAD');

        expect(formatted).toBe('$1,234.56');
        expect(formatted.startsWith('$')).toBe(true);
        expect(formatted).not.toMatch(/^US\$/);
    });

    it('formats USD with US$ prefix so it is distinct from CAD', () => {
        const formatted = formatDisplayCurrency(1234.56, 'USD');

        expect(formatted).toBe('US$1,234.56');
        expect(formatted).toContain('US$');
        expect(formatted).not.toBe(formatDisplayCurrency(1234.56, 'CAD'));
    });

    it('formats COP with COP code prefix and no decimals', () => {
        const formatted = formatDisplayCurrency(2000000, 'COP');

        expect(formatted).toBe('COP 2,000,000');
        expect(formatted.startsWith('COP ')).toBe(true);
        expect(formatted).not.toMatch(/2\.000\.000/);
        expect(formatted).not.toMatch(/2,000,000\.00/);
    });

    it('keeps the symbol position consistent for negative amounts', () => {
        expect(formatDisplayCurrency(-1234.56, 'CAD')).toBe('-$1,234.56');
        expect(formatDisplayCurrency(-1234.56, 'USD')).toBe('-US$1,234.56');
        expect(formatDisplayCurrency(-2000000, 'COP')).toBe('-COP 2,000,000');
    });
});

describe('formatCurrencyAmount', () => {
    it('returns an em dash for missing amount or currency', () => {
        expect(formatCurrencyAmount(null, 'CAD')).toBe('—');
        expect(formatCurrencyAmount(12.5, null)).toBe('—');
        expect(formatCurrencyAmount(undefined, undefined)).toBe('—');
    });

    it('delegates known currencies to formatDisplayCurrency', () => {
        expect(formatCurrencyAmount(1234.5, 'CAD')).toBe(
            formatDisplayCurrency(1234.5, 'CAD'),
        );
        expect(formatCurrencyAmount(2500000, 'COP')).toBe(
            formatDisplayCurrency(2500000, 'COP'),
        );
        expect(formatCurrencyAmount(99.5, 'USD')).toBe('US$99.50');
    });
});
