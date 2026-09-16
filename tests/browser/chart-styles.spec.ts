import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

/** Keep in sync with resources/js/lib/chart-colors.ts */
const CHART_COLORS = {
    income: '#16a34a',
    expenses: '#dc2626',
    assets: '#0f766e',
    liabilities: '#b45309',
    equity: '#1d4ed8',
} as const;

const evidence = 'verification/test-156-chart-styles';

function normalizeColor(value: string): string {
    return value.replace(/\s+/g, '').toLowerCase();
}

function hexToRgb(hex: string): string {
    const cleaned = hex.replace('#', '');
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

async function seedChartData(page: import('@playwright/test').Page) {
    const categoryResponse = await page.request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((item) => item.code === 'C001');
    expect(category).toBeTruthy();

    const accountResponse = await page.request.post('/api/accounts', {
        data: {
            name: 'Chart Style Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const account = (await accountResponse.json()) as { data: { id: number } };

    const periods = [
        '202507',
        '202508',
        '202509',
        '202510',
        '202511',
        '202512',
        '202601',
        '202602',
        '202603',
        '202604',
        '202605',
        '202606',
    ];

    for (const [index, period] of periods.entries()) {
        const year = period.slice(0, 4);
        const month = period.slice(4, 6);

        await page.request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });

        const incomeResponse = await page.request.post('/api/income', {
            data: {
                period,
                description: `Salary ${period}`,
                amount_cad: 4000 + index * 100,
                amount_usd: 0,
                amount_cop: 0,
            },
        });
        expect(incomeResponse.ok()).toBeTruthy();

        const txResponse = await page.request.post('/api/transactions', {
            data: {
                date: `${year}-${month}-10`,
                period,
                quincena: 'Q1',
                category_id: category!.id,
                account_id: account.data.id,
                amount_cad: 1500 + index * 50,
                comments: `Chart style expense ${period}`,
            },
        });
        expect(txResponse.ok()).toBeTruthy();
    }
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

for (const theme of ['light', 'dark'] as const) {
    test(`dashboard charts show distinct colors, legends, and axis labels in ${theme}`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1100 });
        await seedChartData(page);

        await page.goto('/dashboard?period=202606');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

        const incomeChart = page.getByTestId('income-expense-chart');
        await expect(incomeChart).toBeVisible();
        await expect(page.getByTestId('income-expense-chart-legend')).toBeVisible();
        await expect(page.getByTestId('legend-income')).toContainText('Income');
        await expect(page.getByTestId('legend-expenses')).toContainText('Expenses');

        await expect(
            page.getByTestId('income-expense-chart-y-axis-label'),
        ).toHaveText(/Amount \(CAD\)/);
        await expect(
            page.getByTestId('income-expense-chart-x-axis-label'),
        ).toHaveText('Period');
        await expect(page.getByTestId('income-expense-chart-y-tick').first()).toBeVisible();
        await expect(page.getByTestId('income-expense-chart-x-tick').first()).toBeVisible();

        const incomeSwatch = page.getByTestId('legend-swatch-income');
        const expenseSwatch = page.getByTestId('legend-swatch-expenses');
        await expect(incomeSwatch).toHaveCSS(
            'background-color',
            hexToRgb(CHART_COLORS.income),
        );
        await expect(expenseSwatch).toHaveCSS(
            'background-color',
            hexToRgb(CHART_COLORS.expenses),
        );

        const incomeBarFill = await page
            .getByTestId('chart-bar-income-202606')
            .getAttribute('fill');
        const expenseBarFill = await page
            .getByTestId('chart-bar-expenses-202606')
            .getAttribute('fill');
        expect(normalizeColor(incomeBarFill ?? '')).toBe(
            normalizeColor(CHART_COLORS.income),
        );
        expect(normalizeColor(expenseBarFill ?? '')).toBe(
            normalizeColor(CHART_COLORS.expenses),
        );
        expect(incomeBarFill).not.toBe(expenseBarFill);

        await page.screenshot({
            path: `${evidence}/${theme}-income-expense-chart.png`,
            fullPage: false,
        });
        await incomeChart.screenshot({
            path: `${evidence}/${theme}-income-expense-chart-closeup.png`,
        });

        const assetsChart = page.getByTestId('assets-liabilities-chart');
        await expect(assetsChart).toBeVisible();
        await expect(
            page.getByTestId('assets-liabilities-chart-legend'),
        ).toBeVisible();
        await expect(page.getByTestId('legend-assets')).toContainText('Assets');
        await expect(page.getByTestId('legend-liabilities')).toContainText(
            'Liabilities',
        );
        await expect(page.getByTestId('legend-equity')).toContainText('Equity');

        await expect(
            page.getByTestId('assets-liabilities-chart-y-axis-label'),
        ).toHaveText(/Amount \(CAD\)/);
        await expect(
            page.getByTestId('assets-liabilities-chart-x-axis-label'),
        ).toHaveText('Period');

        const assetsStroke = await page
            .getByTestId('al-chart-line-assets')
            .getAttribute('stroke');
        const liabilitiesStroke = await page
            .getByTestId('al-chart-line-liabilities')
            .getAttribute('stroke');
        const equityStroke = await page
            .getByTestId('al-chart-line-equity')
            .getAttribute('stroke');
        expect(normalizeColor(assetsStroke ?? '')).toBe(
            normalizeColor(CHART_COLORS.assets),
        );
        expect(normalizeColor(liabilitiesStroke ?? '')).toBe(
            normalizeColor(CHART_COLORS.liabilities),
        );
        expect(normalizeColor(equityStroke ?? '')).toBe(
            normalizeColor(CHART_COLORS.equity),
        );
        expect(new Set([assetsStroke, liabilitiesStroke, equityStroke]).size).toBe(
            3,
        );

        await assetsChart.screenshot({
            path: `${evidence}/${theme}-assets-liabilities-chart-closeup.png`,
        });

        await page.screenshot({
            path: `${evidence}/${theme}-dashboard-charts-full.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}
