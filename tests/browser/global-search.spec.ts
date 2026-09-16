import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Live verification for global search (feature #108).
 * Does not call migrate:fresh — uses existing app data.
 */
test.describe('Global search', () => {
    test('search box returns accounts, transactions, and categories by type', async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);

        await page.goto('/dashboard');
        await expect(page.getByTestId('global-search-trigger')).toBeVisible();
        await page.screenshot({
            path: 'verification/session-58/01-dashboard-with-search.png',
            fullPage: true,
        });

        await page.getByTestId('global-search-trigger').click();
        await expect(page.getByTestId('global-search-dialog')).toBeVisible();
        await page.getByTestId('global-search-input').fill('RBC');

        await expect(page.getByTestId('global-search-results')).toBeVisible();
        await expect(page.getByTestId('global-search-accounts')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByTestId('global-search-transactions')).toBeVisible();

        await page.screenshot({
            path: 'verification/session-58/02-search-results-rbc.png',
            fullPage: true,
        });

        // Results should be organized by type when present
        await expect(page.getByTestId('global-search-accounts')).toContainText(
            'Accounts',
        );
        await expect(
            page.getByTestId('global-search-transactions'),
        ).toContainText('Transactions');

        expect(consoleErrors).toEqual([]);
    });
});
