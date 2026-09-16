export type DisplayCurrency = 'CAD' | 'USD' | 'COP';

/**
 * Distinct symbols so CAD / USD / COP never look identical in the UI.
 * Matches product rules: $, US$, COP (also accepts $COP as a COP form).
 */
const CURRENCY_SYMBOLS: Record<DisplayCurrency, string> = {
    CAD: '$',
    USD: 'US$',
    COP: 'COP',
};

/**
 * Use English locale so thousand separators are commas (1,234.56 / 2,000,000).
 * es-CO would use period grouping, which fails the product formatting requirement.
 */
const NUMBER_LOCALE = 'en-US';

const FRACTION_DIGITS: Record<DisplayCurrency, number> = {
    CAD: 2,
    USD: 2,
    COP: 0,
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
    return value === 'CAD' || value === 'USD' || value === 'COP';
}

/**
 * Return the display symbol/code for a currency ($, US$, COP).
 */
export function currencySymbol(currency: DisplayCurrency): string {
    return CURRENCY_SYMBOLS[currency];
}

/**
 * Format the numeric portion only (thousand separators + currency-appropriate decimals).
 */
export function formatCurrencyNumber(
    amount: number,
    currency: DisplayCurrency,
): string {
    const digits = FRACTION_DIGITS[currency];

    return new Intl.NumberFormat(NUMBER_LOCALE, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(Math.abs(amount));
}

/**
 * Format a currency amount with a distinguishable symbol and thousand separators.
 * CAD → $1,234.56; USD → US$1,234.56; COP → COP 2,000,000.
 * Negative amounts keep a leading minus: -$1,234.56 / -US$1,234.56 / -COP 2,000,000.
 */
export function formatDisplayCurrency(
    amount: number,
    currency: DisplayCurrency,
): string {
    const symbol = CURRENCY_SYMBOLS[currency];
    const number = formatCurrencyNumber(amount, currency);
    const sign = amount < 0 ? '-' : '';

    if (currency === 'COP') {
        return `${sign}${symbol} ${number}`;
    }

    return `${sign}${symbol}${number}`;
}

/**
 * Format a currency amount with an explicit leading + or − sign.
 * Positive → +$1,234.56; Negative → -$1,234.56 (minus already from formatDisplayCurrency).
 */
export function formatSignedDisplayCurrency(
    amount: number,
    currency: DisplayCurrency,
): string {
    if (amount < 0) {
        return formatDisplayCurrency(amount, currency);
    }

    return `+${formatDisplayCurrency(amount, currency)}`;
}

/**
 * Null-safe signed formatter for list/detail pages.
 */
export function formatSignedCurrencyAmount(
    amount: number | null | undefined,
    currency: string | null | undefined,
    empty: string = '—',
): string {
    if (amount === null || amount === undefined || currency === null || currency === undefined) {
        return empty;
    }

    if (!isDisplayCurrency(currency)) {
        const sign = amount < 0 ? '-' : '+';
        return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
    }

    return formatSignedDisplayCurrency(amount, currency);
}

/**
 * Tailwind classes that visually distinguish positive (green) vs negative (red) amounts.
 */
export function amountToneClass(amount: number): string {
    if (amount < 0) {
        return 'text-red-600 dark:text-red-400';
    }

    if (amount > 0) {
        return 'text-green-600 dark:text-green-400';
    }

    return 'text-muted-foreground';
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
