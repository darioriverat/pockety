import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

/**
 * Live verification for bulk edit transactions (feature #109).
 */
test.describe('Bulk edit transactions', () => {
    test('user can change category for multiple selected transactions', async ({
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
        const c002 = categoriesPayload.data.find((item) => item.code === 'C002');
        expect(c001).toBeTruthy();
        expect(c002).toBeTruthy();

        const createdIds: number[] = [];
        for (const comments of ['Bulk edit A', 'Bulk edit B']) {
            const createResponse = await request.post('/api/transactions', {
                data: {
                    date: '2025-01-20',
                    period: '202501',
                    quincena: 'Q1',
                    category_id: c001!.id,
                    amount_cad: 21.5,
                    comments,
                },
            });
            expect(createResponse.ok()).toBeTruthy();
            const created = (await createResponse.json()) as {
                data: { id: number };
            };
            createdIds.push(created.data.id);
        }

        await page.goto('/transactions');
        await expect(page.getByTestId('transactions-heading')).toBeVisible();
        await page.getByTestId('page-period-selector').click();
        await page.getByRole('option', { name: 'January 2025', exact: true }).click();

        await expect(page.getByTestId(`transaction-row-${createdIds[0]}`)).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByTestId(`transaction-row-${createdIds[1]}`)).toBeVisible();

        await page.screenshot({
            path: 'verification/session-59/03-transactions-before-bulk.png',
            fullPage: true,
        });

        await page.getByTestId(`select-transaction-${createdIds[0]}`).click();
        await page.getByTestId(`select-transaction-${createdIds[1]}`).click();
        await expect(page.getByTestId('selected-count')).toContainText('2 selected');

        await page.getByTestId('bulk-edit-button').click();
        await expect(page.getByTestId('bulk-edit-dialog')).toBeVisible();
        await page.getByTestId('bulk-category-select').click();
        await page
            .getByRole('option', {
                name: `${c002!.code} - ${c002!.name_en}`,
                exact: true,
            })
            .click();

        await page.screenshot({
            path: 'verification/session-59/04-bulk-edit-dialog.png',
            fullPage: true,
        });

        await page.getByTestId('bulk-edit-confirm').click();
        await expect(page.getByTestId('bulk-edit-dialog')).toHaveCount(0);

        await expect(
            page.getByTestId(`transaction-category-${createdIds[0]}`),
        ).toContainText('C002');
        await expect(
            page.getByTestId(`transaction-category-${createdIds[1]}`),
        ).toContainText('C002');
        await expect(
            page.getByTestId(`transaction-row-${createdIds[0]}`),
        ).toHaveAttribute('data-category-code', 'C002');
        await expect(
            page.getByTestId(`transaction-row-${createdIds[1]}`),
        ).toHaveAttribute('data-category-code', 'C002');

        await page.screenshot({
            path: 'verification/session-59/05-transactions-after-bulk.png',
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});
