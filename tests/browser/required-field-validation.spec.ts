import { test, expect } from '@playwright/test';

test.describe('Transaction Form - Required Field Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Seed test data
        // Note: In a real scenario, this would call the seeder endpoint
        await page.goto('/transactions');
        await page.waitForLoadState('networkidle');
    });

    test('displays error when date field is empty on submit', async ({ page }) => {
        // Open add transaction dialog
        await page.click('button:has-text("Add Transaction")');

        // Wait for dialog to be visible
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Clear the date field (it's pre-filled with today's date)
        const dateInput = page.locator('[data-testid="transaction-date-input"]');
        await dateInput.clear();

        // Try to submit
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify error message is displayed near date field
        const dateError = page.locator('[data-testid="date-error"]');
        await expect(dateError).toBeVisible();
        await expect(dateError).toHaveText('Date is required');

        // Verify form dialog is still open (form did not submit)
        await expect(page.locator('[data-testid="transaction-form-dialog"]')).toBeVisible();

        // Take screenshot
        await page.screenshot({
            path: 'verification/test-117-required-fields/01-date-error.png',
        });
    });

    test('displays error when period field is empty on submit', async ({ page }) => {
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Clear the period field
        const periodInput = page.locator('[data-testid="transaction-period-input"]');
        await periodInput.clear();

        // Submit
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify error
        const periodError = page.locator('[data-testid="period-error"]');
        await expect(periodError).toBeVisible();
        await expect(periodError).toHaveText('Period is required');

        await page.screenshot({
            path: 'verification/test-117-required-fields/02-period-error.png',
        });
    });

    test('displays error when category is not selected on submit', async ({ page }) => {
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Category is empty by default, just submit
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify error
        const categoryError = page.locator('[data-testid="category-error"]');
        await expect(categoryError).toBeVisible();
        await expect(categoryError).toHaveText('Category is required');

        await page.screenshot({
            path: 'verification/test-117-required-fields/03-category-error.png',
        });
    });

    test('displays error when amount field is empty on submit', async ({ page }) => {
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Amount is empty by default, just submit
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify error
        const amountError = page.locator('[data-testid="amount-error"]');
        await expect(amountError).toBeVisible();
        await expect(amountError).toHaveText('Amount is required');

        await page.screenshot({
            path: 'verification/test-117-required-fields/04-amount-error.png',
        });
    });

    test('clears date error when user fills in the field', async ({ page }) => {
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Clear date and submit to trigger error
        const dateInput = page.locator('[data-testid="transaction-date-input"]');
        await dateInput.clear();
        await page.click('[data-testid="transaction-form-submit"]');

        // Wait for error to appear
        const dateError = page.locator('[data-testid="date-error"]');
        await expect(dateError).toBeVisible();

        // Take screenshot with error
        await page.screenshot({
            path: 'verification/test-117-required-fields/05-before-filling-date.png',
        });

        // Fill in the date
        await dateInput.fill('2025-01-15');

        // Verify error is cleared
        await expect(dateError).not.toBeVisible();

        // Take screenshot with error cleared
        await page.screenshot({
            path: 'verification/test-117-required-fields/06-after-filling-date.png',
        });
    });

    test('displays multiple errors when multiple required fields are empty', async ({
        page,
    }) => {
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Clear date and period
        await page.locator('[data-testid="transaction-date-input"]').clear();
        await page.locator('[data-testid="transaction-period-input"]').clear();

        // Submit (date, period, category, amount all invalid/empty)
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify all errors are displayed
        await expect(page.locator('[data-testid="date-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="period-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="category-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();

        // Take screenshot showing all errors
        await page.screenshot({
            path: 'verification/test-117-required-fields/07-multiple-errors.png',
        });
    });
});
