import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    selectDisplayedPeriod,
    trackConsoleErrors,
    type ApiCategory,
    ensureExchangeRateForPeriod,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test('feature: user can navigate to different periods using period selector', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page, request);

    await ensureExchangeRateForPeriod(request, '202501', {
        copPerUsd: 4400,
        cadPerUsd: 0.75,
    });

    await ensureExchangeRateForPeriod(request, '202502', {
        copPerUsd: 4500,
        cadPerUsd: 0.8,
    });

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;
    const c001 = categories.find((category) => category.code === 'C001');
    expect(c001).toBeTruthy();

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-10',
            period: '202501',
            category_id: c001!.id,
            amount_cad: 100,
            comments: 'January groceries',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-02-10',
            period: '202502',
            category_id: c001!.id,
            amount_cad: 250,
            comments: 'February groceries',
        },
    });

    await page.goto('/financial-summary');

    await expect(
        page.getByRole('heading', { name: 'Financial Summary' }),
    ).toBeVisible();

    const headerSelector = page.getByTestId('period-selector');
    await expect(headerSelector).toBeVisible();
    await selectDisplayedPeriod(page, 'January 2025', 'period-selector');

    await expect(
        page.getByTestId('total-recorded-disbursements'),
    ).toContainText('100');

    await page.screenshot({
        path: 'verification/period-selector-01-financial-summary.png',
    });

    await headerSelector.click();
    await page
        .getByRole('option', { name: 'February 2025', exact: true })
        .click();

    await expect(headerSelector).toContainText('February 2025');
    await expect(
        page.getByTestId('total-recorded-disbursements'),
    ).toContainText('250');
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'February 2025',
    );

    await page.screenshot({
        path: 'verification/period-selector-02-february.png',
    });

    await page.goto('/balance-sheet');

    await expect(
        page.getByRole('heading', { name: 'Balance Sheet' }),
    ).toBeVisible();
    await expect(page.getByTestId('period-selector')).toContainText(
        'February 2025',
    );
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'February 2025',
    );

    await page.goto('/transactions');

    await expect(
        page.getByRole('heading', { name: 'Transactions' }),
    ).toBeVisible();
    await expect(page.getByTestId('period-selector')).toContainText(
        'February 2025',
    );
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'February 2025',
    );
    await expect(page.getByText('February groceries')).toBeVisible();
    await expect(page.getByText('January groceries')).toHaveCount(0);

    await page.screenshot({
        path: 'verification/period-selector-03-transactions-persisted.png',
    });

    expect(consoleErrors).toEqual([]);
});
