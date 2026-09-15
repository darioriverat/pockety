import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
    type ApiCategory,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature 85: user can view list of all periods with data', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    await request.post('/api/exchange-rates', {
        data: {
            period: '202501',
            usd_cop: 4400,
            usd_cad: 0.75,
            cad_cop: 3000,
        },
    });

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;
    const c001 = categories.find((category) => category.code === 'C001');
    expect(c001).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-12',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 88.25,
            comments: 'periods-history-jan',
        },
    });

    await request.post('/api/income', {
        data: {
            period: '202501',
            description: 'Salary for periods history',
            line_number: 1,
            amount_cad: 4500,
            amount_usd: 0,
            amount_cop: 0,
        },
    });

    await page.goto('/periods/history');
    await expect(
        page.getByTestId('periods-history-heading'),
    ).toBeVisible();
    await expect(page.getByTestId('periods-history-count')).toHaveText('21');
    await expect(page.getByTestId('periods-history-table')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-85-periods-history/02-periods-history-overview.png',
        fullPage: false,
    });

    const rows = page.locator('[data-testid^="period-row-"]');
    await expect(rows).toHaveCount(21);

    const firstPeriod = await rows.first().getAttribute('data-period');
    const lastPeriod = await rows.last().getAttribute('data-period');
    expect(firstPeriod).toBe('202501');
    expect(lastPeriod).toBe('202609');

    const allPeriods = await rows.evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-period') ?? ''),
    );
    const sorted = [...allPeriods].sort();
    expect(allPeriods).toEqual(sorted);

    await expect(page.getByTestId('period-tx-count-202501')).toHaveText('1');
    await expect(page.getByTestId('period-income-202501')).toContainText(
        '4,500',
    );
    await expect(page.getByTestId('period-expenses-202501')).toContainText(
        '88.25',
    );

    await rows.last().scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/test-85-periods-history/03-periods-history-bottom.png',
        fullPage: false,
    });
    await page.screenshot({
        path: 'verification/test-85-periods-history/04-periods-history-full.png',
        fullPage: true,
    });

    await expect(
        page.getByRole('link', { name: 'Periods', exact: true }),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
