import { test, expect } from '@playwright/test';

test.describe('Transaction Success Messages', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to transactions page
        await page.goto('/transactions');
        await page.waitForLoadState('networkidle');
    });

    test('displays success message after creating a transaction', async ({ page }) => {
        // Open add transaction dialog
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        // Fill in the form
        await page.fill('[data-testid="transaction-date-input"]', '2025-01-15');
        await page.fill('[data-testid="transaction-period-input"]', '202501');
        
        // Select category
        await page.click('[aria-label="Category"]');
        await page.waitForSelector('text=Groceries');
        await page.click('text=Groceries');
        
        // Fill amount
        await page.fill('[data-testid="transaction-amount-input"]', '50.00');

        // Submit the form
        await page.click('[data-testid="transaction-form-submit"]');

        // Wait for and verify success toast
        const toast = page.locator('.sonner-toast:has-text("Transaction created successfully")');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Verify dialog is closed
        await expect(page.locator('[data-testid="transaction-form-dialog"]')).not.toBeVisible();

        // Take screenshot
        await page.screenshot({
            path: 'verification/test-118-success-messages/01-create-success.png',
        });
    });

    test('displays success message after updating a transaction', async ({ page }) => {
        // Wait for transactions to load
        await page.waitForSelector('[data-testid="transactions-page"]');
        
        // Find and click first edit button (if transactions exist)
        const editButtons = page.locator('[data-testid="edit-transaction-button"]');
        const count = await editButtons.count();
        
        if (count > 0) {
            await editButtons.first().click();
            await page.waitForSelector('[data-testid="transaction-form-dialog"]');

            // Update amount
            await page.fill('[data-testid="transaction-amount-input"]', '75.00');

            // Submit
            await page.click('[data-testid="transaction-form-submit"]');

            // Verify success toast
            const toast = page.locator('.sonner-toast:has-text("Transaction updated successfully")');
            await expect(toast).toBeVisible({ timeout: 5000 });

            // Take screenshot
            await page.screenshot({
                path: 'verification/test-118-success-messages/02-update-success.png',
            });
        } else {
            // Create a transaction first, then edit it
            await page.click('button:has-text("Add Transaction")');
            await page.waitForSelector('[data-testid="transaction-form-dialog"]');

            await page.fill('[data-testid="transaction-date-input"]', '2025-01-15');
            await page.fill('[data-testid="transaction-period-input"]', '202501');
            await page.click('[aria-label="Category"]');
            await page.waitForSelector('text=Groceries');
            await page.click('text=Groceries');
            await page.fill('[data-testid="transaction-amount-input"]', '50.00');
            await page.click('[data-testid="transaction-form-submit"]');
            
            // Wait for creation toast to disappear
            await page.waitForTimeout(2000);
            
            // Now edit the transaction
            await editButtons.first().click();
            await page.waitForSelector('[data-testid="transaction-form-dialog"]');
            await page.fill('[data-testid="transaction-amount-input"]', '75.00');
            await page.click('[data-testid="transaction-form-submit"]');

            const toast = page.locator('.sonner-toast:has-text("Transaction updated successfully")');
            await expect(toast).toBeVisible({ timeout: 5000 });

            await page.screenshot({
                path: 'verification/test-118-success-messages/02-update-success.png',
            });
        }
    });

    test('displays success message after deleting a transaction', async ({ page }) => {
        // First, ensure there's at least one transaction
        const deleteButtons = page.locator('button:has([aria-label*="delete" i])');
        let count = await deleteButtons.count();

        if (count === 0) {
            // Create a transaction first
            await page.click('button:has-text("Add Transaction")');
            await page.waitForSelector('[data-testid="transaction-form-dialog"]');

            await page.fill('[data-testid="transaction-date-input"]', '2025-01-15');
            await page.fill('[data-testid="transaction-period-input"]', '202501');
            await page.click('[aria-label="Category"]');
            await page.waitForSelector('text=Groceries');
            await page.click('text=Groceries');
            await page.fill('[data-testid="transaction-amount-input"]', '50.00');
            await page.click('[data-testid="transaction-form-submit"]');

            // Wait for creation toast to disappear
            await page.waitForTimeout(2000);
        }

        // Set up dialog handler
        page.on('dialog', dialog => dialog.accept());

        // Click delete on first transaction
        const deleteButton = page.locator('button:has([aria-label*="delete" i])').first();
        await deleteButton.click();

        // Verify success toast
        const toast = page.locator('.sonner-toast:has-text("Transaction deleted successfully")');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Take screenshot
        await page.screenshot({
            path: 'verification/test-118-success-messages/03-delete-success.png',
        });
    });

    test('success toast auto-dismisses after a few seconds', async ({ page }) => {
        // Create a transaction
        await page.click('button:has-text("Add Transaction")');
        await page.waitForSelector('[data-testid="transaction-form-dialog"]');

        await page.fill('[data-testid="transaction-date-input"]', '2025-01-15');
        await page.fill('[data-testid="transaction-period-input"]', '202501');
        await page.click('[aria-label="Category"]');
        await page.waitForSelector('text=Groceries');
        await page.click('text=Groceries');
        await page.fill('[data-testid="transaction-amount-input"]', '50.00');
        await page.click('[data-testid="transaction-form-submit"]');

        // Verify toast appears
        const toast = page.locator('.sonner-toast:has-text("Transaction created successfully")');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Take screenshot while visible
        await page.screenshot({
            path: 'verification/test-118-success-messages/04-toast-visible.png',
        });

        // Wait for auto-dismiss (Sonner default is ~4 seconds)
        await page.waitForTimeout(5000);

        // Verify toast has been dismissed
        await expect(toast).not.toBeVisible();

        // Take screenshot after dismissal
        await page.screenshot({
            path: 'verification/test-118-success-messages/05-toast-dismissed.png',
        });
    });
});
