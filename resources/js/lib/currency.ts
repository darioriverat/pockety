export type DisplayCurrency = 'CAD' | 'USD' | 'COP';

const LOCALES: Record<DisplayCurrency, string> = {
    CAD: 'en-CA',
    USD: 'en-US',
    COP: 'es-CO',
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
    return value === 'CAD' || value === 'USD' || value === 'COP';
}

export function formatDisplayCurrency(
    amount: number,
    currency: DisplayCurrency,
): string {
    return new Intl.NumberFormat(LOCALES[currency], {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount);
}

export function amountForCurrency(
    row: Record<string, number | null | undefined>,
    prefix: string,
    currency: DisplayCurrency,
): number {
    const specificKey = `${prefix}_${currency.toLowerCase()}`;
    const specific = row[specificKey];

    if (typeof specific === 'number') {
        return specific;
    }

    // Fall back to CAD when a currency-specific amount is absent (partial payloads / tests)
    const cad = row[`${prefix}_cad`];

    return typeof cad === 'number' ? cad : 0;
}
