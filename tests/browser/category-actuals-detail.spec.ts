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

test('feature 88: click category in actuals to see detailed transactions', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await loginAsBrowserTestUser(page);

    const categoriesResponse = await request.get('/api/categories');
    const categoriesPayload = await categoriesResponse.json();
    const categories: ApiCategory[] = categoriesPayload.data;
    const c001 = categories.find((category) => category.code === 'C001');
    const c004 = categories.find((category) => category.code === 'C004');
    expect(c001).toBeTruthy();
    expect(c004).toBeTruthy();

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name: 'RBC Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const accountPayload = await accountResponse.json();
    const accountId = accountPayload.data.id as number;

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            account_id: accountId,
            amount_cad: 55.5,
            comments: 'detail-c001-first',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-18',
            period: '202501',
            quincena: 'Q2',
            category_id: c001!.id,
            account_id: accountId,
            amount_cad: 22.25,
            comments: 'detail-c001-second',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-20',
            period: '202501',
            quincena: 'Q2',
            category_id: c004!.id,
            account_id: accountId,
            amount_cad: 99.0,
            comments: 'detail-c004-other',
        },
    });

    await page.goto('/category-actuals');
    await expect(
        page.getByTestId('category-actuals-heading'),
    ).toBeVisible();

    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: /January 2025/i }).click();

    await expect(page.getByTestId('category-actual-link-C001')).toBeVisible();
    await expect(page.getByTestId('category-actual-tx-C001')).toHaveText('2');

    await page.screenshot({
        path: 'verification/test-88-category-detail/01-actuals-before-click.png',
        fullPage: false,
    });

    await page.getByTestId('category-actual-link-C001').click();

    await expect(page).toHaveURL(/\/transactions\?/);
    await expect
        .poll(() => {
            const url = new URL(page.url());
            return `${url.searchParams.get('period')}|${url.searchParams.get('category')}`;
        })
        .toBe('202501|C001');
    await expect(page.getByTestId('transactions-page')).toBeVisible();
    await expect(page.getByTestId('category-detail-banner')).toBeVisible();
    await expect(page.getByTestId('category-detail-heading')).toContainText(
        'C001',
    );
    await expect(page.getByTestId('category-detail-count')).toContainText('2');

    await expect(page.getByText('detail-c001-first')).toBeVisible();
    await expect(page.getByText('detail-c001-second')).toBeVisible();
    await expect(page.getByText('detail-c004-other')).toHaveCount(0);

    const firstRow = page
        .locator('[data-testid^="transaction-row-"]')
        .filter({ hasText: 'detail-c001-first' });
    await expect(firstRow).toBeVisible();
    await expect(firstRow.getByText('Date:')).toBeVisible();
    await expect(firstRow.getByText('2025-01-05')).toBeVisible();
    await expect(firstRow.getByText('$55.50')).toBeVisible();
    await expect(firstRow.getByText('Comments:')).toBeVisible();
    await expect(firstRow.getByText('detail-c001-first')).toBeVisible();
    await expect(firstRow.getByText('Account:')).toBeVisible();
    await expect(firstRow.getByText('RBC Checking')).toBeVisible();

    await page.screenshot({
        path: 'verification/test-88-category-detail/02-c001-detail-list.png',
        fullPage: false,
    });

    await page.screenshot({
        path: 'verification/test-88-category-detail/03-full-page.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
