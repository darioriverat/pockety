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

        await page.goto('/reconciliation');
        await page.locator('#period-input').fill('202501');
        await page.getByRole('button', { name: 'View Reconciliation' }).click();

        await expect(
            page.getByTestId('reconciliation-status'),
        ).toBeVisible();

        // Existing seeded unbalanced account from prior sessions
        const warning = page.locator('[data-testid^="variance-warning-"]').first();
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
