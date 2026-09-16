import { describe, expect, it } from 'vitest';
import {
    formatCurrencyAmount,
    formatDisplayCurrency,
} from '@/lib/currency';

describe('formatDisplayCurrency', () => {
    it('formats CAD with two decimals and comma thousand separators', () => {
        const formatted = formatDisplayCurrency(1234.56, 'CAD');

        expect(formatted).toContain('1,234.56');
        expect(formatted).not.toContain('1.234');
    });

    it('formats USD with two decimals and comma thousand separators', () => {
        const formatted = formatDisplayCurrency(1234.56, 'USD');

        expect(formatted).toContain('1,234.56');
        expect(formatted).not.toContain('1.234');
    });

    it('formats COP without decimals and with comma thousand separators', () => {
        const formatted = formatDisplayCurrency(2000000, 'COP');

        expect(formatted).toContain('2,000,000');
        expect(formatted).not.toMatch(/2\.000\.000/);
        expect(formatted).not.toMatch(/2,000,000\.00/);
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
    });
});
