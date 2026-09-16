import { expect, test, type APIRequestContext } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function getCategoryId(
    request: APIRequestContext,
    code = 'C001',
): Promise<number> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = body.data.find((item) => item.code === code);
    expect(category).toBeTruthy();
    return category!.id;
}

async function createAccount(request: APIRequestContext): Promise<number> {
    const response = await request.post('/api/accounts', {
        data: {
            name: 'Category History Checking',
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { data: { id: number } };
    return body.data.id;
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 98: user can view all transactions for a category across periods', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categoryId = await getCategoryId(request, 'C001');
    const accountId = await createAccount(request);

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 100,
            comments: 'cat-hist-jan',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-02-12',
            period: '202502',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 250.5,
            comments: 'cat-hist-feb',
        },
    });

    // Step 1: Navigate to categories page
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Expense Categories' })).toBeVisible();

    await page.screenshot({
        path: 'verification/test-98-category-history/01-categories-list.png',
        fullPage: false,
    });

    // Step 2: Click on category C001
    await page.getByTestId('category-link-C001').click();
    await expect(page).toHaveURL(/\/categories\/C001$/);
    await expect(page.getByTestId('category-detail-page')).toBeVisible();
    await expect(page.getByTestId('category-detail-heading')).toContainText(
        'C001 — Groceries',
    );

    // Step 3: Verify all C001 transactions across all periods are shown
    await expect(page.getByText('cat-hist-jan')).toBeVisible();
    await expect(page.getByText('cat-hist-feb')).toBeVisible();
    await expect(page.getByTestId('category-transactions-table')).toBeVisible();
    await expect(page.getByTestId('category-transaction-count')).toHaveText('2');

    await page.screenshot({
        path: 'verification/test-98-category-history/02-all-periods.png',
        fullPage: true,
    });

    // Step 5 (before filter): Verify total spending for that category is displayed
    await expect(page.getByTestId('category-total-spending')).toContainText(
        '$350.50',
    );

    // Step 4: Verify transactions can be filtered by period
    await page.getByTestId('filter-period').selectOption('202501');
    await page.getByTestId('apply-period-filter').click();

    await expect(page.getByTestId('active-period-filter')).toBeVisible();
    await expect(page.getByText('cat-hist-jan')).toBeVisible();
    await expect(page.getByText('cat-hist-feb')).toHaveCount(0);
    await expect(page.getByTestId('category-total-spending')).toContainText(
        '$100.00',
    );
    await expect(page.getByTestId('category-transaction-count')).toHaveText('1');

    await page.screenshot({
        path: 'verification/test-98-category-history/03-filtered-202501.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

test('feature 99: category details show summary statistics', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categoryId = await getCategoryId(request, 'C001');
    const accountId = await createAccount(request);

    await request.post('/api/transactions', {
        data: {
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 100,
            comments: 'stats-jan',
        },
    });

    await request.post('/api/transactions', {
        data: {
            date: '2025-02-12',
            period: '202502',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 250.5,
            comments: 'stats-feb',
        },
    });

    // Step 1: Navigate to category details for C001
    await page.goto('/categories/C001');
    await expect(page.getByTestId('category-detail-page')).toBeVisible();

    // Step 2: Verify total amount spent across all periods is shown
    await expect(page.getByTestId('category-total-spending')).toContainText(
        '$350.50',
    );

    // Step 3: Verify average spending per period is calculated
    await expect(page.getByTestId('category-average-spending')).toContainText(
        '$175.25',
    );

    // Step 4: Verify number of periods with transactions is shown
    await expect(page.getByTestId('category-period-count')).toHaveText('2');

    // Step 5: Verify number of total transactions is shown
    await expect(page.getByTestId('category-transaction-count')).toHaveText('2');

    await page.screenshot({
        path: 'verification/test-98-category-history/04-summary-stats-feature-99.png',
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});
