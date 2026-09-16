import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

test.beforeAll(() => {
    resetBrowserState();
});

test.beforeEach(async ({ page }) => {
    await loginAsBrowserTestUser(page);
});

test('feature 2: categories page shows the 45 active expense categories', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await page.goto('/categories');

    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole('heading', { name: 'Expense Categories' })).toBeVisible();
    await expect(page.getByText('Total categories: 45')).toBeVisible();
    await expect(page.getByText('C040')).toHaveCount(0);
    await expect(page.getByText('C031')).toHaveCount(1);

    expect(consoleErrors).toEqual([]);
});

test('feature 3: categories show both Spanish and English names', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await page.goto('/categories');

    await expect(page.getByTestId('category-language-toggle')).toBeVisible();

    await page.getByTestId('category-language-toggle-es').click();
    await expect(page.getByTestId('category-name-C001')).toContainText('MERCADO');
    await expect(page.getByTestId('category-name-C001')).toContainText('ES:');

    await page.getByTestId('category-language-toggle-en').click();
    await expect(page.getByTestId('category-name-C001')).toContainText('Groceries');
    await expect(page.getByTestId('category-name-C001')).toContainText('EN:');

    expect(consoleErrors).toEqual([]);
});

test('feature 4: debt categories display a debt indicator', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    await page.goto('/categories');

    const debtCategoryCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'C009' });
    const nonDebtCategoryCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'C001' });

    await expect(debtCategoryCard.getByText('Debt')).toBeVisible();
    await expect(nonDebtCategoryCard.getByText('Debt')).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
});

test('feature 89: system prevents deletion of category that has associated transactions', async ({
    page,
    request,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Step 1: Create a transaction with category C001 via API (stable setup)
    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categoriesPayload = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const c001 = categoriesPayload.data.find((item) => item.code === 'C001');
    expect(c001).toBeTruthy();

    const createResponse = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 100.0,
            comments: 'Test transaction for delete verification',
        },
    });
    expect(createResponse.ok()).toBeTruthy();

    // Step 2: Navigate to categories page
    await page.goto('/categories');
    await expect(page).toHaveURL(/\/categories$/);

    // Step 3 & 4: Attempt to delete category C001 and verify prevention
    const c001Card = page.locator('[data-slot="card"]').filter({ hasText: 'C001' });
    const dialogMessages: string[] = [];

    page.on('dialog', async (dialog) => {
        dialogMessages.push(dialog.message());
        await dialog.accept();
    });

    await c001Card.getByRole('button', { name: /Delete C001/i }).click();

    // confirm() then alert() — wait until both have been handled
    await expect.poll(() => dialogMessages.length).toBeGreaterThanOrEqual(2);
    expect(dialogMessages[0]).toContain('C001');
    expect(dialogMessages[1].toLowerCase()).toMatch(/transaction|cannot be deleted/);

    // Step 5: Verify C001 still exists on the page
    await expect(page.getByText('C001')).toBeVisible();
    await expect(page.getByTestId('category-name-C001')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
