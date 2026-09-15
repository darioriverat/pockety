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

test('feature: user can navigate to different periods using period selector', async ({
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

    await request.post('/api/exchange-rates', {
        data: {
            period: '202502',
            usd_cop: 4500,
            usd_cad: 0.8,
            cad_cop: 3100,
        },
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
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 100,
            comments: 'January groceries',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-02-10',
            period: '202502',
            quincena: 'Q1',
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
    await expect(headerSelector).toContainText('January 2025');

    await expect(page.getByTestId('total-recorded-disbursements')).toContainText(
        '100',
    );

    await page.screenshot({
        path: 'verification/period-selector-01-financial-summary.png',
    });

    await headerSelector.click();
    await page.getByRole('option', { name: 'February 2025', exact: true }).click();

    await expect(headerSelector).toContainText('February 2025');
    await expect(page.getByTestId('total-recorded-disbursements')).toContainText(
        '250',
    );
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
