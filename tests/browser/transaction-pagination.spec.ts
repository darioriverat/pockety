import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

async function getCategoryId(request: APIRequestContext): Promise<number> {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const category = body.data.find((item) => item.code === 'C001') ?? body.data[0];
    expect(category).toBeTruthy();
    return category.id;
}

async function seedTransactions(
    request: APIRequestContext,
    categoryId: number,
    count: number,
): Promise<void> {
    for (let i = 1; i <= count; i++) {
        const day = ((i - 1) % 28) + 1;
        const response = await request.post('/api/transactions', {
            data: {
                date: `2026-09-${String(day).padStart(2, '0')}`,
                period: '202609',
                quincena: i <= 15 ? 'Q1' : 'Q2',
                category_id: categoryId,
                amount_cad: i,
                comments: `pagination-feature-92-${i}`,
            },
        });
        expect(response.ok()).toBeTruthy();
    }
}

async function openSeptember2026Transactions(page: Page): Promise<void> {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();

    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'September 2026', exact: true }).click();
    await expect(page.getByTestId('page-period-selector')).toContainText(
        'September 2026',
    );
}

test.beforeEach(async ({ page }) => {
    resetBrowserState();
    await loginAsBrowserTestUser(page);
});

test('feature 92: system supports pagination for large transaction lists', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);
    const categoryId = await getCategoryId(request);
    await seedTransactions(request, categoryId, 55);

    await openSeptember2026Transactions(page);

    await expect(page.getByTestId('transactions-total')).toContainText(
        'Total transactions: 55',
    );
    await expect(page.getByTestId('pagination-controls')).toBeVisible();
    await expect(page.getByTestId('page-size-select')).toBeVisible();
    await expect(page.getByTestId('pagination-status')).toContainText(
        'Page 1 of 2',
    );

    await page.getByTestId('page-size-select').click();
    await expect(page.getByRole('option', { name: '25', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: '50', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: '100', exact: true })).toBeVisible();
    await page.getByRole('option', { name: '50', exact: true }).click();

    const pageOneRows = page.locator('[data-testid^="transaction-row-"]');
    await expect(pageOneRows).toHaveCount(50);

    const firstPageFirstComment = await pageOneRows
        .first()
        .getAttribute('data-transaction-comments');

    await page.screenshot({
        path: 'verification/test-92-pagination/01-page-one-default.png',
        fullPage: false,
    });

    await page.getByTestId('pagination-next').click();
    await expect(page.getByTestId('pagination-status')).toContainText(
        'Page 2 of 2',
    );
    await expect(page.locator('[data-testid^="transaction-row-"]')).toHaveCount(5);

    const secondPageFirstComment = await page
        .locator('[data-testid^="transaction-row-"]')
        .first()
        .getAttribute('data-transaction-comments');
    expect(secondPageFirstComment).not.toBe(firstPageFirstComment);

    await page.screenshot({
        path: 'verification/test-92-pagination/02-page-two.png',
        fullPage: false,
    });

    await page.getByTestId('page-size-select').click();
    await page.getByRole('option', { name: '25', exact: true }).click();
    await expect(page.getByTestId('pagination-status')).toContainText(
        'Page 1 of 3',
    );
    await expect(page.locator('[data-testid^="transaction-row-"]')).toHaveCount(25);

    await page.screenshot({
        path: 'verification/test-92-pagination/03-page-size-25.png',
        fullPage: false,
    });

    expect(consoleErrors).toEqual([]);
});
