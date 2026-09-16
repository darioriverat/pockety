import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Live verification for global search (feature #108).
 * Creates a transaction with "RBC" in comments so comment matching is covered.
 */
test.describe('Global search', () => {
    test('search box returns accounts, transactions, and categories by type', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);

        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesPayload = (await categoriesResponse.json()) as {
            data: Array<{ id: number; code: string }>;
        };
        const category =
            categoriesPayload.data.find((item) => item.code === 'C001') ??
            categoriesPayload.data[0];
        expect(category).toBeTruthy();

        const accountsResponse = await request.get('/api/accounts');
        expect(accountsResponse.ok()).toBeTruthy();
        const accountsPayload = (await accountsResponse.json()) as {
            data: Array<{ id: number; name: string }>;
        };
        const rbcAccount =
            accountsPayload.data.find((item) =>
                item.name.toUpperCase().includes('RBC'),
            ) ?? accountsPayload.data[0];
        expect(rbcAccount).toBeTruthy();

        const createResponse = await request.post('/api/transactions', {
            data: {
                date: '2025-01-15',
                period: '202501',
                quincena: 'Q1',
                category_id: category.id,
                account_id: rbcAccount.id,
                amount_cad: 12.34,
                comments: 'Transfer from RBC online for search verification',
            },
        });
        expect(createResponse.ok()).toBeTruthy();

        await page.goto('/dashboard');
        await expect(page.getByTestId('global-search-trigger')).toBeVisible();
        await page.screenshot({
            path: 'verification/session-59/01-dashboard-with-search.png',
            fullPage: true,
        });

        await page.getByTestId('global-search-trigger').click();
        await expect(page.getByTestId('global-search-dialog')).toBeVisible();
        await page.getByTestId('global-search-input').fill('RBC');

        await expect(page.getByTestId('global-search-results')).toBeVisible();
        await expect(page.getByTestId('global-search-accounts')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByTestId('global-search-transactions')).toBeVisible({
            timeout: 10000,
        });

        await page.screenshot({
            path: 'verification/session-59/02-search-results-rbc.png',
            fullPage: true,
        });

        await expect(page.getByTestId('global-search-accounts')).toContainText(
            'Accounts',
        );
        await expect(
            page.getByTestId('global-search-transactions'),
        ).toContainText('Transactions');

        expect(consoleErrors).toEqual([]);
    });
});
