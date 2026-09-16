import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Live verification for duplicate transaction (feature #110).
 */
test.describe('Duplicate transaction', () => {
    test('user can duplicate a transaction with updated date', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await loginAsBrowserTestUser(page);

        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesPayload = (await categoriesResponse.json()) as {
            data: Array<{ id: number; code: string; name_en: string }>;
        };
        const c001 = categoriesPayload.data.find((item) => item.code === 'C001');
        expect(c001).toBeTruthy();

        const createResponse = await request.post('/api/transactions', {
            data: {
                date: '2025-01-18',
                period: '202501',
                quincena: 'Q1',
                category_id: c001!.id,
                amount_cad: 33.25,
                comments: 'Duplicate source txn',
            },
        });
        expect(createResponse.ok()).toBeTruthy();
        const created = (await createResponse.json()) as {
            data: { id: number };
        };
        const sourceId = created.data.id;

        await page.goto('/transactions');
        await expect(page.getByTestId('transactions-heading')).toBeVisible();
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2025', exact: true }).click();

        await expect(page.getByTestId(`transaction-row-${sourceId}`)).toBeVisible({
            timeout: 10000,
        });

        await page.screenshot({
            path: 'verification/session-60/01-transactions-before-duplicate.png',
            fullPage: true,
        });

        await page.getByTestId(`duplicate-transaction-${sourceId}`).click();
        await expect(page.getByTestId('transaction-form-dialog')).toBeVisible();
        await expect(page.getByTestId('transaction-form-title')).toHaveText(
            'Duplicate Transaction',
        );
        await expect(page.getByTestId('transaction-date-input')).toHaveValue(
            '2025-01-18',
        );
        await expect(page.getByTestId('transaction-amount-input')).toHaveValue(
            '33.25',
        );

        await page.screenshot({
            path: 'verification/session-60/02-duplicate-form-prefilled.png',
            fullPage: true,
        });

        const today = new Date().toISOString().split('T')[0];
        const todayPeriod = today.slice(0, 7).replace('-', '');

        await page.getByTestId('transaction-date-input').fill(today);
        await page.getByTestId('transaction-period-input').fill(todayPeriod);

        await page.screenshot({
            path: 'verification/session-60/03-duplicate-form-date-updated.png',
            fullPage: true,
        });

        await page.getByTestId('transaction-form-submit').click();
        await expect(page.getByTestId('transaction-form-dialog')).toHaveCount(0);

        // Switch to current period to find the new duplicate
        await page.getByTestId('page-period-selector').click();
        const periodLabel = new Date().toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
        });
        await page.getByRole('option', { name: periodLabel, exact: true }).click();

        await expect(
            page.getByText('Duplicate source txn').first(),
        ).toBeVisible({ timeout: 10000 });

        const listResponse = await request.get(
            `/api/transactions?period=${todayPeriod}&search=${encodeURIComponent('Duplicate source txn')}`,
        );
        expect(listResponse.ok()).toBeTruthy();
        const listPayload = (await listResponse.json()) as {
            data: Array<{
                id: number;
                date: string;
                amount_cad: number | null;
                comments: string | null;
                category: { code: string };
            }>;
        };
        const duplicates = listPayload.data.filter(
            (item) =>
                item.comments === 'Duplicate source txn' &&
                item.id !== sourceId &&
                item.date === today,
        );
        expect(duplicates.length).toBeGreaterThanOrEqual(1);
        expect(duplicates[0].amount_cad).toBe(33.25);
        expect(duplicates[0].category.code).toBe('C001');

        await expect(
            page.getByTestId(`transaction-row-${duplicates[0].id}`),
        ).toBeVisible();
        await expect(
            page.getByTestId(`transaction-comments-${duplicates[0].id}`),
        ).toContainText('Duplicate source txn');

        await page.screenshot({
            path: 'verification/session-60/04-transactions-after-duplicate.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
