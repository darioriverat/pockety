import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Error messages with icons', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://dev.pockety.com:8080/transactions');
        await page.waitForLoadState('networkidle');
    });

    test('error messages are displayed in red with clear icon', async ({
        page,
    }) => {
        // Click Add Transaction button
        await page.click('button:has-text("Add Transaction")');

        // Wait for dialog to appear
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Clear the date field (it may have a default value)
        await page.fill('[data-testid="transaction-date-input"]', '');

        // Set an invalid amount (negative)
        await page.fill('[data-testid="transaction-amount-input"]', '-100');

        // Click submit button to trigger validation
        await page.click('[data-testid="transaction-form-submit"]');

        // Wait for error messages to appear
        await page.waitForSelector('[data-testid="date-error"]');
        await page.waitForSelector('[data-testid="amount-error"]');
        await page.waitForSelector('[data-testid="category-error"]');

        // Verify date error message
        const dateError = page.locator('[data-testid="date-error"]');
        await expect(dateError).toBeVisible();
        await expect(dateError).toHaveText(/Date is required/);

        // Verify the error has an icon (svg element)
        const dateErrorIcon = dateError.locator('svg').first();
        await expect(dateErrorIcon).toBeVisible();

        // Verify amount error message
        const amountError = page.locator('[data-testid="amount-error"]');
        await expect(amountError).toBeVisible();
        await expect(amountError).toHaveText(
            /Amount must be a positive number/,
        );

        // Verify the error has an icon
        const amountErrorIcon = amountError.locator('svg').first();
        await expect(amountErrorIcon).toBeVisible();

        // Verify category error message
        const categoryError = page.locator('[data-testid="category-error"]');
        await expect(categoryError).toBeVisible();
        await expect(categoryError).toHaveText(/Category is required/);

        // Verify the error has an icon
        const categoryErrorIcon = categoryError.locator('svg').first();
        await expect(categoryErrorIcon).toBeVisible();

        // Take a screenshot
        const verificationDir = path.join(
            process.cwd(),
            'verification',
            'test-150-error-messages',
        );
        if (!fs.existsSync(verificationDir)) {
            fs.mkdirSync(verificationDir, { recursive: true });
        }

        await page.screenshot({
            path: path.join(verificationDir, 'error-messages-with-icons.png'),
            fullPage: true,
        });

        // Verify error messages are displayed in red (text-destructive class)
        // In Tailwind, text-destructive is typically a red color
        const dateErrorClass = await dateError.getAttribute('class');
        expect(dateErrorClass).toContain('text-destructive');

        const amountErrorClass = await amountError.getAttribute('class');
        expect(amountErrorClass).toContain('text-destructive');

        const categoryErrorClass = await categoryError.getAttribute('class');
        expect(categoryErrorClass).toContain('text-destructive');

        // Verify icons have proper sizing classes
        const dateIconClass = await dateErrorIcon.getAttribute('class');
        expect(dateIconClass).toContain('h-4');
        expect(dateIconClass).toContain('w-4');

        // Verify error messages are positioned near the relevant field
        // Date error should be below date input
        const dateInput = page.locator('[data-testid="transaction-date-input"]');
        const dateInputBox = await dateInput.boundingBox();
        const dateErrorBox = await dateError.boundingBox();

        if (dateInputBox && dateErrorBox) {
            // Error should be below the input (y position greater)
            expect(dateErrorBox.y).toBeGreaterThan(dateInputBox.y);
            // Error should be relatively close (within 100px)
            expect(dateErrorBox.y - dateInputBox.y).toBeLessThan(100);
        }

        console.log('✓ Error messages displayed in red with clear icons');
        console.log('✓ Icons are present and visible');
        console.log('✓ Error messages are positioned near relevant fields');
    });
});
