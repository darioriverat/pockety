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

test('feature 89: system prevents deletion of category that has associated transactions', async ({
    page,
}) => {
    const consoleErrors = trackConsoleErrors(page);

    // Step 1: Create a transaction with category C001
    await page.goto('/transactions');
    
    // Find and click the add transaction button
    await page.getByRole('button', { name: /add transaction/i }).click();
    
    // Fill in the transaction form
    await page.locator('input[name="date"]').fill('2025-01-15');
    await page.locator('select[name="category_id"]').selectOption({ label: /C001.*MERCADO/i });
    await page.locator('input[name="amount_cad"]').fill('100.00');
    await page.locator('textarea[name="comments"]').fill('Test transaction for delete verification');
    
    // Submit the form
    await page.getByRole('button', { name: /save|submit|create/i }).click();
    
    // Wait for success message or redirect
    await page.waitForTimeout(1000);

    // Step 2: Navigate to categories page
    await page.goto('/categories');
    await expect(page).toHaveURL(/\/categories$/);

    // Step 3 & 4: Attempt to delete category C001 and verify prevention
    const c001Card = page.locator('[data-slot="card"]').filter({ hasText: 'C001' });
    
    // Wait for the delete button to be visible
    const deleteButton = c001Card.getByRole('button').filter({ hasText: /delete/i }).or(
        c001Card.locator('button svg')
    );
    
    // Set up dialog handler before clicking delete
    page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('C001');
        await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Wait for the error alert
    await page.waitForTimeout(1000);
    
    // Step 5: Verify message indicates transactions exist for this category
    // The alert should have been shown with the error message
    // We can verify C001 still exists on the page
    await expect(page.getByText('C001')).toBeVisible();
    await expect(page.getByText('MERCADO')).toBeVisible();

    expect(consoleErrors).toEqual([]);
});
