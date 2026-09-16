export type DisplayCurrency = 'CAD' | 'USD' | 'COP';

/**
 * Use English locales so thousand separators are commas (1,234.56 / 2,000,000).
 * es-CO would use period grouping, which fails the product formatting requirement.
 */
const LOCALES: Record<DisplayCurrency, string> = {
    CAD: 'en-CA',
    USD: 'en-US',
    COP: 'en-US',
};

const FRACTION_DIGITS: Record<DisplayCurrency, number> = {
    CAD: 2,
    USD: 2,
    COP: 0,
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
    return value === 'CAD' || value === 'USD' || value === 'COP';
}

/**
 * Format a currency amount with thousand separators and currency-appropriate decimals.
 * CAD/USD → 2 decimals (e.g. $1,234.56); COP → 0 decimals (e.g. COP 2,000,000).
 */
export function formatDisplayCurrency(
    amount: number,
    currency: DisplayCurrency,
): string {
    const digits = FRACTION_DIGITS[currency];

    return new Intl.NumberFormat(LOCALES[currency], {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(amount);
}

/**
 * Null-safe wrapper used by list/detail pages. Returns `empty` when amount or currency is missing.
 */
export function formatCurrencyAmount(
    amount: number | null | undefined,
    currency: string | null | undefined,
    empty: string = '—',
): string {
    if (amount === null || amount === undefined || currency === null || currency === undefined) {
        return empty;
    }

    if (!isDisplayCurrency(currency)) {
        return `${currency} ${amount.toFixed(2)}`;
    }

    return formatDisplayCurrency(amount, currency);
}

export function amountForCurrency<Prefix extends string>(
    row: Partial<Record<`${Prefix}_${Lowercase<DisplayCurrency>}`, number | null>>,
    prefix: Prefix,
    currency: DisplayCurrency,
): number {
    const specificKey =
        `${prefix}_${currency.toLowerCase()}` as `${Prefix}_${Lowercase<DisplayCurrency>}`;
    const specific = row[specificKey];

    if (typeof specific === 'number') {
        return specific;
    }

    // Fall back to CAD when a currency-specific amount is absent (partial payloads / tests)
    const cad = row[`${prefix}_cad` as `${Prefix}_cad`];

    return typeof cad === 'number' ? cad : 0;
}
