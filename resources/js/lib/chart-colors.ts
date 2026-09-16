/**
 * Distinct, accessible series colors for financial charts.
 * Chosen for contrast against light and dark backgrounds and against each other.
 */
export const CHART_COLORS = {
    income: '#16a34a', // green-600
    incomeLine: '#15803d', // green-700
    expenses: '#dc2626', // red-600
    expensesLine: '#b91c1c', // red-700
    assets: '#0f766e', // teal-700
    liabilities: '#b45309', // amber-700
    equity: '#1d4ed8', // blue-700
} as const;

export type ChartSeriesKey = keyof typeof CHART_COLORS;
