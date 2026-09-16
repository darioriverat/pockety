import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Feature #119 — confirmation dialog before deleting a transaction.
 */
test.describe('Delete transaction confirmation dialog', () => {
    test('cancel keeps the transaction; confirm deletes it', async ({
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
        const c001 = categoriesPayload.data.find((item) => item.code === 'C001');
        expect(c001).toBeTruthy();

        const createResponse = await request.post('/api/transactions', {
            data: {
                date: '2025-01-23',
                period: '202501',
                quincena: 'Q1',
                category_id: c001!.id,
                amount_cad: 18.75,
                comments: 'Confirm-delete source',
            },
        });
        expect(createResponse.ok()).toBeTruthy();
        const created = (await createResponse.json()) as {
            data: { id: number };
        };
        const txnId = created.data.id;

        await page.goto('/transactions');
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2025', exact: true }).click();
        await expect(page.getByTestId(`transaction-row-${txnId}`)).toBeVisible({
            timeout: 10000,
        });

        // Open dialog
        await page
            .getByTestId(`transaction-row-${txnId}`)
            .getByTestId('delete-transaction-button')
            .click();
        await expect(
            page.getByTestId('delete-confirmation-dialog'),
        ).toBeVisible();
        await expect(
            page.getByTestId('delete-confirmation-warning'),
        ).toContainText(/cannot be undone/i);

        await page.screenshot({
            path: 'verification/test-119-delete-confirm/01-dialog-open.png',
            fullPage: true,
        });

        // Cancel — transaction remains
        await page.getByTestId('delete-cancel-button').click();
        await expect(
            page.getByTestId('delete-confirmation-dialog'),
        ).toHaveCount(0);
        await expect(page.getByTestId(`transaction-row-${txnId}`)).toBeVisible();

        await page.screenshot({
            path: 'verification/test-119-delete-confirm/02-after-cancel.png',
            fullPage: true,
        });

        // Confirm — transaction deleted
        await page
            .getByTestId(`transaction-row-${txnId}`)
            .getByTestId('delete-transaction-button')
            .click();
        await expect(
            page.getByTestId('delete-confirmation-dialog'),
        ).toBeVisible();
        await page.getByTestId('delete-confirm-button').click();

    await expect(
        page.getByText('Transaction deleted successfully'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
        page.getByTestId(`transaction-row-${txnId}`),
    ).toHaveCount(0);
    await expect(
        page.getByTestId('delete-confirmation-dialog'),
    ).toHaveCount(0);

    await page.screenshot({
        path: 'verification/test-119-delete-confirm/03-after-confirm.png',
        fullPage: true,
    });

        expect(consoleErrors).toEqual([]);
    });
});
