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

    await expect(page.locator('[data-slot="card"]').filter({ hasText: 'C001' }).getByText('ES:')).toBeVisible();
    await expect(page.getByText('MERCADO')).toBeVisible();
    await expect(page.locator('[data-slot="card"]').filter({ hasText: 'C001' }).getByText('EN:')).toBeVisible();
    await expect(page.getByText('Groceries')).toBeVisible();

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
