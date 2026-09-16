import { test, expect } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

/**
 * Test #107: User can manually mark an account variance as reviewed/acknowledged
 */
test.beforeAll(() => {
    resetBrowserState();
});

test.describe('Reconciliation - Variance Acknowledgment', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsBrowserTestUser(page);

        await page.evaluate(async () => {
            const accountResponse = await fetch('/api/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: 'Ack Variance Account',
                    type: 'bank',
                    primary_currency: 'CAD',
                }),
            });
            const accountPayload = await accountResponse.json();
            const accountId = accountPayload.data.id as number;

            await fetch(`/api/accounts/${accountId}/balances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    period: '202501',
                    recorded_balance_cad: 1000,
                    recorded_balance_usd: 0,
                    recorded_balance_cop: 0,
                }),
            });

            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            const firstCategory = categories.data[0];

            await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    date: '2025-01-15',
                    period: '202501',
                    quincena: 'Q1',
                    category_id: firstCategory.id,
                    account_id: accountId,
                    amount_cad: 75,
                    comments: 'Creates variance for acknowledgment test',
                }),
            });
        });
    });

    test('acknowledges variance with optional note and shows reviewed indicator', async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);

        await page.goto('/reconciliation');
        await expect(page.locator('h1')).toContainText('Reconciliation');

        await page.locator('#period-input').fill('202501');
        await page.getByRole('button', { name: 'View Reconciliation' }).click();

        const accountCard = page.locator(
            '[data-account-name="Ack Variance Account"]',
        );
        await expect(accountCard).toBeVisible();

        const accountTestId = await accountCard.getAttribute('data-testid');
        const accountId = accountTestId?.replace(
            'account-reconciliation-',
            '',
        );
        expect(accountId).toBeTruthy();

        await page.screenshot({
            path: 'verification/test-107-acknowledge-variance/01-unbalanced-before-ack.png',
            fullPage: true,
        });

        await page.getByTestId(`acknowledge-variance-${accountId}`).click();
        await expect(
            page.getByTestId('acknowledge-variance-dialog'),
        ).toBeVisible();

        await page
            .getByTestId('acknowledge-note-input')
            .fill('Timing difference pending statement');
        await page.screenshot({
            path: 'verification/test-107-acknowledge-variance/02-acknowledge-dialog.png',
            fullPage: true,
        });

        await page.getByTestId('acknowledge-submit').click();

        await expect(
            page.getByTestId(`variance-reviewed-${accountId}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`variance-reviewed-${accountId}`),
        ).toContainText('Reviewed');
        await expect(
            page.getByTestId(`variance-review-note-${accountId}`),
        ).toContainText('Timing difference pending statement');

        await expect(
            accountCard.getByTestId('variance-amount').first(),
        ).toContainText('$75.00');

        await page.screenshot({
            path: 'verification/test-107-acknowledge-variance/03-reviewed-indicator.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
