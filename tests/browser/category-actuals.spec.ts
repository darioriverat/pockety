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

test('feature 86: category actuals aggregates by category and period', async ({
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
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 100.0,
            comments: 'actuals-first',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-12',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 50.25,
            comments: 'actuals-second',
        },
    });

    await page.goto('/category-actuals');
    await expect(
        page.getByTestId('category-actuals-heading'),
    ).toBeVisible();
    await expect(page.getByTestId('category-actuals-table')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-86-category-actuals/01-report-initial.png',
        fullPage: false,
    });

    await expect(page.getByTestId('category-actual-amount-C001')).toContainText(
        '150.25',
    );
    await expect(page.getByTestId('category-actual-tx-C001')).toHaveText('2');

    await expect(page.getByTestId('category-actuals-count')).toHaveText('46');

    const rows = page.locator('[data-testid^="category-actual-row-"]');
    await expect(rows).toHaveCount(46);
    await expect(page.getByTestId('category-actual-row-C040')).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-86-category-actuals/02-c001-total.png',
        fullPage: false,
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-28',
            period: '202501',
            quincena: 'Q2',
            category_id: c001!.id,
            amount_cad: 42.5,
            comments: 'actuals-third',
        },
    });

    await page.getByTestId('category-actuals-refresh').click();

    await expect(page.getByTestId('category-actual-amount-C001')).toContainText(
        '192.75',
    );
    await expect(page.getByTestId('category-actual-tx-C001')).toHaveText('3');

    await page.screenshot({
        path: 'verification/test-86-category-actuals/03-after-refresh.png',
        fullPage: false,
    });

    await page.screenshot({
        path: 'verification/test-86-category-actuals/04-full-page.png',
        fullPage: true,
    });

    await expect(
        page.locator('[data-sidebar="menu-button"]', {
            hasText: 'Category Actuals',
        }),
    ).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
