import { test, expect } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Live verification against the running app (no migrate:fresh).
 * Covers core dashboard + YTD reports (#105) + reconciliation variance warning (#106).
 */
test.describe('Session 57 live verification', () => {
    test('dashboard and YTD reports load', async ({ page }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);

        await expect(page).toHaveURL(/\/dashboard$/);
        await page.screenshot({
            path: 'verification/session-57/01-dashboard.png',
            fullPage: true,
        });

        await page.goto('/reports/year-to-date?year=2025');
        await expect(
            page.getByTestId('reports-ytd-heading'),
        ).toContainText('Year-to-Date Reports');
        await expect(page.getByTestId('ytd-income-card')).toBeVisible();
        await expect(page.getByTestId('ytd-expenses-card')).toBeVisible();
        await expect(page.getByTestId('ytd-net-card')).toBeVisible();
        await page.screenshot({
            path: 'verification/session-57/02-ytd-reports-2025.png',
            fullPage: true,
        });

        await page.getByTestId('year-select').click();
        await page.getByTestId('year-option-2026').click();
        await expect(page.getByTestId('ytd-summary-card')).toContainText(
            '2026',
        );
        await page.screenshot({
            path: 'verification/session-57/03-ytd-reports-2026.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });

    test('reconciliation shows variance warning for large variance', async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);

        await page.evaluate(async () => {
            const accountResponse = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Session 57 Variance Account',
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
                    recorded_balance_cad: '1000.00',
                    recorded_balance_usd: '0.00',
                    recorded_balance_cop: '0.00',
                }),
            });

            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();

            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: '2025-01-15',
                    period: '202501',
                    quincena: 'Q1',
                    category_id: categories.data[0].id,
                    account_id: account.data.id,
                    amount_cad: '25.00',
                    comments: 'Session 57 large variance',
                }),
            });
        });

        await page.goto('/reconciliation');
        await page.locator('#period-input').fill('202501');
        await page.getByRole('button', { name: 'View Reconciliation' }).click();

        await expect(
            page.getByTestId('reconciliation-status'),
        ).toBeVisible();

        const warning = page
            .locator('[data-account-name="Session 57 Variance Account"]')
            .getByTestId(/^variance-warning-\d+$/);
        await expect(warning).toBeVisible({ timeout: 10000 });

        await page.screenshot({
            path: 'verification/session-57/04-reconciliation-variance-warning.png',
            fullPage: true,
        });

        const investigate = page
            .locator('[data-testid^="investigate-link-"]')
            .first();
        await expect(investigate).toBeVisible();

        expect(consoleErrors).toEqual([]);
    });
});
