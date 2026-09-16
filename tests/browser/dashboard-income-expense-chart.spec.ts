import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function seedIncomeExpenseData(
    request: APIRequestContext,
): Promise<void> {
    const categoryResponse = await request.get('/api/categories');
    expect(categoryResponse.ok()).toBeTruthy();
    const categories = (await categoryResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = categories.data.find((item) => item.code === 'C001');
    expect(category).toBeTruthy();

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name: 'Dashboard Chart Checking',
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

        await request.post('/api/exchange-rates', {
            data: {
                period,
                usd_cop: 4400,
                usd_cad: 0.75,
                cad_cop: 3000,
            },
        });

        const incomeResponse = await request.post('/api/income', {
            data: {
                period,
                description: `Salary ${period}`,
                amount_cad: 4000 + index * 100,
                amount_usd: 0,
                amount_cop: 0,
            },
        });
        expect(incomeResponse.ok()).toBeTruthy();

        const txResponse = await request.post('/api/transactions', {
            data: {
                date: `${year}-${month}-10`,
                period,
                quincena: 'Q1',
                category_id: category!.id,
                account_id: account.data.id,
                amount_cad: 1500 + index * 50,
                comments: `Dashboard chart expense ${period}`,
            },
        });
        expect(txResponse.ok()).toBeTruthy();
    }
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 101: dashboard shows income vs expenses chart over time', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    await seedIncomeExpenseData(request);

    await page.goto('/dashboard?period=202606');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('income-expense-chart-card')).toBeVisible();
    await expect(page.getByText('Income vs Expenses')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-101-income-expense-chart/01-dashboard-overview.png',
        fullPage: true,
    });

    const chart = page.getByTestId('income-expense-chart');
    await expect(chart).toBeVisible();

    const range = page.getByTestId('income-expense-chart-range');
    await expect(range).toContainText(/Last 12 months/i);

    const legend = page.getByTestId('income-expense-chart-legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Income');
    await expect(legend).toContainText('Expenses');

    await expect(page.getByTestId('chart-line-income')).toBeVisible();
    await expect(page.getByTestId('chart-line-expenses')).toBeVisible();
    await expect(page.getByTestId('chart-bar-income-202606')).toBeVisible();
    await expect(page.getByTestId('chart-bar-expenses-202606')).toBeVisible();
    await expect(page.getByTestId('chart-bar-income-202507')).toBeVisible();
    await expect(page.getByTestId('chart-period-202601')).toBeVisible();

    await chart.screenshot({
        path: 'verification/test-101-income-expense-chart/02-chart-closeup.png',
    });

    await page.screenshot({
        path: 'verification/test-101-income-expense-chart/03-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
