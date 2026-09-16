import { test, expect } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

/**
 * Test #106: System shows warning when variance exceeds acceptable threshold
 *
 * This test verifies that:
 * 1. Warning icon is displayed when account variance > $10
 * 2. Tooltip explains the variance
 * 3. User can click to investigate transactions
 */

test.beforeAll(() => {
    resetBrowserState();
});

test.describe('Reconciliation - Variance Warnings', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsBrowserTestUser(page);

        // Seed test data: Create account with significant variance
        await page.evaluate(async () => {
            // This will be executed in the browser context
            // Create an account with a large variance through the API
            const accountResponse = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Variance Account',
                    type: 'bank',
                    primary_currency: 'CAD',
                }),
            });
            const account = await accountResponse.json();

            // Create a balance with recorded amount
            await fetch('/api/account-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: account.data.id,
                    period: '202501',
                    recorded_balance_cad: '1000.00',
                    recorded_balance_usd: '0.00',
                    recorded_balance_cop: '0.00',
                }),
            });

            // Create a transaction to cause variance
            // Transaction will reduce computed balance, creating a variance > $10
            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            const firstCategory = categories.data[0];

            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2025-01-15',
                    period: '202501',
                    quincena: 'Q1',
                    category_id: firstCategory.id,
                    account_id: account.data.id,
                    amount_cad: '25.00', // Creates variance of $25
                    comments: 'Test transaction for variance',
                }),
            });
        });
    });

    test('shows warning icon when variance exceeds $10 threshold', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        // Step 1: Navigate to account reconciliation
        await page.goto('/reconciliation');
        await expect(page.locator('h1')).toContainText('Reconciliation');

        // Load reconciliation for period 202501
        await page.fill('input#period-input', '202501');
        await page.click('button[type="submit"]');

        // Wait for data to load
        await page.waitForSelector('[data-testid^="account-reconciliation-"]', { timeout: 5000 });

        // Step 2: Verify variance exists (should be > $10)
        // Find the Test Variance Account card
        const accountCard = page.locator('[data-account-name="Test Variance Account"]');
        await expect(accountCard).toBeVisible();

        // Step 3: Verify warning icon is shown
        const warningIcon = accountCard.locator('[data-testid^="variance-warning-"]');
        await expect(warningIcon).toBeVisible();

        // Take screenshot of variance warning
        await page.screenshot({ path: 'verification/test-106-variance-warning.png', fullPage: true });

        // Step 4: Verify tooltip message explains the variance
        // Hover over warning icon to show tooltip
        await warningIcon.hover();
        await page.waitForTimeout(500); // Wait for tooltip to appear

        const tooltip = page.locator('[data-testid^="variance-tooltip-"]');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Significant Variance Detected');
        await expect(tooltip).toContainText('$10.00 threshold');

        // Take screenshot of tooltip
        await page.screenshot({ path: 'verification/test-106-variance-tooltip.png', fullPage: true });

        // Step 5: Verify user can click to investigate transactions
        const investigateLink = accountCard.locator('[data-testid^="investigate-link-"]');
        await expect(investigateLink).toBeVisible();
        await expect(investigateLink).toContainText('Investigate Transactions');

        // Click the investigate link
        await investigateLink.click();

        // Should navigate to account details page with period parameter
        await expect(page).toHaveURL(/\/accounts\/\d+\?period=202501/);

        // Take screenshot of account details page
        await page.screenshot({ path: 'verification/test-106-investigate-transactions.png', fullPage: true });

        expect(consoleErrors).toEqual([]);
    });

    test('does not show warning for accounts with variance below threshold', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        // Create an account with small variance (< $10)
        await page.evaluate(async () => {
            const accountResponse = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Small Variance Account',
                    type: 'bank',
                    primary_currency: 'CAD',
                }),
            });
            const account = await accountResponse.json();

            await fetch('/api/account-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: account.data.id,
                    period: '202501',
                    recorded_balance_cad: '500.00',
                    recorded_balance_usd: '0.00',
                    recorded_balance_cop: '0.00',
                }),
            });

            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            const firstCategory = categories.data[0];

            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2025-01-15',
                    period: '202501',
                    quincena: 'Q1',
                    category_id: firstCategory.id,
                    account_id: account.data.id,
                    amount_cad: '5.00', // Creates variance of only $5
                    comments: 'Small variance transaction',
                }),
            });
        });

        await page.goto('/reconciliation');
        await page.fill('input#period-input', '202501');
        await page.click('button[type="submit"]');

        await page.waitForSelector('[data-testid^="account-reconciliation-"]', { timeout: 5000 });

        const accountCard = page.locator('[data-account-name="Small Variance Account"]');
        await expect(accountCard).toBeVisible();

        // Should show "Variance" badge but NO warning icon
        await expect(accountCard.locator('text=Variance')).toBeVisible();

        // Warning icon should NOT be present
        const warningIcon = accountCard.locator('[data-testid^="variance-warning-"]');
        await expect(warningIcon).not.toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'verification/test-106-no-warning-small-variance.png', fullPage: true });

        expect(consoleErrors).toEqual([]);
    });

    test('does not show warning for balanced accounts', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        // Create a balanced account
        await page.evaluate(async () => {
            const accountResponse = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Balanced Account',
                    type: 'bank',
                    primary_currency: 'CAD',
                }),
            });
            const account = await accountResponse.json();

            // Create balance without any transactions (perfectly balanced)
            await fetch('/api/account-balances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: account.data.id,
                    period: '202501',
                    recorded_balance_cad: '1000.00',
                    recorded_balance_usd: '0.00',
                    recorded_balance_cop: '0.00',
                }),
            });
        });

        await page.goto('/reconciliation');
        await page.fill('input#period-input', '202501');
        await page.click('button[type="submit"]');

        await page.waitForSelector('[data-testid^="account-reconciliation-"]', { timeout: 5000 });

        const accountCard = page.locator('[data-account-name="Balanced Account"]');
        await expect(accountCard).toBeVisible();

        // Should show "Balanced" badge
        await expect(accountCard.locator('text=Balanced')).toBeVisible();

        // Warning icon should NOT be present
        const warningIcon = accountCard.locator('[data-testid^="variance-warning-"]');
        await expect(warningIcon).not.toBeVisible();

        // Investigate link should NOT be present for balanced accounts
        const investigateLink = accountCard.locator('[data-testid^="investigate-link-"]');
        await expect(investigateLink).not.toBeVisible();

        // Take screenshot
        await page.screenshot({ path: 'verification/test-106-no-warning-balanced.png', fullPage: true });

        expect(consoleErrors).toEqual([]);
    });
});
